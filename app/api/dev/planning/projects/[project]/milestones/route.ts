import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listMilestones, createMilestone, getProject, type PlanningMilestoneInput } from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ milestones: listMilestones(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Partial<PlanningMilestoneInput> | null
  if (!body?.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const milestone = createMilestone(project, {
    title: body.title,
    description: body.description ?? '',
    phase: body.phase ?? '',
    startDate: body.startDate ?? '',
    targetDate: body.targetDate ?? '',
    progress: body.progress ?? 0,
    status: body.status ?? 'Upcoming',
    sequence: body.sequence,
  })
  return NextResponse.json({ milestone }, { status: 201 })
}
