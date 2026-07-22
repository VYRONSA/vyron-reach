import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runWithIsolatedDataDir } from '../vyronDevDataDir'
import { runWithIsolatedEventBus } from '../events/eventBus'

/**
 * Production Validation 2.1, Milestone 2.1.3 — combines
 * runWithIsolatedDataDir (vyronDevDataDir.ts) and runWithIsolatedEventBus
 * (eventBus.ts) into the one guarantee the Simulation Service actually
 * needs: `fn` can call any real, unmodified service function — Planning,
 * Workforce, Scheduler, Escalation, Knowledge, Notifications, Metrics,
 * Certification, all of it — and every read, write, and published event
 * it produces is confined to a throwaway directory and a throwaway event
 * bus for the duration of the call, with zero risk of touching the real
 * `.vyron-dev/` or the real, already-running production subscriptions.
 * "No production logic may be bypassed" and "No production-state
 * corruption" both fall out of this one function.
 */
export async function runIsolatedSimulation<T>(fn: () => Promise<T>): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-simulation-'))
  try {
    return await runWithIsolatedDataDir(dir, () => runWithIsolatedEventBus(fn))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
