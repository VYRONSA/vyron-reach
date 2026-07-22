import fs from 'node:fs'
import path from 'node:path'
import { atomicWriteFileSync, withFileLock } from '../fileLock'
import { getVyronDevDataDir } from '../vyronDevDataDir'

/**
 * Shared server-side, file-backed JSON store — the same pattern
 * lib/dev/runtime/runtimeStorage.ts already established for the job store
 * (lives outside .next/ so a build doesn't wipe it; gitignored since this
 * is local runtime state, not project data), generalized so the Director's
 * several small stores (runtime status, inbox, history, in-app
 * notifications) don't each hand-roll the same ensure/read/write dance.
 *
 * Every write is atomic (write-then-rename, never a partial file), and
 * `updateJsonStore` is the one safe way to mutate: it holds a real
 * cross-process file lock across the read-mutate-write cycle so two
 * concurrent updates can never interleave and silently lose one side's
 * change (the read-modify-write race that previously made records vanish
 * under concurrent execution).
 */
function storeDir(): string {
  return getVyronDevDataDir()
}

function storeFile(filename: string): string {
  return path.join(storeDir(), filename)
}

function ensureStore(file: string, defaultContent: string): void {
  const dir = storeDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, defaultContent, 'utf-8')
}

/**
 * Version 2.0 Phase 5 Milestone 5.2 ("Performance" — "Avoid repeated full-
 * file scans," "Minimize unnecessary serialization") — a read-through/
 * write-through cache keyed by absolute file path. Every store in this
 * app already goes through readJsonStore/writeJsonStore/updateJsonStore,
 * so caching here is the one change that speeds up every single one of
 * them, exactly the "extend existing services only" mandate: no store's
 * own code changes, no new persistence mechanism, the on-disk format and
 * every existing function's signature/behavior stay identical.
 *
 * Correctness rests on one cheap syscall: `fs.statSync(file).mtimeMs`.
 * On every read, the cache is only trusted if the file's mtime still
 * matches what was recorded when it was cached — so a write from ANOTHER
 * process (this app's file locks already anticipate that possibility) is
 * always detected before the next read, at the cost of a stat() call
 * instead of a full read+parse. A write from THIS process never even
 * needs that check: writeJsonStore populates the cache directly from the
 * value already in hand, skipping a redundant read+re-parse of what was
 * just serialized.
 */
type CacheEntry = { mtimeMs: number; data: unknown }
const cache = new Map<string, CacheEntry>()

export function readJsonStore<T>(filename: string, fallback: T): T {
  const file = storeFile(filename)
  ensureStore(file, JSON.stringify(fallback))

  const mtimeMs = fs.statSync(file).mtimeMs
  const cached = cache.get(file)
  if (cached && cached.mtimeMs === mtimeMs) return cached.data as T

  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as T
    cache.set(file, { mtimeMs, data })
    return data
  } catch (err) {
    // PRA-P1-007: this used to swallow a parse failure silently, so a
    // corrupted store (e.g. two subsystems writing incompatible shapes to
    // the same filename, the exact PRA-P1-003 collision) was
    // indistinguishable from "no history yet" — an operator saw an empty
    // list with no signal anything was actually wrong. Every store in the
    // codebase reads through this one function, so logging here covers
    // all of them at once rather than each store needing its own fix.
    console.warn(`[fileJsonStore] Failed to parse "${file}" as JSON — returning the fallback value instead of the corrupted content.`, err)
    return fallback
  }
}

export function writeJsonStore<T>(filename: string, value: T): void {
  const file = storeFile(filename)
  ensureStore(file, JSON.stringify(value))
  atomicWriteFileSync(file, JSON.stringify(value, null, 2))
  cache.set(file, { mtimeMs: fs.statSync(file).mtimeMs, data: value })
}

/**
 * The one safe way to mutate a JSON store under concurrency: read the
 * current value, compute the next one, and write it back, all inside a
 * single exclusive file lock — no other reader-then-writer can interleave
 * in between and clobber this update or have theirs clobbered.
 */
export function updateJsonStore<T>(filename: string, fallback: T, mutate: (current: T) => T): T {
  const file = storeFile(filename)
  return withFileLock(file, () => {
    const current = readJsonStore(filename, fallback)
    const next = mutate(current)
    writeJsonStore(filename, next)
    return next
  })
}
