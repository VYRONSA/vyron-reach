import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { SchedulerState, SchedulerCycleResult } from './schedulerTypes'

const CYCLE_HISTORY_LIMIT = 500

/**
 * Persistence for scheduler state — on the same atomic fileJsonStore
 * primitives every other durable store in this app uses
 * (readJsonStore/updateJsonStore, themselves on fileLock.ts's
 * write-then-rename + cross-process mutex). No new persistence
 * mechanism. A single global record (the Scheduler coordinates across
 * every project, so its own state isn't project-scoped the way most
 * other stores in this app are).
 */

const FILE = 'scheduler-state.json'

const DEFAULT_STATE: SchedulerState = {
  lastCycleAt: null,
  lastCycleResult: null,
  totalCycles: 0,
  lastExecutedAt: {},
  waitingNotified: [],
  cycleHistory: [],
}

export function getSchedulerState(): SchedulerState {
  return readJsonStore<SchedulerState>(FILE, DEFAULT_STATE)
}

/**
 * Records a completed cycle and updates the per-project "last executed"
 * fairness timestamps — all under one lock, so a concurrent read can
 * never observe the cycle result without the timestamps it produced (or
 * vice versa). `waitingNotified` is wholesale-replaced with this cycle's
 * own `waiting` list — a project drops off the moment it starts or
 * becomes ineligible, and schedulerService.ts is the one that compares
 * against the PRIOR value (read before calling this) to decide whether a
 * given waiting project is newly waiting and needs a fresh notification.
 */
export function recordCycle(result: SchedulerCycleResult): SchedulerState {
  return updateJsonStore<SchedulerState>(FILE, DEFAULT_STATE, current => {
    const lastExecutedAt = { ...current.lastExecutedAt }
    for (const project of result.started) lastExecutedAt[project] = result.timestamp

    return {
      lastCycleAt: result.timestamp,
      lastCycleResult: result,
      totalCycles: current.totalCycles + 1,
      lastExecutedAt,
      waitingNotified: [...result.waiting],
      cycleHistory: [result, ...current.cycleHistory].slice(0, CYCLE_HISTORY_LIMIT),
    }
  })
}

/** Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — paginated/filtered "Scheduler History" over the bounded cycleHistory above. */
export function querySchedulerHistory(filter: { dateRange?: DateRangeFilter } = {}, page: PageRequest = {}): PageResult<SchedulerCycleResult> {
  let items = getSchedulerState().cycleHistory
  if (filter.dateRange) items = items.filter(c => inDateRange(c.timestamp, filter.dateRange))
  return paginate(items, page)
}
