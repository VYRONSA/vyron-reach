import type { EngineeringPlan, EngineeringTask, ValidationIssue, ValidationIssueType } from './planningTypes'

/**
 * Presentation layer only — DEF-003. Translates the validation engine's
 * already-computed output (planningValidator.ts's ValidationIssue) into
 * Executive-readable language. This module never decides whether a plan
 * is valid: it reads `issue.type`/`issue.description`/`issue.taskId` and
 * the plan's own already-computed tasks, and formats them. The raw
 * validator text is preserved verbatim in `technicalDetails` — nothing
 * here rewrites or re-derives what the validator already concluded, so
 * there is exactly one source of truth for "is this plan valid" (the
 * validator itself, untouched) and exactly one source of truth for "what
 * did the validator say" (technicalDetails, a passthrough).
 */

export type ValidationSeverity = 'Critical' | 'High' | 'Medium'

export type ExecutiveValidationExplanation = {
  issueType: ValidationIssueType
  /** Human label for the Validation Rule field — currently identical to issueType, kept distinct so report copy can diverge from the type name without touching planningTypes.ts. */
  validationRule: string
  severity: ValidationSeverity
  executiveSummary: string
  rootCause: string
  impact: string
  /** Report-level "why execution was blocked" — the specific root cause plus the standing governance rule, not a new rule of its own. */
  whyExecutionWasBlocked: string
  recommendedAction: string
  affectedTasks: { id: string; title: string; engineeringSequence: number | null }[]
  evidence: string[]
  /** Verbatim issue.description — the exact text an engineer already sees today. */
  technicalDetails: string
}

const VALIDATION_RULE_LABEL: Record<ValidationIssueType, string> = {
  'Missing Objective': 'Missing Objective',
  'Missing Acceptance Criteria': 'Missing Acceptance Criteria',
  'Duplicate Work': 'Duplicate Work',
  'Missing Dependency': 'Missing Dependency',
  'Invalid Engineering Order': 'Invalid Engineering Order',
  'Architecture Conflict': 'Architecture Conflict',
}

const SEVERITY_BY_TYPE: Record<ValidationIssueType, ValidationSeverity> = {
  'Missing Objective': 'Critical',
  'Architecture Conflict': 'Critical',
  'Invalid Engineering Order': 'High',
  'Missing Dependency': 'High',
  'Duplicate Work': 'Medium',
  'Missing Acceptance Criteria': 'Medium',
}

const GOVERNANCE_NOTE = 'The Engineering Director will not advance this plan past Director Review — and no human can approve it — while this issue is open.'

function findTask(plan: EngineeringPlan, taskId: string | null): EngineeringTask | null {
  if (!taskId) return null
  return plan.tasks.find(t => t.id === taskId) ?? null
}

function affectedTasksFor(task: EngineeringTask | null): ExecutiveValidationExplanation['affectedTasks'] {
  if (!task) return []
  return [{ id: task.id, title: task.title, engineeringSequence: task.engineeringSequence }]
}

function explainMissingObjective(): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  return {
    executiveSummary: 'The plan does not state the business objective it is meant to achieve.',
    rootCause: 'No objective was provided when this Engineering Plan was generated.',
    impact: 'Without a stated objective, this plan cannot be evaluated for business value or prioritized against other initiatives.',
    recommendedAction: 'Return to Planning and provide a clear statement of the objective this plan is meant to achieve, then resubmit for Director Review.',
    evidence: [],
  }
}

function explainMissingAcceptanceCriteria(task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  if (task) {
    return {
      executiveSummary: `Task "${task.title}" has no way to confirm it was completed successfully.`,
      rootCause: `No acceptance criteria were defined for task "${task.title}".`,
      impact: 'This task could be marked done without any measurable proof it actually achieved its intended result.',
      recommendedAction: `Add at least one specific, checkable acceptance criterion to "${task.title}", then resubmit the plan.`,
      evidence: [`Task: "${task.title}"`, `Engineering Sequence position: ${task.engineeringSequence ?? 'Unmapped'}`],
    }
  }
  return {
    executiveSummary: 'The plan as a whole has no way to confirm it was completed successfully.',
    rootCause: 'No plan-level acceptance criteria were defined.',
    impact: "There is no measurable definition of \"done\" for this plan overall.",
    recommendedAction: 'Add at least one specific, checkable acceptance criterion for the plan, then resubmit.',
    evidence: [],
  }
}

function explainDuplicateWork(task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  const title = task?.title ?? 'A task in this plan'
  return {
    executiveSummary: `${title} duplicates work that is already tracked elsewhere.`,
    rootCause: 'The Planning Engine found this task\'s title matching already-tracked work — either open work already in progress, or another task within this same plan.',
    impact: 'Approving this as-is would commit engineering time twice to the same outcome, wasting capacity that could go to new work.',
    recommendedAction: 'Remove or merge the duplicate task with the existing tracked work, then resubmit the plan.',
    evidence: task ? [`Task: "${task.title}"`] : [],
  }
}

function explainMissingDependency(task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  const title = task?.title ?? 'A task in this plan'
  return {
    executiveSummary: `${title} is scheduled to start before its prerequisite work is declared.`,
    rootCause: task
      ? `This task sits at Engineering Sequence position ${task.engineeringSequence}, which requires a declared prerequisite dependency, but none was declared.`
      : 'A task requiring a prerequisite dependency was found without one declared.',
    impact: 'Starting this task without its prerequisite in place risks rework, blocked execution, or a broken build if the underlying capability doesn\'t exist yet.',
    recommendedAction: `Declare the prerequisite dependency for ${title}, or move it to an earlier, unblocked position, then resubmit.`,
    evidence: task ? [`Engineering Sequence position: ${task.engineeringSequence ?? 'Unmapped'}`, `Declared dependencies: ${task.dependencies.length}`] : [],
  }
}

function explainInvalidEngineeringOrder(task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  const title = task?.title ?? 'A task in this plan'
  return {
    executiveSummary: `${title} is scheduled ahead of where this project has actually progressed.`,
    rootCause: task
      ? `This task maps to Engineering Sequence position ${task.engineeringSequence}, but the project has not yet reached that point.`
      : 'A task was scheduled ahead of the project\'s current position in the Engineering Sequence.',
    impact: 'Executing this task now risks depending on engineering foundations that don\'t exist yet, which can cause wasted work or a failed build.',
    recommendedAction: 'Wait until the project reaches this position in the Engineering Sequence, or explicitly resequence this task with the Engineering Director, then resubmit.',
    evidence: task ? [`Engineering Sequence position: ${task.engineeringSequence ?? 'Unmapped'}`] : [],
  }
}

function explainArchitectureConflict(task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  const title = task?.title ?? 'A task in this plan'
  return {
    executiveSummary: `${title} proposes building something that already exists in the codebase.`,
    rootCause: 'A narrow, evidence-based check found this task proposing new infrastructure that the repository already has in place.',
    impact: 'Building this would risk two conflicting implementations of the same capability (for example, two authentication systems or two database layers), creating confusion and technical debt.',
    recommendedAction: `Revise ${title} to build on the existing implementation instead of replacing it, then resubmit.`,
    evidence: task ? [`Task: "${task.title}"`] : [],
  }
}

function explain(issue: ValidationIssue, task: EngineeringTask | null): Pick<ExecutiveValidationExplanation, 'executiveSummary' | 'rootCause' | 'impact' | 'recommendedAction' | 'evidence'> {
  switch (issue.type) {
    case 'Missing Objective':
      return explainMissingObjective()
    case 'Missing Acceptance Criteria':
      return explainMissingAcceptanceCriteria(task)
    case 'Duplicate Work':
      return explainDuplicateWork(task)
    case 'Missing Dependency':
      return explainMissingDependency(task)
    case 'Invalid Engineering Order':
      return explainInvalidEngineeringOrder(task)
    case 'Architecture Conflict':
      return explainArchitectureConflict(task)
  }
}

/** One ValidationIssue → one Executive-readable explanation. Never called from anywhere in the validator itself — this is read-only, downstream presentation. */
export function translateValidationIssue(issue: ValidationIssue, plan: EngineeringPlan): ExecutiveValidationExplanation {
  const task = findTask(plan, issue.taskId)
  const { executiveSummary, rootCause, impact, recommendedAction, evidence } = explain(issue, task)
  return {
    issueType: issue.type,
    validationRule: VALIDATION_RULE_LABEL[issue.type],
    severity: SEVERITY_BY_TYPE[issue.type],
    executiveSummary,
    rootCause,
    impact,
    whyExecutionWasBlocked: `${rootCause} ${GOVERNANCE_NOTE}`,
    recommendedAction,
    affectedTasks: affectedTasksFor(task),
    evidence,
    technicalDetails: issue.description,
  }
}

/** The full Executive Validation Report for a plan — one explanation per issue, in the same order the validator produced them. Empty when the plan is valid. */
export function buildExecutiveValidationReport(plan: EngineeringPlan): ExecutiveValidationExplanation[] {
  return plan.validation.issues.map(issue => translateValidationIssue(issue, plan))
}
