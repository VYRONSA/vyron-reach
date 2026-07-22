import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { startCertificationSubscription } from './certificationService'

/**
 * Production Validation 2.1, Milestone 2.1.2 — starts the Certification
 * Service's Event Service subscription. Mirrors every other bootstrap in
 * this app (recovery/delivery/scheduler/escalation/retention/metrics):
 * same in-memory singleton promise, same file-lock-with-stale-reclaim,
 * same instrumentation.ts call site shape.
 *
 * Runs alongside metricsBootstrap.ts, both FIRST in instrumentation.ts
 * (before recovery/delivery/scheduler/escalation) — the exact same
 * reasoning Milestone 2.1.1 established: every bootstrap below publishes
 * real DashboardEvents as part of its own startup work, and subscribing
 * after them would silently miss whatever certification-relevant
 * activity (a Recovery event, in particular) happened during startup
 * itself.
 *
 * "Restart recovery": every FeatureCertification record and Evidence
 * Pack is durable (certificationStore.ts, on the same fileJsonStore
 * primitives every other store uses) — a restart re-subscribes and keeps
 * updating Open feature records from exactly where the persisted state
 * left off. A feature that was Open when the process went down is still
 * Open after it comes back, waiting for its batch-completed event
 * exactly as before — nothing about being interrupted mid-feature loses
 * or corrupts its accumulated tallies.
 */
function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'certification-bootstrap.lock')
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

export function runCertificationBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    try {
      startCertificationSubscription()
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
