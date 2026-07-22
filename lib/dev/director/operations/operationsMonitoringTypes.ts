/**
 * Autonomous Operations — post-release monitoring, incident detection/
 * response, and governed rollback coordination. Mirrors Autonomous
 * Quality Assurance and Release Management's exact shape (modular
 * registry, real-or-honest-gap results, structured evidence).
 *
 * Deliberately, permanently contains no exec/subprocess call anywhere —
 * every check here is a plain, read-only `fetch()`. Release Management's
 * own deployment step never promotes past a preview URL (no `--prod`,
 * ever, by design), so there is no production traffic-alias for a
 * "rollback" to redirect; Rollback Coordination here governs and
 * records a human's decision, it does not execute a cutover. See this
 * module's own service file for the full reasoning.
 */

export type OperationalCheckType =
  | 'Deployment Monitoring'
  | 'Service Health Monitoring'
  | 'Application Health Monitoring'
  | 'Error Monitoring'
  | 'Performance Monitoring'
  | 'Availability Monitoring'

export type OperationalCheckStatus = 'Healthy' | 'Degraded' | 'Down' | 'Not Applicable' | 'Skipped'

export type OperationalCheckResult = {
  check: OperationalCheckType
  status: OperationalCheckStatus
  summary: string
  detail: string
  durationMs: number | null
}

export type OperationsReport = {
  project: string
  releaseId: string
  deploymentUrl: string
  runAt: string
  durationMs: number
  checks: OperationalCheckResult[]
  /** True only when every check that actually ran (not Not Applicable/Skipped) is Healthy. */
  healthy: boolean
}

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type IncidentStatus = 'Open' | 'RollbackPending' | 'RollbackApproved' | 'Resolved'

export type Incident = {
  id: string
  project: string
  status: IncidentStatus
  severity: IncidentSeverity
  detectedAt: string
  resolvedAt: string | null
  /** The release this incident was detected against. */
  relatedReleaseId: string
  /** The last known-good release Rollback Coordination identified as a candidate, if any. */
  rollbackTargetReleaseId: string | null
  checks: OperationalCheckResult[]
  /** Composed once the incident is Resolved — a real summary of what was detected, how long, and what (if anything) was decided. Null until then. */
  postIncidentReview: string | null
  createdAt: string
  updatedAt: string
}

export type RollbackControlDecisionType = 'Go' | 'Hold'

/** Append-only, mirrors ReleaseControlDecision (releaseManagementTypes.ts) exactly — never mutated or deleted, the permanent record of who decided what and why for one specific incident's rollback candidate. */
export type RollbackControlDecision = {
  id: string
  incidentId: string
  project: string
  executive: string
  decidedAt: string
  decision: RollbackControlDecisionType
  reason: string
  /** Wave 4 / CB-001 (rollback) remediation — mirrors ReleaseControlDecision.effective exactly: true only for the decision that actually won the RollbackPending->RollbackApproved/still-RollbackPending transition. A concurrent submission that lost that race is still recorded (never dropped) with this set to false. */
  effective: boolean
}
