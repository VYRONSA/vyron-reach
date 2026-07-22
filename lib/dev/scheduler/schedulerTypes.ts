/**
 * The Cross-Project Execution Scheduler (Version 2.0 Phase 4, Milestone
 * 4.2) — types. The Scheduler operates ABOVE the per-project Engineering
 * Directors (lib/dev/director/serverExecutionLoop.ts, entirely
 * unmodified by this milestone); it decides which project's Director
 * gets to run, never how a Director itself behaves once running.
 */

/**
 * What the Scheduler can determine about a project's readiness this
 * cycle, before deciding whether to actually start/resume it:
 *   - Running: a Director loop is already active — never touched.
 *   - Blocked / WaitingForCeo: paused for human input — never touched,
 *     the same CEO-approval gate every earlier milestone protects.
 *   - Completed / NoWork: nothing eligible to run right now.
 *   - AwaitingGo: provisioned through Project Initiation
 *     (lib/dev/initiation/) but no Executive Go decision has been
 *     recorded yet — never touched, the same explicit-human-decision
 *     gate Executive Go/Hold Control protects. Projects with no
 *     Initiation history at all are never affected by this value.
 *   - Eligible: a candidate for this cycle's available execution slots.
 */
export type ProjectEligibility = 'Eligible' | 'Running' | 'Blocked' | 'WaitingForCeo' | 'Completed' | 'NoWork' | 'AwaitingGo'

export type SchedulingFactor = {
  name: string
  value: number
  detail: string
}

export type ProjectSchedulingInfo = {
  project: string
  eligibility: ProjectEligibility
  /** Higher = scheduled sooner. Deterministic given identical factor inputs — see schedulingPolicy.ts. */
  priorityScore: number
  factors: SchedulingFactor[]
}

export type SchedulerCycleResult = {
  timestamp: string
  /** Every discovered project, ranked by priorityScore descending — "Current execution order" for the dashboard. */
  order: ProjectSchedulingInfo[]
  started: string[]
  /** Eligible this cycle but not started — no available execution slot. */
  waiting: string[]
  errors: { project: string; message: string }[]
}

export type SchedulerState = {
  lastCycleAt: string | null
  lastCycleResult: SchedulerCycleResult | null
  totalCycles: number
  /** Per-project: when the Scheduler last actually started/resumed it — the durable "recent execution" signal fairness scoring reads, independent of DirectorRuntimeStatus (which changes constantly while a run progresses). */
  lastExecutedAt: Record<string, string>
  /** Projects the Scheduler has already sent a "Project Waiting" notification for at their current eligible-but-unscheduled streak, so it isn't re-sent every tick — cleared once the project stops being merely eligible (started, or becomes ineligible again). */
  waitingNotified: string[]
  /**
   * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — a
   * bounded, newest-first history of recent cycles (see
   * schedulerStore.ts's CYCLE_HISTORY_LIMIT) for paginated "Scheduler
   * History." `lastCycleResult` above is untouched and stays the fast
   * "just the latest cycle" read every earlier milestone (the dashboard
   * panel, the bootstrap) already relies on — this is additive, a FIFO
   * cap being this store's own retention policy rather than age-based
   * archiving, appropriate for a high-frequency operational log where
   * "the last N cycles" is what's actually useful, not "cycles older
   * than X days."
   */
  cycleHistory: SchedulerCycleResult[]
}
