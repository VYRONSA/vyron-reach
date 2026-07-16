import type { ValidationStatus } from '../handoverStorage'

export type JobStatus = 'Queued' | 'Running' | 'Validating' | 'Updating' | 'Completed' | 'Failed' | 'Cancelled'

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
  approvedAt: string | null
  appliedAt: string | null
}

export type CreateJobInput = {
  projectSlug: string
  milestoneId: string
  batchId: string
  objective: string
  prompt: string
}
