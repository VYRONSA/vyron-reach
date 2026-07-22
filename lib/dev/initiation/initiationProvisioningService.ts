import * as planningStateService from '../planningState/planningStateService'
import * as initiationService from './initiationService'
import { listInitiationRequests } from './initiationStore'
import { findAcceptanceFor, listRiskGateDecisions } from './riskGate'
import { acquireProvisioningOwnership, releaseProvisioningOwnership } from './provisioningLock'
import type { GeneratedPlanCandidate, InitiationRequest, ProvisionResult } from './initiationTypes'

/**
 * Commits an approved InitiationRequest's reviewedProgramme into real
 * Planning Service records (milestones -> batches -> risks ->
 * dependencies) and flips the project to 'active'. Every sub-step
 * persists its result via initiationService.recordProvisionProgress
 * immediately after creating the record, and is skipped on a subsequent
 * call if that tempId is already present — so retrying after a crash
 * mid-sequence resumes instead of duplicating records.
 *
 * Deliberately does NOT hand off into autonomous execution — Executive
 * Go/Hold Control (executiveControlService.ts) owns that decision now,
 * exclusively, after Provisioning has already completed. A project sits
 * fully provisioned-but-not-started until an Executive explicitly
 * chooses Go.
 *
 * PRA-P1-015: a crash between beginProvisioning and completeProvisioning
 * leaves the record in 'Provisioning' — calling this again (either a
 * direct retry via POST /provision, or automatically via
 * resumeStuckProvisioning/initiationRecoveryBootstrap.ts at server
 * startup) resumes cleanly rather than being permanently stuck, since
 * beginProvisioning now accepts 'Provisioning' as a valid source status
 * and provisionProgramme skips anything already committed.
 */
export async function runProvisioning(id: string): Promise<InitiationRequest> {
  const started = initiationService.beginProvisioning(id)
  return runProvisioningWork(started)
}

/**
 * PRA-P1-016 remediation — starts provisioning and returns as soon as the
 * synchronous 'Provisioning' status transition is durably recorded,
 * instead of blocking the caller for the full duration of
 * provisionProgramme (which, for a large programme, risks a platform
 * request/function timeout — the exact scenario PRA-P1-015's crash
 * recovery exists to catch). Mirrors releaseManagementService.ts's
 * submitReleaseControlDecision: a synchronous CAS, then a fire-and-forget
 * async worker, the same shape as its own `void executeRelease(...)`.
 *
 * The `setImmediate` here is load-bearing, not decorative:
 * provisionProgramme is entirely synchronous fs work (via
 * fileJsonStore.ts), so a bare `void runProvisioningWork(started)` with no
 * intervening event-loop tick would run to completion before this
 * function even returns — Node's single thread has no other way to
 * "start something in the background" than to actually yield control
 * first. Deferring to the next tick is what lets the HTTP response for
 * this request go out before the (still synchronous, still
 * single-threaded) work begins, which is the actual risk this finding
 * describes: a client/proxy-side timeout from never receiving a response,
 * not a claim that provisioning itself becomes concurrent with anything
 * else.
 *
 * No client change was needed to support this — InitiationDetailView.tsx
 * already renders a distinct "Provisioning…" state and already
 * subscribes to 'Project Initiation' SSE events, which
 * completeProvisioning/failProvisioning already publish, so the terminal
 * outcome still arrives live exactly as before; only the transport
 * changed (the fetch's own response vs. a follow-up event), not anything
 * the CEO clicks or sees.
 */
export function startProvisioning(id: string): InitiationRequest {
  const started = initiationService.beginProvisioning(id)
  setImmediate(() => {
    void runProvisioningWork(started)
  })
  return started
}

/**
 * CB-002 remediation — wraps the actual mutating work in a per-initiation
 * lock (provisioningLock.ts) so two genuinely overlapping calls for the
 * same InitiationRequest (beginProvisioning's CAS alone can't prevent
 * this — see that lock module's own doc comment) can never both run
 * provisionProgramme concurrently. A losing call is not an error: the
 * winner is already doing the work (or, if it crashed, the lock goes
 * stale and a future retry/resumeStuckProvisioning reclaims it) — this
 * call simply has nothing left to do and returns the current state as-is.
 */
async function runProvisioningWork(started: InitiationRequest): Promise<InitiationRequest> {
  const owner = acquireProvisioningOwnership(started.id)
  if (!owner) return initiationService.getInitiation(started.id) ?? started

  try {
    const programme = started.reviewedProgramme
    if (!programme) {
      return initiationService.failProvisioning(started.id, 'No reviewed programme to provision — this should be unreachable from the Approved state.')
    }

    try {
      provisionProgramme(started.id, started.project, programme, started.provisionResult)
      planningStateService.updateProject(started.project, { status: 'active' })
      return initiationService.completeProvisioning(started.id)
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Provisioning failed for an unknown reason.'
      return initiationService.failProvisioning(started.id, reason)
    }
  } finally {
    releaseProvisioningOwnership(started.id, owner)
  }
}

/**
 * PRA-P1-015 remediation — finds every InitiationRequest a crash or
 * timeout left stuck in 'Provisioning' and resumes each one by calling
 * runProvisioning again, exactly as if the original request had simply
 * been retried. Safe to call at any time (idempotent, resumable): a
 * record that isn't actually stuck (none currently are, or one completes
 * normally between the listInitiationRequests call and its own retry)
 * simply isn't touched by this, and re-running an already-Provisioned
 * record is impossible since beginProvisioning only accepts
 * Approved/ProvisioningFailed/Provisioning as source statuses. One
 * record's failure never stops the others from being attempted.
 */
export async function resumeStuckProvisioning(): Promise<{ resumed: string[]; failed: { id: string; reason: string }[] }> {
  const stuck = listInitiationRequests().filter(r => r.status === 'Provisioning')
  const resumed: string[] = []
  const failed: { id: string; reason: string }[] = []

  for (const record of stuck) {
    try {
      await runProvisioning(record.id)
      resumed.push(record.id)
    } catch (err) {
      failed.push({ id: record.id, reason: err instanceof Error ? err.message : 'Unknown error.' })
    }
  }

  return { resumed, failed }
}

function provisionProgramme(id: string, project: string, programme: GeneratedPlanCandidate, existing: ProvisionResult | null): void {
  const milestoneIdByTempId: Record<string, string> = { ...(existing?.milestoneIdByTempId ?? {}) }
  const sortedMilestones = [...programme.milestones].sort((a, b) => a.sequence - b.sequence)
  for (const milestone of sortedMilestones) {
    if (milestoneIdByTempId[milestone.tempId]) continue
    const created = planningStateService.createMilestone(project, {
      title: milestone.title,
      description: milestone.description,
      phase: milestone.phase,
      startDate: '',
      targetDate: '',
      progress: 0,
      status: 'Upcoming',
      sequence: milestone.sequence,
    })
    milestoneIdByTempId[milestone.tempId] = created.id
    initiationService.recordProvisionProgress(id, { milestoneIdByTempId: { [milestone.tempId]: created.id } })
  }

  const batchIdByTempId: Record<string, string> = { ...(existing?.batchIdByTempId ?? {}) }
  const sortedBatches = [...programme.batches].sort((a, b) => a.sequence - b.sequence)
  for (const batch of sortedBatches) {
    if (batchIdByTempId[batch.tempId]) continue
    const milestoneId = milestoneIdByTempId[batch.milestoneRef]
    if (!milestoneId) throw new Error(`Batch "${batch.batchNumber}" references milestone "${batch.milestoneRef}" which was never provisioned.`)
    const created = planningStateService.createBatch(project, {
      batchNumber: batch.batchNumber,
      milestone: milestoneId,
      objective: batch.objective,
      summary: batch.summary,
      completedTasks: '',
      lessonsLearned: '',
      claudePrompt: batch.claudePrompt,
      completionDate: '',
      status: 'Queued',
      sequence: batch.sequence,
    })
    batchIdByTempId[batch.tempId] = created.id
    initiationService.recordProvisionProgress(id, { batchIdByTempId: { [batch.tempId]: created.id } })
  }

  // Executive Risk Gate integration (requirement 5: "Accepted risks
  // remain visible throughout the project lifecycle"): a risk the
  // Executive explicitly Accepted is provisioned as 'Monitoring' (not
  // 'Open') with the decision annotated directly into its mitigation
  // text — it stays visible in the normal Risk Register views exactly
  // like any other risk, just carrying the governance record with it,
  // rather than needing a separate place to look this up.
  const gateDecisions = listRiskGateDecisions(id)
  const riskIds: string[] = [...(existing?.riskIds ?? [])]
  for (let i = riskIds.length; i < programme.risks.length; i++) {
    const risk = programme.risks[i]
    const acceptance = findAcceptanceFor(risk, gateDecisions)
    const mitigation = acceptance
      ? `[Executive-accepted by ${acceptance.executive} on ${acceptance.decidedAt}: ${acceptance.reason}] ${risk.mitigation}`.trim()
      : risk.mitigation
    const created = planningStateService.createRisk(project, {
      title: risk.title,
      description: risk.description,
      relatedMilestone: risk.relatedMilestoneRef ? milestoneIdByTempId[risk.relatedMilestoneRef] ?? '' : '',
      severity: risk.severity,
      probability: risk.probability,
      mitigation,
      owner: '',
      status: acceptance ? 'Monitoring' : 'Open',
    })
    riskIds.push(created.id)
    initiationService.recordProvisionProgress(id, { riskIds })
  }

  const dependencyIds: string[] = [...(existing?.dependencyIds ?? [])]
  for (let i = dependencyIds.length; i < programme.dependencies.length; i++) {
    const dep = programme.dependencies[i]
    const fromId = dep.fromType === 'milestone' ? milestoneIdByTempId[dep.fromRef] : batchIdByTempId[dep.fromRef]
    const toId = dep.toType === 'milestone' ? milestoneIdByTempId[dep.toRef] : batchIdByTempId[dep.toRef]
    if (!fromId || !toId) throw new Error('Dependency references a milestone/batch that was never provisioned.')
    const created = planningStateService.addDependency(project, { fromType: dep.fromType, fromId, toType: dep.toType, toId, note: dep.note })
    dependencyIds.push(created.id)
    initiationService.recordProvisionProgress(id, { dependencyIds })
  }
}
