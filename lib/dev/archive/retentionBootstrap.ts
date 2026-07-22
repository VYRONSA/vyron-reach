import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { archiveClosedInboxItems } from '../director/engineeringInboxStore'
import { archiveReadNotifications } from '../notifications/inAppNotificationStore'
import { archiveTerminalDeliveries } from '../notifications/deliveryStore'
import { archiveClosedEscalations } from '../escalation/escalationStateStore'

/**
 * "Implement automatic archival" (Version 2.0 Phase 5, Milestone 5.2) —
 * the recurring driver behind every store's own archiveEligibleRecords
 * call (see archiveService.ts). Mirrors recoveryBootstrap.ts/
 * deliveryBootstrap.ts/schedulerBootstrap.ts/escalationBootstrap.ts's
 * identical, already-proven pattern exactly (same in-memory promise
 * dedup, same file-lock-with-stale-reclaim, same recurring `setInterval`
 * shape) rather than inventing a fifth way to "run recurring background
 * work in this process."
 *
 * Runs far less often than the Scheduler's or Escalation's ticks
 * (housekeeping, not time-sensitive coordination) and deliberately does
 * NOT run its first pass synchronously inside the startup sequence the
 * way the other four bootstraps do — archiving on every single process
 * restart would race ordinary startup with file I/O across four stores
 * for no benefit; the first pass happens on the first regular tick
 * instead, TICK_INTERVAL_MS after this module loads.
 */

const TICK_INTERVAL_MS = 60 * 60 * 1000 // hourly

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'retention-bootstrap.lock')
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

/** Every store's own retention policy is defined where that store's data lives (engineeringInboxStore.ts, inAppNotificationStore.ts, deliveryStore.ts, escalationStateStore.ts) — "Different stores may define different retention periods" — this function just calls each of them with the current time, deterministically, one after another. */
function runArchivalPass(): void {
  const now = new Date().toISOString()
  // Each store's own isEligible predicate is the only thing that decides
  // what can ever be archived (see archiveService.ts's doc comment) — a
  // failure in one store's pass must never skip the others.
  for (const archive of [archiveClosedInboxItems, archiveReadNotifications, archiveTerminalDeliveries, archiveClosedEscalations]) {
    try {
      archive(now)
    } catch {
      // The next hourly tick tries again — a transient failure here
      // (e.g. a lock timeout racing a live write) is never worth
      // crashing the process over.
    }
  }
}

let bootstrapPromise: Promise<void> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

function startRecurringTick(): void {
  if (tickTimer) return
  tickTimer = setInterval(runArchivalPass, TICK_INTERVAL_MS)
  tickTimer.unref?.()
}

export function runRetentionBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    try {
      startRecurringTick()
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}

/** Exposed for tests and for any future manual/administrative "archive now" trigger — the recurring tick above is just this, called on a timer. */
export { runArchivalPass }
