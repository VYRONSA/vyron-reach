import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { queryFeatureCertifications } from '@/lib/dev/certification/certificationStore'
import type { CertificationResult, FeatureCertificationStatus } from '@/lib/dev/certification/certificationTypes'

/** "Historical certification" — paginated, filterable by project/status/result/date range, on the same query primitives every other historical store in this app uses. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const project = params.get('project') ?? undefined
  const status = (params.get('status') as FeatureCertificationStatus | null) ?? undefined
  const result = (params.get('result') as CertificationResult | null) ?? undefined
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const page = params.get('page')
  const pageSize = params.get('pageSize')

  const response = queryFeatureCertifications(
    { project, status, result: result ?? undefined, dateRange: dateFrom || dateTo ? { from: dateFrom ?? undefined, to: dateTo ?? undefined } : undefined },
    { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
  )
  return NextResponse.json(response)
}
