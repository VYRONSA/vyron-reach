import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { recoverActiveDirectorsOnStartup } from './serverExecutionLoop'
import { publish } from '../events/eventBus'

/**
 * The Recovery Bootstrap — guarantees recoverActiveDirectorsOnStartup()
 * runs exactly once per application process, as part of application
 * startup itself, never as a side effect of which route happens to be
 * imported first. Called from instrumentation.ts's register() hook,
 * which Next.js runs exactly once per server instance, before any
 * request is served — independent of API route order, the first user
 * request, browser activity, dashboard opening, or any lifecycle
 * endpoint being called.
 *
 * This does not change Director decision logic in any way:
 * recoverActiveDirectorsOnStartup() itself is untouched, still exported
 * from serverExecutionLoop.ts and still does exactly what it always did
 * (attempt to reacquire each Running/Planning project's loop lock,
 * fire-and-forget). This file only guarantees WHEN and HOW OFTEN that
 * call happens.
 */

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'recovery-bootstrap.lock')
}
function recordFile(): string {
  return path.join(storeDir(), 'recovery-bootstrap.json')
}

function ensureDir(): void {
  const dir = storeDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * A file lock, not just the in-memory guard below — defense in depth for
 * the (for a single Node.js server, not expected, but not impossible in
 * every deployment topology) case of two genuinely concurrent bootstrap
 * attempts. A lock left behind by a process that crashed mid-bootstrap on
 * a previous startup must never block recovery on THIS startup forever,
 * so a stale lock (its recorded pid no longer alive) is reclaimed, the
 * same way the Director's own loop-ownership lock handles this.
 */
function acquireBootstrapLock(): boolean {
  ensureDir()
  const file = lockFile()
  const payload = JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })
  if (tryCreateExclusive(file, payload)) return true

  try {
    const existing = JSON.parse(fs.readFileSync(file, 'utf-8')) as { pid: number }
    if (isProcessAlive(existing.pid)) return false // a live process is already running bootstrap
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

/** A durable, inspectable record that startup recovery ran — observability only, never consulted to decide whether to run again (recovery must run fresh on every single startup, not just the first one ever). */
function recordStartupRecovery(): void {
  ensureDir()
  fs.writeFileSync(recordFile(), JSON.stringify({ pid: process.pid, completedAt: new Date().toISOString() }, null, 2), 'utf-8')
}

/**
 * The actual "prevent duplicate startup recovery within the same
 * process" guarantee: an in-memory singleton promise. Since this check
 * and its assignment are synchronous with no `await` in between, two
 * calls arriving in the same process (however that happens) can never
 * both see `bootstrapPromise` as null — only the first call runs the
 * bootstrap; every other caller (including this same module being
 * imported again elsewhere) gets back the same in-flight/settled promise.
 */
let bootstrapPromise: Promise<void> | null = null

export function runRecoveryBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return // another concurrent caller already won it
    const startedAt = Date.now()
    try {
      await recoverActiveDirectorsOnStartup()
      recordStartupRecovery()
      publish({ category: 'Recovery', project: '*', type: 'director-recovery-completed', payload: { durationMs: Date.now() - startedAt } })
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
