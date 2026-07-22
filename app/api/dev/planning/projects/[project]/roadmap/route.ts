import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getRoadmapLists, addRoadmapItem, getProject } from '@/lib/dev/planningState/planningStateService'
import type { ProjectListKind } from '@/lib/dev/planningState/planningStateTypes'

function isKind(value: unknown): value is ProjectListKind {
  return value === 'roadmap' || value === 'upcoming'
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ lists: getRoadmapLists(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as
    | { kind?: ProjectListKind; title?: string; detail?: string; status?: string }
    | null
  if (!isKind(body?.kind) || !body?.title) {
    return NextResponse.json({ error: "kind ('roadmap' | 'upcoming') and title are required" }, { status: 400 })
  }

  const item = addRoadmapItem(project, body.kind, {
    title: body.title,
    detail: body.detail ?? '',
    status: body.status ?? '',
  })
  return NextResponse.json({ item }, { status: 201 })
}
