import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { appendDirectorHistory, historyForProject } from '@/lib/dev/director/directorHistoryStore'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  if (!project) return NextResponse.json({ error: 'Missing project query param' }, { status: 400 })
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '100')

  return NextResponse.json({ history: historyForProject(project, Number.isFinite(limit) ? limit : 100) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as { project?: string; event?: string; batchId?: string | null; detail?: string } | null
  if (!body?.project || !body.event) return NextResponse.json({ error: 'project and event are required' }, { status: 400 })

  const entry = appendDirectorHistory({ project: body.project, event: body.event, batchId: body.batchId ?? null, detail: body.detail ?? '' })
  return NextResponse.json({ entry }, { status: 201 })
}
