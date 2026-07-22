import type { DevelopmentSession } from '../developmentOrchestrator'
import type { GitIntelligence } from '../gitIntelligence'
import type { BatchStatus } from '../batchesStorage'

export type CeoDecision = 'Approved' | 'Rejected' | 'Pending'

/**
 * The formal Execution Identity — the one key every subsystem (Dashboard,
 * Projects, Milestones, Batch Manager, Planning Engine, Runtime Context
 * Builder, Prompt Builder, Review Package, Recurrence Detection, CEO
 * Review) reads instead of separately re-deriving "what's currently being
 * worked on." Built once from the already-authoritative DevelopmentSession
 * (whose currentBatch already comes from batchesStorage's Active-batch
 * invariant — see getCurrentBatchForProject), plus whatever the caller
 * knows about the surrounding execution (repo commit, the runtime job it
 * belongs to, a CEO decision, the knowledge state it was planned against).
 */
export type ExecutionIdentity = {
  product: string
  project: string
  phase: string
  milestoneId: string | null
  milestoneTitle: string | null
  batchId: string | null
  batchNumber: string | null
  /** The batch record's own updatedAt — the cheapest true "batch revision" marker: it changes the instant the batch's objective/status/anything about it is edited. */
  batchVersion: string
  batchStatus: BatchStatus | 'None'
  repositoryCommit: string | null
  runtimeJobId: string | null
  ceoDecision: CeoDecision
  knowledgeVersion: string
  /**
   * Version 2.0 Milestone 2.2 (Live Knowledge Refresh) — the Planning
   * Service's own per-project counter (planningStateService.getMetadata)
   * as of this batch's last synchronization boundary, the DNA-only
   * fingerprint (lib/dev/knowledge/knowledgeVersion.ts's
   * computeDNAVersion), and a compact digest of knowledgeVersion +
   * planningVersion + dnaVersion together. All three are frozen at the
   * same moment knowledgeVersion is and never recomputed for the
   * lifetime of this batch — see serverExecutionLoop.ts's runLoopBody.
   */
  planningVersion: number
  dnaVersion: string
  executionContextVersion: string
  executionTimestamp: string
}

export function buildExecutionIdentity(
  session: DevelopmentSession,
  options: {
    git?: GitIntelligence
    runtimeJobId?: string | null
    ceoDecision?: CeoDecision
    knowledgeVersion?: string
    planningVersion?: number
    dnaVersion?: string
    executionContextVersion?: string
  } = {}
): ExecutionIdentity {
  const batch = session.currentBatch
  const commit = options.git?.commitHash
  return {
    product: session.project?.name ?? session.project?.slug ?? 'Unknown',
    project: session.project?.slug ?? 'Unknown',
    phase: session.currentPhase,
    milestoneId: session.currentMilestone?.id ?? null,
    milestoneTitle: session.currentMilestone?.title ?? null,
    batchId: batch?.id ?? null,
    batchNumber: batch?.batchNumber ?? null,
    batchVersion: batch?.updatedAt ?? 'None',
    batchStatus: batch?.status ?? 'None',
    repositoryCommit: commit && commit !== 'Unavailable' ? commit : null,
    runtimeJobId: options.runtimeJobId ?? null,
    ceoDecision: options.ceoDecision ?? 'Pending',
    knowledgeVersion: options.knowledgeVersion ?? 'Unknown',
    planningVersion: options.planningVersion ?? 0,
    dnaVersion: options.dnaVersion ?? 'Unknown',
    executionContextVersion: options.executionContextVersion ?? 'Unknown',
    executionTimestamp: new Date().toISOString(),
  }
}

/**
 * The stable comparison key Recurrence Detection judges "same execution"
 * under. Deliberately excludes runtimeJobId/executionTimestamp/ceoDecision
 * — those differ on every single run by definition and would make
 * recurrence detection never fire. Repository commit, batch revision, and
 * knowledge version are included precisely because the Planning Rules say
 * a change in any of them means execution should be ALLOWED, not blocked
 * — baking them into the key makes "the key changed" and "a meaningful
 * change happened" the same fact, rather than two things kept in sync by
 * hand in two different places.
 */
export function executionIdentityKey(identity: ExecutionIdentity): string {
  return [
    identity.project,
    identity.milestoneId ?? 'none',
    identity.batchId ?? 'none',
    identity.batchVersion,
    identity.repositoryCommit ?? 'none',
    identity.knowledgeVersion,
    // Version 2.0 Milestone 2.2: a Planning Service edit (e.g. a milestone
    // or batch field changed directly, not via a Knowledge Service record)
    // doesn't necessarily move knowledgeVersion, so planningVersion is
    // included as its own independent recurrence-detection signal.
    identity.planningVersion,
  ].join('::')
}
