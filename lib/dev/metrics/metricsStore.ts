import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { DashboardEvent } from '../events/eventTypes'
import { publish } from '../events/eventBus'
import { applyEvent } from './metricClassifier'
import type { MetricsState, MetricSnapshot, SnapshotGranularity, TestRunInput, TestRunRecord } from './metricsTypes'

/**
 * Persistence for the Metrics Service — on the same atomic fileJsonStore
 * primitives every other durable store in this app uses. One file for
 * the live counters/durations/spans document, one per snapshot
 * granularity, one for externally-reported test runs.
 */

const STATE_FILE = 'metrics-state.json'
const SNAPSHOT_FILE: Record<SnapshotGranularity, string> = {
  hourly: 'metrics-snapshots-hourly.json',
  daily: 'metrics-snapshots-daily.json',
  weekly: 'metrics-snapshots-weekly.json',
  monthly: 'metrics-snapshots-monthly.json',
}
const TEST_RUNS_FILE = 'metrics-test-runs.json'
/** Snapshots are historical evidence, not an operational log — kept generously, capped only to bound worst-case file size over a very long-running deployment (hourly snapshots alone would otherwise grow forever). */
const MAX_SNAPSHOTS_PER_GRANULARITY = 5000

const DEFAULT_STATE: MetricsState = { counters: {}, durations: {}, spans: {}, pendingRiskFlags: {}, lastEventSeq: 0 }

export function getMetricsState(): MetricsState {
  return readJsonStore<MetricsState>(STATE_FILE, DEFAULT_STATE)
}

/**
 * The Metrics Service's single write path — the entire read-classify-
 * write cycle happens inside one updateJsonStore lock, exactly like
 * every other store's mutation function in this codebase (and exactly
 * the fix Enterprise Scalability's archiveEligibleRecords needed after a
 * concurrency review caught it doing this as two separate calls). A
 * concurrent event arriving mid-classification can never be lost or
 * silently overwrite this one.
 */
export function processMetricEvent(event: DashboardEvent): MetricsState {
  return updateJsonStore<MetricsState>(STATE_FILE, DEFAULT_STATE, current => applyEvent(current, event))
}

/**
 * eventBus.ts's own doc comment is explicit: `seq` "resets to 0 on every
 * process restart — meaningless across restarts." lastEventSeq exists to
 * make redelivery WITHIN one live process's subscription a safe no-op
 * (a defensive re-subscribe, a retry), never to compare seq numbers
 * minted by a previous process — those numbers share no meaning with
 * this process's fresh count starting back at 1. metricsBootstrap.ts
 * calls this once, immediately before subscribing, so the persisted
 * cursor is back in sync with the fresh eventBus instance it's about to
 * start reading from; every counter/duration/span accumulated so far is
 * untouched, only the dedup cursor resets.
 */
export function resetEventCursor(): void {
  updateJsonStore<MetricsState>(STATE_FILE, DEFAULT_STATE, current => ({ ...current, lastEventSeq: 0 }))
}

export function recordSnapshot(snapshot: MetricSnapshot): void {
  const file = SNAPSHOT_FILE[snapshot.granularity]
  updateJsonStore<MetricSnapshot[]>(file, [], current => [snapshot, ...current].slice(0, MAX_SNAPSHOTS_PER_GRANULARITY))
}

export function getLatestSnapshot(granularity: SnapshotGranularity): MetricSnapshot | null {
  return readJsonStore<MetricSnapshot[]>(SNAPSHOT_FILE[granularity], [])[0] ?? null
}

export function querySnapshots(granularity: SnapshotGranularity, filter: { dateRange?: DateRangeFilter } = {}, page: PageRequest = {}): PageResult<MetricSnapshot> {
  let items = readJsonStore<MetricSnapshot[]>(SNAPSHOT_FILE[granularity], [])
  if (filter.dateRange) items = items.filter(s => inDateRange(s.timestamp, filter.dateRange))
  return paginate(items, page)
}

export function listAllSnapshotsForExport(granularity: SnapshotGranularity): MetricSnapshot[] {
  return readJsonStore<MetricSnapshot[]>(SNAPSHOT_FILE[granularity], [])
}

/**
 * "There is no in-app producer for a test suite run" (see
 * metricsTypes.ts's TestRunInput doc) — recorded directly, not derived
 * from the DashboardEvent stream. It still PUBLISHES one, though (project
 * '*' — a whole-suite run is never scoped to a single project), so
 * Production Validation 2.1 Milestone 2.1.2's Certification Service (or
 * any other future consumer) can correlate "tests ran" the same way it
 * correlates everything else, without reaching into this store directly.
 */
export function recordTestRun(input: TestRunInput): TestRunRecord {
  const record: TestRunRecord = { ...input, id: randomUUID(), timestamp: input.timestamp ?? new Date().toISOString() }
  updateJsonStore<TestRunRecord[]>(TEST_RUNS_FILE, [], current => [record, ...current])
  publish({ category: 'Testing', project: '*', type: 'test-run-recorded', payload: { testRunId: record.id, executed: record.executed, passed: record.passed, failed: record.failed } })
  return record
}

export function listTestRuns(filter: { dateRange?: DateRangeFilter } = {}, page: PageRequest = {}): PageResult<TestRunRecord> {
  let items = readJsonStore<TestRunRecord[]>(TEST_RUNS_FILE, [])
  if (filter.dateRange) items = items.filter(r => inDateRange(r.timestamp, filter.dateRange))
  return paginate(items, page)
}

export function getAllTestRuns(): TestRunRecord[] {
  return readJsonStore<TestRunRecord[]>(TEST_RUNS_FILE, [])
}
