import { executeDevelopmentJob } from './claudeRuntime'
import type { DevelopmentJob } from './runtimeTypes'

/**
 * Ensures development jobs run strictly one at a time. Claude Code operates
 * directly on this repository's working tree, so two concurrent runs could
 * step on the same files — this in-memory promise chain is enough to
 * serialize execution within one running dev server process, which is the
 * only place this runtime is meant to run.
 */
let queue: Promise<void> = Promise.resolve()

export function enqueueDevelopmentJob(job: DevelopmentJob): void {
  queue = queue.then(() => executeDevelopmentJob(job)).catch(() => {})
}
