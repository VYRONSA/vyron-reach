import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { recordCycle, querySchedulerHistory, getSchedulerState } from '../../../lib/dev/scheduler/schedulerStore'
import type { SchedulerCycleResult } from '../../../lib/dev/scheduler/schedulerTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function cycle(timestamp: string, overrides: Partial<SchedulerCycleResult> = {}): SchedulerCycleResult {
  return { timestamp, order: [], started: [], waiting: [], errors: [], ...overrides }
}

describe('Scheduler History — bounded history + pagination', () => {
  it('accumulates a newest-first cycle history alongside lastCycleResult', () => {
    recordCycle(cycle('2026-01-01T00:00:00.000Z'))
    recordCycle(cycle('2026-01-01T00:01:00.000Z'))
    recordCycle(cycle('2026-01-01T00:02:00.000Z'))

    const state = getSchedulerState()
    expect(state.cycleHistory).toHaveLength(3)
    expect(state.cycleHistory[0].timestamp).toBe('2026-01-01T00:02:00.000Z') // newest first
    expect(state.lastCycleResult?.timestamp).toBe('2026-01-01T00:02:00.000Z')
  })

  it('paginates cycle history', () => {
    for (let i = 0; i < 10; i++) recordCycle(cycle(`2026-01-01T00:${String(i).padStart(2, '0')}:00.000Z`))
    const page = querySchedulerHistory({}, { pageSize: 4 })
    expect(page.items).toHaveLength(4)
    expect(page.total).toBe(10)
  })

  it('filters cycle history by date range', () => {
    recordCycle(cycle('2026-01-01T00:00:00.000Z'))
    recordCycle(cycle('2026-06-01T00:00:00.000Z'))
    const filtered = querySchedulerHistory({ dateRange: { from: '2026-03-01T00:00:00.000Z' } })
    expect(filtered.total).toBe(1)
  })

  it('caps cycle history at a bounded size — retention as a FIFO policy for this high-frequency operational store', () => {
    const project = uniqueSlug()
    // 520 sequential locked read-modify-write cycles against a growing
    // file is a genuine stress test, not a hang — it can legitimately
    // take longer than the default per-test timeout under a loaded host
    // (many parallel test-file forks), hence the generous explicit budget.
    for (let i = 0; i < 520; i++) recordCycle(cycle(new Date(2026, 0, 1, 0, i).toISOString(), { started: [project] }))
    const state = getSchedulerState()
    expect(state.cycleHistory.length).toBeLessThanOrEqual(500)
    expect(state.totalCycles).toBe(520) // the cycle COUNT is never capped, only the retained history detail
  }, 60000)
})
