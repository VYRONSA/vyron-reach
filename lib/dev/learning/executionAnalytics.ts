import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { Handover } from '../handoverStorage'
import type { WorkforceReport } from '../agents/agentWorkforce'
import type { ExecutiveEngineeringReport } from '../intelligence/engineeringIntelligenceEngine'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import type { ExecutionLearningRecord, ExecutionOutcome } from './learningTypes'

function determineOutcome(job: DevelopmentJob): ExecutionOutcome {
  if (job.status === 'Failed') return 'Failed'
  if (job.status === 'Cancelled') return 'RolledBack'
  if (job.status === 'Completed' && job.appliedAt) return 'Succeeded'
  if (job.status === 'Completed' && !job.appliedAt) return 'Rejected'
  return 'Unknown'
}

/**
 * Joins an already-persisted DevelopmentJob with its Handover and the
 * Workforce report that was live for it — nothing here is a new fact,
 * only a composition of records that already exist. Called once, right
 * after a job reaches a terminal state, from the same place Mission
 * Control already assembles all of these pieces.
 */
export function buildExecutionLearningRecord(
  job: DevelopmentJob,
  handover: Handover | null,
  report: ExecutiveEngineeringReport,
  strategy: ExecutiveEngineeringStrategy,
  workforce: WorkforceReport | null,
  product: string,
  phase: string
): ExecutionLearningRecord {
  const findingCategoryCounts: Record<string, number> = {}
  for (const f of report.findings) {
    const key = `${f.module}:${f.category}`
    findingCategoryCounts[key] = (findingCategoryCounts[key] ?? 0) + 1
  }

  return {
    id: job.id,
    timestamp: job.completedAt ?? job.createdAt,
    projectSlug: job.projectSlug,
    product,
    phase,
    milestone: job.milestoneId || null,
    batch: job.batchId || null,
    taskTitle: handover?.objective || job.objective || null,
    objective: job.objective,
    runtime: job.runtime,
    cost: job.cost,
    durationMs: job.duration,
    filesCreated: handover?.filesCreated ?? [],
    filesModified: handover?.filesModified ?? [],
    findingCategoryCounts,
    directorGoal: strategy.currentStrategicGoal,
    directorTheme: strategy.currentDevelopmentTheme,
    agentsUsed: workforce?.agentsUsed ?? [],
    agentDecisions: workforce
      ? workforce.agentOutputs.flatMap(o =>
          o.decisions.map(d => ({ role: o.role, decision: d.decision, confidence: o.confidence, durationMs: o.executionDurationMs, cost: o.cost }))
        )
      : [],
    recommendations: handover?.recommendations ? [handover.recommendations] : [],
    outcome: determineOutcome(job),
  }
}

export type ExecutionAnalyticsSummary = {
  totalExecutions: number
  successRate: number | null
  averageCost: number | null
  averageDurationMs: number | null
  outcomeBreakdown: Record<ExecutionOutcome, number>
}

/** Plain aggregation over persisted records — every number here is a direct count/average, never estimated. */
export function summarizeExecutions(records: ExecutionLearningRecord[]): ExecutionAnalyticsSummary {
  const outcomeBreakdown: Record<ExecutionOutcome, number> = { Succeeded: 0, Failed: 0, RolledBack: 0, Rejected: 0, Unknown: 0 }
  for (const r of records) outcomeBreakdown[r.outcome]++

  const costs = records.map(r => r.cost).filter((c): c is number => c !== null)
  const durations = records.map(r => r.durationMs).filter((d): d is number => d !== null)

  return {
    totalExecutions: records.length,
    successRate: records.length > 0 ? Math.round((outcomeBreakdown.Succeeded / records.length) * 100) : null,
    averageCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
    averageDurationMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    outcomeBreakdown,
  }
}
