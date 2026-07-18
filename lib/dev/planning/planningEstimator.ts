import type { Complexity, Confidence, DraftEngineeringTask, EffortEstimate, PlanningHistoryRecord } from './planningTypes'

/**
 * Effort estimation — a deterministic Low/Medium/High hour convention
 * (4h/16h/40h), adjusted by real historical variance when this project
 * has any (Learning: "use historical plans to improve future
 * estimates"). Confidence is never fabricated: zero comparable history
 * means Low confidence, no matter how precise the resulting number
 * looks.
 */

const BASE_HOURS: Record<Complexity, number> = { Low: 4, Medium: 16, High: 40 }

const HIGH_COMPLEXITY_SEQUENCES = new Set(['Authentication', 'Database', 'Core Services', 'Business Logic', 'Reporting', 'AI'])

/**
 * Complexity is read from the task's source, never invented: named
 * feature milestones (Authentication, Database, AI, ...) default to
 * High since they're new subsystem work; secret-removal, build fixes,
 * and documentation default lower since they're typically a targeted
 * change rather than new subsystem work.
 */
export function estimateTaskComplexity(draft: DraftEngineeringTask, milestoneTitleAtSequence: (seq: number) => string | undefined): Complexity {
  const milestoneTitle = draft.engineeringSequence !== null ? milestoneTitleAtSequence(draft.engineeringSequence) : undefined
  if (milestoneTitle && HIGH_COMPLEXITY_SEQUENCES.has(milestoneTitle)) return 'High'
  const lower = `${draft.title} ${draft.source}`.toLowerCase()
  if (lower.includes('secret') || lower.includes('debugger') || lower.includes('duplicate') || lower.includes('unused')) return 'Low'
  if (draft.source.includes('Documentation')) return 'Low'
  return 'Medium'
}

function averageVarianceRatio(history: PlanningHistoryRecord[]): { ratio: number; sampleSize: number } {
  const comparable = history.filter(h => h.actualDurationHours !== null && h.plan.effort.hours > 0)
  if (comparable.length === 0) return { ratio: 1, sampleSize: 0 }
  const ratios = comparable.map(h => h.actualDurationHours! / h.plan.effort.hours)
  return { ratio: ratios.reduce((sum, r) => sum + r, 0) / ratios.length, sampleSize: comparable.length }
}

export function estimateTaskHours(complexity: Complexity, history: PlanningHistoryRecord[]): EffortEstimate {
  const base = BASE_HOURS[complexity]
  const { ratio, sampleSize } = averageVarianceRatio(history)
  const hours = Math.max(1, Math.round(base * ratio))

  const confidence: Confidence = sampleSize === 0 ? 'Low' : sampleSize >= 3 ? 'High' : 'Medium'
  const assumptions = [`Base estimate: ${base}h for ${complexity} complexity (convention: Low=4h, Medium=16h, High=40h).`]
  if (sampleSize === 0) {
    assumptions.push('No historical execution data for this project yet — this estimate is the convention only, not calibrated by real outcomes.')
  } else {
    assumptions.push(`Adjusted ${ratio.toFixed(2)}x by the average variance observed across ${sampleSize} historical plan(s) for this project.`)
  }

  return { hours, complexity, confidence, assumptions }
}

/** Plan-level estimate — the sum of task hours, with the plan's own confidence never higher than its least-confident task (never fabricate certainty by averaging it away). */
export function estimatePlanEffort(taskEstimates: EffortEstimate[]): EffortEstimate {
  if (taskEstimates.length === 0) {
    return { hours: 0, complexity: 'Low', confidence: 'Low', assumptions: ['No tasks in this plan.'] }
  }
  const hours = taskEstimates.reduce((sum, e) => sum + e.hours, 0)
  const confidenceRank: Record<Confidence, number> = { Low: 0, Medium: 1, High: 2 }
  const confidence = taskEstimates.reduce((worst, e) => (confidenceRank[e.confidence] < confidenceRank[worst] ? e.confidence : worst), 'High' as Confidence)
  const complexity: Complexity = hours > BASE_HOURS.High ? 'High' : hours > BASE_HOURS.Medium ? 'Medium' : 'Low'
  return {
    hours,
    complexity,
    confidence,
    assumptions: [`Sum of ${taskEstimates.length} task estimate(s): ${hours}h total.`, 'Plan confidence is the lowest of any individual task\'s confidence.'],
  }
}

export function formatDuration(hours: number): string {
  if (hours <= 0) return '0 hours'
  if (hours < 8) return `${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round((hours / 8) * 10) / 10
  return `${hours} hours (~${days} working day${days === 1 ? '' : 's'} at 8h/day)`
}
