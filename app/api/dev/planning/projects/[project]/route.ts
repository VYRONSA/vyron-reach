import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getPlanningState, updateProject } from '@/lib/dev/planningState/planningStateService'
import type { Project } from '@/lib/dev/planningState/planningStateTypes'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  const state = getPlanningState(project)
  if (!state) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json({ state })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  const patch = (await request.json().catch(() => null)) as Partial<Omit<Project, 'slug'>> | null
  if (!patch) return NextResponse.json({ error: 'Patch body missing or malformed' }, { status: 400 })

  const updated = updateProject(project, patch)
  if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json({ project: updated })
}
