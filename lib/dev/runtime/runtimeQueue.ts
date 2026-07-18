import { executeDevelopmentJob } from './claudeRuntime'
import { readJobs } from './runtimeStorage'
import type { DevelopmentJob } from './runtimeTypes'

/**
 * Ensures development jobs run strictly one at a time. Claude Code operates
 * directly on this repository's working tree, so two concurrent runs could
 * step on the same files — this in-memory promise chain is enough to
 * serialize execution within one running dev server process, which is the
 * only place this runtime is meant to run.
 *
 * Note on "multiple executions": this repository is the only working tree
 * this server process ever touches, so there is no meaningful notion of
 * "different repositories running simultaneously" here — every project
 * slug (reach/dev/pay/...) is a label within this one repo, not a separate
 * checkout. Serializing globally, across every project, is the correct
 * behavior, not a limitation to fix.
 */
let queue: Promise<void> = Promise.resolve()

export function enqueueDevelopmentJob(job: DevelopmentJob): void {
  queue = queue.then(() => executeDevelopmentJob(job)).catch(() => {})
}

/**
 * Recovery: a job left at 'Queued' means the server died before it ever
 * started running (claudeCodeProvider.ts never touched it — no pid was
 * ever assigned), so it's always safe to silently re-enqueue exactly as if
 * nothing happened. A 'Running'/'Validating' job is deliberately NOT
 * auto-resumed here — that's runtimeEngine.ts's orphan reconciliation,
 * which marks it Failed instead, so a CEO explicitly chooses Retry rather
 * than a job silently re-executing without anyone asking for it. Runs once
 * per server process lifetime, at module load.
 */
function recoverQueuedJobsOnStartup(): void {
  const queued = readJobs()
    .filter(j => j.status === 'Queued')
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  for (const job of queued) enqueueDevelopmentJob(job)
}

recoverQueuedJobsOnStartup()
