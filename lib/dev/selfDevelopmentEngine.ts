import type { Milestone } from './milestonesStorage'
import type { Batch } from './batchesStorage'
import { getProjectIntelligence, type ProjectIntelligenceContext } from './projectIntelligence'
import { getDevelopmentIntelligence } from './developmentIntelligence'
import { getDevelopmentSession, type DevelopmentSession, type DevelopmentReadiness } from './developmentOrchestrator'
import { getDevelopmentPlan, type DevelopmentPlan, type TaskRecommendation, type BatchRecommendation } from './aiPlanningEngine'

/** The project slug VYRON DEV uses to track its own development, the same way it tracks any other product. */
export const SELF_PROJECT_SLUG = 'vyron-dev'

/**
 * The Self Development Status — VYRON DEV understanding its own state
 * through the exact same engines it built to understand every other
 * product's state. Nothing here is a new calculation: every field is
 * read straight off the Development Session or Development Plan, which
 * themselves already compose Project/Development/Handover/Git/
 * Deployment/Build Intelligence.
 */
export type SelfDevelopmentStatus = {
  currentPhase: string
  currentMilestone: Milestone | null
  currentBatch: Batch | null
  currentProgress: number
  currentObjective: string | null
  recommendedNextTask: TaskRecommendation
  recommendedNextBatch: BatchRecommendation
  executiveStatus: DevelopmentReadiness
  /** The full Session/Plan the status above was distilled from — everything else the Executive Command Centre needs (Git/Build/Deployment/Claude/Risks) lives here, so callers never need a second engine call. */
  session: DevelopmentSession
  plan: DevelopmentPlan
}

/**
 * The Self Development Engine — pure composition over the existing
 * intelligence chain (Project Intelligence → Development Intelligence →
 * Development Orchestrator → AI Planning Engine). Each upstream engine
 * is computed exactly once and threaded through the rest, so calling
 * this never duplicates a Project/Development Intelligence, Session, or
 * Plan computation. Slug-parameterized like every other engine here —
 * "self" describes the intent (VYRON DEV pointing it at its own project
 * record, SELF_PROJECT_SLUG), not a restriction on what it can compute.
 */
export function getSelfDevelopmentStatus(slug: string, context: ProjectIntelligenceContext = {}): SelfDevelopmentStatus {
  const projectIntel = getProjectIntelligence(slug, context)
  const devIntel = getDevelopmentIntelligence(slug, projectIntel)
  const session = getDevelopmentSession(slug, context, projectIntel, devIntel)
  const plan = getDevelopmentPlan(slug, context, projectIntel, devIntel, session)

  return {
    currentPhase: session.currentPhase,
    currentMilestone: session.currentMilestone,
    currentBatch: session.currentBatch,
    currentProgress: projectIntel.progress,
    currentObjective: session.currentObjective,
    recommendedNextTask: plan.recommendedNextTask,
    recommendedNextBatch: plan.recommendedNextBatch,
    executiveStatus: session.developmentReadiness,
    session,
    plan,
  }
}
