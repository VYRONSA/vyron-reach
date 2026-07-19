import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getDirectorStatus, listDirectorStatuses, patchDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'
import type { DirectorRuntimeStatus } from '@/lib/dev/director/directorRuntimeTypes'

/**
 * The Director's live status blackboard. The autonomous orchestration loop
 * runs client-side (batches/milestones/projects only exist in
 * localStorage — see autonomousEngineeringDirector.ts's doc comment), so
 * it POSTs a patch here after every step; this GET is what makes that
 * state visible to CEO Runtime Queries and the Command Centre dashboard
 * independent of whether that browser tab is still open.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  if (!project) return NextResponse.json({ statuses: listDirectorStatuses() })
  return NextResponse.json({ status: getDirectorStatus(project) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as { project?: string; patch?: Partial<Omit<DirectorRuntimeStatus, 'project'>> } | null
  if (!body?.project) return NextResponse.json({ error: 'project is required' }, { status: 400 })

  return NextResponse.json({ status: patchDirectorStatus(body.project, body.patch ?? {}) })
}
