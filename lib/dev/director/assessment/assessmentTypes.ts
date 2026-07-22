/**
 * The Headless Engineering Assessment Engine (Version 2.0, Milestone 2.3)
 * — types for the Assessment Service, the ONLY producer of Quality
 * Gates, Risk Assessment, and Engineering Health. Distinct from
 * lib/dev/assessment/ (an older, unrelated repository-facts/code-quality
 * engine, still browser-attended, still used by EngineeringAssessmentPanel.tsx
 * — different concept, deliberately not touched or merged here) and from
 * lib/dev/operations/qualityGateEngine.ts + riskAssessmentEngine.ts (an
 * older browser-attended pipeline scored off an AI-generated
 * ExecutiveEngineeringReport, which is not something headless server
 * code can produce — this module checks genuinely different signals,
 * all derivable from durable server state alone).
 */

export type GateStatus = 'Passing' | 'Failing' | 'Unknown'

export type QualityGateName =
  | 'Build Status'
  | 'TypeScript Status'
  | 'Test Status'
  | 'Planning Consistency'
  | 'Dependency Consistency'
  | 'Completion Consistency'
  | 'Execution Health'

export type QualityGateResult = {
  gate: QualityGateName
  status: GateStatus
  /** Always populated, even when Passing — the concrete fact the gate checked, e.g. "1 Active batch, 0 orphaned dependencies." Never fabricated: reflects exactly what was read from durable state. */
  detail: string
}

export type QualityGateReport = {
  gates: QualityGateResult[]
  passing: number
  failing: number
  unknown: number
}

export type RiskLevel = 'Low' | 'Medium' | 'High'

export type RiskFactorName =
  | 'Open Risks'
  | 'Risk Severity'
  | 'Blocked Milestones'
  | 'Stalled Batches'
  | 'Technical Debt Growth'
  | 'Repeated Failures'
  | 'Recovery Frequency'
  | 'Outstanding CEO Decisions'

export type RiskFactor = {
  factor: RiskFactorName
  level: RiskLevel
  detail: string
}

export type RiskAssessment = {
  factors: RiskFactor[]
  /** The worst (highest) factor level, not an average — one severe factor makes the whole project risky, the same rule lib/dev/operations/riskAssessmentEngine.ts already established. */
  overall: RiskLevel
}

export type EngineeringHealth = 'Healthy' | 'Attention Required' | 'At Risk' | 'Critical'

/**
 * The full, deterministic content of one assessment — everything in this
 * type must be a pure function of `AssessmentInput`: running
 * computeAssessment() twice against byte-identical input must produce a
 * byte-identical EngineeringAssessment. No timestamps, no random ids, no
 * browser state anywhere in this type or its nested types.
 */
export type EngineeringAssessment = {
  project: string
  qualityGates: QualityGateReport
  riskAssessment: RiskAssessment
  engineeringHealth: EngineeringHealth
  /**
   * The Knowledge Service technical-debt record count this assessment was
   * computed against — carried on the output (not just described in
   * riskAssessment's prose) specifically so the NEXT assessment can read
   * it back as its own durable "growth" baseline (see assessmentGather.ts)
   * without ever touching a wall clock or parsing text.
   */
  technicalDebtBaseline: number
}

/**
 * The durable-state snapshot every evaluator reads instead of touching
 * Planning/Knowledge/Runtime/Director stores directly — gathered once per
 * synchronization boundary by assessmentGather.ts. Two assessments run
 * against an AssessmentInput with identical field values (deep-equal)
 * are required to produce identical EngineeringAssessment output.
 */
export type AssessmentInput = {
  project: string

  // Already-computed signals (never re-run inside the assessment itself —
  // Milestone 2.3 requires no subprocess execution / non-determinism here).
  buildStatus: GateStatus
  typescriptStatus: GateStatus

  // Planning Service (current state)
  totalMilestones: number
  blockedMilestoneIds: string[]
  totalBatches: number
  activeBatchIds: string[]
  orphanedBatchIds: string[]
  /** Dependency edges whose fromId/toId no longer resolves to an existing milestone or batch. */
  danglingDependencyIds: string[]
  completedBatchIds: string[]
  completedMilestoneIds: string[]

  // Knowledge Service (permanent record)
  batchCompletionRecordedIds: string[]
  milestoneCompletionRecordedIds: string[]
  technicalDebtRecordCount: number
  /**
   * From the immediately preceding assessment's own recorded
   * technicalDebtBaseline, if one exists — the explicit, durable
   * (non-wall-clock) baseline "growth" is measured against. For a
   * project's very first assessment, this equals technicalDebtRecordCount
   * itself (zero delta) rather than a distinct null/sentinel value — a
   * sentinel would make the very first assessment's content permanently
   * differ from an otherwise-identical later one with truly zero change,
   * which would violate "assessment changes only when engineering state
   * changes."
   */
  previousTechnicalDebtRecordCount: number

  // Current-state Risk Register (Planning Service)
  openRiskSeverities: RiskLevel[]

  // Runtime job store
  /** Most recent jobs first, already limited to a fixed window (see assessmentGather.ts) — a fixed window size keeps this deterministic regardless of total job history length. */
  recentJobStatuses: string[]
  /** True when the currently Active batch's most recent job (if any) ended Failed or Cancelled — i.e. the last attempt at it did not succeed. */
  activeBatchLastJobFailed: boolean

  // Director history (operational log)
  recoveryEventCount: number

  // Engineering Inbox
  openInboxCount: number

  // Director Runtime state
  directorState: string
}
