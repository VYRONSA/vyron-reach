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
 */
export type ExecutionSnapshot = {
  project: string
  projectName: string
  projectTagline: string
  projectDescription: string
  milestones: Milestone[]
  batches: Batch[]
  /** Architecture Decisions as of hand-off time — frozen for the run's duration; see "Remaining Limitations" on why this isn't kept live. */
  decisions: { decision: string; reason: string }[]
  /** Only Critical-relevant fields are carried — batch/milestone ids for blocker attribution, title/priority for display. */
  technicalDebt: { title: string; priority: string; relatedBatch: string }[]
  openRisks: { title: string; severity: string; relatedMilestone: string }[]
  developmentRules: string
  productBible: ProductBible
  /** A cheap fingerprint of what the snapshot's decisions/debt/risks looked like at hand-off — the "Knowledge Version" persisted alongside execution identity. */
  knowledgeVersion: string
  /** Minimal, server-appended completion records — this run's own audit trail of "what got built," independent of the (localStorage-only) Handover store. */
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
export type HandoffInput = Omit<ExecutionSnapshot, 'knowledgeVersion' | 'completions' | 'handedOffAt'>
