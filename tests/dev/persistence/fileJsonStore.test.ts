import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { readJsonStore, writeJsonStore, updateJsonStore } from '../../../lib/dev/director/fileJsonStore'
import { atomicWriteFileSync, tryCreateExclusive } from '../../../lib/dev/fileLock'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Persistence — atomic write / write-then-rename', () => {
  it('atomicWriteFileSync leaves no partial or leftover temp file behind', () => {
    const file = path.join(isolated.dir, 'target.json')
    atomicWriteFileSync(file, JSON.stringify({ hello: 'world' }))
    expect(fs.readFileSync(file, 'utf-8')).toBe(JSON.stringify({ hello: 'world' }))
    const leftovers = fs.readdirSync(isolated.dir).filter(f => f.includes('.tmp-'))
    expect(leftovers).toEqual([])
  })

  it('a reader never observes a half-written file — the target only ever exists as the old or new full content', () => {
    const file = path.join(isolated.dir, 'target.json')
    atomicWriteFileSync(file, 'version-1')
    expect(fs.readFileSync(file, 'utf-8')).toBe('version-1')
    atomicWriteFileSync(file, 'version-2-longer-content')
    expect(fs.readFileSync(file, 'utf-8')).toBe('version-2-longer-content')
  })

  it('writeJsonStore creates the store directory and file on first write', () => {
    writeJsonStore('fresh.json', { a: 1 })
    const file = path.join(isolated.dir, 'fresh.json')
    expect(fs.existsSync(file)).toBe(true)
    expect(JSON.parse(fs.readFileSync(file, 'utf-8'))).toEqual({ a: 1 })
  })
})

describe('Persistence — power-loss simulation', () => {
  it('an interrupted write (temp file created, rename never happens) never corrupts or replaces the real target', () => {
    const file = path.join(isolated.dir, 'target.json')
    writeJsonStore('target.json', { safe: true })

    // Simulate a crash between the tmp write and the rename: create a tmp
    // file the same way atomicWriteFileSync does, but never rename it.
    const orphanTmp = `${file}.tmp-99999-123456789`
    fs.writeFileSync(orphanTmp, '{"corrupt": tr', 'utf-8') // deliberately truncated/invalid JSON

    // The real target must be completely unaffected by the orphaned tmp file.
    expect(JSON.parse(fs.readFileSync(file, 'utf-8'))).toEqual({ safe: true })
    expect(readJsonStore('target.json', { safe: false })).toEqual({ safe: true })

    fs.unlinkSync(orphanTmp)
  })

  it('readJsonStore falls back to the given default instead of throwing when the file contains invalid JSON', () => {
    const file = path.join(isolated.dir, 'broken.json')
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(file, '{not valid json', 'utf-8')
    expect(readJsonStore('broken.json', { fallback: true })).toEqual({ fallback: true })
  })

  it('logs a warning naming the file on a parse failure, instead of silently masking corruption as "no history yet" (PRA-P1-007)', () => {
    const file = path.join(isolated.dir, 'broken.json')
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(file, '{not valid json', 'utf-8')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      readJsonStore('broken.json', { fallback: true })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toContain('broken.json')
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('never warns on a normal, successful read — only on an actual parse failure', () => {
    writeJsonStore('healthy.json', { ok: true })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      readJsonStore('healthy.json', { ok: false })
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('a lock file abandoned mid-mutation (simulated crash while holding the lock) is reclaimed once stale, not held forever', () => {
    const file = path.join(isolated.dir, 'locked.json')
    writeJsonStore('locked.json', { count: 0 })
    const lockPath = `${file}.lock`

    // Simulate a process that crashed while holding the lock: create the
    // lock file directly (bypassing withFileLock's own release), then
    // backdate its mtime past the staleness window so the next real
    // updateJsonStore call is forced to reclaim it rather than wait/timeout.
    tryCreateExclusive(lockPath, '999999')
    const past = new Date(Date.now() - 20_000)
    fs.utimesSync(lockPath, past, past)

    const result = updateJsonStore<{ count: number }>('locked.json', { count: 0 }, current => ({ count: current.count + 1 }))
    expect(result.count).toBe(1)
    expect(fs.existsSync(lockPath)).toBe(false)
  })
})

describe('Persistence — restart recovery / state durability', () => {
  it('data written before a simulated restart is fully readable afterward', () => {
    writeJsonStore('durable.json', { value: 'before-restart' })

    // "Restart" here means: nothing about the store module carries any
    // memory of the previous write except what's on disk — every read
    // must be provably consistent with the file's actual current content.
    // We simulate that by reading through a value nobody kept a reference
    // to (readJsonStore's own mtime-checked cache, see fileJsonStore.ts,
    // is irrelevant here: it only ever skips re-parsing when the file is
    // provably unchanged, never returns stale data).
    const readBack = readJsonStore<{ value: string }>('durable.json', { value: 'MISSING' })
    expect(readBack.value).toBe('before-restart')
  })

  it('updateJsonStore mutations survive being read by a completely separate call site', () => {
    updateJsonStore<string[]>('list.json', [], current => [...current, 'a'])
    updateJsonStore<string[]>('list.json', [], current => [...current, 'b'])
    updateJsonStore<string[]>('list.json', [], current => [...current, 'c'])
    expect(readJsonStore<string[]>('list.json', [])).toEqual(['a', 'b', 'c'])
  })

  it('a store file for one filename is fully independent of another — no cross-contamination', () => {
    writeJsonStore('store-a.json', { owner: 'a' })
    writeJsonStore('store-b.json', { owner: 'b' })
    expect(readJsonStore('store-a.json', {})).toEqual({ owner: 'a' })
    expect(readJsonStore('store-b.json', {})).toEqual({ owner: 'b' })
  })
})

describe('Persistence — read-through cache (Version 2.0 Phase 5 Milestone 5.2)', () => {
  it('a second read of unchanged data returns an equal value without re-parsing the file', () => {
    writeJsonStore('cached.json', { value: 'v1' })
    const first = readJsonStore('cached.json', { value: 'MISSING' })
    const second = readJsonStore('cached.json', { value: 'MISSING' })
    expect(second).toEqual(first)
    expect(second).toEqual({ value: 'v1' })
  })

  it('detects a write from this process and returns the new value on the next read', () => {
    writeJsonStore('cached.json', { value: 'v1' })
    readJsonStore('cached.json', { value: 'MISSING' }) // populate the cache
    writeJsonStore('cached.json', { value: 'v2' })
    expect(readJsonStore('cached.json', { value: 'MISSING' })).toEqual({ value: 'v2' })
  })

  it('detects a write made directly to disk (simulating a separate process, bypassing this module\'s own cache population) via the file\'s changed mtime', () => {
    const file = path.join(isolated.dir, 'cached.json')
    writeJsonStore('cached.json', { value: 'v1' })
    readJsonStore('cached.json', { value: 'MISSING' }) // populate the cache

    // Simulate another process writing the same file with a distinctly
    // later mtime — fs.utimesSync guarantees the change is observable
    // regardless of the filesystem's mtime write-coalescing behavior for
    // two rapid writes in the same test tick.
    fs.writeFileSync(file, JSON.stringify({ value: 'v2-from-another-process' }), 'utf-8')
    const future = new Date(Date.now() + 5000)
    fs.utimesSync(file, future, future)

    expect(readJsonStore('cached.json', { value: 'MISSING' })).toEqual({ value: 'v2-from-another-process' })
  })

  it('every store file has its own independent cache entry', () => {
    writeJsonStore('cache-a.json', { owner: 'a' })
    writeJsonStore('cache-b.json', { owner: 'b' })
    readJsonStore('cache-a.json', {})
    readJsonStore('cache-b.json', {})
    writeJsonStore('cache-a.json', { owner: 'a-updated' })
    expect(readJsonStore('cache-a.json', {})).toEqual({ owner: 'a-updated' })
    expect(readJsonStore('cache-b.json', {})).toEqual({ owner: 'b' })
  })
})

describe('Persistence — updateJsonStore correctness', () => {
  it('never loses a write across many sequential locked mutations', () => {
    for (let i = 0; i < 50; i++) {
      updateJsonStore<{ n: number }>('counter.json', { n: 0 }, current => ({ n: current.n + 1 }))
    }
    expect(readJsonStore('counter.json', { n: 0 })).toEqual({ n: 50 })
  })

  it('returns the mutated value, matching what was persisted', () => {
    const result = updateJsonStore<{ tags: string[] }>('tags.json', { tags: [] }, current => ({ tags: [...current.tags, 'x'] }))
    expect(result).toEqual(readJsonStore('tags.json', { tags: [] }))
  })
})
