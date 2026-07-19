import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { startServerDirector } from '@/lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'
import type { HandoffInput } from '@/lib/dev/director/executionSnapshotTypes'

/**
 * START DEVELOPMENT's one and only server touchpoint. The browser reads
 * its own localStorage-backed planning state ONE LAST TIME here (project,
 * milestones, batches, decisions, technical debt, risks, product bible,
 * development rules) and hands it off wholesale. From the moment this
 * request returns, the server owns every one of those fields — the
 * browser closing has no effect on what happens next (see
 * serverExecutionLoop.ts).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  const body = (await request.json().catch(() => null)) as HandoffInput | null
  if (!body || body.project !== project) {
    return NextResponse.json({ error: 'Handoff body missing or project mismatch' }, { status: 400 })
  }

  const existing = getDirectorStatus(project)
  if (existing.state === 'Running' || existing.state === 'Planning') {
    return NextResponse.json({ error: 'Autonomous development is already running for this project.' }, { status: 409 })
  }

  startServerDirector(body)
  return NextResponse.json({ status: getDirectorStatus(project) }, { status: 202 })
}
