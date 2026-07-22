import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { querySimulationReports } from '@/lib/dev/simulation/simulationStore'
import type { ScenarioId } from '@/lib/dev/simulation/simulationTypes'
import type { SimulationStatus } from '@/lib/dev/simulation/simulationTypes'

/** "Historical simulations" / "Simulation reports" — paginated, filterable by scenario/status/date range. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const scenario = (params.get('scenario') as ScenarioId | null) ?? undefined
  const status = (params.get('status') as SimulationStatus | null) ?? undefined
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const page = params.get('page')
  const pageSize = params.get('pageSize')

  const result = querySimulationReports(
    { scenario, status, dateRange: dateFrom || dateTo ? { from: dateFrom ?? undefined, to: dateTo ?? undefined } : undefined },
    { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
  )
  return NextResponse.json(result)
}
