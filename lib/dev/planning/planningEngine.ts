import { DEFAULT_MILESTONES } from '../initializer/milestoneInitializer'
import { deriveWorkCandidates, buildDraftTask } from './planningModels'
import { prioritizeTasks, sortByPriority } from './planningPrioritizer'
import { estimateTaskComplexity, estimateTaskHours, estimatePlanEffort, formatDuration } from './planningEstimator'
import { validatePlan } from './planningValidator'
import type {
  ApprovalPackage,
  ApprovalStatus,
  EngineeringPlan,
  EngineeringTask,
  PlanningHistoryRecord,
  PlanningInput,
  PlanRisk,
  PlanRiskAssessment,
  RiskLevel,
} from './planningTypes'

/**
 * The Engineering Planning Engine — converts engineering knowledge
 * (Engineering Assessment, Director Recommendation, Current Engineering
 * Position, Engineering Organization, DNA, Learning, Repository Facts,
 * History) into an executable Engineering Plan. Every function in this
 * file is pure and read-only: nothing here writes to
 * milestonesStorage/batchesStorage/queueStorage, spawns a Runtime job,
 * or edits a repository. A plan's tasks default to Proposed and stay
 * there until a human explicitly approves them (applyHumanApprovalDecision) —
 * generating a plan is never itself an approval.
 */

function milestoneTitleAtSequence(seq: number): string | undefined {
  return DEFAULT_MILESTONES.find(m => m.sequence === seq)?.title
}

const RISK_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }

function buildRiskAssessment(input: PlanningInput, tasks: EngineeringTask[]): PlanRiskAssessment {
  const { assessment } = input

  const technical: PlanRisk = (() => {
    const worst = Math.min(assessment.scores.maintainability.score, assessment.scores.architecture.score)
    if (worst < 40) return { level: 'Critical', reason: `Maintainability ${assessment.scores.maintainability.score}/100, Architecture ${assessment.scores.architecture.score}/100 — both below 40.` }
    if (worst < 55) return { level: 'High', reason: `Maintainability ${assessment.scores.maintainability.score}/100, Architecture ${assessment.scores.architecture.score}/100.` }
    if (worst < 75) return { level: 'Medium', reason: `Maintainability ${assessment.scores.maintainability.score}/100, Architecture ${assessment.scores.architecture.score}/100.` }
    return { level: 'Low', reason: `Maintainability ${assessment.scores.maintainability.score}/100, Architecture ${assessment.scores.architecture.score}/100 — both healthy.` }
  })()

  const business: PlanRisk = (() => {
    const undocumented = [
      assessment.projectIntelligence.businessDomain === 'Not documented',
      assessment.projectIntelligence.technologyStack === 'Not documented',
    ].filter(Boolean).length
    if (!input.engineeringOrganizationReady) {
      return { level: 'High', reason: 'Engineering Organization is not yet initialized for this project — no roadmap/milestone structure to plan against.' }
    }
    if (undocumented === 2) return { level: 'Medium', reason: 'Business Domain and Technology Stack are both undocumented in Engineering DNA.' }
    if (undocumented === 1) return { level: 'Low', reason: 'One of Business Domain/Technology Stack is undocumented in Engineering DNA.' }
    return { level: 'Low', reason: 'Business Domain and Technology Stack are both recorded in Engineering DNA.' }
  })()

  const architecture: PlanRisk = (() => {
    const score = assessment.scores.architecture.score
    const violations = assessment.findings.filter(f => f.category === 'Architecture Violation').length
    if (violations > 0) return { level: 'High', reason: `${violations} Architecture Violation finding(s) in the Engineering Assessment.` }
    if (score < 55) return { level: 'Medium', reason: `Architecture score ${score}/100.` }
    return { level: 'Low', reason: `Architecture score ${score}/100, no Architecture Violation findings.` }
  })()

  const delivery: PlanRisk = (() => {
    if (assessment.build.buildStatus === 'Failing') return { level: 'Critical', reason: 'The last recorded build is failing.' }
    const lowConfidenceTasks = tasks.filter(t => t.priority === 'Low' && t.priorityReason.startsWith('Sequence violation')).length
    if (lowConfidenceTasks > 0) return { level: 'Medium', reason: `${lowConfidenceTasks} task(s) demoted for skipping ahead of the Engineering Sequence.` }
    if (input.learningSummary.totalExecutions === 0) return { level: 'Medium', reason: 'No historical execution data for this project — estimates are unvalidated.' }
    return { level: 'Low', reason: `Build is Passing; ${input.learningSummary.totalExecutions} historical execution(s) inform this plan's estimates.` }
  })()

  const worst = [technical, business, architecture, delivery].reduce((a, b) => (RISK_RANK[b.level] > RISK_RANK[a.level] ? b : a))
  const overall: PlanRisk = {
    level: worst.level,
    reason: `Overall risk is set by the highest individual risk — ${worst === technical ? 'Technical' : worst === business ? 'Business' : worst === architecture ? 'Architecture' : 'Delivery'}: ${worst.reason}`,
  }

  return { technical, business, architecture, delivery, overall }
}

let planCounter = 0
function nextPlanId(projectSlug: string): string {
  planCounter += 1
  return `plan_${projectSlug}_${Date.now()}_${planCounter}`
}

/**
 * Generates one Engineering Plan from already-assembled inputs — the
 * Planning Engine never fetches its own data. Task candidates come from
 * the Director's own escalations/accelerated work and the Assessment
 * Engine's own recommendations (planningModels.ts); nothing here
 * invents a candidate. Returns approvalStatus 'Proposed' always — a
 * plan is never self-approving.
 */
export function generateEngineeringPlan(input: PlanningInput): EngineeringPlan {
  const currentSequence = input.currentPosition.currentMilestoneSequence ?? 0

  const candidates = deriveWorkCandidates(input.assessment, input.directorStrategy)
  const drafts = candidates.map(c => buildDraftTask(input.projectSlug, c))
  const prioritized = prioritizeTasks(drafts, currentSequence)

  const tasks: EngineeringTask[] = drafts.map(draft => {
    const attrs = prioritized.get(draft.id)!
    const complexity = estimateTaskComplexity(draft, milestoneTitleAtSequence)
    const effort = estimateTaskHours(complexity, input.history)
    return {
      id: draft.id,
      title: draft.title,
      description: draft.description,
      reason: draft.reason,
      estimatedHours: effort.hours,
      complexity,
      dependencies: attrs.dependencies,
      priority: attrs.priority,
      priorityReason: attrs.priorityReason,
      status: 'Proposed',
      acceptanceCriteria: draft.acceptanceCriteria,
      engineeringSequence: draft.engineeringSequence,
      source: draft.source,
    }
  })

  const ranked = sortByPriority(tasks)
  const topTask = ranked[0] ?? null

  const objective = topTask?.title ?? input.directorStrategy?.currentStrategicGoal ?? 'No outstanding work identified by the Engineering Assessment or Engineering Director.'
  const reason = topTask?.reason ?? input.assessment.riskSummary
  const expectedOutcome = topTask
    ? topTask.acceptanceCriteria.map(c => c.text).join('; ') || `"${topTask.title}" is resolved.`
    : 'No change — nothing outstanding was identified.'

  const taskEffortEstimates = tasks.map(t => estimateTaskHours(t.complexity, input.history))
  const effort = estimatePlanEffort(taskEffortEstimates)
  const risk = buildRiskAssessment(input, tasks)

  const planDependencies = topTask ? topTask.dependencies : [{ relation: 'Independent' as const, target: 'None', reason: 'No task selected.' }]
  const acceptanceCriteria = topTask ? topTask.acceptanceCriteria : []

  const provisionalPlan: EngineeringPlan = {
    id: nextPlanId(input.projectSlug),
    projectSlug: input.projectSlug,
    projectName: input.projectName,
    generatedAt: new Date().toISOString(),
    objective,
    reason,
    expectedOutcome,
    complexity: effort.complexity,
    confidence: effort.confidence,
    estimatedDuration: formatDuration(effort.hours),
    riskLevel: risk.overall.level,
    dependencies: planDependencies,
    acceptanceCriteria,
    tasks: ranked,
    risk,
    effort,
    validation: { valid: true, issues: [] },
    approvalStatus: 'Proposed',
    directorReviewNote: null,
  }

  const validation = validatePlan(provisionalPlan, input.existingWorkTitles, input.facts)
  return { ...provisionalPlan, validation }
}

/**
 * The Director Review step of Planning Engine → Director Review → Human
 * Approval → Runtime. Mechanical, not a new judgment: a plan with any
 * validation issue is sent back (stays Proposed); a valid plan advances
 * to Director Reviewed, ready for a human to act on. Never advances a
 * plan to Approved itself — that is exclusively applyHumanApprovalDecision's job.
 */
export function reviewPlanAsDirector(plan: EngineeringPlan): EngineeringPlan {
  if (!plan.validation.valid) {
    return {
      ...plan,
      approvalStatus: 'Proposed',
      directorReviewNote: `Director Review blocked — ${plan.validation.issues.length} validation issue(s) must be resolved first: ${plan.validation.issues.map(i => i.type).join(', ')}.`,
    }
  }
  return {
    ...plan,
    approvalStatus: 'Director Reviewed',
    directorReviewNote: `Director Review passed — ${plan.tasks.length} task(s), overall risk ${plan.risk.overall.level}, no outstanding validation issues.`,
  }
}

/**
 * The Human Approval step — the only function in this engine allowed to
 * set approvalStatus to 'Approved' or 'Rejected', and only from
 * 'Director Reviewed'. Approving here still never touches the Runtime
 * or creates real project work; it only marks the plan/tasks eligible
 * for a future, separate execution step to pick up.
 */
export function applyHumanApprovalDecision(plan: EngineeringPlan, decision: 'Approved' | 'Rejected'): EngineeringPlan {
  if (plan.approvalStatus !== 'Director Reviewed') return plan
  return {
    ...plan,
    approvalStatus: decision,
    tasks: plan.tasks.map(t => ({ ...t, status: decision })),
  }
}

/** Exactly what moves to the Director — never more than this. */
export function buildApprovalPackage(plan: EngineeringPlan): ApprovalPackage {
  return {
    plan,
    directorRecommendation: plan.directorReviewNote ?? plan.reason,
    riskSummary: `${plan.risk.overall.level} — ${plan.risk.overall.reason}`,
    validation: plan.validation,
    readyForHumanApproval: plan.approvalStatus === 'Director Reviewed',
  }
}

/** The historical record Learning stores — execution/approval fields are filled in later by separate, explicit calls, never guessed here. */
export function buildPlanningHistoryRecord(plan: EngineeringPlan): PlanningHistoryRecord {
  return {
    id: `history_${plan.id}`,
    timestamp: plan.generatedAt,
    projectSlug: plan.projectSlug,
    plan,
    approvalResult: null,
    decidedBy: null,
    decidedAt: null,
    executionResult: 'NotExecuted',
    actualDurationHours: null,
    success: null,
    varianceHours: null,
  }
}

export function approvalStatusFromRecord(record: PlanningHistoryRecord): ApprovalStatus {
  return record.plan.approvalStatus
}
