import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getLatestAssessment } from '@/lib/dev/director/assessment/assessmentService'
import { listAssessmentHistory } from '@/lib/dev/director/assessment/assessmentStore'

/** Read-only — the Assessment Service (lib/dev/director/assessment/assessmentService.ts) is the only writer; this route never triggers a new assessment, it only surfaces what the Director's own synchronization-boundary requests already produced. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  const { searchParams } = new URL(request.url)
  if (searchParams.get('history') === 'true') {
    return NextResponse.json({ history: listAssessmentHistory(project) })
  }
  return NextResponse.json({ latest: getLatestAssessment(project) })
}
