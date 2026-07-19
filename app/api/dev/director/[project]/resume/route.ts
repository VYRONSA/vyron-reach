import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { resumeServerDirector } from '@/lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'

/** Manual Resume — for a CEO-paused project, or a Blocked one the CEO addressed outside the system without a specific inbox item to resolve. Resolving an inbox item (PATCH /api/dev/director/inbox/[id]) already triggers this same resume automatically. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  resumeServerDirector(project)
  return NextResponse.json({ status: getDirectorStatus(project) })
}
