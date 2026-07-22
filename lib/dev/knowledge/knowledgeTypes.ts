/**
 * The Server Knowledge Engine (Version 2.0, Milestone 2.1) — permanent,
 * append-only engineering records. Distinct from the Planning Service
 * (lib/dev/planningState/), which owns CURRENT mutable state ("what is
 * this risk's status right now"); the Knowledge Service owns the
 * historical record ("a risk was identified, on this date, in this
 * batch") — a fact that stays true forever even if the current-state
 * entity is later edited or deleted. Every domain here is write-once,
 * never mutated or deleted once recorded, and never capped/truncated —
 * "Historical records are never lost" is a hard requirement, not a
 * best-effort one (contrast with lib/dev/director/directorHistoryStore.ts,
 * an operational debug log that IS deliberately capped, and stays that
 * way — it is not an engineering-knowledge domain).
 */

export type KnowledgeSource = 'Headless' | 'Attended' | 'Manual'

export type KnowledgeRecordBase = {
  id: string
  project: string
  timestamp: string
  batchId: string | null
  milestoneId: string | null
  runtimeJobId: string | null
  source: KnowledgeSource
}

export type HandoverRecord = KnowledgeRecordBase & {
  phase: string
  objective: string
  executiveSummary: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  buildStatus: string
  typescriptStatus: string
  gitDiffSummary: string | null
  /**
   * Engineering Intelligence attribution (requirement: "every AI output
   * shall record which knowledge sources influenced the result") — every
   * KnowledgeItem.sourceRef actually included in this batch's Engineering
   * Context. Defaults to `[]` for any caller that doesn't supply it (the
   * browser-attended path, simulations) — never required, never backfilled.
   */
  knowledgeSourcesConsulted: string[]
  /** The companion fact for requirement 7 — every knowledge source category that had nothing relevant for this batch, recorded rather than silently omitted. */
  knowledgeGapSources: string[]
}

/** Architecture Decisions and Business Decisions are recorded through two separate domains/stores (matching the mission's explicit separation), sharing this one shape. */
export type DecisionRecord = KnowledgeRecordBase & {
  decision: string
  reason: string
  alternatives: string
}

export type DebtPriority = 'Low' | 'Medium' | 'High'
export type TechnicalDebtRecord = KnowledgeRecordBase & {
  title: string
  description: string
  priority: DebtPriority
}

export type RiskSeverity = 'Low' | 'Medium' | 'High'
export type RiskRecord = KnowledgeRecordBase & {
  title: string
  description: string
  severity: RiskSeverity
}

export type JournalRecord = KnowledgeRecordBase & {
  summary: string
  wins: string
  problems: string
  ideas: string
  nextActions: string
}

export type MilestoneCompletionRecord = KnowledgeRecordBase & {
  milestoneTitle: string
  phase: string
}

export type BatchCompletionRecord = KnowledgeRecordBase & {
  batchNumber: string
  objective: string
  summary: string
}

/**
 * One Autonomous Quality Assurance run — recorded permanently regardless
 * of outcome (a failed run is as durably learnable-from as a passed
 * one, same reasoning as this codebase's Historical Fixes knowledge).
 * `activities` is the same structured
 * VerificationActivityResult[] shape the pipeline itself produces
 * (lib/dev/director/qualityAssurance/qualityAssuranceTypes.ts) —
 * duplicated here as a plain JSON-safe shape rather than imported, so
 * the Knowledge Service (a foundational, dependency-light module) never
 * needs to import from the Director layer that depends on it.
 */
export type VerificationActivityRecord = {
  activity: string
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Skipped'
  summary: string
}

export type VerificationRecord = KnowledgeRecordBase & {
  passed: boolean
  durationMs: number
  activities: VerificationActivityRecord[]
}

/**
 * One Autonomous Release Management execution — recorded permanently
 * regardless of outcome, same reasoning as VerificationRecord above.
 * `activities` mirrors VerificationActivityRecord's shape (a plain,
 * JSON-safe duplicate of the Director layer's own
 * ReleaseActivityResult, not an import of it — same layering reason:
 * this foundational module never depends on the Director layer above it).
 */
export type ReleaseActivityRecord = {
  activity: string
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Skipped'
  summary: string
}

export type ReleaseRecord = KnowledgeRecordBase & {
  version: string
  passed: boolean
  durationMs: number
  activities: ReleaseActivityRecord[]
}

/**
 * One resolved Autonomous Operations incident — recorded once, at
 * resolution, capturing the full lifecycle in retrospect (an Incident
 * is a long-lived, stateful entity unlike a one-shot Verification/
 * Release run, so recording happens when it's actually over, not per
 * monitoring cycle). `checks` mirrors OperationalCheckResult's shape as
 * a plain JSON-safe duplicate, same layering reason as
 * VerificationActivityRecord/ReleaseActivityRecord above.
 */
export type OperationalCheckRecord = {
  check: string
  status: 'Healthy' | 'Degraded' | 'Down' | 'Not Applicable' | 'Skipped'
  summary: string
}

export type IncidentRecord = KnowledgeRecordBase & {
  severity: string
  resolved: boolean
  durationMs: number
  checks: OperationalCheckRecord[]
  review: string
}

export type TimelineCategory =
  | 'Handover'
  | 'Architecture Decision'
  | 'Business Decision'
  | 'Technical Debt'
  | 'Risk'
  | 'Journal'
  | 'Milestone Completed'
  | 'Batch Completed'
  /** Version 2.0 Milestone 2.2 — logged by lib/dev/director/liveKnowledgeRefresh.ts every time a Director run's engineering context is reloaded at a synchronization boundary. */
  | 'Knowledge Refresh'
  /** Autonomous Quality Assurance — logged by knowledgeService.recordVerification for every verification run, passed or failed. */
  | 'Verification'
  /** Autonomous Release Management — logged by knowledgeService.recordRelease/recordTimelineEvent for release preparation and execution. */
  | 'Release'
  /** Autonomous Operations — logged by knowledgeService.recordIncident for every resolved operational incident. */
  | 'Operations'

export type TimelineEvent = KnowledgeRecordBase & {
  category: TimelineCategory
  title: string
  detail: string
}

/** What a caller supplies — the service assigns id/timestamp, never the caller (keeps every record's identity and ordering authoritatively server-owned). */
export type RecordInput<T extends KnowledgeRecordBase> = Omit<T, 'id' | 'timestamp'>
