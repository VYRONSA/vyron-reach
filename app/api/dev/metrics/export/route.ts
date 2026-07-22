import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getCurrentKpis } from '@/lib/dev/metrics/metricsService'
import { listAllSnapshotsForExport } from '@/lib/dev/metrics/metricsStore'
import { exportKpisAsJson, exportKpisAsCsv, exportSnapshotsAsJson, exportSnapshotsAsCsv } from '@/lib/dev/metrics/exportService'
import type { SnapshotGranularity } from '@/lib/dev/metrics/metricsTypes'

const GRANULARITIES: SnapshotGranularity[] = ['hourly', 'daily', 'weekly', 'monthly']

/**
 * "Support exporting metrics as: JSON, CSV. These exports will later
 * become evidence for investment presentations." `scope=current` (the
 * default) exports the live KPI view as one document; `scope=snapshots`
 * exports a granularity's full historical trend, one row/entry per
 * period. Never mutates anything — an export is a read.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } })
  }

  const params = request.nextUrl.searchParams
  const format = params.get('format') === 'csv' ? 'csv' : 'json'
  const scope = params.get('scope') === 'snapshots' ? 'snapshots' : 'current'

  if (scope === 'snapshots') {
    const granularity = params.get('granularity') as SnapshotGranularity | null
    if (!granularity || !GRANULARITIES.includes(granularity)) {
      return new Response(JSON.stringify({ error: `granularity must be one of: ${GRANULARITIES.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    const snapshots = listAllSnapshotsForExport(granularity)
    const body = format === 'csv' ? exportSnapshotsAsCsv(snapshots) : exportSnapshotsAsJson(snapshots)
    return fileResponse(body, format, `metrics-${granularity}-snapshots`)
  }

  const kpis = getCurrentKpis()
  const body = format === 'csv' ? exportKpisAsCsv(kpis) : exportKpisAsJson(kpis)
  return fileResponse(body, format, 'metrics-current')
}

function fileResponse(body: string, format: 'json' | 'csv', filenameBase: string): Response {
  const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json'
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filenameBase}.${format}"`,
    },
  })
}
