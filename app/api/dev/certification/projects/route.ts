import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getProjectCertification } from '@/lib/dev/certification/certificationService'
import { getCertificationState } from '@/lib/dev/certification/certificationStore'

/** With `?project=slug`, one project's certification summary. Without it, every project that has at least one Certified feature — "Certified Projects" for the dashboard. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  if (project) {
    return NextResponse.json({ summary: getProjectCertification(project) })
  }

  const projects = [...new Set(getCertificationState().records.filter(r => r.status === 'Certified').map(r => r.project))]
  return NextResponse.json({ summaries: projects.map(getProjectCertification) })
}
