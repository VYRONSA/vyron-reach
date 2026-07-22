import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getEventsSince, getCurrentSeq, isWithinRetention } from '@/lib/dev/events/eventBus'
import { buildDashboardSnapshot } from '@/lib/dev/events/dashboardSnapshot'

/**
 * The polling fallback transport for environments where SSE is
 * unavailable (Milestone 5.1's Transport section: "Provide a polling
 * fallback... The fallback must preserve the same event model.") — reads
 * from the exact same eventBus.ts/dashboardSnapshot.ts the SSE route
 * uses, just request/response instead of a long-lived stream. A client
 * with no `since` cursor (first load, or its last known seq fell outside
 * the ring buffer's retention window) gets a full `snapshot`; otherwise
 * it gets the `events` it missed since that cursor, in order — the same
 * two cases app/api/dev/events/stream/route.ts's `Last-Event-ID` handling
 * covers, so client-side event-application logic can be shared verbatim
 * regardless of which transport is active.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project') ?? undefined
  const sinceParam = request.nextUrl.searchParams.get('since')
  const since = sinceParam !== null ? Number(sinceParam) : null

  if (since !== null && Number.isFinite(since) && isWithinRetention(since)) {
    return NextResponse.json({ events: getEventsSince(since, project), seq: getCurrentSeq(), snapshot: null })
  }

  return NextResponse.json({ events: [], seq: getCurrentSeq(), snapshot: buildDashboardSnapshot(project) })
}
