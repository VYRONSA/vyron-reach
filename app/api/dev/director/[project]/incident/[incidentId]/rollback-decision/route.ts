import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import {
  getIncidentById,
  submitRollbackControlDecision,
  describeOperationsError,
} from '@/lib/dev/director/operations/operationsMonitoringService'
import type { RollbackControlDecisionType } from '@/lib/dev/director/operations/operationsMonitoringTypes'

/**
 * The only route through which a human can submit a real rollback Go/
 * Hold decision. A 'Go' here records permanent approval to roll back to
 * a specific prior release — it does not itself trigger any traffic
 * cutover; see lib/dev/director/operations/operationsMonitoringService.ts's
 * own doc comment for why that stays a human action outside this
 * subsystem.
 */

/** Read-only: the full incident, including its recorded checks and (once decided) rollback status. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string; incidentId: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project, incidentId } = await params
  const incident = getIncidentById(incidentId)
  if (!incident || incident.project !== project) {
    return NextResponse.json({ error: `Incident '${incidentId}' not found for project '${project}'.` }, { status: 404 })
  }
  return NextResponse.json({ incident })
}

type PostBody = { decision?: RollbackControlDecisionType; reason?: string }

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string; incidentId: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project, incidentId } = await params
  const body = (await request.json().catch(() => null)) as PostBody | null
  if (!body?.decision || !body.reason) {
    return NextResponse.json({ error: 'decision and reason are required.' }, { status: 400 })
  }

  try {
    const incident = submitRollbackControlDecision(project, incidentId, {
      executive: currentDevActor(),
      decision: body.decision,
      reason: body.reason,
    })
    return NextResponse.json({ incident })
  } catch (err) {
    const described = describeOperationsError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
