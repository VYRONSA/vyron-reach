import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import {
  getRelease,
  submitReleaseControlDecision,
  describeReleaseManagementError,
} from '@/lib/dev/director/releaseManagement/releaseManagementService'
import type { ReleaseControlDecisionType } from '@/lib/dev/director/releaseManagement/releaseManagementTypes'

/**
 * The only route through which a human can submit a real Release Go/Hold
 * decision — the single gate between a prepared release (real, but
 * local-only: a computed version/notes/branch name and a set of
 * validation results) and the mutating sequence that actually commits,
 * pushes, opens a pull request, and deploys a preview. See
 * lib/dev/director/releaseManagement/releaseManagementService.ts.
 */

/** Read-only: the full prepared release, including its preparation report and (once decided) execution report. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string; releaseId: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project, releaseId } = await params
  const release = getRelease(releaseId)
  if (!release || release.project !== project) {
    return NextResponse.json({ error: `Release '${releaseId}' not found for project '${project}'.` }, { status: 404 })
  }
  return NextResponse.json({ release })
}

type PostBody = { decision?: ReleaseControlDecisionType; reason?: string }

/** Submits one Release Go/Hold decision — only valid while the release is Prepared. Go kicks off the real mutating sequence (fire-and-forget, since it performs real network operations); Hold only records the decision. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string; releaseId: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project, releaseId } = await params
  const body = (await request.json().catch(() => null)) as PostBody | null
  if (!body?.decision || !body.reason) {
    return NextResponse.json({ error: 'decision and reason are required.' }, { status: 400 })
  }

  try {
    const release = submitReleaseControlDecision(project, releaseId, {
      executive: currentDevActor(),
      decision: body.decision,
      reason: body.reason,
    })
    return NextResponse.json({ release })
  } catch (err) {
    const described = describeReleaseManagementError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
