import type { EngineeringContextVersions } from './engineeringContextVersion'
import type { QualityGateReport } from './assessment/assessmentTypes'

/**
 * Shared types for the Autonomous Engineering Director — the orchestration
 * layer that owns execution end-to-end once a CEO presses Start
 * Development, as opposed to lib/dev/director/engineeringDirector.ts (the
 * pure strategic layer, ranking findings/resolving agent conflicts) which
 * this orchestration layer consumes as one input, not replaces.
 */

export type ProjectExecutionState = 'Idle' | 'Planning' | 'Running' | 'Waiting for CEO' | 'Blocked' | 'Completed' | 'Cancelled'

/**
 * The live status one project's autonomous run is in — server-persisted
 * (file-backed, like the Runtime job store) so it survives page reloads
 * and answers CEO Runtime Queries independent of whether the browser tab
 * that started the run is still open. The client-side orchestration loop
 * (lib/dev/runtime/autonomousEngineeringDirector.ts) is the only writer;
 * everything else (the Command Centre dashboard, the Runtime Query
 * endpoint) only ever reads this.
 */
export type DirectorRuntimeStatus = {
  project: string
  state: ProjectExecutionState
  currentPhase: string
  currentMilestoneId: string | null
  currentMilestoneTitle: string | null
  currentBatchId: string | null
  currentBatchNumber: string | null
  /** Human-readable "what's happening right now" — "Launching Claude", "Validating implementation", "Waiting for CEO: Build Failure", etc. */
  currentActivity: string
  currentAiTask: string | null
  currentJobId: string | null
  /** Version 2.0 Phase 3 Milestone 3.1 — the Worker Role assigned to the current batch (lib/dev/director/workforce/taskAssignment.ts). Null when idle or between batches. */
  currentWorkerRole: string | null
  /** Set only while state === 'Waiting for CEO' or 'Blocked'. */
  waitingReason: string | null
  waitingInboxItemId: string | null
  buildStatus: string
  typescriptStatus: string
  /**
   * Version 2.0 Milestone 2.3 — riskLevel/engineeringHealth/qualityGates
   * are written exclusively by the Assessment Service
   * (lib/dev/director/assessment/assessmentService.ts), requested only at
   * synchronization boundaries (see serverExecutionLoop.ts's
   * runLoopBody). The Director itself never computes or interprets these
   * values — it only ever copies an EngineeringAssessment's fields onto
   * this status.
   */
  riskLevel: string
  engineeringHealth: string
  qualityGates: QualityGateReport | null
  totalBatches: number
  completedBatches: number
  remainingBatches: number
  startedAt: string | null
  lastAdvancedAt: string | null
  completedAt: string | null
  /** Mean duration of completed batches in this run so far — null until at least one has completed. The only honest input an ETA can be built from. */
  averageBatchDurationMs: number | null
  estimatedCompletionAt: string | null
  error: string | null
  /**
   * Version 2.0 Milestone 2.2 (Live Knowledge Refresh) — the engineering
   * context versions as of the last synchronization boundary this run
   * actually refreshed at. `null` means no refresh has happened yet for
   * this run (forces the next boundary check to always refresh — see
   * engineeringContextVersionsEqual). Recovery explicitly resets this to
   * `null` before resuming, so a crash can never cause stale
   * pre-crash versions to be trusted as "unchanged."
   */
  lastKnownVersions: EngineeringContextVersions | null
}

export const IDLE_DIRECTOR_STATUS: Omit<DirectorRuntimeStatus, 'project'> = {
  state: 'Idle',
  currentPhase: 'Unknown',
  currentMilestoneId: null,
  currentMilestoneTitle: null,
  currentBatchId: null,
  currentBatchNumber: null,
  currentActivity: 'Not started',
  currentAiTask: null,
  currentJobId: null,
  currentWorkerRole: null,
  waitingReason: null,
  waitingInboxItemId: null,
  buildStatus: 'Unknown',
  typescriptStatus: 'Unknown',
  riskLevel: 'Unknown',
  engineeringHealth: 'Unknown',
  qualityGates: null,
  totalBatches: 0,
  completedBatches: 0,
  remainingBatches: 0,
  startedAt: null,
  lastAdvancedAt: null,
  completedAt: null,
  averageBatchDurationMs: null,
  estimatedCompletionAt: null,
  error: null,
  lastKnownVersions: null,
}

export type InterventionSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type InterventionReasonType =
  | 'Approval Required'
  | 'Business Decision Required'
  | 'Build Failure'
  | 'Security Review'
  | 'Deployment Approval'
  | 'Technical Debt Escalation'
  /** Version 2.0 Phase 3 Milestone 3.1 — a worker's output failed the Director's validation gate, or two workers' file changes conflicted and the existing strategic layer's resolution (resolveAgentConflict) sided with caution rather than proceeding. */
  | 'Worker Review Required'
  /** Autonomous Quality Assurance — one or more verification activities (tests, static analysis, security scanning, ...) failed for this batch; see lib/dev/director/qualityAssurance/. */
  | 'Quality Assurance Failure'
  /** Autonomous Release Management — a release has been prepared and is awaiting an Executive's Go/Hold decision; see lib/dev/director/releaseManagement/. Dedicated rather than reusing 'Deployment Approval' so a future, genuinely distinct "should we deploy this" question still has somewhere of its own to go. */
  | 'Release Go/Hold Required'
  /** Autonomous Release Management — one or more release activities (git operations, pull request creation, deployment, ...) failed during an approved release's execution. */
  | 'Release Failure'
  /** Autonomous Operations — a post-release monitoring check detected an operational incident; see lib/dev/director/operations/. */
  | 'Operational Incident'
  /** Autonomous Operations — a prior known-good release is available and awaiting an Executive's rollback Go/Hold decision. */
  | 'Rollback Go/Hold Required'

export type EngineeringInboxStatus = 'Open' | 'Resolved' | 'Dismissed'

/** One required interruption — every reason the Director pauses a project becomes exactly one of these. */
export type EngineeringInboxItem = {
  id: string
  project: string
  batchId: string | null
  batchNumber: string | null
  reasonType: InterventionReasonType
  reason: string
  severity: InterventionSeverity
  recommendedAction: string
  timestamp: string
  status: EngineeringInboxStatus
  resolvedAt: string | null
  resolutionNote: string | null
  /** For the global Engineering Inbox's "Unread" filter — distinct from `status`, since an item can be seen (read) without yet being resolved/dismissed. */
  read: boolean
  /**
   * PRA-P1-019: the dedup key project-level items (batchId null — Release/
   * Rollback/Incident governance) use instead of batchId — the id of the
   * underlying ReleaseRequest/Incident this item is about. Optional and
   * `null`/absent for item types that don't have (or don't yet use) such an
   * id; createInboxItem only dedupes a project-level item when this is
   * present, so omitting it is always backward-compatible, never a silent
   * behavior change for a caller that hasn't been updated to pass it.
   */
  sourceRef?: string | null
}

export type DirectorHistoryEntry = {
  id: string
  project: string
  timestamp: string
  event: string
  batchId: string | null
  detail: string
}
