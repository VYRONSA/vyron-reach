import { randomUUID } from 'node:crypto'
import * as knowledgeService from '../../knowledge/knowledgeService'
import { listReleaseRequests } from '../releaseManagement/releaseManagementStore'
import { createInboxItem } from '../engineeringInboxStore'
import { raiseNotification } from '../../notifications/notificationService'
import { publish } from '../../events/eventBus'
import {
  listIncidents,
  getIncident,
  findActiveIncident,
  insertIncident,
  updateIncident,
  appendRollbackControlDecision,
} from './operationsMonitoringStore'
import {
  probeDeployment,
  checkDeploymentMonitoring,
  checkServiceHealth,
  checkApplicationHealth,
  checkErrorMonitoring,
  checkPerformanceMonitoring,
  checkAvailabilityMonitoring,
} from './operationsMonitoringRunners'
import type { Incident, IncidentSeverity, OperationalCheckResult, RollbackControlDecision, RollbackControlDecisionType } from './operationsMonitoringTypes'

/**
 * Autonomous Operations' orchestrator. `runOperationsMonitoringCycle` is
 * the only function the recurring background bootstrap ever calls, and
 * it never touches git/gh/vercel — only plain `fetch()` and durable
 * reads/writes. `submitRollbackControlDecision` is the only place a
 * Rollback Go/Hold decision is recorded; per this module's own scope
 * decision (see operationsMonitoringTypes.ts's doc comment), a 'Go'
 * decision records real, permanent approval to roll back to a specific
 * prior release, but performs no automated traffic cutover itself —
 * Release Management's own deployments never reach a production alias
 * (no `--prod`, ever, by design), so there is no live traffic for an
 * automated rollback to redirect. That remains a human action outside
 * this subsystem, permanently — the same honest boundary Release
 * Management already drew for production promotion.
 */

export class IncidentNotFoundError extends Error {
  constructor(id: string) {
    super(`Incident '${id}' not found.`)
    this.name = 'IncidentNotFoundError'
  }
}

export class IncidentConflictError extends Error {
  constructor(
    public readonly id: string,
    public readonly actualStatus: string,
    public readonly allowed: string[]
  ) {
    super(`Incident '${id}' is '${actualStatus}', expected one of: ${allowed.join(', ')}.`)
    this.name = 'IncidentConflictError'
  }
}

export class RollbackControlInputError extends Error {
  constructor(id: string, reason: string) {
    super(`Incident '${id}': invalid rollback decision — ${reason}`)
    this.name = 'RollbackControlInputError'
  }
}

export function describeOperationsError(err: unknown): { status: number; error: string } | null {
  if (err instanceof IncidentNotFoundError) return { status: 404, error: err.message }
  if (err instanceof IncidentConflictError) return { status: 409, error: err.message }
  if (err instanceof RollbackControlInputError) return { status: 400, error: err.message }
  return null
}

/** Exported for direct unit testing (Wave 4 — Testing Gaps) — pure and deterministic, the same rationale metricClassifier.ts's applyEvent is exported for. monitorProject remains the only production caller. */
export function classifySeverity(checks: OperationalCheckResult[]): IncidentSeverity | null {
  const byCheck = Object.fromEntries(checks.map(c => [c.check, c.status])) as Record<string, string>
  if (byCheck['Service Health Monitoring'] === 'Down' || byCheck['Application Health Monitoring'] === 'Down') return 'Critical'
  if (byCheck['Application Health Monitoring'] === 'Degraded' || byCheck['Performance Monitoring'] === 'Down') return 'High'
  if (byCheck['Error Monitoring'] === 'Down') return 'Medium'
  if (checks.some(c => c.status === 'Degraded')) return 'Low'
  return null
}

async function resolveIncident(incident: Incident, checks: OperationalCheckResult[]): Promise<void> {
  const durationMs = Date.now() - new Date(incident.detectedAt).getTime()
  const minutes = Math.max(1, Math.round(durationMs / 60_000))
  const review = `Detected ${incident.detectedAt} at ${incident.severity} severity, resolved after ~${minutes} minute(s). ${
    incident.rollbackTargetReleaseId
      ? 'A rollback to a prior release was under review during this incident.'
      : 'No prior known-good release was available to roll back to.'
  }`
  const resolved = updateIncident(incident.id, c =>
    c.status !== 'Resolved' ? { ...c, status: 'Resolved', resolvedAt: new Date().toISOString(), postIncidentReview: review, checks, updatedAt: new Date().toISOString() } : null
  )
  if (!resolved) return

  publish({ category: 'Operations', project: incident.project, type: 'incident-resolved', payload: { incidentId: incident.id, severity: incident.severity, durationMs } })

  knowledgeService.recordIncident({
    project: incident.project,
    severity: incident.severity,
    resolved: true,
    durationMs,
    checks: checks.map(c => ({ check: c.check, status: c.status, summary: c.summary })),
    review,
  })
}

async function monitorProject(project: string): Promise<void> {
  const releasedDeployments = listReleaseRequests(project).filter(r => r.status === 'Released' && r.deploymentUrl)
  if (releasedDeployments.length === 0) return

  const currentRelease = releasedDeployments[0]
  const priorGoodRelease = releasedDeployments[1] ?? null

  const existingIncident = findActiveIncident(project, currentRelease.id)
  const probe = await probeDeployment(currentRelease.deploymentUrl!)

  const recentResolvedSeverities = knowledgeService.listIncidents(project).slice(0, 10).map(i => i.severity)
  const checks: OperationalCheckResult[] = [
    checkDeploymentMonitoring(currentRelease),
    checkServiceHealth(probe),
    checkApplicationHealth(probe),
    checkErrorMonitoring(project),
    checkPerformanceMonitoring(probe),
    checkAvailabilityMonitoring(recentResolvedSeverities),
  ]

  const healthy = checks.every(c => c.status === 'Healthy' || c.status === 'Not Applicable')

  if (healthy) {
    if (existingIncident) await resolveIncident(existingIncident, checks)
    return
  }

  if (existingIncident) {
    // Already tracking this — refresh its evidence, don't raise a second Inbox item every cycle.
    const refreshed = updateIncident(existingIncident.id, c => (c.status !== 'Resolved' ? { ...c, checks, updatedAt: new Date().toISOString() } : null))
    if (refreshed) publish({ category: 'Operations', project, type: 'incident-refreshed', payload: { incidentId: refreshed.id, severity: refreshed.severity, status: refreshed.status } })
    return
  }

  const severity = classifySeverity(checks) ?? 'Low'
  const failed = checks.filter(c => c.status === 'Down' || c.status === 'Degraded')
  const now = new Date().toISOString()

  const incident: Incident = {
    id: randomUUID(),
    project,
    status: 'Open',
    severity,
    detectedAt: now,
    resolvedAt: null,
    relatedReleaseId: currentRelease.id,
    rollbackTargetReleaseId: null,
    checks,
    postIncidentReview: null,
    createdAt: now,
    updatedAt: now,
  }
  insertIncident(incident)
  publish({ category: 'Operations', project, type: 'incident-opened', payload: { incidentId: incident.id, severity, relatedReleaseId: currentRelease.id } })

  const reason = `${severity}-severity incident on release v${currentRelease.version}: ${failed.map(c => `${c.check}: ${c.summary}`).join(' | ')}`
  const item = createInboxItem({
    project,
    batchId: null,
    batchNumber: null,
    reasonType: 'Operational Incident',
    reason,
    severity,
    recommendedAction: 'Review the operational evidence and determine next steps.',
    // PRA-P1-019: a recurrence of this exact incident reopens the same item instead of piling up duplicates.
    sourceRef: incident.id,
  })
  await raiseNotification({
    type: 'Operational Incident',
    project,
    title: `${project}: operational incident detected`,
    message: reason,
    severity,
    metadata: { incidentId: incident.id, inboxItemId: item.id },
  })

  // Requirement 5 — incidents automatically generate engineering work where appropriate.
  // Reuses knowledgeService.recordRisk, which already dual-writes the permanent
  // record, a Timeline entry, and the current-state Planning Risk in one call.
  if (severity === 'High' || severity === 'Critical') {
    knowledgeService.recordRisk({
      project,
      title: `Operational incident: ${failed.map(c => c.check).join(', ')}`,
      description: reason,
      severity: 'High', // planningState's RiskSeverity has no 'Critical' tier — same constraint Initiation's Risk Gate already documented
    })
  }

  if (priorGoodRelease) {
    const pending = updateIncident(incident.id, c => (c.status === 'Open' ? { ...c, status: 'RollbackPending', rollbackTargetReleaseId: priorGoodRelease.id, updatedAt: new Date().toISOString() } : null))
    if (pending) {
      publish({ category: 'Operations', project, type: 'rollback-pending', payload: { incidentId: incident.id, rollbackTargetReleaseId: priorGoodRelease.id } })
      const rollbackReason = `A prior known-good release (v${priorGoodRelease.version}) is available to roll back to.`
      const rollbackItem = createInboxItem({
        project,
        batchId: null,
        batchNumber: null,
        reasonType: 'Rollback Go/Hold Required',
        reason: rollbackReason,
        severity: 'High',
        recommendedAction: 'Review and record a Go/Hold decision on rolling back to the prior release.',
        // PRA-P1-019: the same incident's rollback notice reopens the same item instead of piling up duplicates.
        sourceRef: incident.id,
      })
      await raiseNotification({
        type: 'Rollback Go/Hold Required',
        project,
        title: `${project}: rollback candidate available`,
        message: rollbackReason,
        severity: 'High',
        metadata: { incidentId: incident.id, releaseId: priorGoodRelease.id, inboxItemId: rollbackItem.id },
      })
    }
  }
}

/** The only function the recurring bootstrap tick calls. Never throws for one project's own failure — every project is monitored independently so one bad deployment can't stop the cycle for everyone else. */
export async function runOperationsMonitoringCycle(): Promise<void> {
  const projects = new Set(listReleaseRequests().filter(r => r.status === 'Released' && r.deploymentUrl).map(r => r.project))
  for (const project of projects) {
    try {
      await monitorProject(project)
    } catch {
      // A single project's monitoring failure (e.g. a DNS error thrown outside probeDeployment's own try/catch) never stops the cycle for the rest.
    }
  }
}

export function listIncidentsForProject(project?: string): Incident[] {
  return listIncidents(project)
}

export function getIncidentById(id: string): Incident | null {
  return getIncident(id)
}

export type SubmitRollbackControlDecisionInput = {
  executive: string
  decision: RollbackControlDecisionType
  reason: string
}

/**
 * Records a real, permanent Go/Hold decision on a pending rollback
 * candidate. 'Hold' leaves the incident exactly as it is (still
 * RollbackPending, decidable again later). 'Go' records approval and
 * transitions to RollbackApproved — this function never calls git, gh,
 * or vercel; the actual traffic cutover is a human action outside this
 * subsystem (see this file's own doc comment for why).
 *
 * Wave 4 (Rollback Go/Hold Decision Race) remediation — mirrors
 * releaseManagementService.ts's submitReleaseControlDecision exactly: the
 * status CAS (updateIncident, which runs inside a real file lock) is the
 * single source of truth for whether THIS submission took effect. The
 * decision record is appended only after that outcome is known, tagged
 * `effective` accordingly, and a lost race throws IncidentConflictError
 * carrying the freshly re-read actual status — never the stale
 * pre-mutation snapshot read at the top of this function, and never a
 * silent `?? current` fallback that would let a caller believe a dropped
 * decision had succeeded. Previously the decision was appended
 * unconditionally before the CAS ever ran and a lost CAS fell back to the
 * stale snapshot without throwing at all — the same defect class already
 * fixed once in Release Management (PRA-P1-026/027), now closed here too.
 */
export function submitRollbackControlDecision(project: string, incidentId: string, input: SubmitRollbackControlDecisionInput): Incident {
  const existing = getIncident(incidentId)
  if (!existing || existing.project !== project) throw new IncidentNotFoundError(incidentId)
  if (!input.reason?.trim()) throw new RollbackControlInputError(incidentId, 'reason is required.')

  const applied = updateIncident(incidentId, c => {
    if (c.status !== 'RollbackPending') return null
    return input.decision === 'Hold'
      ? { ...c, updatedAt: new Date().toISOString() }
      : { ...c, status: 'RollbackApproved', updatedAt: new Date().toISOString() }
  })

  const decision: RollbackControlDecision = {
    id: randomUUID(),
    incidentId,
    project,
    executive: input.executive,
    decidedAt: new Date().toISOString(),
    decision: input.decision,
    reason: input.reason.trim(),
    effective: applied !== null,
  }
  appendRollbackControlDecision(decision)

  if (!applied) {
    // Lost the race (or the incident genuinely wasn't RollbackPending) —
    // re-read rather than trust the pre-mutation `existing` snapshot
    // above, which may already be stale by now.
    const current = getIncident(incidentId) ?? existing
    throw new IncidentConflictError(incidentId, current.status, ['RollbackPending'])
  }

  knowledgeService.recordTimelineEvent({
    project,
    source: 'Manual',
    category: 'Business Decision',
    title: `Rollback Control: ${input.decision}`,
    detail: `${input.executive}: ${decision.reason}`,
  })
  publish({ category: 'Operations', project, type: 'rollback-decision', payload: { incidentId, decision: input.decision, executive: input.executive } })

  return applied
}
