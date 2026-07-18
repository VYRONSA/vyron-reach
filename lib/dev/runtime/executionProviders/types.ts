import type { ExecutionProviderId } from '../../agents/providerAdapter'
import type { DevelopmentJob } from '../runtimeTypes'

export type { ExecutionProviderId }

/**
 * The seam a real execution provider implements. Claude Code
 * (claudeCodeProvider.ts) is the only one wired to a real execution path
 * today — it works because the Claude Code CLI carries its own tool-use/
 * shell/filesystem access. A text-only API (e.g. a raw OpenAI Responses
 * API call) cannot implement this interface meaningfully without an
 * entirely separate tool-use harness (file read/write/shell tools) that
 * this mission does not build — see the doc comment on
 * lib/dev/agents/providerAdapter.ts.
 */
export type ExecutionProviderHandlers = {
  /** Persists a partial update to the job record (status, output, etc.). */
  updateJob: (patch: Partial<DevelopmentJob>) => void
  /** Reads the job's current persisted state (e.g. to check for a Cancelled race). */
  getJob: () => DevelopmentJob | null
}

export type ExecutionProvider = {
  id: ExecutionProviderId
  displayName: string
  isAvailable(): boolean
  /** Drives the job from Running through to a terminal status, calling handlers.updateJob along the way. Never throws — all failure is recorded as a Failed status update. */
  run(job: DevelopmentJob, handlers: ExecutionProviderHandlers): Promise<void>
  /** Best-effort kill for a job still in flight. Returns false if the job isn't running under this provider. */
  kill(jobId: string): boolean
}
