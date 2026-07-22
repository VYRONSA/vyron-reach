import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { runEscalationCycle } from './escalationService'
import { publish } from '../events/eventBus'

/**
 * The Escalation Bootstrap — guarantees escalation monitoring resumes
 * exactly once per application process at startup, mirroring
 * lib/dev/director/recoveryBootstrap.ts, lib/dev/notifications/
 * deliveryBootstrap.ts, and lib/dev/scheduler/schedulerBootstrap.ts's
 * identical, already-proven pattern (same in-memory promise dedup, same
 * file-lock-with-stale-reclaim).
 *
 * "Prevent duplicate reminders" and "never lose escalation history" fall
 * out of this exactly the way they do for the Scheduler: escalation state
 * (currentLevel, reminderCount, history) is read fresh from disk on every
 * cycle, never cached in memory across a restart, so a resumed process
 * picks up precisely where a crashed one left off — a level already
 * reminded for is never re-reminded, and history is append-only.
 *
 * Runs last in instrumentation.ts, after Director recovery and the
 * Scheduler's own bootstrap — by the time this runs, every inbox item
 * this process will ever see already reflects its true current status.
 */

const TICK_INTERVAL_MS = 60_000

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'escalation-bootstrap.lock')
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
      runEscalationCycle()
    } catch {
      // runEscalationCycle already reports per-item errors into its own
      // result (see EscalationCycleResult.errors) and never throws for an
      // individual item's failure; a throw here means the cycle itself
      // couldn't run at all (e.g. the lock timed out) — the next tick
      // tries again rather than this timer being torn down.
    }
  }, TICK_INTERVAL_MS)
  tickTimer.unref?.()
}

export function runEscalationBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    const startedAt = Date.now()
    try {
      runEscalationCycle()
      publish({ category: 'Recovery', project: '*', type: 'escalation-recovery-completed', payload: { durationMs: Date.now() - startedAt } })
    } finally {
      releaseBootstrapLock()
    }
    startRecurringTick()
  })()

  return bootstrapPromise
}
