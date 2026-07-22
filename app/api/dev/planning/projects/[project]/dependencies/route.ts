import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  listDependencies,
  addDependency,
  getProject,
  type PlanningDependencyInput,
} from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ dependencies: listDependencies(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Partial<PlanningDependencyInput> | null
  if (!body?.fromType || !body.fromId || !body.toType || !body.toId) {
    return NextResponse.json({ error: 'fromType, fromId, toType, and toId are required' }, { status: 400 })
  }

  const dependency = addDependency(project, {
    fromType: body.fromType,
    fromId: body.fromId,
    toType: body.toType,
    toId: body.toId,
    note: body.note,
  })
  return NextResponse.json({ dependency }, { status: 201 })
}
