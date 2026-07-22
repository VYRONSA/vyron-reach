import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import { describeInitiationError } from '@/lib/dev/initiation/initiationService'
import { getExecutiveControlStatus, submitExecutiveControlDecision } from '@/lib/dev/initiation/executiveControlService'
import type { ExecutiveControlDecisionType } from '@/lib/dev/initiation/initiationTypes'

/** Read-only: whether autonomous execution has actually started for this project, plus the full permanent Go/Hold decision history. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  try {
    const status = getExecutiveControlStatus(id)
    return NextResponse.json(status)
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}

type PostBody = { decision?: ExecutiveControlDecisionType; reason?: string }

/** Submits one Executive Go/Hold decision — only valid while the InitiationRequest is Provisioned. Go attempts the actual handoff into autonomous execution; Hold only records the decision. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  const body = (await request.json().catch(() => null)) as PostBody | null
  if (!body?.decision || !body.reason) {
    return NextResponse.json({ error: 'decision and reason are required.' }, { status: 400 })
  }

  try {
    const initiation = submitExecutiveControlDecision(id, {
      executive: currentDevActor(),
      decision: body.decision,
      reason: body.reason,
    })
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
