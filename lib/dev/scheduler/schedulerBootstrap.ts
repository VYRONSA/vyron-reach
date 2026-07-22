import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { runSchedulingCycle } from './schedulerService'
import { raiseNotification } from '../notifications/notificationService'
import { publish } from '../events/eventBus'

/**
 * The Scheduler Bootstrap — guarantees the Scheduler resumes exactly
 * once per application process at startup, mirroring
 * lib/dev/director/recoveryBootstrap.ts and
 * lib/dev/notifications/deliveryBootstrap.ts's identical, already-proven
 * pattern (same in-memory promise dedup, same file-lock-with-stale-reclaim).
 *
 * Runs deliberately AFTER Director recovery and after the notification
 * delivery bootstrap in instrumentation.ts — by the time this runs,
 * every crashed Director loop this process is going to reclaim has
 * already been reclaimed (its DirectorRuntimeStatus already reflects
 * 'Running' again), so the Scheduler's very first cycle correctly sees
 * "already running" for those projects instead of mistaking a
 * about-to-be-recovered project for Idle and trying to double-start it.
 * "Respect existing Director ownership" falls out of that ordering, not
 * from any new coordination this file adds.
 *
 * After the initial recovery cycle, starts a recurring tick so the
 * Scheduler keeps re-evaluating projects for the life of the process —
 * not just once at startup. Each tick is a completely ordinary call to
 * runSchedulingCycle(), which has its own per-cycle file lock (see
 * schedulerService.ts) — this file's own bootstrap lock only protects
 * the one-time startup sequencing, not ongoing ticks.
 */

const TICK_INTERVAL_MS = 30_000

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'scheduler-bootstrap.lock')
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

function startRecurringTick(): void {
  if (tickTimer) return // already running in this process
  tickTimer = setInterval(() => {
    try {
      runSchedulingCycle()
    } catch {
      // runSchedulingCycle already reports per-project errors into its own
      // result (see SchedulerCycleResult.errors) and never throws for an
      // individual project's failure; a throw here means the cycle itself
      // couldn't run at all (e.g. the lock timed out) — the next tick
      // tries again rather than this timer being torn down.
    }
  }, TICK_INTERVAL_MS)
  // Never keeps the process alive on its own — matches every other
  // background interval in this codebase's philosophy of not blocking
  // a clean process exit.
  tickTimer.unref?.()
}

export function runSchedulerBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    const startedAt = Date.now()
    try {
      runSchedulingCycle()
      await raiseNotification({
        type: 'Scheduler Recovered',
        // Not project-specific — '*' is this codebase's lightweight
        // convention for a cross-project event where NotificationEvent
        // still requires some project string.
        project: '*',
        title: 'Cross-Project Execution Scheduler recovered',
        message: 'The Scheduler resumed after a restart and completed its first scheduling cycle.',
        severity: 'Info',
        metadata: {},
      })
      publish({ category: 'Recovery', project: '*', type: 'scheduler-recovery-completed', payload: { durationMs: Date.now() - startedAt } })
    } finally {
      releaseBootstrapLock()
    }
    startRecurringTick()
  })()

  return bootstrapPromise
}
