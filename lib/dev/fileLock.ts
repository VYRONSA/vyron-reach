import fs from 'node:fs'

/**
 * Durable, cross-process file coordination primitives — the foundation
 * both the Director's loop-ownership lock (directorLock.ts) and its
 * stores' atomic persistence are built on. None of this relies on
 * in-memory state (a `Set`, a module-level variable, a singleton import):
 * everything here is anchored in the filesystem's own atomicity
 * guarantees, which is what makes it safe across separate Next.js route
 * module instances, separate requests, and process restarts — the exact
 * boundaries an in-memory guard cannot survive.
 */

/**
 * Atomically creates `file` with `contents`, succeeding only if it did not
 * already exist. Built on `fs`'s `O_CREAT|O_EXCL` semantics (Node's `'wx'`
 * flag), which the OS itself guarantees is all-or-nothing even when two
 * separate processes attempt it at the same instant — this is the one
 * primitive every lock in this app is built from.
 */
export function tryCreateExclusive(file: string, contents: string): boolean {
  try {
    fs.writeFileSync(file, contents, { flag: 'wx' })
    return true
  } catch {
    return false
  }
}

/** Write-then-rename so a reader never observes a partially-written file, even if the process is killed mid-write — `rename` on the same filesystem is atomic. */
export function atomicWriteFileSync(file: string, contents: string): void {
  const tmp = `${file}.tmp-${process.pid}-${process.hrtime.bigint()}`
  fs.writeFileSync(tmp, contents, 'utf-8')
  fs.renameSync(tmp, file)
}

const LOCK_RETRY_DELAY_MS = 5
const LOCK_TIMEOUT_MS = 5000
/** A lock file older than this is assumed abandoned by a process that died while holding it, and is forcibly cleared rather than waited on forever. */
const STALE_LOCK_MS = 10_000

/**
 * A blocking mutex scoped to one file path: every caller eventually gets
 * in (unlike directorLock.ts's "acquire or abandon" loop-ownership lock),
 * used to make a store's whole read-modify-write cycle atomic across
 * processes/module instances — the fix for "no write may overwrite
 * another valid write; no record may disappear."
 *
 * The wait is a deliberate short synchronous spin, not `await`-based: the
 * callers here (store read/mutate/write) are themselves synchronous
 * (`fs.*Sync`), specifically so this keeps working from contexts that
 * aren't `async` — introducing an `await` here would only move the
 * problem, not remove it. Bounded by LOCK_TIMEOUT_MS so a truly stuck
 * caller fails loudly instead of hanging forever.
 */
export function withFileLock<T>(targetFile: string, fn: () => T): T {
  const lockPath = `${targetFile}.lock`
  const deadline = Date.now() + LOCK_TIMEOUT_MS

  for (;;) {
    if (tryCreateExclusive(lockPath, String(process.pid))) break
    try {
      const age = Date.now() - fs.statSync(lockPath).mtimeMs
      if (age > STALE_LOCK_MS) fs.unlinkSync(lockPath)
    } catch {
      // Vanished between the failed create and this check (another
      // waiter already reclaimed/released it), or stat failed — either
      // way, just loop around and retry the create.
    }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for a lock on ${targetFile}`)
    const until = Date.now() + LOCK_RETRY_DELAY_MS
    while (Date.now() < until) {
      /* deliberate short synchronous spin — see doc comment above */
    }
  }

  try {
    return fn()
  } finally {
    try {
      fs.unlinkSync(lockPath)
    } catch {
      // already gone — fine
    }
  }
}
