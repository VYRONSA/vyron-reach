import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getCurrentKpis, getTopProjects } from '@/lib/dev/metrics/metricsService'
import { getLatestSnapshot } from '@/lib/dev/metrics/metricsStore'

/**
 * Read-only — never processes an event or takes a snapshot itself (a GET
 * request must never have a write side effect, matching every other
 * status route in this app). Returns the live KPI view plus each
 * granularity's most recent snapshot, for "Live KPIs" and a quick
 * "how stale is the latest snapshot" check.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  return NextResponse.json({
    kpis: getCurrentKpis(),
    topProjects: getTopProjects(5),
    latestSnapshots: {
      hourly: getLatestSnapshot('hourly'),
      daily: getLatestSnapshot('daily'),
      weekly: getLatestSnapshot('weekly'),
      monthly: getLatestSnapshot('monthly'),
    },
  })
}
