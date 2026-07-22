import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../../fileLock'
import { isProcessAlive } from '../../runtime/processLiveness'
import { getVyronDevDataDir } from '../../vyronDevDataDir'
import { runOperationsMonitoringCycle } from './operationsMonitoringService'
import { publish } from '../../events/eventBus'

/**
 * The Operations Monitoring Bootstrap — guarantees post-release
 * monitoring resumes exactly once per application process at startup,
 * mirroring lib/dev/escalation/escalationBootstrap.ts's identical,
 * already-proven pattern (same in-memory promise dedup, same file-lock-
 * with-stale-reclaim, same unref()'d recurring tick).
 *
 * Interval is longer than Escalation's 60s (3 minutes) since this cycle
 * makes real outbound HTTP requests to external deployment URLs rather
 * than only reading local durable state — no reason to poll faster than
 * an operator would plausibly want to be paged.
 */

const TICK_INTERVAL_MS = 3 * 60_000

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'operations-monitoring-bootstrap.lock')
}

function ensureDir(): void {
  const dir = storeDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function acquireBootstrapLock(): boolean {
  ensureDir()
  const file = lockFile()
  const payload = JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })
  if (tryCreateExclusive(file, payload)) return true

  try {
    const existing = JSON.parse(fs.readFileSync(file, 'utf-8')) as { pid: number }
    if (isProcessAlive(existing.pid)) return false
    fs.unlinkSync(file)
  } catch {
    // vanished or unreadable between the failed create and this check — fall through and retry
  }
  return tryCreateExclusive(file, payload)
}

function releaseBootstrapLock(): void {
  try {
    fs.unlinkSync(lockFile())
  } catch {
    // already gone — fine
  }
}

let bootstrapPromise: Promise<void> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null
let cycleInFlight = false

function startRecurringTick(): void {
  if (tickTimer) return // already running in this process
  tickTimer = setInterval(() => {
    if (cycleInFlight) return // never let a slow-responding deployment cause overlapping cycles to pile up requests
    cycleInFlight = true
    void runOperationsMonitoringCycle()
      .catch(() => {
        // runOperationsMonitoringCycle already isolates each project's own failure;
        // a throw here means the cycle itself couldn't run at all — the next tick tries again.
      })
      .finally(() => {
        cycleInFlight = false
      })
  }, TICK_INTERVAL_MS)
  tickTimer.unref?.()
}

export function runOperationsMonitoringBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    const startedAt = Date.now()
    try {
      await runOperationsMonitoringCycle()
      publish({ category: 'Recovery', project: '*', type: 'operations-monitoring-recovery-completed', payload: { durationMs: Date.now() - startedAt } })
    } finally {
      releaseBootstrapLock()
    }
    startRecurringTick()
  })()

  return bootstrapPromise
}
