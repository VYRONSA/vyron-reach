import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'
import { attemptHandoff } from '@/lib/dev/initiation/initiationHandoff'

/**
 * Manual "Start Development" — one of three paths in this app that can
 * bring a project's Director out of 'Idle' (the others: the Cross-Project
 * Scheduler, and an Executive's Go decision). All three now converge on
 * initiationHandoff.ts's attemptHandoff, which is what makes this route
 * incapable of bypassing Executive Go/Hold Control: attemptHandoff
 * refuses (with a clear message, surfaced below as a 409) for any project
 * still awaiting its first Go decision, unconditionally, with no
 * override available from this or any other call site.
 *
 * The request body no longer supplies the handoff content — attemptHandoff
 * builds it server-side from the durable Planning Service (the same
 * source of truth the Scheduler and Go already use) via
 * buildServerHandoff. `{ project }` is still required and checked against
 * the URL param purely as a request-shape sanity check; existing callers
 * that still POST a full legacy handoff payload keep working unchanged
 * (project is simply one field among many they already send).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  const body = (await request.json().catch(() => null)) as { project?: string } | null
  if (!body || body.project !== project) {
    return NextResponse.json({ error: 'Handoff body missing or project mismatch' }, { status: 400 })
  }

  const existing = getDirectorStatus(project)
  if (existing.state === 'Running' || existing.state === 'Planning') {
    return NextResponse.json({ error: 'Autonomous development is already running for this project.' }, { status: 409 })
  }

  const handoffError = attemptHandoff(project)
  if (handoffError) {
    return NextResponse.json({ error: handoffError }, { status: 409 })
  }
  return NextResponse.json({ status: getDirectorStatus(project) }, { status: 202 })
}
