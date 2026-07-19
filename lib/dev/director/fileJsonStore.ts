import fs from 'node:fs'
import path from 'node:path'
import { atomicWriteFileSync, withFileLock } from '../fileLock'

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
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')

function storeFile(filename: string): string {
  return path.join(STORE_DIR, filename)
}

function ensureStore(file: string, defaultContent: string): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, defaultContent, 'utf-8')
}

export function readJsonStore<T>(filename: string, fallback: T): T {
  const file = storeFile(filename)
  ensureStore(file, JSON.stringify(fallback))
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function writeJsonStore<T>(filename: string, value: T): void {
  const file = storeFile(filename)
  ensureStore(file, JSON.stringify(value))
  atomicWriteFileSync(file, JSON.stringify(value, null, 2))
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
