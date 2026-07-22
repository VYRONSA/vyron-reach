import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listDecisions, createDecision, getProject, type PlanningDecisionInput } from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ decisions: listDecisions(project) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  if (!getProject(project)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Partial<PlanningDecisionInput> | null
  if (!body?.decision) return NextResponse.json({ error: 'decision is required' }, { status: 400 })

  const decision = createDecision(project, {
    decision: body.decision,
    reason: body.reason ?? '',
    alternatives: body.alternatives ?? '',
    approvedDate: body.approvedDate ?? '',
    status: body.status ?? 'Proposed',
    relatedMilestone: body.relatedMilestone,
    relatedBatch: body.relatedBatch,
    relatedJournalEntry: body.relatedJournalEntry,
    relatedPrompt: body.relatedPrompt,
  })
  return NextResponse.json({ decision }, { status: 201 })
}
