import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { queryFeatureCertifications, getCertificationState } from '@/lib/dev/certification/certificationStore'
import { getPlatformCertification } from '@/lib/dev/certification/certificationService'

/** Read-only overview — never certifies anything itself. Recent Certified features plus the 30-day platform rollup, for the dashboard's "Latest Certifications" / "Platform Certification" panels in one round trip. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const state = getCertificationState()
  const openCount = state.records.filter(r => r.status === 'Open').length
  const certifiedRecords = state.records.filter(r => r.status === 'Certified')
  const certifiedProjectCount = new Set(certifiedRecords.map(r => r.project)).size
  const latest = queryFeatureCertifications({ status: 'Certified' }, { page: 1, pageSize: 10 })

  return NextResponse.json({
    openFeatures: openCount,
    certifiedFeatures: certifiedRecords.length,
    certifiedProjects: certifiedProjectCount,
    latestCertifications: latest.items,
    platform: {
      last30Days: getPlatformCertification('30d'),
      last90Days: getPlatformCertification('90d'),
      last12Months: getPlatformCertification('12m'),
    },
  })
}
