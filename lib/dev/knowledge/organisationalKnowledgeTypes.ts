/**
 * Shared retrieval vocabulary for every "what does this organisation
 * already know" pipeline in VYRON DEV. Originally defined only inside
 * lib/dev/initiation/initiationTypes.ts for Initiation's Knowledge
 * Discovery (directive-time); relocated here so the Director's
 * per-batch Engineering Intelligence pipeline (lib/dev/director/
 * engineeringIntelligence/) can share the exact same item/gap shape
 * instead of inventing a second, incompatible one. initiationTypes.ts
 * re-exports these — nothing about Initiation's own behavior changes.
 */

/**
 * Every organisational knowledge source either pipeline can retrieve
 * from. Initiation-only source types (Existing Milestone, Existing
 * Delivery Batch, Previous Executive Directive, Previous Engineering
 * Programme, Existing Project Documentation, Prompt Library) and
 * Engineering-Intelligence-only source types (Previous Engineering
 * Batch, Previous Engineering Outcome, Lessons Learned, Coding
 * Standards, Platform Architecture, Component Documentation, Shared
 * Framework Knowledge, Review Board Decision, Historical Fix) coexist
 * in one union — a pipeline only ever registers retrievers for the
 * source types it actually understands, so this shared union costs
 * nothing per-pipeline beyond the type name existing.
 */
export type KnowledgeSourceType =
  | 'Product Knowledge'
  | 'Product Decision Register'
  | 'Architecture Decision Record'
  | 'Development Rules'
  | 'Engineering Standards'
  | 'Existing Project Documentation'
  | 'Previous Executive Directive'
  | 'Previous Engineering Programme'
  | 'Existing Milestone'
  | 'Existing Delivery Batch'
  | 'Risk Register'
  | 'Technical Debt'
  | 'Prompt Library'
  | 'Knowledge Service'
  | 'Previous Engineering Batch'
  | 'Previous Engineering Outcome'
  | 'Lessons Learned'
  | 'Coding Standards'
  | 'Platform Architecture'
  | 'Component Documentation'
  | 'Shared Framework Knowledge'
  | 'Review Board Decision'
  | 'Historical Fix'
  | 'Verification History'
  | 'Release History'
  | 'Operational History'

/** One piece of retrieved knowledge, already carrying everything needed for both ranking and attribution. `sourceRef` is a stable, real reference (never fabricated) so a generated recommendation or recorded attribution can point back to something a human can actually go look at. */
export type KnowledgeItem = {
  sourceType: KnowledgeSourceType
  sourceRef: string
  /** The project this knowledge belongs to, if any — null for cross-cutting sources (e.g. Development Rules, Engineering Standards, or organisation-wide Learning entries that carry no per-project attribution). */
  project: string | null
  title: string
  summary: string
  timestamp: string | null
  /** 0-1, filled in during ranking. Higher is more relevant to the current directive/batch. */
  relevanceScore: number
}

/** A source that produced nothing — either searched and empty, or structurally unreachable from the server today. Recorded rather than silently omitted, so "no relevant knowledge exists" is always an honest, visible fact, never a fabricated result. */
export type KnowledgeGap = {
  sourceType: KnowledgeSourceType
  reason: string
}
