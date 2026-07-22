import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { tryCreateExclusive } from '../fileLock'
import { isProcessAlive } from '../runtime/processLiveness'
import { getVyronDevDataDir } from '../vyronDevDataDir'

/**
 * Durable, atomic ownership of "who may run this project's Engineering
 * Director loop right now" — the root-cause fix for duplicate execution.
 * Deliberately NOT an in-memory Set: a module-level variable is only a
 * true mutex within one shared module instance, and Next.js does not
 * guarantee that different route files importing the same module get the
 * same instance (route loading, module re-evaluation, and separate
 * requests can each end up with their own copy). A lock file, by
 * contrast, is anchored in the filesystem — every route, every request,
 * every process reads and writes the exact same inode, so "only one
 * holder at a time" is enforced by the OS, not by JavaScript.
 */

function lockDir(): string {
  return path.join(getVyronDevDataDir(), 'director-locks')
}

type LockContents = { owner: string; pid: number; acquiredAt: string }

function lockFile(project: string): string {
  return path.join(lockDir(), `${project}.lock`)
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
 * Attempts to become the sole owner of `project`'s execution loop.
 * Returns an owner token on success (pass it to releaseLoopOwnership
 * when the loop stops), or `null` if another still-alive holder already
 * owns it — callers MUST treat `null` as "exit immediately, never start
 * a loop," not retry in a way that could race.
 *
 * The acquisition itself is a single atomic filesystem operation
 * (`tryCreateExclusive`, built on O_CREAT|O_EXCL) — there is no
 * check-then-act gap for two concurrent callers to both slip through. The
 * only case that needs extra logic is a *stale* lock left behind by a
 * process that died without releasing it (a crash or a killed dev
 * server): that is detected via `isProcessAlive` on the recorded pid, and
 * only then is the lock forcibly reclaimed — and the reclaim's own final
 * step is, again, a single atomic create, so even two callers racing to
 * reclaim the same stale lock can still only produce one winner.
 */
export function acquireLoopOwnership(project: string): string | null {
  ensureDir()
  const file = lockFile(project)
  const owner = randomUUID()
  const payload = JSON.stringify({ owner, pid: process.pid, acquiredAt: new Date().toISOString() } satisfies LockContents)

  if (tryCreateExclusive(file, payload)) return owner

  const existing = readLock(file)
  if (existing && isProcessAlive(existing.pid)) return null // a live holder already owns this project's loop — never start a second one

  // Stale lock from a process that's no longer running (crash/restart) — reclaim it.
  try {
    fs.unlinkSync(file)
  } catch {
    // already gone, or another reclaimer just removed it — either way, proceed to the atomic (re)create below
  }
  return tryCreateExclusive(file, payload) ? owner : null
}

/** Releases ownership only if the caller is still the recorded owner — a late release from a stale/superseded holder can never clobber a newer legitimate lock. */
export function releaseLoopOwnership(project: string, owner: string): void {
  const file = lockFile(project)
  const existing = readLock(file)
  if (existing && existing.owner === owner) {
    try {
      fs.unlinkSync(file)
    } catch {
      // already gone — fine
    }
  }
}
