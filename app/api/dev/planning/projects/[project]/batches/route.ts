import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listBatches, createBatch, getProject, type PlanningBatchInput } from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ batches: listBatches(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Partial<PlanningBatchInput> | null
  if (!body?.batchNumber) return NextResponse.json({ error: 'batchNumber is required' }, { status: 400 })

  const batch = createBatch(project, {
    batchNumber: body.batchNumber,
    milestone: body.milestone ?? '',
    objective: body.objective ?? '',
    summary: body.summary ?? '',
    completedTasks: body.completedTasks ?? '',
    lessonsLearned: body.lessonsLearned ?? '',
    claudePrompt: body.claudePrompt ?? '',
    completionDate: body.completionDate ?? '',
    status: body.status ?? 'Queued',
    sequence: body.sequence,
  })
  return NextResponse.json({ batch }, { status: 201 })
}
