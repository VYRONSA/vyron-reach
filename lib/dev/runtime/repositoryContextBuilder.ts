import type { DevelopmentSession } from '../developmentOrchestrator'
import type { Handover } from '../handoverStorage'

export type RepositoryContext = {
  repositoryStatus: string
  gitStatus: string
  gitDiffSummary: string | null
}

/**
 * The Repository Context Builder — consolidates everything the Runtime
 * Context needs to know about the state of the actual repository into one
 * named component, per the Execution Engine's architecture checklist.
 * Pure composition: repositoryStatus/gitStatus are already computed by the
 * Development Orchestrator (itself built on gitInfo.ts/gitIntelligence.ts),
 * and gitDiffSummary comes from the most recent Handover — this module
 * derives nothing new, it only gives the existing data one clear home.
 */
export function buildRepositoryContext(session: DevelopmentSession, latestHandover: Handover | null): RepositoryContext {
  return {
    repositoryStatus: session.gitRepositoryStatus,
    gitStatus: session.gitWorkingTreeStatus,
    gitDiffSummary: latestHandover?.gitDiffSummary || null,
  }
}
