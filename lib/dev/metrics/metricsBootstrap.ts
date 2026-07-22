import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { startMetricsSubscription } from './metricsService'
import { maybeTakeSnapshot } from './snapshotService'
import type { SnapshotGranularity } from './metricsTypes'

/**
 * Production Validation 2.1, Milestone 2.1.1 — starts the Metrics
 * Service's Event Service subscription and its recurring snapshot tick.
 * Mirrors every other bootstrap in this app (recovery/delivery/
 * scheduler/escalation/retention): same in-memory singleton promise,
 * same file-lock-with-stale-reclaim, same instrumentation.ts call site
 * shape — this app already has one proven answer to "run exactly once at
 * startup, then keep running in the background," reused again rather
 * than invented a sixth time.
 *
 * "Recovery after restart": the Metrics Service's own counters/durations
 * are durable (metricsStore.ts, on the same fileJsonStore primitives
 * every other store uses) — a restart re-subscribes to the Event Service
 * and keeps accumulating from exactly where the persisted state left
 * off. What does NOT survive a restart is any event published while
 * this process was down entirely: eventBus.ts is deliberately transient
 * (Milestone 5.1's "Do not persist event streams"), so a gap while the
 * whole server is offline is not retroactively recovered — the same
 * limitation every other Event Service subscriber in this app already
 * has, not something unique to metrics.
 */

const TICK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes — cheap no-op unless a period boundary was actually crossed, see maybeTakeSnapshot
const GRANULARITIES: SnapshotGranularity[] = ['hourly', 'daily', 'weekly', 'monthly']

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'metrics-bootstrap.lock')
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

function takeAllDueSnapshots(): void {
  for (const granularity of GRANULARITIES) {
    try {
      maybeTakeSnapshot(granularity)
    } catch {
      // The next tick tries again — a transient failure taking one
      // granularity's snapshot must never skip the others or crash the
      // process.
    }
  }
}

let bootstrapPromise: Promise<void> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

function startRecurringTick(): void {
  if (tickTimer) return
  tickTimer = setInterval(takeAllDueSnapshots, TICK_INTERVAL_MS)
  tickTimer.unref?.()
}

export function runMetricsBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    try {
      startMetricsSubscription()
      takeAllDueSnapshots() // an initial capture so a fresh deployment has at least one snapshot per granularity immediately, not after the first 5-minute tick
    } finally {
      releaseBootstrapLock()
    }
    startRecurringTick()
  })()

  return bootstrapPromise
}
