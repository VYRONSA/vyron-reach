import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getDirectorStatus, listDirectorStatuses } from '@/lib/dev/director/directorRuntimeStore'

/**
 * Read-only view of the Director's live status blackboard — CEO Runtime
 * Queries and the Command Centre dashboard both read through here.
 *
 * PRA-P1-017 remediation: this route used to also expose a POST that
 * accepted an arbitrary `{project, patch}` body and wrote it straight to
 * patchDirectorStatus — including `state` — with none of the guards
 * pauseServerDirector/resumeServerDirector/startServerDirector enforce
 * (acquireLoopOwnership in particular). A single authenticated call could
 * set state:'Running' without the loop ever actually acquiring ownership,
 * a self-inflicted "Running but nobody is running it" zombie only ever
 * revisited at the next server restart. That POST handler is removed
 * outright rather than restricted to a "safe" field allowlist: no current
 * UI component calls it (confirmed — the only caller was
 * lib/dev/runtime/directorClient.ts's own patchDirectorStatus wrapper,
 * itself unused by any component and removed alongside this), and every
 * legitimate state transition already has its own purpose-built, guarded
 * route (handoff/pause/resume/cancel/inbox-resolve).
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  if (!project) return NextResponse.json({ statuses: listDirectorStatuses() })
  return NextResponse.json({ status: getDirectorStatus(project) })
}
