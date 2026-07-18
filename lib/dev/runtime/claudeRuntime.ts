import { getJob, updateJob } from './runtimeStorage'
import { getActiveProvider } from '../agents/providerAdapter'
import { claudeCodeProvider } from './executionProviders/claudeCodeProvider'
import type { ExecutionProvider } from './executionProviders/types'
import type { DevelopmentJob } from './runtimeTypes'

/**
 * Provider dispatch table — every provider registered in providerAdapter.ts
 * with a real execution module goes here. Only 'claude-code' has one today;
 * adding a second provider means implementing its own module under
 * executionProviders/ and registering it here, without touching this
 * dispatcher's callers (runtimeQueue.ts, runtimeEngine.ts) at all.
 */
const PROVIDER_IMPLEMENTATIONS: Partial<Record<ExecutionProvider['id'], ExecutionProvider>> = {
  'claude-code': claudeCodeProvider,
}

function resolveProvider(): ExecutionProvider {
  const active = getActiveProvider()
  const impl = PROVIDER_IMPLEMENTATIONS[active.id]
  if (!impl) {
    throw new Error(`No execution provider implementation registered for '${active.id}'.`)
  }
  return impl
}

/** Best-effort kill for a job still in flight — used by the Cancel action. No-op if the job already finished. */
export function killDevelopmentJob(jobId: string): boolean {
  return resolveProvider().kill(jobId)
}

/**
 * Dispatches job execution to whichever provider is currently active
 * (lib/dev/agents/providerAdapter.ts). This module owns no execution logic
 * itself — it only wires the job store's read/write handlers to the
 * provider's `run()` contract (lib/dev/runtime/executionProviders/types.ts).
 */
export async function executeDevelopmentJob(job: DevelopmentJob): Promise<void> {
  const provider = resolveProvider()
  await provider.run(job, {
    updateJob: patch => {
      updateJob(job.id, patch)
    },
    getJob: () => getJob(job.id),
  })
}
