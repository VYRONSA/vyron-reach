import fs from 'node:fs'
import path from 'node:path'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { resumeStuckProvisioning } from './initiationProvisioningService'
import { publish } from '../events/eventBus'

/**
 * PRA-P1-015 remediation — the Initiation Recovery Bootstrap, guarantees
 * resumeStuckProvisioning() runs exactly once per application process, as
 * part of application startup itself, mirroring
 * lib/dev/director/recoveryBootstrap.ts's own pattern exactly (same lock
 * file mechanics, same stale-lock reclaim via isProcessAlive, same
 * in-memory once-per-process guard). Before this existed, an
 * InitiationRequest left stuck in 'Provisioning' by a crash or timeout had
 * no automatic recovery path at all — only a manual retry of the same
 * POST /provision request (now itself possible again, see
 * initiationService.ts's beginProvisioning) would ever resume it.
 *
 * Called from instrumentation.ts's register() hook, after the Director's
 * own recovery bootstrap — ordering doesn't matter for correctness here
 * (the two subsystems touch disjoint stores), but running after keeps
 * this file consistent with the rest of that hook's documented ordering
 * reasoning (each bootstrap after the ones whose startup activity it has
 * no dependency on).
 */

function storeDir(): string {
  return getVyronDevDataDir()
}
function lockFile(): string {
  return path.join(storeDir(), 'initiation-recovery-bootstrap.lock')
}
function recordFile(): string {
  return path.join(storeDir(), 'initiation-recovery-bootstrap.json')
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
function recordStartupRecovery(resumed: string[], failed: { id: string; reason: string }[]): void {
  ensureDir()
  fs.writeFileSync(
    recordFile(),
    JSON.stringify({ pid: process.pid, completedAt: new Date().toISOString(), resumed, failed }, null, 2),
    'utf-8'
  )
}

/** The "prevent duplicate startup recovery within the same process" guarantee — see recoveryBootstrap.ts's identical in-memory singleton-promise pattern for why this is race-free. */
let bootstrapPromise: Promise<void> | null = null

export function runInitiationRecoveryBootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    if (!acquireBootstrapLock()) return // another concurrent caller already won it
    const startedAt = Date.now()
    try {
      const { resumed, failed } = await resumeStuckProvisioning()
      recordStartupRecovery(resumed, failed)
      publish({
        category: 'Recovery',
        project: '*',
        type: 'initiation-recovery-completed',
        payload: { durationMs: Date.now() - startedAt, resumedCount: resumed.length, failedCount: failed.length },
      })
    } finally {
      releaseBootstrapLock()
    }
  })()

  return bootstrapPromise
}
