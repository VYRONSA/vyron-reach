/**
 * Production Validation 2.1, Milestone 2.1.1 — Engineering Intelligence &
 * Performance Metrics. Types only. "The Metrics Service becomes the ONLY
 * owner of engineering metrics. Existing services MUST NOT calculate
 * metrics. They simply publish events." — every producer this milestone
 * touches publishes a RAW FACT (a count-of-one occurrence, or a
 * self-measured duration like `durationMs` on the Scheduler/Assessment/
 * Recovery events); only this module turns a stream of raw facts into a
 * percentage, an average, or a trend.
 */

/** A raw tally — how many times something happened. Never a percentage or an average; those are MetricsKpis, computed from these. */
export type MetricCounters = Record<string, number>

/** A running accumulator for computing an average duration without storing every individual sample. */
export type DurationAccumulator = { count: number; totalMs: number }
export type MetricDurations = Record<string, DurationAccumulator>

/** An unresolved "this started, waiting for its matching end" marker — e.g. a worker task assigned but not yet completed. Keyed by an id specific to what's being timed (`worker:<taskId>`, `delivery:<deliveryId>`, ...). */
export type OpenSpan = { name: string; startedAt: string }

/**
 * The Metrics Service's entire durable state — one document, one
 * updateJsonStore lock per event processed, exactly like every other
 * store in this app that must never lose a concurrent update (see
 * metricsService.ts's processEvent). `lastEventSeq` is what makes "no
 * duplicate metrics" a guarantee rather than a hope: eventBus.ts's
 * DashboardEvent.seq is monotonic, so an event already reflected here is
 * always detectable and skipped.
 */
export type MetricsState = {
  counters: MetricCounters
  durations: MetricDurations
  spans: Record<string, OpenSpan>
  /** project -> ISO timestamp of the most recent unconfirmed High risk-level assessment, for "Risk prediction accuracy" (see metricClassifier.ts). */
  pendingRiskFlags: Record<string, string>
  lastEventSeq: number
}

export type SnapshotGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly'

/** One point-in-time capture of every derived KPI — what "Historical Metrics" queries and the dashboard's trend data are built from. */
export type MetricSnapshot = {
  id: string
  granularity: SnapshotGranularity
  timestamp: string
  /** The period key this snapshot represents (e.g. '2026-07-19T14' for hourly, '2026-07-19' for daily) — what dedup/"one snapshot per period" is keyed on. */
  periodKey: string
  kpis: MetricsKpis
}

export type ThroughputKpis = {
  projectsStarted: number
  projectsCompleted: number
  featuresPlanned: number
  featuresDelivered: number
  tasksAssigned: number
  tasksCompleted: number
  averageFeatureDurationMs: number | null
  averageProjectDurationMs: number | null
}

export type AutomationKpis = {
  autonomousDecisions: number
  manualOverrides: number
  automationPercentage: number | null
  ceoInterventionPercentage: number | null
  directorDecisions: number
  workerDecisions: number
  schedulerDecisions: number
  recoveryEvents: number
}

export type QualityKpis = {
  technicalDebtCreated: number
  technicalDebtResolved: number
  knowledgeUpdates: number
  documentationGenerated: number
  /**
   * Proxy metrics, not machine-learning-validated predictions — see
   * metricClassifier.ts's doc comment for the exact definition of each.
   * Documented here rather than implied, since "accuracy" without that
   * caveat would overstate what these measure.
   */
  assessmentAccuracyPercentage: number | null
  riskPredictionAccuracyPercentage: number | null
  /** A point-in-time gauge (completed batches / total batches), read directly from Planning state at snapshot time — see snapshotService.ts. Null outside a snapshot (the live/incremental KPI view has no "current batch list" to read without querying Planning directly, which processEvent deliberately never does). */
  planningAccuracyPercentage: number | null
}

export type ReliabilityKpis = {
  recoveryCount: number
  averageRecoveryDurationMs: number | null
  notificationFailures: number
  escalationFrequency: number
  schedulerCycles: number
  workerFailures: number
  retryCounts: number
  /** Wave 4 (Orphaned Event Category) — Autonomous Operations incident/rollback lifecycle, sourced from the 'Operations' DashboardEventCategory. */
  incidentsOpened: number
  incidentsResolved: number
  averageIncidentDurationMs: number | null
  rollbacksApproved: number
}

export type PerformanceKpis = {
  averagePlanningDurationMs: number | null
  averageAssessmentDurationMs: number | null
  averageWorkerDurationMs: number | null
  averageSchedulingDurationMs: number | null
  averageNotificationDurationMs: number | null
  averageEscalationDurationMs: number | null
}

export type TestingKpis = {
  testsExecuted: number
  testsPassed: number
  testsFailed: number
  regressionFailures: number
  averageExecutionDurationMs: number | null
}

export type MetricsKpis = {
  throughput: ThroughputKpis
  automation: AutomationKpis
  quality: QualityKpis
  reliability: ReliabilityKpis
  performance: PerformanceKpis
  testing: TestingKpis
}

/** One externally-reported test suite run — there is no in-app producer for "a test suite executed" (npm run test:director is a separate CLI invocation, not something the running server observes), so this is recorded through its own narrow ingestion function/route rather than derived from the DashboardEvent stream. */
export type TestRunInput = {
  executed: number
  passed: number
  failed: number
  regressionFailures: number
  durationMs: number
  timestamp?: string
}

export type TestRunRecord = TestRunInput & { id: string; timestamp: string }
