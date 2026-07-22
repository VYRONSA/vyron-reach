import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../../fileLock'
import { isProcessAlive } from '../../runtime/processLiveness'
import { getVyronDevDataDir } from '../../vyronDevDataDir'
import { resumeStuckReleases } from './releaseManagementService'
import { publish } from '../../events/eventBus'

/**
 * PRA-P1-025 remediation — the Release Recovery Bootstrap, guarantees
 * resumeStuckReleases() runs exactly once per application process, as
 * part of application startup itself, mirroring
 * lib/dev/director/recoveryBootstrap.ts's and
 * lib/dev/initiation/initiationRecoveryBootstrap.ts's identical lock/
 * once-per-process pattern. Before this existed, a ReleaseRequest left
 * stuck in 'Releasing' by a crash mid-execution had no automatic
 * reconciliation at all — recoverActiveDirectorsOnStartup only revisits
 * Director-runtime state (Running/Planning), which by the time a release
 * executes is already legitimately 'Completed', so it never looked at
 * Release Management's own store.
 */

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'release-recovery-bootstrap.lock')
}
function recordFile(): string {
  return path.join(storeDir(), 'release-recovery-bootstrap.json')
}

function ensureDir(): void {
  const dir = storeDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** Same reasoning as recoveryBootstrap.ts's acquireBootstrapLock: a lock left behind by a process that crashed mid-bootstrap on a previous startup must never block recovery on this startup forever. */
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

/** A durable, inspectable record that startup recovery ran — observability only, never consulted to decide whether to run again. */
function recordStartupRecovery(failedOut: string[]): void {
  ensureDir()
  fs.writeFileSync(
    recordFile(),
    JSON.stringify({ pid: process.pid, completedAt: new Date().toISOString(), failedOut }, null, 2),
    'utf-8'
  )
}

/** The "prevent duplicate startup recovery within the same process" guarantee — see recoveryBootstrap.ts's identical in-memory singleton-promise pattern for why this is race-free. */
let bootstrapPromise: Promise<void> | null = null

export function runReleaseRecoveryBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return // another concurrent caller already won it
    const startedAt = Date.now()
    try {
      const { failedOut } = await resumeStuckReleases()
      recordStartupRecovery(failedOut)
      publish({
        category: 'Recovery',
        project: '*',
        type: 'release-recovery-completed',
        payload: { durationMs: Date.now() - startedAt, failedOutCount: failedOut.length },
      })
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
