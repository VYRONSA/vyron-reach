import type { ValidationStatus } from '../handoverStorage'

export type JobStatus = 'Queued' | 'Running' | 'Validating' | 'Updating' | 'Completed' | 'Rejected' | 'Failed' | 'Cancelled'

/**
 * Fine-grained phase within the Running/Validating job statuses, inferred
 * from Claude's own streamed tool-use events (see claudeCodeProvider.ts) —
 * best-effort, never fabricated: if a phase can't be inferred from the
 * stream, this simply stays at its last known value rather than guessing.
 */
export type RuntimePhase =
  | 'Launching Claude'
  | 'Executing'
  | 'Reading Files'
  | 'Writing Code'
  | 'Running Build'
  | 'Running TypeScript'
  | 'Running Validation'

export type RuntimeUsage = {
  inputTokens: number | null
  outputTokens: number | null
}

/**
 * The full lifecycle record for one autonomous Claude Code execution.
 * Everything Claude's CLI returns is captured (rawOutput/stderr/exitCode/
 * usage), even fields this app doesn't otherwise use, per "everything
 * returned by Claude must be stored." approvedAt/appliedAt exist because
 * this runtime requires human approval before Handover/Batch/Milestone
 * state is written — the job reaching "Completed" means Claude's run
 * succeeded and produced valid JSON, not that project state was changed.
 */
export type DevelopmentJob = {
  id: string
  projectSlug: string
  milestoneId: string
  batchId: string
  objective: string
  status: JobStatus
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  runtime: string
  claudeSessionId: string | null
  claudeUuid: string | null
  duration: number | null
  cost: number | null
  buildStatus: ValidationStatus
  typescriptStatus: ValidationStatus
  result: string | null
  error: string | null
  prompt: string
  rawOutput: string | null
  stderr: string | null
  exitCode: number | null
  usage: RuntimeUsage | null
  /** `git diff --stat` captured right after Claude's process exits successfully — null if git isn't available or the command fails, never fabricated. */
  gitDiffSummary: string | null
  approvedAt: string | null
  appliedAt: string | null
  /** Set only when a human rejects a Completed job's result — distinct from Failed (the CLI itself didn't succeed) and Cancelled (stopped mid-flight). No knowledge writes happen for a Rejected job. */
  rejectedAt: string | null
  rejectionReason: string | null
  /** OS process id of the spawned CLI, persisted (not just kept in memory) so a crash/restart can be detected on the next read — see lib/dev/runtime/processLiveness.ts and runtimeEngine.ts's reconciliation. */
  pid: number | null
  /** Live sub-phase within Running/Validating — see RuntimePhase. */
  currentPhase: RuntimePhase | null
  /** Set when this job is a Retry that resumed a previous Claude session rather than starting fresh — the session id it resumed, for display/audit only. */
  resumedSessionId: string | null
}

export type CreateJobInput = {
  projectSlug: string
  milestoneId: string
  batchId: string
  objective: string
  prompt: string
  /** When set, the provider resumes this Claude session instead of starting fresh — used by Retry when the previous attempt got far enough to receive a session id before failing. */
  resumeSessionId?: string
}
