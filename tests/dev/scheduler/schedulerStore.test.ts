import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { getSchedulerState, recordCycle } from '../../../lib/dev/scheduler/schedulerStore'
import type { SchedulerCycleResult } from '../../../lib/dev/scheduler/schedulerTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function cycle(overrides: Partial<SchedulerCycleResult> = {}): SchedulerCycleResult {
  return { timestamp: '2026-01-01T00:00:00.000Z', order: [], started: [], waiting: [], errors: [], ...overrides }
}

describe('Scheduler Store — defaults', () => {
  it('starts with no cycles ever recorded', () => {
    const state = getSchedulerState()
    expect(state.lastCycleAt).toBeNull()
    expect(state.totalCycles).toBe(0)
    expect(state.lastExecutedAt).toEqual({})
    expect(state.waitingNotified).toEqual([])
  })
})

describe('Scheduler Store — recording cycles', () => {
  it('records the timestamp, result, and increments totalCycles', () => {
    recordCycle(cycle({ timestamp: '2026-01-01T00:00:00.000Z' }))
    const state = getSchedulerState()
    expect(state.lastCycleAt).toBe('2026-01-01T00:00:00.000Z')
    expect(state.totalCycles).toBe(1)
    expect(state.lastCycleResult?.timestamp).toBe('2026-01-01T00:00:00.000Z')
  })

  it('accumulates totalCycles across multiple recordings', () => {
    recordCycle(cycle())
    recordCycle(cycle())
    recordCycle(cycle())
    expect(getSchedulerState().totalCycles).toBe(3)
  })

  it('records lastExecutedAt only for started projects, at this cycle\'s timestamp', () => {
    const project = uniqueSlug()
    recordCycle(cycle({ timestamp: '2026-01-01T00:00:00.000Z', started: [project] }))
    expect(getSchedulerState().lastExecutedAt[project]).toBe('2026-01-01T00:00:00.000Z')
  })

  it('preserves lastExecutedAt for a project not started in a later cycle', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    recordCycle(cycle({ timestamp: '2026-01-01T00:00:00.000Z', started: [projectA] }))
    recordCycle(cycle({ timestamp: '2026-01-01T01:00:00.000Z', started: [projectB] }))
    const state = getSchedulerState()
    expect(state.lastExecutedAt[projectA]).toBe('2026-01-01T00:00:00.000Z') // untouched by the second cycle
    expect(state.lastExecutedAt[projectB]).toBe('2026-01-01T01:00:00.000Z')
  })

  it('updates lastExecutedAt to the newest cycle when a project starts again later', () => {
    const project = uniqueSlug()
    recordCycle(cycle({ timestamp: '2026-01-01T00:00:00.000Z', started: [project] }))
    recordCycle(cycle({ timestamp: '2026-01-02T00:00:00.000Z', started: [project] }))
    expect(getSchedulerState().lastExecutedAt[project]).toBe('2026-01-02T00:00:00.000Z')
  })

  it('wholesale-replaces waitingNotified with the current cycle\'s waiting list', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    recordCycle(cycle({ waiting: [projectA, projectB] }))
    expect(getSchedulerState().waitingNotified.sort()).toEqual([projectA, projectB].sort())

    recordCycle(cycle({ waiting: [projectB] })) // projectA started or became ineligible
    expect(getSchedulerState().waitingNotified).toEqual([projectB])
  })
})

describe('Scheduler Store — restart survival', () => {
  it('a fresh read sees everything a prior process wrote', () => {
    const project = uniqueSlug()
    recordCycle(cycle({ timestamp: '2026-01-01T00:00:00.000Z', started: [project] }))
    // "Restart" — nothing here is a cached reference; getSchedulerState reads fresh from disk.
    const state = getSchedulerState()
    expect(state.totalCycles).toBe(1)
    expect(state.lastExecutedAt[project]).toBeTruthy()
  })
})
