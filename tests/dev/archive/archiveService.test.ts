import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { readJsonStore, writeJsonStore } from '../../../lib/dev/director/fileJsonStore'
import { tryCreateExclusive } from '../../../lib/dev/fileLock'
import { archiveEligibleRecords, queryArchive } from '../../../lib/dev/archive/archiveService'
import type { RetentionPolicy } from '../../../lib/dev/archive/archiveTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

type Rec = { id: string; status: 'Open' | 'Closed'; timestamp: string }

const LIVE_FILE = 'archive-test-live.json'
const ARCHIVE_FILE = 'archive-test-archive.json'

function seed(records: Rec[]) {
  writeJsonStore(LIVE_FILE, records)
}

function rec(id: string, status: Rec['status'], timestamp: string): Rec {
  return { id, status, timestamp }
}

describe('Archive Service — retention never touches active state', () => {
  it('never archives an ineligible (active) record no matter how old it is', () => {
    seed([rec('a', 'Open', '2020-01-01T00:00:00.000Z')])
    const policy: RetentionPolicy = { maxAgeMs: 1000, maxLiveCount: null }
    const result = archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: r => r.status === 'Closed',
      getTimestamp: r => r.timestamp,
      policy,
      now: '2026-01-01T00:00:00.000Z',
    })
    expect(result.archived).toBe(0)
    expect(readJsonStore<Rec[]>(LIVE_FILE, [])).toHaveLength(1)
  })
})

describe('Archive Service — age-based retention', () => {
  it('archives eligible records older than maxAgeMs, keeps newer ones', () => {
    seed([
      rec('old', 'Closed', '2025-01-01T00:00:00.000Z'),
      rec('new', 'Closed', '2025-12-30T00:00:00.000Z'),
      rec('active', 'Open', '2020-01-01T00:00:00.000Z'),
    ])
    const now = '2026-01-01T00:00:00.000Z'
    const policy: RetentionPolicy = { maxAgeMs: 30 * 24 * 60 * 60 * 1000, maxLiveCount: null } // 30 days

    const result = archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: r => r.status === 'Closed',
      getTimestamp: r => r.timestamp,
      policy,
      now,
    })

    expect(result.archived).toBe(1)
    expect(result.remaining).toBe(2)
    const live = readJsonStore<Rec[]>(LIVE_FILE, [])
    expect(live.map(r => r.id).sort()).toEqual(['active', 'new'])
    const archived = readJsonStore<Rec[]>(ARCHIVE_FILE, [])
    expect(archived.map(r => r.id)).toEqual(['old'])
  })

  it('is deterministic — identical inputs and `now` always produce the identical result', () => {
    seed([rec('old', 'Closed', '2025-01-01T00:00:00.000Z')])
    const policy: RetentionPolicy = { maxAgeMs: 1000, maxLiveCount: null }
    const run = () =>
      archiveEligibleRecords<Rec>({ liveFile: LIVE_FILE, archiveFile: ARCHIVE_FILE, isEligible: r => r.status === 'Closed', getTimestamp: r => r.timestamp, policy, now: '2026-01-01T00:00:00.000Z' })
    const first = run()
    // Re-seed identically since the first run already archived it — this proves the DECISION is deterministic given the same starting state, not that running it twice in a row is idempotent (it naturally is, since nothing eligible remains).
    expect(first.archived).toBe(1)
    seed([rec('old', 'Closed', '2025-01-01T00:00:00.000Z')])
    const second = run()
    expect(second).toEqual(first)
  })
})

describe('Archive Service — count-based retention', () => {
  it('archives the oldest eligible records once the live count exceeds maxLiveCount', () => {
    seed([
      rec('c1', 'Closed', '2025-01-01T00:00:00.000Z'),
      rec('c2', 'Closed', '2025-01-02T00:00:00.000Z'),
      rec('c3', 'Closed', '2025-01-03T00:00:00.000Z'),
    ])
    const policy: RetentionPolicy = { maxAgeMs: null, maxLiveCount: 1 }
    const result = archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: r => r.status === 'Closed',
      getTimestamp: r => r.timestamp,
      policy,
      now: '2026-01-01T00:00:00.000Z',
    })
    expect(result.archived).toBe(2)
    expect(result.remaining).toBe(1)
    const live = readJsonStore<Rec[]>(LIVE_FILE, [])
    expect(live.map(r => r.id)).toEqual(['c3']) // the newest one survives
  })

  it('never archives past maxLiveCount an ineligible record just because the store as a whole is large', () => {
    seed([rec('active1', 'Open', '2025-01-01T00:00:00.000Z'), rec('active2', 'Open', '2025-01-02T00:00:00.000Z')])
    const policy: RetentionPolicy = { maxAgeMs: null, maxLiveCount: 1 }
    const result = archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: r => r.status === 'Closed',
      getTimestamp: r => r.timestamp,
      policy,
      now: '2026-01-01T00:00:00.000Z',
    })
    expect(result.archived).toBe(0)
    expect(readJsonStore<Rec[]>(LIVE_FILE, [])).toHaveLength(2)
  })
})

describe('Archive Service — queryable archive retrieval', () => {
  it('archived records remain queryable, paginated, after being moved', () => {
    seed(Array.from({ length: 5 }, (_, i) => rec(`c${i}`, 'Closed', `2025-01-0${i + 1}T00:00:00.000Z`)))
    archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: () => true,
      getTimestamp: r => r.timestamp,
      policy: { maxAgeMs: 0, maxLiveCount: null },
      now: '2026-01-01T00:00:00.000Z',
    })
    const page = queryArchive<Rec>(ARCHIVE_FILE, { page: 1, pageSize: 2 })
    expect(page.total).toBe(5)
    expect(page.items).toHaveLength(2)
  })

  it('supports filtering archived records by predicate', () => {
    seed([rec('a', 'Closed', '2025-01-01T00:00:00.000Z'), rec('b', 'Closed', '2025-01-02T00:00:00.000Z')])
    archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: () => true,
      getTimestamp: r => r.timestamp,
      policy: { maxAgeMs: 0, maxLiveCount: null },
      now: '2026-01-01T00:00:00.000Z',
    })
    const page = queryArchive<Rec>(ARCHIVE_FILE, {}, r => r.id === 'b')
    expect(page.items.map(r => r.id)).toEqual(['b'])
  })
})

describe('Archive Service — concurrency (regression: the live-file mutation must be lock-protected, not a bare read-then-write)', () => {
  it('archiving the live file goes through the same cross-process lock every other store mutation uses, reclaiming a stale abandoned lock rather than racing past it', () => {
    seed([rec('old', 'Closed', '2025-01-01T00:00:00.000Z')])
    const liveFilePath = path.join(isolated.dir, LIVE_FILE)
    const lockPath = `${liveFilePath}.lock`

    // Simulate a process that crashed while holding the live file's lock
    // mid-mutation — the exact scenario fileJsonStore.test.ts already
    // proves updateJsonStore recovers from. If archiveEligibleRecords
    // used a bare readJsonStore/writeJsonStore pair instead of
    // updateJsonStore, it would never even look at this lock file.
    tryCreateExclusive(lockPath, String(999_999_999))
    const past = new Date(Date.now() - 20_000)
    fs.utimesSync(lockPath, past, past)

    const result = archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: r => r.status === 'Closed',
      getTimestamp: r => r.timestamp,
      policy: { maxAgeMs: 0, maxLiveCount: null },
      now: '2026-01-01T00:00:00.000Z',
    })

    expect(result.archived).toBe(1)
    expect(fs.existsSync(lockPath)).toBe(false) // reclaimed and released, not left behind
  })
})

describe('Archive Service — restart survival', () => {
  it('a fresh read sees the archive a prior process wrote', () => {
    seed([rec('a', 'Closed', '2025-01-01T00:00:00.000Z')])
    archiveEligibleRecords<Rec>({
      liveFile: LIVE_FILE,
      archiveFile: ARCHIVE_FILE,
      isEligible: () => true,
      getTimestamp: r => r.timestamp,
      policy: { maxAgeMs: 0, maxLiveCount: null },
      now: '2026-01-01T00:00:00.000Z',
    })
    expect(readJsonStore<Rec[]>(ARCHIVE_FILE, [])).toHaveLength(1)
  })
})
