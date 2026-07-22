/**
 * The Real-Time Event Service (Version 2.0 Phase 5, Milestone 5.1) —
 * types. The Event Service is the single publisher every dashboard
 * surface subscribes to; no component ever subscribes directly to a
 * Director, the Scheduler, the Inbox, or Notifications. Producers keep
 * owning their durable state exactly as before — this module never
 * stores anything itself (see eventBus.ts's module docstring).
 */
export type DashboardEventCategory =
  | 'Engineering Director'
  | 'Worker Assignment'
  | 'Worker Completion'
  | 'Planning Changes'
  | 'Knowledge Updates'
  | 'Assessment Updates'
  | 'Scheduler Activity'
  | 'Notification Delivery'
  | 'Engineering Inbox'
  | 'Escalation'
  | 'Recovery'
  | 'Project Status'
  /**
   * Production Validation 2.1, Milestone 2.1.1's Testing metrics had no
   * event source (a test suite run is reported through its own narrow
   * ingestion function, not observed by the running server) — Milestone
   * 2.1.2's Certification Service needs that same fact as a correlatable
   * event, not just a Metrics Service counter, so metricsStore.ts's
   * recordTestRun now publishes one too.
   */
  | 'Testing'
  /**
   * Project Initiation — every InitiationRequest state-machine transition
   * (Draft/Generating/Review/Approved/Provisioning/Provisioned/Cancelled)
   * publishes here, project-scoped, so the initiation wizard's SSE
   * subscription can resolve Generating/Provisioning live instead of
   * polling.
   */
  | 'Project Initiation'
  /**
   * PRA-P1-033 remediation — Autonomous Operations (Incident lifecycle:
   * opened/refreshed/resolved, plus Rollback Go/Hold decisions) was the
   * one producer module reviewed that never published to the bus, so
   * Live Command Centre / Metrics had no live signal for it and an
   * operator had to poll/refresh to see a change.
   */
  | 'Operations'

export type PublishDashboardEventInput = {
  category: DashboardEventCategory
  /** The '*' sentinel marks a genuinely cross-project event (Scheduler Recovered, a bootstrap's own Recovery event) — the same convention lib/dev/scheduler/schedulerBootstrap.ts already established for NotificationEvent.project. */
  project: string
  /** A short, category-scoped discriminator (e.g. 'status-changed', 'reminder-sent') — never parsed by the bus itself, purely for consumers. */
  type: string
  payload: Record<string, unknown>
}

/** A single published event — assigned its id/seq/timestamp by the bus at publish time, never by the caller. */
export type DashboardEvent = PublishDashboardEventInput & {
  id: string
  /** Monotonically increasing per-process sequence number. This is what makes "ordered delivery" and "no duplicate processing" simple guarantees rather than clock-based heuristics: a consumer only ever needs to track the highest seq it has already applied and ignore/replay relative to that. Resets to 0 on every process restart — meaningless across restarts, exactly like the rest of this transient service. */
  seq: number
  timestamp: string
}
