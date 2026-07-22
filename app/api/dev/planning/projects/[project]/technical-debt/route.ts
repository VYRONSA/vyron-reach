import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  listTechnicalDebt,
  createTechnicalDebt,
  getProject,
  type PlanningTechnicalDebtInput,
} from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ technicalDebt: listTechnicalDebt(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Partial<PlanningTechnicalDebtInput> | null
  if (!body?.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const debt = createTechnicalDebt(project, {
    title: body.title,
    description: body.description ?? '',
    relatedBatch: body.relatedBatch,
    priority: body.priority ?? 'Low',
    estimatedEffort: body.estimatedEffort ?? '',
    createdDate: body.createdDate ?? '',
    resolvedDate: body.resolvedDate ?? '',
    status: body.status ?? 'Open',
  })
  return NextResponse.json({ technicalDebt: debt }, { status: 201 })
}
