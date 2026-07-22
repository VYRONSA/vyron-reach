import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { listPendingDeliveries } from './deliveryStore'
import { getDeliveryHandler, processDelivery } from './deliveryQueue'
import { publish } from '../events/eventBus'
// Imported purely for their registerDeliveryHandler() side effects at
// module load — this is how the registry (deliveryQueue.ts) knows how to
// actually resume an Email/WhatsApp delivery on recovery, without this
// file needing to import or know anything about either provider's
// transport details.
import './providers/emailNotificationProvider'
import './providers/whatsappNotificationProvider'

/**
 * The Notification Delivery Bootstrap — guarantees pending deliveries
 * (Queued/Sending/Retrying, left behind by a process that crashed or
 * restarted mid-delivery) resume exactly once per application process,
 * as part of application startup itself. Mirrors
 * lib/dev/director/recoveryBootstrap.ts's exact pattern (same in-memory
 * promise dedup, same file-lock-with-stale-reclaim defense-in-depth,
 * same instrumentation.ts call site) rather than inventing a different
 * one — this codebase already has one proven-correct answer to "run
 * exactly once at startup," so this reuses it instead of the older
 * module-load-side-effect pattern (lib/dev/runtime/runtimeQueue.ts still
 * uses that older pattern; not something this milestone touches).
 *
 * A 'Sending' delivery record specifically means the process died mid-attempt
 * — whether the remote provider actually received it before the crash is
 * genuinely unknown. Resuming it (rather than leaving it stuck forever)
 * accepts a small, explicit risk of a duplicate send in that narrow
 * window, which every queued-delivery system carries unless the provider
 * itself de-duplicates by an idempotency key; documented here rather than
 * silently assumed away.
 */

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'notification-delivery-bootstrap.lock')
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
    if (isProcessAlive(existing.pid)) return false // a live process is already resuming deliveries
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

function resumePendingDeliveries(): void {
  for (const delivery of listPendingDeliveries()) {
    const handler = getDeliveryHandler(delivery.provider)
    // An unknown provider name (e.g. one that existed in a previous
    // deployment but was removed) has nothing to resume it with — left
    // as-is rather than guessed at; a future manual/administrative pass
    // can reconcile it, not this bootstrap.
    if (!handler) continue
    void processDelivery(delivery.id, handler)
  }
}

let bootstrapPromise: Promise<void> | null = null

export function runNotificationDeliveryBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return
    const startedAt = Date.now()
    try {
      resumePendingDeliveries()
      publish({ category: 'Recovery', project: '*', type: 'delivery-recovery-completed', payload: { durationMs: Date.now() - startedAt } })
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
