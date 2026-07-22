import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { readPlanningHistory, appendPlanningRecord, updatePlanningRecord, applyApprovalDecision } from '@/lib/dev/planning/planningRepository'
import type { PlanningHistoryRecord } from '@/lib/dev/planning/planningTypes'

/**
 * The Planning Engine's only server-side step — reading/writing plan
 * history (file-backed, planningRepository.ts owns the storage). The
 * Planning Engine itself (lib/dev/planning/planningEngine.ts) is pure
 * and runs client-side, the same split the Assessment Engine uses. GET
 * returns history for estimate calibration; POST persists a freshly
 * generated plan (Proposed, never pre-approved); PATCH is the only way
 * an approval or execution outcome is ever recorded — this route never
 * creates a Runtime job or touches milestones/batches/queue itself.
 *
 * PRA-P1-008 remediation: PATCH used to accept a client-supplied
 * approvalStatus and write it unconditionally, so a plan could be forced
 * to 'Approved' with no server-side check that it had actually passed
 * Director Review — a direct governance-gate bypass. An approval/
 * rejection now goes exclusively through applyApprovalDecision, which
 * re-derives the outcome server-side via the Planning Engine's own
 * applyHumanApprovalDecision rather than trusting the client's value.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const projectSlug = request.nextUrl.searchParams.get('project') ?? undefined
  return NextResponse.json({ history: readPlanningHistory(projectSlug) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const record = (await request.json().catch(() => null)) as PlanningHistoryRecord | null
  if (!record || !record.id || !record.projectSlug || !record.plan) {
    return NextResponse.json({ error: 'A valid PlanningHistoryRecord is required' }, { status: 400 })
  }

  appendPlanningRecord(record)
  return NextResponse.json({ record }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<Pick<PlanningHistoryRecord, 'executionResult' | 'actualDurationHours' | 'success' | 'varianceHours'>> & {
        id?: string
        decision?: 'Approved' | 'Rejected'
      })
    | null
  if (!body || !body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { id, decision } = body

  if (decision) {
    // PRA-P1-011: applyApprovalDecision itself publishes 'Planning Changes'
    // on a successful write (never on a rejected/409 decision) — see its
    // own doc comment for why that's done there rather than here.
    const result = applyApprovalDecision(id, decision)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json({ record: result.record })
  }

  // Explicit allowlist, only including keys actually present in the body —
  // not a rest-spread of the raw request body (which would forward any JSON
  // key the caller sent, including approvalResult; unlike TypeScript's
  // compile-time type on `body` above, nothing stops a raw HTTP request
  // from including it) and not a blind destructure into every field
  // (which would explicitly set the other three to `undefined` and wipe
  // them on any partial patch). This is what actually keeps approval/
  // rejection reachable only through applyApprovalDecision, not just typed
  // that way, while still patching only what was sent.
  const patch: Partial<Pick<PlanningHistoryRecord, 'executionResult' | 'actualDurationHours' | 'success' | 'varianceHours'>> = {}
  if ('executionResult' in body) patch.executionResult = body.executionResult
  if ('actualDurationHours' in body) patch.actualDurationHours = body.actualDurationHours
  if ('success' in body) patch.success = body.success
  if ('varianceHours' in body) patch.varianceHours = body.varianceHours

  const updated = updatePlanningRecord(id, patch)
  if (!updated) return NextResponse.json({ error: 'Planning record not found' }, { status: 404 })

  return NextResponse.json({ record: updated })
}
