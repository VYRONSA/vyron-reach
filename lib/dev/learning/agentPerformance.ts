import type { AgentScorecard, ExecutionLearningRecord } from './learningTypes'

const CONFIDENCE_RANK: Record<string, number> = { High: 2, Medium: 1, Low: 0 }

function isBlockingDecisionText(decision: string): boolean {
  const text = decision.toLowerCase()
  return text.includes('block') || text.includes('needs review')
}

/**
 * One scorecard per agent role, built entirely from decisions that
 * already ran and executions whose outcome is already known — nothing
 * here re-runs an agent or estimates a number without real history
 * behind it. Prediction accuracy is only computed for decisions
 * belonging to an execution whose outcome is Succeeded or Failed
 * (Rejected/RolledBack/Unknown executions don't cleanly confirm or deny
 * a prediction, so they're excluded rather than guessed either way).
 */
export function buildAgentScorecards(records: ExecutionLearningRecord[]): AgentScorecard[] {
  const roles = new Set<string>()
  for (const r of records) for (const d of r.agentDecisions) roles.add(d.role)

  return [...roles].map(role => {
    const decisions = records.flatMap(r => r.agentDecisions.filter(d => d.role === role).map(d => ({ ...d, outcome: r.outcome })));
    const blocking = decisions.filter(d => isBlockingDecisionText(d.decision))
    const clear = decisions.filter(d => !isBlockingDecisionText(d.decision))

    const resolvable = decisions.filter(d => d.outcome === 'Succeeded' || d.outcome === 'Failed')
    const truePositives = resolvable.filter(d => isBlockingDecisionText(d.decision) && d.outcome === 'Failed').length
    const trueNegatives = resolvable.filter(d => !isBlockingDecisionText(d.decision) && d.outcome === 'Succeeded').length
    const falsePositives = resolvable.filter(d => isBlockingDecisionText(d.decision) && d.outcome === 'Succeeded').length
    const falseNegatives = resolvable.filter(d => !isBlockingDecisionText(d.decision) && d.outcome === 'Failed').length

    const confidenceValues = decisions.map(d => CONFIDENCE_RANK[d.confidence] ?? 1)
    const avgConfidenceRank = confidenceValues.length > 0 ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length : 1
    const averageConfidence = avgConfidenceRank >= 1.5 ? 'High' : avgConfidenceRank >= 0.5 ? 'Medium' : 'Low'

    const durations = decisions.map(d => d.durationMs)
    const costs = decisions.map(d => d.cost)
    const succeeded = decisions.filter(d => d.outcome === 'Succeeded').length

    return {
      role,
      executions: decisions.length,
      acceptedPercent: decisions.length > 0 ? Math.round((clear.length / decisions.length) * 100) : null,
      rejectedPercent: decisions.length > 0 ? Math.round((blocking.length / decisions.length) * 100) : null,
      averageConfidence,
      predictionAccuracy: resolvable.length > 0 ? Math.round(((truePositives + trueNegatives) / resolvable.length) * 100) : null,
      falsePositives,
      falseNegatives,
      averageRuntimeMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      averageCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
      successRate: decisions.length > 0 ? Math.round((succeeded / decisions.length) * 100) : null,
    }
  })
}

export function mostAccurateAgent(scorecards: AgentScorecard[]): AgentScorecard | null {
  const withAccuracy = scorecards.filter(s => s.predictionAccuracy !== null)
  if (withAccuracy.length === 0) return null
  return withAccuracy.reduce((best, s) => (s.predictionAccuracy! > best.predictionAccuracy! ? s : best))
}

export function leastAccurateAgent(scorecards: AgentScorecard[]): AgentScorecard | null {
  const withAccuracy = scorecards.filter(s => s.predictionAccuracy !== null)
  if (withAccuracy.length === 0) return null
  return withAccuracy.reduce((worst, s) => (s.predictionAccuracy! < worst.predictionAccuracy! ? s : worst))
}
