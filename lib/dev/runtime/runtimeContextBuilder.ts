import { decisionsForProject } from '../decisionsStorage'
import { getKnowledgeNote } from '../knowledgeData'
import { getProductBible, type ProductBible } from '../productBibleStorage'
import { buildRepositoryContext } from './repositoryContextBuilder'
import type { DevelopmentSession } from '../developmentOrchestrator'
import type { DevelopmentConversationMemory } from '../developmentConversationMemoryEngine'
import type { Handover } from '../handoverStorage'
import type { RelevantKnowledge } from '../learning/learningTypes'
import type { EngineeringIntelligenceContext } from '../director/engineeringIntelligence/engineeringIntelligenceTypes'
import type { DevelopmentJob } from './runtimeTypes'

export type DevelopmentContext = {
  product: string
  project: string
  productVision: string
  /** The full Product Bible document (vision/goals/targetMarket/coreFeatures/futureRoadmap/notes) — futureRoadmap doubles as the Roadmap context field, since this project has no separate roadmap store. */
  productBible: ProductBible
  currentPhase: string
  currentMilestone: string | null
  currentBatch: string | null
  currentObjective: string | null
  currentTask: string | null
  previousRuntimeExecution: DevelopmentJob | null
  previousHandover: Handover | null
  /** Last 3 Handovers (newest first), for context beyond just the single latest one. */
  previousHandovers: Handover[]
  previousClaudeCompletion: string
  outstandingRecommendations: string | null
  developmentQueue: { title: string; priority: string }[]
  technicalDebt: { title: string; priority: string }[]
  architectureDecisions: { decision: string; reason: string }[]
  runtimeHistory: DevelopmentJob[]
  repositoryStatus: string
  gitStatus: string
  gitDiffSummary: string | null
  developmentRules: string
  openRisks: { title: string; severity: string }[]
  buildStatus: string
  typescriptStatus: string
  /** From the Knowledge Engine (lib/dev/learning/) — null when the caller doesn't have it (e.g. it wasn't fetched yet), never fabricated. */
  relevantKnowledge: RelevantKnowledge | null
  /**
   * The Engineering Intelligence pipeline's structured retrieval result
   * (lib/dev/director/engineeringIntelligence/) — organisational
   * knowledge (decisions, risks, technical debt, learned patterns, past
   * outcomes, worker reviews, resolved incidents) gathered for this
   * specific task, grouped by source with honest gaps recorded for
   * anything not found. Null when the caller hasn't run the pipeline
   * (e.g. the browser-attended path, which does not populate this
   * field today — see buildServerDevelopmentContext in
   * lib/dev/director/serverContextBuilder.ts for the one caller that
   * does).
   */
  engineeringIntelligence: EngineeringIntelligenceContext | null
}

/**
 * The Runtime Context Builder — pure composition, nothing new derived.
 * Every field is either read straight off the already-computed Session/
 * Memory (which already compose Project/Development/Git/Build/Deployment/
 * Handover Intelligence), or a plain, non-"intelligence" store lookup
 * (decisionsForProject, getKnowledgeNote — direct data access, the same
 * category as every engine in this app already freely uses for
 * getMilestones/getBatches/etc.). Runtime history and the latest handover
 * are accepted as precomputed params rather than fetched here, since one
 * lives in the server-side job store and the other in localStorage — this
 * function only assembles what it's given.
 */
export function buildDevelopmentContext(
  slug: string,
  session: DevelopmentSession,
  memory: DevelopmentConversationMemory,
  latestHandover: Handover | null,
  runtimeHistory: DevelopmentJob[],
  relevantKnowledge: RelevantKnowledge | null = null,
  /** Handovers beyond the latest one (newest first) — optional, so existing callers that only have the latest one need no change. */
  additionalHandovers: Handover[] = []
): DevelopmentContext {
  const decisions = decisionsForProject(slug)
  const rules = getKnowledgeNote('coding-standards')
  const repository = buildRepositoryContext(session, latestHandover)
  const previousHandovers = (latestHandover ? [latestHandover, ...additionalHandovers] : additionalHandovers).slice(0, 3)

  return {
    product: session.project?.name ?? slug,
    project: slug,
    productVision: [session.project?.tagline, session.project?.description].filter(Boolean).join(' — '),
    productBible: getProductBible(slug),
    currentPhase: session.currentPhase,
    currentMilestone: session.currentMilestone?.title ?? null,
    currentBatch: session.currentBatch ? `Batch ${session.currentBatch.batchNumber}` : null,
    currentObjective: session.currentObjective,
    currentTask: session.currentTask?.title ?? null,
    previousRuntimeExecution: runtimeHistory[0] ?? null,
    previousHandover: latestHandover,
    previousHandovers,
    previousClaudeCompletion: memory.completionStatus,
    outstandingRecommendations: session.previousRecommendations,
    developmentQueue: session.outstandingTasks.map(t => ({ title: t.title, priority: t.priority })),
    technicalDebt: session.technicalDebt.map(d => ({ title: d.title, priority: d.priority })),
    architectureDecisions: decisions.slice(0, 5).map(d => ({ decision: d.decision, reason: d.reason })),
    runtimeHistory: runtimeHistory.slice(0, 5),
    repositoryStatus: repository.repositoryStatus,
    gitStatus: repository.gitStatus,
    gitDiffSummary: repository.gitDiffSummary,
    developmentRules: rules.content,
    openRisks: session.activeRisks.map(r => ({ title: r.title, severity: r.severity })),
    buildStatus: session.buildStatus,
    typescriptStatus: session.typescriptStatus,
    relevantKnowledge,
    // The browser-attended path does not run the Engineering Intelligence
    // pipeline (a headless-loop concern) — see this field's own doc
    // comment on DevelopmentContext above.
    engineeringIntelligence: null,
  }
}
