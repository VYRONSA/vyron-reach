import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { querySnapshots } from '@/lib/dev/metrics/metricsStore'
import type { SnapshotGranularity } from '@/lib/dev/metrics/metricsTypes'

const GRANULARITIES: SnapshotGranularity[] = ['hourly', 'daily', 'weekly', 'monthly']

/** "Snapshots must be queryable." Paginated + date-range filterable, on the same query primitives every other historical store in this app uses (see lib/dev/query/). */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const granularity = params.get('granularity') as SnapshotGranularity | null
  if (!granularity || !GRANULARITIES.includes(granularity)) {
    return NextResponse.json({ error: `granularity must be one of: ${GRANULARITIES.join(', ')}` }, { status: 400 })
  }

  const page = params.get('page')
  const pageSize = params.get('pageSize')
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')

  const result = querySnapshots(
    granularity,
    { dateRange: dateFrom || dateTo ? { from: dateFrom ?? undefined, to: dateTo ?? undefined } : undefined },
    { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
  )
  return NextResponse.json(result)
}
