import type { RepositoryFacts } from '../assessment/assessmentModels'
import type { EngineeringPlan, EngineeringTask, PlanValidationResult, ValidationIssue } from './planningTypes'

/**
 * Runs before a plan may be marked Director Reviewed or Approved — the
 * gate the ticket describes as "before a plan is approved, validate."
 * Every check here is a re-verification of something the rest of the
 * pipeline already computed (never trusts the Prioritizer/Estimator
 * blindly) or a narrow, evidence-based keyword check — the same
 * "documented, narrow heuristic, not a claim of full coverage" style
 * every other detector in this codebase already follows.
 */

function normalizeTitle(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function checkMissingObjective(plan: EngineeringPlan): ValidationIssue[] {
  if (plan.objective.trim()) return []
  return [{ type: 'Missing Objective', description: 'The plan has no objective set.', taskId: null }]
}

function checkMissingAcceptanceCriteria(plan: EngineeringPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (plan.acceptanceCriteria.length === 0) {
    issues.push({ type: 'Missing Acceptance Criteria', description: 'The plan itself has no acceptance criteria.', taskId: null })
  }
  for (const task of plan.tasks) {
    if (task.acceptanceCriteria.length === 0) {
      issues.push({ type: 'Missing Acceptance Criteria', description: `Task "${task.title}" has no acceptance criteria.`, taskId: task.id })
    }
  }
  return issues
}

function checkDuplicateWork(plan: EngineeringPlan, existingWorkTitles: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Map<string, EngineeringTask>()
  const existingNormalized = existingWorkTitles.map(normalizeTitle)

  for (const task of plan.tasks) {
    const key = normalizeTitle(task.title)
    const existingMatch = existingNormalized.find(e => e === key)
    if (existingMatch) {
      issues.push({ type: 'Duplicate Work', description: `Task "${task.title}" duplicates already-tracked work.`, taskId: task.id })
      continue
    }
    const dup = seen.get(key)
    if (dup) {
      issues.push({ type: 'Duplicate Work', description: `Task "${task.title}" duplicates task "${dup.title}" in the same plan.`, taskId: task.id })
    } else {
      seen.set(key, task)
    }
  }
  return issues
}

function checkMissingDependencies(plan: EngineeringPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const task of plan.tasks) {
    if (task.engineeringSequence !== null && task.engineeringSequence > 1) {
      const hasRequires = task.dependencies.some(d => d.relation === 'Requires')
      if (!hasRequires) {
        issues.push({
          type: 'Missing Dependency',
          description: `Task "${task.title}" is at Engineering Sequence position ${task.engineeringSequence} but declares no prerequisite dependency.`,
          taskId: task.id,
        })
      }
    }
  }
  return issues
}

function checkInvalidEngineeringOrder(plan: EngineeringPlan): ValidationIssue[] {
  return plan.tasks
    .filter(t => t.priorityReason.startsWith('Sequence violation'))
    .map(t => ({ type: 'Invalid Engineering Order' as const, description: t.priorityReason, taskId: t.id }))
}

/** Narrow, keyword-based check: a task proposing to build something Repository Facts already show exists. */
function checkArchitectureConflicts(plan: EngineeringPlan, facts: RepositoryFacts): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const task of plan.tasks) {
    const lower = task.title.toLowerCase()
    const proposesNewAuth = /(add|implement|build|create)[^.]*authentication/.test(lower)
    if (proposesNewAuth && facts.authFileExists) {
      issues.push({
        type: 'Architecture Conflict',
        description: `Task "${task.title}" proposes new authentication, but lib/dev/auth.ts already exists.`,
        taskId: task.id,
      })
    }
    const proposesNewDatabase = /(add|implement|build|create)[^.]*database/.test(lower)
    if (proposesNewDatabase && facts.supabaseConfigured) {
      issues.push({
        type: 'Architecture Conflict',
        description: `Task "${task.title}" proposes a new database layer, but Supabase is already configured.`,
        taskId: task.id,
      })
    }
  }
  return issues
}

export function validatePlan(plan: EngineeringPlan, existingWorkTitles: string[], facts: RepositoryFacts): PlanValidationResult {
  const issues = [
    ...checkMissingObjective(plan),
    ...checkMissingAcceptanceCriteria(plan),
    ...checkDuplicateWork(plan, existingWorkTitles),
    ...checkMissingDependencies(plan),
    ...checkInvalidEngineeringOrder(plan),
    ...checkArchitectureConflicts(plan, facts),
  ]
  return { valid: issues.length === 0, issues }
}
