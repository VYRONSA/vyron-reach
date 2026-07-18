import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  cancelDevelopmentJob,
  getDevelopmentJob,
  markJobApplied,
  markJobApproved,
  rejectDevelopmentJob,
} from '@/lib/dev/runtime/runtimeEngine'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const job = getDevelopmentJob(id)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({ job })
}

/**
 * The only write surface for the human-approval gate: the browser calls
 * this after a person reviews a Completed job's result and decides to
 * apply it (action: "approve"), again once it has finished writing the
 * local Handover/Batch/Milestone state (action: "applied"), or to stop a
 * job still in flight (action: "cancel"). No other transition is exposed —
 * the runtime itself drives Queued → Running → Validating →
 * Completed/Failed without any client input.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { action?: string; reason?: string } | null
  const action = body?.action

  try {
    let job = null
    if (action === 'approve') job = markJobApproved(id)
    else if (action === 'applied') job = markJobApplied(id)
    else if (action === 'cancel') job = cancelDevelopmentJob(id)
    else if (action === 'reject') job = rejectDevelopmentJob(id, body?.reason)
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    return NextResponse.json({ job })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid job transition' }, { status: 409 })
  }
}
