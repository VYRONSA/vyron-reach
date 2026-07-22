import { randomUUID } from 'node:crypto'
import { appendKnowledgeRecord, listKnowledgeRecords, listAllKnowledgeRecords, queryKnowledgeRecords } from './knowledgeStore'
import * as planningStateService from '../planningState/planningStateService'
import { publish } from '../events/eventBus'
import type {
  KnowledgeRecordBase,
  KnowledgeSource,
  HandoverRecord,
  DecisionRecord,
  TechnicalDebtRecord,
  DebtPriority,
  RiskRecord,
  RiskSeverity,
  JournalRecord,
  MilestoneCompletionRecord,
  BatchCompletionRecord,
  VerificationRecord,
  VerificationActivityRecord,
  ReleaseRecord,
  ReleaseActivityRecord,
  IncidentRecord,
  OperationalCheckRecord,
  TimelineEvent,
  TimelineCategory,
} from './knowledgeTypes'

/**
 * The Knowledge Service — the ONLY writer for engineering history
 * (Version 2.0, Milestone 2.1). Every function here does exactly two
 * things: append the permanent domain record (via knowledgeStore.ts, on
 * the shared atomic fileJsonStore primitives), and append a matching
 * Project Timeline entry — so the timeline can never drift out of sync
 * with the domain records it summarizes, because nothing ever writes one
 * without the other. For the three domains that already have a
 * current-state equivalent in the Planning Service (Decisions/Risks/
 * Technical Debt — "what is this item's status right now"), the Knowledge
 * Service also mirrors a current-state entity there; the Knowledge
 * Service's own record remains the permanent, immutable historical fact
 * regardless of how that current-state entity is later edited.
 *
 * ExecutionSnapshot is no longer written to for any of this — see
 * lib/dev/director/serverExecutionLoop.ts, which now calls this service
 * directly wherever it used to push onto snapshot.completions.
 */

type CommonFields = {
  project: string
  batchId?: string | null
  milestoneId?: string | null
  runtimeJobId?: string | null
  source?: KnowledgeSource
}

function base(input: CommonFields): KnowledgeRecordBase {
  return {
    id: randomUUID(),
    project: input.project,
    timestamp: new Date().toISOString(),
    batchId: input.batchId ?? null,
    milestoneId: input.milestoneId ?? null,
    runtimeJobId: input.runtimeJobId ?? null,
    source: input.source ?? 'Manual',
  }
}

export type RecordTimelineEventInput = CommonFields & {
  category: TimelineCategory
  title: string
  detail: string
}

/** Every domain-recording function below (recordHandover, recordArchitectureDecision, ...) routes through timelineFor -> here, making this the single choke point for publishing 'Knowledge Updates' events across the whole Knowledge Service. */
export function recordTimelineEvent(input: RecordTimelineEventInput): TimelineEvent {
  const record: TimelineEvent = { ...base(input), category: input.category, title: input.title, detail: input.detail }
  const result = appendKnowledgeRecord('timeline', record)
  // batchId/milestoneId were already parameters of `input` (CommonFields)
  // before this milestone — carrying them into the payload is exposing
  // data this function already has in hand, not new calculation.
  // Production Validation 2.1 Milestone 2.1.2's Certification Service
  // needs it to correlate a Knowledge event back to the specific feature
  // (batch) it happened during.
  publish({
    category: 'Knowledge Updates',
    project: input.project,
    type: 'timeline-event-recorded',
    payload: { timelineCategory: input.category, title: input.title, batchId: input.batchId ?? null, milestoneId: input.milestoneId ?? null },
  })
  return result
}

function timelineFor(record: KnowledgeRecordBase, category: TimelineCategory, title: string, detail: string): void {
  recordTimelineEvent({ ...record, category, title, detail })
}

// ---- Engineering Handover ----

export type RecordHandoverInput = CommonFields & {
  phase: string
  objective: string
  executiveSummary: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  buildStatus: string
  typescriptStatus: string
  gitDiffSummary?: string | null
  knowledgeSourcesConsulted?: string[]
  knowledgeGapSources?: string[]
}

export function recordHandover(input: RecordHandoverInput): HandoverRecord {
  const record: HandoverRecord = {
    ...base(input),
    phase: input.phase,
    objective: input.objective,
    executiveSummary: input.executiveSummary,
    filesCreated: input.filesCreated,
    filesModified: input.filesModified,
    filesDeleted: input.filesDeleted,
    buildStatus: input.buildStatus,
    typescriptStatus: input.typescriptStatus,
    gitDiffSummary: input.gitDiffSummary ?? null,
    knowledgeSourcesConsulted: input.knowledgeSourcesConsulted ?? [],
    knowledgeGapSources: input.knowledgeGapSources ?? [],
  }
  appendKnowledgeRecord('handovers', record)
  timelineFor(record, 'Handover', `Handover: ${input.objective || 'Batch executed'}`, input.executiveSummary)
  return record
}

export function listHandovers(project: string): HandoverRecord[] {
  return listKnowledgeRecords('handovers', project)
}

// ---- Architecture / Business Decisions ----

export type RecordDecisionInput = CommonFields & {
  decision: string
  reason?: string
  alternatives?: string
}

export function recordArchitectureDecision(input: RecordDecisionInput): DecisionRecord {
  const record: DecisionRecord = {
    ...base(input),
    decision: input.decision,
    reason: input.reason ?? '',
    alternatives: input.alternatives ?? '',
  }
  appendKnowledgeRecord('architectureDecisions', record)
  timelineFor(record, 'Architecture Decision', input.decision, input.reason ?? '')

  planningStateService.createDecision(input.project, {
    decision: input.decision,
    reason: input.reason || 'Recorded automatically from an execution report.',
    alternatives: input.alternatives ?? '',
    approvedDate: record.timestamp.slice(0, 10),
    status: 'Approved',
    relatedBatch: input.batchId ?? undefined,
    relatedMilestone: input.milestoneId ?? undefined,
  })

  return record
}

export function recordBusinessDecision(input: RecordDecisionInput): DecisionRecord {
  const record: DecisionRecord = {
    ...base(input),
    decision: input.decision,
    reason: input.reason ?? '',
    alternatives: input.alternatives ?? '',
  }
  appendKnowledgeRecord('businessDecisions', record)
  timelineFor(record, 'Business Decision', input.decision, input.reason ?? '')

  planningStateService.createDecision(input.project, {
    decision: input.decision,
    reason: input.reason || 'Business decision recorded.',
    alternatives: input.alternatives ?? '',
    approvedDate: record.timestamp.slice(0, 10),
    status: 'Approved',
    relatedBatch: input.batchId ?? undefined,
    relatedMilestone: input.milestoneId ?? undefined,
  })

  return record
}

export function listArchitectureDecisions(project: string): DecisionRecord[] {
  return listKnowledgeRecords('architectureDecisions', project)
}

export function listBusinessDecisions(project: string): DecisionRecord[] {
  return listKnowledgeRecords('businessDecisions', project)
}

// ---- Technical Debt ----

export type RecordTechnicalDebtInput = CommonFields & {
  title: string
  description?: string
  priority?: DebtPriority
}

export function recordTechnicalDebt(input: RecordTechnicalDebtInput): TechnicalDebtRecord {
  const priority = input.priority ?? 'Medium'
  const record: TechnicalDebtRecord = {
    ...base(input),
    title: input.title,
    description: input.description ?? '',
    priority,
  }
  appendKnowledgeRecord('technicalDebt', record)
  timelineFor(record, 'Technical Debt', input.title, input.description ?? '')

  planningStateService.createTechnicalDebt(input.project, {
    title: input.title,
    description: input.description ?? '',
    relatedBatch: input.batchId ?? undefined,
    priority,
    estimatedEffort: 'Unknown',
    createdDate: record.timestamp.slice(0, 10),
    resolvedDate: '',
    status: 'Open',
  })

  return record
}

export function listTechnicalDebt(project: string): TechnicalDebtRecord[] {
  return listKnowledgeRecords('technicalDebt', project)
}

// ---- Risk Register ----

export type RecordRiskInput = CommonFields & {
  title: string
  description?: string
  severity?: RiskSeverity
}

export function recordRisk(input: RecordRiskInput): RiskRecord {
  const severity = input.severity ?? 'Medium'
  const record: RiskRecord = {
    ...base(input),
    title: input.title,
    description: input.description ?? '',
    severity,
  }
  appendKnowledgeRecord('risks', record)
  timelineFor(record, 'Risk', input.title, input.description ?? '')

  planningStateService.createRisk(input.project, {
    title: input.title,
    description: input.description ?? '',
    relatedMilestone: input.milestoneId ?? undefined,
    severity,
    probability: 'Medium',
    mitigation: '',
    owner: 'Unassigned',
    status: 'Open',
  })

  return record
}

export function listRisks(project: string): RiskRecord[] {
  return listKnowledgeRecords('risks', project)
}

// ---- Engineering Journal ----

export type AppendJournalInput = CommonFields & {
  summary: string
  wins?: string
  problems?: string
  ideas?: string
  nextActions?: string
}

export function appendJournalEntry(input: AppendJournalInput): JournalRecord {
  const record: JournalRecord = {
    ...base(input),
    summary: input.summary,
    wins: input.wins ?? '',
    problems: input.problems ?? '',
    ideas: input.ideas ?? '',
    nextActions: input.nextActions ?? '',
  }
  appendKnowledgeRecord('journal', record)
  timelineFor(record, 'Journal', 'Journal entry', input.summary)
  return record
}

export function listJournalEntries(project: string): JournalRecord[] {
  return listKnowledgeRecords('journal', project)
}

// ---- Milestone Completion History ----

export type RecordMilestoneCompletionInput = CommonFields & {
  milestoneId: string
  milestoneTitle: string
  phase: string
}

export function recordMilestoneCompletion(input: RecordMilestoneCompletionInput): MilestoneCompletionRecord {
  const record: MilestoneCompletionRecord = {
    ...base(input),
    milestoneId: input.milestoneId,
    milestoneTitle: input.milestoneTitle,
    phase: input.phase,
  }
  appendKnowledgeRecord('milestoneCompletions', record)
  timelineFor(record, 'Milestone Completed', input.milestoneTitle, `Phase: ${input.phase}`)
  return record
}

export function listMilestoneCompletions(project: string): MilestoneCompletionRecord[] {
  return listKnowledgeRecords('milestoneCompletions', project)
}

// ---- Batch Completion History ----

export type RecordBatchCompletionInput = CommonFields & {
  batchId: string
  batchNumber: string
  objective: string
  summary: string
}

export function recordBatchCompletion(input: RecordBatchCompletionInput): BatchCompletionRecord {
  const record: BatchCompletionRecord = {
    ...base(input),
    batchNumber: input.batchNumber,
    objective: input.objective,
    summary: input.summary,
  }
  appendKnowledgeRecord('batchCompletions', record)
  timelineFor(record, 'Batch Completed', `Batch ${input.batchNumber}`, input.summary)
  return record
}

export function listBatchCompletions(project: string): BatchCompletionRecord[] {
  return listKnowledgeRecords('batchCompletions', project)
}

// ---- Autonomous Quality Assurance — Verification History ----

export type RecordVerificationInput = CommonFields & {
  passed: boolean
  durationMs: number
  activities: VerificationActivityRecord[]
}

/** Recorded for EVERY verification run, passed or failed — a failure is as durably learnable-from as a success (same reasoning as Historical Fixes knowledge). */
export function recordVerification(input: RecordVerificationInput): VerificationRecord {
  const record: VerificationRecord = {
    ...base(input),
    passed: input.passed,
    durationMs: input.durationMs,
    activities: input.activities,
  }
  appendKnowledgeRecord('verifications', record)
  const failed = input.activities.filter(a => a.status === 'Failed')
  timelineFor(
    record,
    'Verification',
    input.passed ? 'Verification passed' : 'Verification failed',
    input.passed
      ? `${input.activities.length} activit${input.activities.length === 1 ? 'y' : 'ies'} evaluated.`
      : failed.map(a => `${a.activity}: ${a.summary}`).join(' | ')
  )
  return record
}

export function listVerifications(project: string): VerificationRecord[] {
  return listKnowledgeRecords('verifications', project)
}

// ---- Autonomous Release Management — Release Audit History ----

export type RecordReleaseInput = CommonFields & {
  version: string
  passed: boolean
  durationMs: number
  activities: ReleaseActivityRecord[]
}

/** Recorded for EVERY release execution, passed or failed — a failed release is as durably learnable-from as a successful one. */
export function recordRelease(input: RecordReleaseInput): ReleaseRecord {
  const record: ReleaseRecord = {
    ...base(input),
    version: input.version,
    passed: input.passed,
    durationMs: input.durationMs,
    activities: input.activities,
  }
  appendKnowledgeRecord('releases', record)
  const failed = input.activities.filter(a => a.status === 'Failed')
  timelineFor(
    record,
    'Release',
    input.passed ? `Release v${input.version} released` : `Release v${input.version} failed`,
    input.passed
      ? `${input.activities.length} activit${input.activities.length === 1 ? 'y' : 'ies'} evaluated.`
      : failed.map(a => `${a.activity}: ${a.summary}`).join(' | ')
  )
  return record
}

export function listReleases(project: string): ReleaseRecord[] {
  return listKnowledgeRecords('releases', project)
}

// ---- Autonomous Operations — Operational Audit History ----

export type RecordIncidentInput = CommonFields & {
  severity: string
  resolved: boolean
  durationMs: number
  checks: OperationalCheckRecord[]
  review: string
}

/** Recorded once an incident is resolved — a long-lived entity's full lifecycle captured in retrospect, not a per-cycle write. */
export function recordIncident(input: RecordIncidentInput): IncidentRecord {
  const record: IncidentRecord = {
    ...base(input),
    severity: input.severity,
    resolved: input.resolved,
    durationMs: input.durationMs,
    checks: input.checks,
    review: input.review,
  }
  appendKnowledgeRecord('incidents', record)
  timelineFor(record, 'Operations', `Incident resolved (${input.severity})`, input.review)
  return record
}

export function listIncidents(project: string): IncidentRecord[] {
  return listKnowledgeRecords('incidents', project)
}

// ---- Project Timeline (read side) ----

export function listTimeline(project: string): TimelineEvent[] {
  return listKnowledgeRecords('timeline', project)
}

export function listAllTimelineEvents(): TimelineEvent[] {
  return listAllKnowledgeRecords('timeline')
}

/** Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — paginated/filtered/searched Timeline access, built on knowledgeStore.ts's generic queryKnowledgeRecords. */
export function queryTimeline(
  project: string,
  filter: { dateRange?: { from?: string; to?: string }; search?: string } = {},
  page: { page?: number; pageSize?: number } = {}
) {
  return queryKnowledgeRecords<TimelineEvent>('timeline', project, filter, page, e => `${e.category} ${e.title} ${e.detail}`)
}
