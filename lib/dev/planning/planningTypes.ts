import type { AssessmentReport } from '../assessment/assessmentTypes'
import type { RepositoryFacts } from '../assessment/assessmentModels'
import type { DNAProfileFields } from '../initializer/initializerTypes'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import type { ExecutionAnalyticsSummary } from '../learning/executionAnalytics'

/**
 * Shared types for the Engineering Planning Engine. This engine prepares
 * work for approval — it never writes to milestonesStorage,
 * batchesStorage, queueStorage, or the Runtime. An EngineeringPlan and
 * its EngineeringTasks are a distinct, self-contained record (persisted
 * only by planningRepository.ts) until a human approves one; nothing
 * here creates a real Milestone/Batch/Task as a side effect of planning.
 */

export type Complexity = 'Low' | 'Medium' | 'High'
export type Confidence = 'High' | 'Medium' | 'Low'
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type TaskStatus = 'Proposed' | 'Approved' | 'Rejected'
export type DependencyRelation = 'Requires' | 'Blocks' | 'Independent'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type ApprovalStatus = 'Proposed' | 'Director Reviewed' | 'Approved' | 'Rejected'

export type TaskDependency = {
  relation: DependencyRelation
  /** The other task's title, or a milestone/engineering-sequence name when the dependency isn't on another task in this plan. */
  target: string
  reason: string
}

/** Measurable only — a pass/fail condition someone can literally check, never a vague aspiration. */
export type AcceptanceCriterion = {
  text: string
}

/** Task shape before priority/dependencies (planningPrioritizer.ts) and effort (planningEstimator.ts) are attached. */
export type DraftEngineeringTask = {
  id: string
  title: string
  description: string
  reason: string
  status: TaskStatus
  acceptanceCriteria: AcceptanceCriterion[]
  engineeringSequence: number | null
  source: string
  /** The priority the candidate's own source (Director escalation/acceleration) already assigned, if any — the Prioritizer defers to this before applying its own sequence-based rules. */
  sourceSeverity: TaskPriority | null
}

export type EngineeringTask = {
  id: string
  title: string
  description: string
  reason: string
  estimatedHours: number
  complexity: Complexity
  dependencies: TaskDependency[]
  priority: TaskPriority
  priorityReason: string
  status: TaskStatus
  acceptanceCriteria: AcceptanceCriterion[]
  /** Position in the canonical Engineering Sequence (lib/dev/initializer/milestoneInitializer.ts's DEFAULT_MILESTONES) this task maps to, or null if it doesn't correspond to a named milestone. */
  engineeringSequence: number | null
  /** Where this task's candidate came from — an Assessment recommendation category, or the Director's strategy/sprint. */
  source: string
}

export type RiskCategory = 'Technical' | 'Business' | 'Architecture' | 'Delivery'

export type PlanRisk = {
  level: RiskLevel
  reason: string
}

export type PlanRiskAssessment = {
  technical: PlanRisk
  business: PlanRisk
  architecture: PlanRisk
  delivery: PlanRisk
  overall: PlanRisk
}

export type EffortEstimate = {
  hours: number
  complexity: Complexity
  confidence: Confidence
  assumptions: string[]
}

export type ValidationIssueType =
  | 'Missing Dependency'
  | 'Duplicate Work'
  | 'Architecture Conflict'
  | 'Invalid Engineering Order'
  | 'Missing Acceptance Criteria'
  | 'Missing Objective'

export type ValidationIssue = {
  type: ValidationIssueType
  description: string
  taskId: string | null
}

export type PlanValidationResult = {
  valid: boolean
  issues: ValidationIssue[]
}

export type EngineeringPlan = {
  id: string
  projectSlug: string
  projectName: string
  generatedAt: string
  objective: string
  reason: string
  expectedOutcome: string
  complexity: Complexity
  confidence: Confidence
  estimatedDuration: string
  riskLevel: RiskLevel
  dependencies: TaskDependency[]
  acceptanceCriteria: AcceptanceCriterion[]
  tasks: EngineeringTask[]
  risk: PlanRiskAssessment
  effort: EffortEstimate
  validation: PlanValidationResult
  approvalStatus: ApprovalStatus
  directorReviewNote: string | null
}

/** Exactly what moves from the Planning Engine to the Director, then to the human — never more than this. */
export type ApprovalPackage = {
  plan: EngineeringPlan
  directorRecommendation: string
  riskSummary: string
  validation: PlanValidationResult
  readyForHumanApproval: boolean
}

/** One historical record — Learning's input for calibrating future estimates. Execution/approval fields start unset and are updated later, never guessed at plan-generation time. */
export type PlanningHistoryRecord = {
  id: string
  timestamp: string
  projectSlug: string
  plan: EngineeringPlan
  approvalResult: ApprovalStatus | null
  /** PRA-P1-009: who recorded approvalResult, populated from currentDevActor() at decision time — null until a decision is actually recorded, mirroring ReleaseControlDecision's/RiskGateDecision's attribution. */
  decidedBy: string | null
  /** PRA-P1-009: when approvalResult was recorded — distinct from `timestamp` above, which reflects plan generation, not the approval decision. */
  decidedAt: string | null
  executionResult: 'Succeeded' | 'Failed' | 'NotExecuted'
  actualDurationHours: number | null
  success: boolean | null
  /** actualDurationHours - plan.effort.hours; null until execution is recorded. */
  varianceHours: number | null
}

export type CurrentEngineeringPosition = {
  currentPhase: string
  currentMilestoneTitle: string | null
  currentMilestoneSequence: number | null
  currentBatchNumber: string | null
}

/** Every input the Planning Engine is allowed to consume — nothing here is fetched or invented by the engine itself. */
export type PlanningInput = {
  projectSlug: string
  projectName: string
  assessment: AssessmentReport
  directorStrategy: ExecutiveEngineeringStrategy | null
  currentPosition: CurrentEngineeringPosition
  engineeringOrganizationReady: boolean
  dnaProfile: DNAProfileFields | null
  learningSummary: ExecutionAnalyticsSummary
  facts: RepositoryFacts
  history: PlanningHistoryRecord[]
  /** Titles already tracked as real work (open queue tasks, active batches) — the Duplicate Work check's only source of truth. */
  existingWorkTitles: string[]
}

/** One deduplicated unit of candidate work, before it becomes a task — the shared shape both Assessment recommendations and Director sprint items reduce to. */
export type WorkCandidate = {
  title: string
  description: string
  reason: string
  source: string
  sourceSeverity: TaskPriority | null
}
