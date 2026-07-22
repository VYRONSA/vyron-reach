import type { MetricsKpis, MetricSnapshot } from './metricsTypes'

/**
 * "Support exporting metrics as: JSON, CSV. These exports will later
 * become evidence for investment presentations." Two shapes: the current
 * live KPI snapshot (one row) and a granularity's full snapshot history
 * (one row per period) — both flattened to `category.field` columns so a
 * spreadsheet can open either directly with no further transformation.
 */
export function flattenKpis(kpis: MetricsKpis): Record<string, number | null> {
  const flat: Record<string, number | null> = {}
  for (const [category, fields] of Object.entries(kpis)) {
    for (const [field, value] of Object.entries(fields as Record<string, number | null>)) {
      flat[`${category}.${field}`] = value
    }
  }
  return flat
}

export function exportKpisAsJson(kpis: MetricsKpis): string {
  return JSON.stringify(kpis, null, 2)
}

export function exportKpisAsCsv(kpis: MetricsKpis): string {
  const flat = flattenKpis(kpis)
  const keys = Object.keys(flat)
  const header = keys.map(csvCell).join(',')
  const row = keys.map(k => csvCell(flat[k])).join(',')
  return `${header}\n${row}\n`
}

export function exportSnapshotsAsJson(snapshots: MetricSnapshot[]): string {
  return JSON.stringify(snapshots, null, 2)
}

export function exportSnapshotsAsCsv(snapshots: MetricSnapshot[]): string {
  if (snapshots.length === 0) return 'periodKey,timestamp\n'
  const flatRows = snapshots.map(s => ({ periodKey: s.periodKey, timestamp: s.timestamp, ...flattenKpis(s.kpis) }))
  const keys = Object.keys(flatRows[0])
  const header = keys.map(csvCell).join(',')
  const rows = flatRows.map(row => keys.map(k => csvCell((row as Record<string, unknown>)[k])).join(','))
  return [header, ...rows].join('\n') + '\n'
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
