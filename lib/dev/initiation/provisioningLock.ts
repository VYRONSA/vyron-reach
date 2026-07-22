import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'

/**
 * CB-002 remediation — durable, atomic ownership of "who may actually run
 * this InitiationRequest's provisioning work right now." Mirrors
 * lib/dev/director/directorLock.ts exactly (same reasoning applies: a
 * module-level in-memory flag is only a mutex within one shared module
 * instance, not guaranteed across route/process boundaries; a lock file
 * anchored in the filesystem is enforced by the OS for every caller).
 *
 * Root cause this closes: beginProvisioning's CAS (initiationService.ts)
 * deliberately accepts 'Provisioning' as a source status so a crashed/stuck
 * record can be resumed (PRA-P1-015) — but that same widening means two
 * genuinely overlapping calls (not a sequential crash-retry, an actual
 * second concurrent request while the first is still actively running)
 * both pass that CAS, and without this lock both would go on to run
 * provisionProgramme concurrently against the same initially-empty/partial
 * `existing` snapshot, each creating its own duplicate Planning Service
 * records for the same tempIds before either's write was visible to the
 * other. This lock is acquired around the actual mutating work (not
 * around beginProvisioning's CAS itself, which stays exactly as it was),
 * so a losing concurrent caller simply no-ops instead of erroring or
 * blocking — never touching provisionProgramme a second time while the
 * winner is still working.
 *
 * Scoped per initiation id (not global), so concurrent provisioning
 * requests for two different projects never contend with each other —
 * only two calls for the exact same InitiationRequest ever race here.
 */

function lockDir(): string {
  return path.join(getVyronDevDataDir(), 'provisioning-locks')
}

type LockContents = { owner: string; pid: number; acquiredAt: string }

function lockFile(initiationId: string): string {
  return path.join(lockDir(), `${initiationId}.lock`)
}

function ensureDir(): void {
  const dir = lockDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readLock(file: string): LockContents | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as LockContents
  } catch {
    return null
  }
}

/**
 * Attempts to become the sole owner of `initiationId`'s provisioning work.
 * Returns an owner token on success (pass it to releaseProvisioningOwnership
 * when the work finishes, success or failure), or `null` if another
 * still-alive holder already owns it — callers MUST treat `null` as "do not
 * run provisionProgramme, exit immediately," never retry/wait in a way that
 * could race.
 *
 * A stale lock left behind by a process that died mid-provisioning (a crash
 * or killed dev server) is detected via `isProcessAlive` on the recorded
 * pid and reclaimed — this is what preserves PRA-P1-015's crash-recovery
 * behavior: resumeStuckProvisioning (running in a fresh, genuinely alive
 * process) can still acquire this lock and complete the work.
 */
export function acquireProvisioningOwnership(initiationId: string): string | null {
  ensureDir()
  const file = lockFile(initiationId)
  const owner = randomUUID()
  const payload = JSON.stringify({ owner, pid: process.pid, acquiredAt: new Date().toISOString() } satisfies LockContents)

  if (tryCreateExclusive(file, payload)) return owner

  const existing = readLock(file)
  if (existing && isProcessAlive(existing.pid)) return null // a live holder is already provisioning this exact initiation — never run it a second time concurrently

  // Stale lock from a process that's no longer running (crash/restart) — reclaim it.
  try {
    fs.unlinkSync(file)
  } catch {
    // already gone, or another reclaimer just removed it — either way, proceed to the atomic (re)create below
  }
  return tryCreateExclusive(file, payload) ? owner : null
}

/** Releases ownership only if the caller is still the recorded owner — a late release from a stale/superseded holder can never clobber a newer legitimate lock. */
export function releaseProvisioningOwnership(initiationId: string, owner: string): void {
  const file = lockFile(initiationId)
  const existing = readLock(file)
  if (existing && existing.owner === owner) {
    try {
      fs.unlinkSync(file)
    } catch {
      // already gone — fine
    }
  }
}
