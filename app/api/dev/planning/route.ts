import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { readPlanningHistory, appendPlanningRecord, updatePlanningRecord } from '@/lib/dev/planning/planningRepository'
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
    | (Partial<Pick<PlanningHistoryRecord, 'approvalResult' | 'executionResult' | 'actualDurationHours' | 'success' | 'varianceHours'>> & {
        id?: string
        approvalStatus?: PlanningHistoryRecord['plan']['approvalStatus']
      })
    | null
  if (!body || !body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { id, ...patch } = body
  const updated = updatePlanningRecord(id, patch)
  if (!updated) return NextResponse.json({ error: 'Planning record not found' }, { status: 404 })

  return NextResponse.json({ record: updated })
}
