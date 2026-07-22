import type { KnowledgeItem, KnowledgeGap, KnowledgeSourceType } from '../../knowledge/organisationalKnowledgeTypes'

/**
 * The Engineering Intelligence pipeline — the Director's per-batch
 * analogue of Initiation's Knowledge Discovery
 * (lib/dev/initiation/knowledgeDiscovery.ts). Named "Engineering
 * Intelligence," not "Engineering Context," so it never collides with
 * the unrelated, pre-existing Live Knowledge Refresh machinery
 * (lib/dev/director/engineeringContextVersion.ts's
 * EngineeringContextVersions) — same word, different concept, kept
 * apart deliberately.
 *
 * Shares its item/gap vocabulary (KnowledgeItem/KnowledgeGap/
 * KnowledgeSourceType) with Initiation rather than inventing a second
 * one — see lib/dev/knowledge/organisationalKnowledgeTypes.ts.
 */

/** Everything one retrieval pass needs. `snapshot*` fields carry data lib/dev/director/liveKnowledgeRefresh.ts already froze onto the ExecutionSnapshot at this run's last synchronization boundary — reused here rather than re-queried, so Architecture Decisions/Technical Debt/Risk Register/Development Rules are retrieved exactly once per boundary, not once per boundary AND once per batch. */
export type EngineeringIntelligenceQuery = {
  project: string
  /** The current batch's own objective (and, where useful, its summary) — this pipeline's equivalent of Initiation's directive text, used for lexical relevance scoring. */
  queryText: string
  currentBatchId: string | null
  snapshotDecisions: { decision: string; reason: string }[]
  snapshotTechnicalDebt: { title: string; priority: string; relatedBatch: string }[]
  snapshotOpenRisks: { title: string; severity: string; relatedMilestone: string }[]
  snapshotDevelopmentRules: string
}

/** One knowledge source's ranked results, grouped — this is what makes the result "structured Engineering Context rather than raw documents": a reader (human or prompt-building code) sees named, typed categories, never an undifferentiated blob. */
export type EngineeringIntelligenceSection = {
  sourceType: KnowledgeSourceType
  items: KnowledgeItem[]
}

export type EngineeringIntelligenceContext = {
  sections: EngineeringIntelligenceSection[]
  gaps: KnowledgeGap[]
  retrievedAt: string
  sourcesConsulted: number
}

/** What gets durably recorded against this batch's Handover — "which knowledge sources influenced the result," per requirement 6, and which ones had nothing (requirement 7), both as first-class facts rather than something only reconstructable by re-running the pipeline later. */
export type EngineeringIntelligenceAttribution = {
  sourceRefs: string[]
  sourceTypesConsulted: KnowledgeSourceType[]
  gapSourceTypes: KnowledgeSourceType[]
}
