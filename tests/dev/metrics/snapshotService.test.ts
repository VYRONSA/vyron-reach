import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { periodKeyFor, maybeTakeSnapshot } from '../../../lib/dev/metrics/snapshotService'
import { getLatestSnapshot, querySnapshots } from '../../../lib/dev/metrics/metricsStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Snapshot Service — periodKeyFor', () => {
  it('computes an hourly key', () => {
    expect(periodKeyFor('hourly', '2026-07-19T14:35:00.000Z')).toBe('2026-07-19T14')
  })

  it('computes a daily key', () => {
    expect(periodKeyFor('daily', '2026-07-19T14:35:00.000Z')).toBe('2026-07-19')
  })

  it('computes a monthly key', () => {
    expect(periodKeyFor('monthly', '2026-07-19T14:35:00.000Z')).toBe('2026-07')
  })

  it('computes an ISO-8601 weekly key', () => {
    // 2026-01-01 is a Thursday, so it falls in ISO week 1 of 2026.
    expect(periodKeyFor('weekly', '2026-01-01T00:00:00.000Z')).toBe('2026-W01')
  })

  it('is deterministic — the same timestamp always produces the same key', () => {
    const a = periodKeyFor('daily', '2026-03-15T09:00:00.000Z')
    const b = periodKeyFor('daily', '2026-03-15T09:00:00.000Z')
    expect(a).toBe(b)
  })
})

describe('Snapshot Service — maybeTakeSnapshot', () => {
  it('takes a snapshot when none exists yet for this period', () => {
    const snapshot = maybeTakeSnapshot('daily', '2026-01-01T00:00:00.000Z')
    expect(snapshot).not.toBeNull()
    expect(snapshot?.periodKey).toBe('2026-01-01')
    expect(getLatestSnapshot('daily')?.periodKey).toBe('2026-01-01')
  })

  it('is idempotent within the same period — calling it again in the same hour/day/week/month is a no-op', () => {
    maybeTakeSnapshot('daily', '2026-01-01T00:00:00.000Z')
    const second = maybeTakeSnapshot('daily', '2026-01-01T23:59:00.000Z')
    expect(second).toBeNull()
    expect(querySnapshots('daily').total).toBe(1)
  })

  it('takes a new snapshot once the period actually changes', () => {
    maybeTakeSnapshot('daily', '2026-01-01T00:00:00.000Z')
    const next = maybeTakeSnapshot('daily', '2026-01-02T00:00:00.000Z')
    expect(next).not.toBeNull()
    expect(querySnapshots('daily').total).toBe(2)
  })

  it('each granularity tracks its own period independently', () => {
    maybeTakeSnapshot('hourly', '2026-01-01T00:30:00.000Z')
    maybeTakeSnapshot('daily', '2026-01-01T00:30:00.000Z')
    maybeTakeSnapshot('hourly', '2026-01-01T01:30:00.000Z') // new hour
    expect(querySnapshots('hourly').total).toBe(2)
    expect(querySnapshots('daily').total).toBe(1) // still the same day
  })
})
