import type { Batch } from '../batchesStorage'
import type { Milestone } from '../milestonesStorage'
import type { ProductBible } from '../productBibleStorage'

/**
 * The server-owned mirror of "planning state required for autonomous
 * execution" — Project State, Current Phase/Milestone/Batch, and the
 * Execution Queue all derive from the milestones/batches arrays here, the
 * same way they did from batchesStorage/milestonesStorage client-side.
 * This is a snapshot, not a live subscription: the browser hands one off
 * once (at Start Development), and from that point the server Director
 * loop is the ONLY writer — batches complete and milestones advance here,
 * not in localStorage. batches/milestones use the exact same types as the
 * client stores (type-only imports — zero runtime coupling to
 * localStorage) so a snapshot round-trips losslessly when the browser
 * later pulls it back to reconcile its own view.
 *
 * As of Version 2.0 Milestone 2.1, this is a LIGHTWEIGHT RUNTIME CACHE
 * ONLY — it is no longer the system of record for engineering history.
 * `decisions`/`technicalDebt`/`openRisks` remain here purely as the
 * frozen-at-hand-off inputs the active run's own preflight-blocker checks
 * read (see serverExecutionLoop.ts's findPreflightBlocker); the permanent,
 * queryable historical record for every decision/debt/risk/completion now
 * lives exclusively in the Knowledge Service (lib/dev/knowledge/). Losing
 * this entire snapshot (a crash before it's ever re-saved, a manual
 * delete) loses no engineering knowledge — only this one run's in-flight
 * progress cache, which recovery already handles separately.
 */
export type ExecutionSnapshot = {
  project: string
  projectName: string
  projectTagline: string
  projectDescription: string
  milestones: Milestone[]
  batches: Batch[]
  /** Architecture Decisions as of hand-off time — frozen for the run's duration; used only for this run's own context-building, not as a historical record (see the Knowledge Service for that). */
  decisions: { decision: string; reason: string }[]
  /** Only Critical-relevant fields are carried — batch/milestone ids for blocker attribution, title/priority for display. */
  technicalDebt: { title: string; priority: string; relatedBatch: string }[]
  openRisks: { title: string; severity: string; relatedMilestone: string }[]
  developmentRules: string
  productBible: ProductBible
  /**
   * Minimal, server-appended completion records — a lightweight runtime
   * cache used only by estimateCompletion() (this run's own ETA math via
   * each completion's recorded job duration). NOT the historical record:
   * every batch completion is durably recorded via the Knowledge Service's
   * recordBatchCompletion() at the same time this array is appended to,
   * and that Knowledge Service record — never this array — is what
   * survives independently of this snapshot.
   */
  completions: SnapshotCompletion[]
  handedOffAt: string
}

export type SnapshotCompletion = {
  batchId: string
  batchNumber: string
  milestoneId: string
  milestoneTitle: string
  objective: string
  summary: string
  completedAt: string
  runtimeJobId: string
}

/** Exactly what the browser sends once, at Start Development — everything buildServerDevelopmentContext/serverPlanningState need to run without it again. */
export type HandoffInput = Omit<ExecutionSnapshot, 'completions' | 'handedOffAt'>
