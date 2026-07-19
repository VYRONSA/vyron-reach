import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { recoverActiveDirectorsOnStartup } from './serverExecutionLoop'

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

const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const LOCK_FILE = path.join(STORE_DIR, 'recovery-bootstrap.lock')
const RECORD_FILE = path.join(STORE_DIR, 'recovery-bootstrap.json')

function ensureDir(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
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
  const payload = JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })
  if (tryCreateExclusive(LOCK_FILE, payload)) return true

  try {
    const existing = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8')) as { pid: number }
    if (isProcessAlive(existing.pid)) return false // a live process is already running bootstrap
    fs.unlinkSync(LOCK_FILE)
  } catch {
    // vanished or unreadable between the failed create and this check — fall through and retry
  }
  return tryCreateExclusive(LOCK_FILE, payload)
}

function releaseBootstrapLock(): void {
  try {
    fs.unlinkSync(LOCK_FILE)
  } catch {
    // already gone — fine
  }
}

/** A durable, inspectable record that startup recovery ran — observability only, never consulted to decide whether to run again (recovery must run fresh on every single startup, not just the first one ever). */
function recordStartupRecovery(): void {
  ensureDir()
  fs.writeFileSync(RECORD_FILE, JSON.stringify({ pid: process.pid, completedAt: new Date().toISOString() }, null, 2), 'utf-8')
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
    try {
      await recoverActiveDirectorsOnStartup()
      recordStartupRecovery()
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
