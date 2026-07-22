import { randomUUID } from 'node:crypto'
import { getLatestSnapshot, recordSnapshot, querySnapshots, listAllSnapshotsForExport } from './metricsStore'
import { getCurrentKpis } from './metricsService'
import type { MetricSnapshot, SnapshotGranularity } from './metricsTypes'

/**
 * "Persist metric snapshots. Support: Hourly, Daily, Weekly, Monthly.
 * Snapshots must be queryable." One generic period-key scheme drives all
 * four granularities — deterministic given an explicit `now` (never an
 * internal Date.now() read), matching every other periodic/deterministic
 * decision already established in this app (Scheduler, Escalation).
 */
export function periodKeyFor(granularity: SnapshotGranularity, isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours()

  switch (granularity) {
    case 'hourly':
      return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}`
    case 'daily':
      return `${year}-${pad(month)}-${pad(day)}`
    case 'monthly':
      return `${year}-${pad(month)}`
    case 'weekly': {
      const { isoYear, isoWeek } = isoWeekOf(date)
      return `${isoYear}-W${pad(isoWeek)}`
    }
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** ISO-8601 week numbering (Monday-start weeks, week 1 contains the year's first Thursday) — the standard, unambiguous definition, so "weekly" never depends on which day a caller happens to consider the start of the week. */
function isoWeekOf(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return { isoYear: d.getUTCFullYear(), isoWeek }
}

/**
 * Takes a snapshot for `granularity` only if the current period hasn't
 * already been captured — "one snapshot per period," idempotent within
 * that period by construction (calling this five times in the same hour
 * produces exactly one hourly snapshot, not five), which is what makes
 * this safe to call from a recurring tick without its own dedup logic.
 */
export function maybeTakeSnapshot(granularity: SnapshotGranularity, now: string = new Date().toISOString()): MetricSnapshot | null {
  const periodKey = periodKeyFor(granularity, now)
  const latest = getLatestSnapshot(granularity)
  if (latest && latest.periodKey === periodKey) return null

  const snapshot: MetricSnapshot = { id: randomUUID(), granularity, timestamp: now, periodKey, kpis: getCurrentKpis() }
  recordSnapshot(snapshot)
  return snapshot
}

export { querySnapshots, listAllSnapshotsForExport }
