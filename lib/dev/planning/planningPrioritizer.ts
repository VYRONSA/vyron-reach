import { DEFAULT_MILESTONES } from '../initializer/milestoneInitializer'
import type { DraftEngineeringTask, TaskDependency, TaskPriority } from './planningTypes'

/**
 * Determines each task's priority and dependencies purely from its
 * position in the canonical Engineering Sequence (DEFAULT_MILESTONES)
 * relative to the project's current position — the mechanism that
 * enforces "never recommend AI before Authentication, never recommend
 * Release before Testing, never skip prerequisites." A task whose
 * milestone comes after an unstarted prerequisite is demoted to Low and
 * carries a Requires dependency naming exactly what's missing; nothing
 * here silently reorders — the reason is always explained.
 */

const SEVERITY_RANK: Record<TaskPriority, number> = { Critical: 3, High: 2, Medium: 1, Low: 0 }

function milestoneAt(sequence: number): { title: string; sequence: number } | undefined {
  return DEFAULT_MILESTONES.find(m => m.sequence === sequence)
}

function priorityFromSequenceGap(engineeringSequence: number, currentSequence: number): { priority: TaskPriority; reason: string } {
  const gap = engineeringSequence - currentSequence
  if (gap > 1) {
    const missing = milestoneAt(engineeringSequence - 1)
    return {
      priority: 'Low',
      reason: `Sequence violation: "${milestoneAt(engineeringSequence)?.title}" is position ${engineeringSequence} in the Engineering Sequence, but the project is currently at position ${currentSequence}${missing ? ` — "${missing.title}" (position ${missing.sequence}) has not been reached yet` : ''}. Demoted rather than skipped ahead.`,
    }
  }
  if (gap === 1) {
    return { priority: 'Medium', reason: `Next in the Engineering Sequence — position ${engineeringSequence} directly follows the project's current position ${currentSequence}.` }
  }
  if (gap === 0) {
    return { priority: 'High', reason: `Matches the project's current Engineering Sequence position (${currentSequence}).` }
  }
  return { priority: 'Medium', reason: `Revisits Engineering Sequence position ${engineeringSequence}, already passed (current position ${currentSequence}).` }
}

function priorityFromSourceText(title: string, source: string): { priority: TaskPriority; reason: string } {
  const lower = `${title} ${source}`.toLowerCase()
  if (source.includes('Security') && (lower.includes('secret') || lower.includes('rotate'))) {
    return { priority: 'Critical', reason: 'Possible committed secret — the highest-severity Security Assessment category.' }
  }
  if (source.includes('Security')) return { priority: 'High', reason: 'Sourced from the Security category of the Engineering Assessment.' }
  if (source.includes('Build') || lower.includes('build') || lower.includes('typescript')) {
    return { priority: 'Critical', reason: 'Sourced from the Build category — a failing build or TypeScript error blocks all other work.' }
  }
  if (source.includes('Documentation')) return { priority: 'Low', reason: 'Sourced from the Documentation category — non-blocking.' }
  return { priority: 'Medium', reason: `Sourced from ${source}; no Engineering Sequence position or escalation applies.` }
}

export type PrioritizedTaskAttributes = {
  priority: TaskPriority
  priorityReason: string
  dependencies: TaskDependency[]
}

/**
 * Runs over the whole draft list at once (not task-by-task) because
 * "Blocks" dependencies are relational — a task only blocks another task
 * that's also present in this same plan.
 */
export function prioritizeTasks(drafts: DraftEngineeringTask[], currentSequence: number): Map<string, PrioritizedTaskAttributes> {
  const result = new Map<string, PrioritizedTaskAttributes>()

  for (const draft of drafts) {
    let priority: TaskPriority
    let priorityReason: string

    if (draft.sourceSeverity) {
      priority = draft.sourceSeverity
      priorityReason = `Priority inherited from ${draft.source}.`
    } else if (draft.engineeringSequence !== null) {
      const result_ = priorityFromSequenceGap(draft.engineeringSequence, currentSequence)
      priority = result_.priority
      priorityReason = result_.reason
    } else {
      const result_ = priorityFromSourceText(draft.title, draft.source)
      priority = result_.priority
      priorityReason = result_.reason
    }

    const dependencies: TaskDependency[] = []
    if (draft.engineeringSequence !== null && draft.engineeringSequence > 1) {
      const prerequisite = milestoneAt(draft.engineeringSequence - 1)
      if (prerequisite) {
        dependencies.push({
          relation: 'Requires',
          target: prerequisite.title,
          reason: `"${prerequisite.title}" (Engineering Sequence position ${prerequisite.sequence}) must be complete first.`,
        })
      }
    }
    for (const other of drafts) {
      if (other.id === draft.id || draft.engineeringSequence === null || other.engineeringSequence === null) continue
      if (other.engineeringSequence === draft.engineeringSequence + 1) {
        dependencies.push({ relation: 'Blocks', target: other.title, reason: `"${draft.title}" must complete before "${other.title}" can start.` })
      }
    }
    if (dependencies.length === 0) {
      dependencies.push({ relation: 'Independent', target: 'None', reason: 'No Engineering Sequence position or escalation ties this task to another.' })
    }

    result.set(draft.id, { priority, priorityReason, dependencies })
  }

  return result
}

/** Sorts a plan's tasks by priority (Critical first), the same ranking used to pick a plan's Objective. */
export function sortByPriority<T extends { priority: TaskPriority }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => SEVERITY_RANK[b.priority] - SEVERITY_RANK[a.priority])
}
