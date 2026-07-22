import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import { describeInitiationError } from '@/lib/dev/initiation/initiationService'
import { getRiskGateStatus, submitRiskGateDecision } from '@/lib/dev/initiation/riskGateService'
import type { RiskGateDecisionType } from '@/lib/dev/initiation/initiationTypes'

/** Read-only: the current unresolved High-severity risks (if any) plus the full permanent decision history — what the Risk Gate UI renders. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  try {
    const status = getRiskGateStatus(id)
    return NextResponse.json(status)
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}

type PostBody = { decision?: RiskGateDecisionType; reason?: string; riskTempIds?: string[] }

/** Submits one Executive Risk Gate decision (Accept Risk / Mitigate Risk / Reject Programme) — only valid while the InitiationRequest is Approved. */
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
    const initiation = submitRiskGateDecision(id, {
      executive: currentDevActor(),
      decision: body.decision,
      reason: body.reason,
      riskTempIds: body.riskTempIds ?? [],
    })
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
