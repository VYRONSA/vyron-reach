import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { updateRoadmapItem, deleteRoadmapItem } from '@/lib/dev/planningState/planningStateService'
import type { ProjectListItem, ProjectListKind } from '@/lib/dev/planningState/planningStateTypes'

function isKind(value: unknown): value is ProjectListKind {
  return value === 'roadmap' || value === 'upcoming'
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  const body = (await request.json().catch(() => null)) as
    | ({ kind?: ProjectListKind } & Partial<Pick<ProjectListItem, 'title' | 'detail' | 'status'>>)
    | null
  if (!isKind(body?.kind)) return NextResponse.json({ error: "kind ('roadmap' | 'upcoming') is required" }, { status: 400 })

  const { kind, ...patch } = body
  const item = updateRoadmapItem(project, kind, id, patch)
  if (!item) return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  const kind = request.nextUrl.searchParams.get('kind')
  if (!isKind(kind)) return NextResponse.json({ error: "kind ('roadmap' | 'upcoming') query param is required" }, { status: 400 })

  deleteRoadmapItem(project, kind, id)
  return NextResponse.json({ deleted: true })
}
