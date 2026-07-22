import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { recordTestRun, listTestRuns } from '@/lib/dev/metrics/metricsStore'
import type { TestRunInput } from '@/lib/dev/metrics/metricsTypes'

/**
 * "Testing: Tests executed, Tests passed, Tests failed, Average
 * execution duration, Regression failures." There is no in-app producer
 * for a test suite run — `npm run test:director` is a separate CLI
 * invocation the running server never observes — so this is the one
 * Metrics category with its own narrow ingestion endpoint instead of
 * being derived from the Event Service, exactly as documented in
 * metricsTypes.ts's TestRunInput.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const page = params.get('page')
  const pageSize = params.get('pageSize')
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')

  const result = listTestRuns(
    { dateRange: dateFrom || dateTo ? { from: dateFrom ?? undefined, to: dateTo ?? undefined } : undefined },
    { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
  )
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<TestRunInput> | null
  if (
    !body ||
    typeof body.executed !== 'number' ||
    typeof body.passed !== 'number' ||
    typeof body.failed !== 'number' ||
    typeof body.regressionFailures !== 'number' ||
    typeof body.durationMs !== 'number'
  ) {
    return NextResponse.json({ error: 'executed, passed, failed, regressionFailures, and durationMs are required numbers' }, { status: 400 })
  }

  const record = recordTestRun({
    executed: body.executed,
    passed: body.passed,
    failed: body.failed,
    regressionFailures: body.regressionFailures,
    durationMs: body.durationMs,
    timestamp: body.timestamp,
  })
  return NextResponse.json({ record }, { status: 201 })
}
