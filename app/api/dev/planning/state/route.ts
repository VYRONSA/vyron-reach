import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  listProjects,
  listAllMilestones,
  listAllBatches,
  listAllDecisions,
  listAllRisks,
  listAllTechnicalDebt,
  listAllRoadmapLists,
} from '@/lib/dev/planningState/planningStateService'

/**
 * The single bulk hydration point for the browser's in-memory planning
 * cache (lib/dev/planningState/planningClientCache.ts) — one request
 * populates every planning collection across every project, instead of
 * N+1 per-project requests. This is the only place the browser reads
 * planning data from in bulk; individual mutations still go through the
 * per-entity routes and this endpoint is re-fetched afterward to
 * reconcile the cache with the server's authoritative (invariant-
 * enforced) result.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  return NextResponse.json({
    projects: listProjects(),
    milestones: listAllMilestones(),
    batches: listAllBatches(),
    decisions: listAllDecisions(),
    risks: listAllRisks(),
    technicalDebt: listAllTechnicalDebt(),
    roadmapLists: listAllRoadmapLists(),
  })
}
