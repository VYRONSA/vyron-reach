import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'
import { listInboxItems } from '@/lib/dev/director/engineeringInboxStore'

/**
 * CEO Runtime Queries — one composite endpoint answering every question
 * the mission names ("Where are we?", "What is currently executing?",
 * "Why are we waiting?", "Estimated completion?", ...), generated purely
 * from the live DirectorRuntimeStatus this project's autonomous run has
 * already been pushing updates to. No separate computation happens here —
 * this only shapes already-live state into direct answers.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  if (!project) return NextResponse.json({ error: 'Missing project query param' }, { status: 400 })

  const s = getDirectorStatus(project)
  const openInbox = listInboxItems({ project, status: 'Open' })

  return NextResponse.json({
    whereAreWe: `${project}: ${s.state} — ${s.currentActivity}`,
    whatIsCurrentlyExecuting: s.currentAiTask ?? (s.state === 'Running' ? s.currentActivity : 'Nothing — the autonomous run is not currently executing.'),
    whyAreWeWaiting: s.state === 'Waiting for CEO' || s.state === 'Blocked' ? s.waitingReason : null,
    estimatedCompletion: s.estimatedCompletionAt,
    currentBatch: s.currentBatchNumber ? `Batch ${s.currentBatchNumber}` : null,
    currentMilestone: s.currentMilestoneTitle,
    currentPhase: s.currentPhase,
    remainingBatches: s.remainingBatches,
    currentRisks: s.riskLevel,
    currentBuildStatus: s.buildStatus,
    currentTypeScriptStatus: s.typescriptStatus,
    openInboxItemCount: openInbox.length,
    status: s,
  })
}
