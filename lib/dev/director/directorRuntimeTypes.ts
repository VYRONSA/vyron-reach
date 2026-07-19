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
  /** Set only while state === 'Waiting for CEO' or 'Blocked'. */
  waitingReason: string | null
  waitingInboxItemId: string | null
  buildStatus: string
  typescriptStatus: string
  riskLevel: string
  engineeringHealth: string
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
  waitingReason: null,
  waitingInboxItemId: null,
  buildStatus: 'Unknown',
  typescriptStatus: 'Unknown',
  riskLevel: 'Unknown',
  engineeringHealth: 'Unknown',
  totalBatches: 0,
  completedBatches: 0,
  remainingBatches: 0,
  startedAt: null,
  lastAdvancedAt: null,
  completedAt: null,
  averageBatchDurationMs: null,
  estimatedCompletionAt: null,
  error: null,
}

export type InterventionSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type InterventionReasonType =
  | 'Approval Required'
  | 'Business Decision Required'
  | 'Build Failure'
  | 'Security Review'
  | 'Deployment Approval'
  | 'Technical Debt Escalation'

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
}

export type DirectorHistoryEntry = {
  id: string
  project: string
  timestamp: string
  event: string
  batchId: string | null
  detail: string
}
