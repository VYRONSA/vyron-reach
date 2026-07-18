import { healthFromScore } from '../intelligence/engineeringIntelligenceEngine'
import type { ExecutiveOperationsDashboard, OperationsSnapshot, ReleaseReadiness, TrendDirection } from './operationsTypes'

const RISK_TO_NUM: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }

/** history is expected newest-first (operationsHistoryStorage returns it that way). Compares the newer half of the series against the older half — Unknown with fewer than 2 points, since a trend needs at least two. */
function trendFromSeries(values: number[], higherIsBetter: boolean): TrendDirection {
  if (values.length < 2) return 'Unknown'
  const mid = Math.ceil(values.length / 2)
  const recent = values.slice(0, mid)
  const older = values.slice(mid)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  const delta = recentAvg - olderAvg
  const threshold = 3
  if (Math.abs(delta) < threshold) return 'Stable'
  const improving = higherIsBetter ? delta > 0 : delta < 0
  return improving ? 'Improving' : 'Declining'
}

/**
 * The Executive Operations Dashboard — every field is either read
 * directly off the Operations Snapshot history (already the result of
 * Continuous Validation runs) or a plain average/rate over it. No new
 * inspection of code or state happens here. deploymentSuccess is always
 * null: this system has no deployment-triggering or deployment-outcome
 * tracking capability, so there is nothing honest to report there.
 */
export function buildExecutiveOperationsDashboard(
  history: OperationsSnapshot[],
  releaseReadiness: ReleaseReadiness
): ExecutiveOperationsDashboard {
  const scores = history.map(h => h.engineeringScore)
  const debtScores = history.map(h => h.technicalDebtScore)
  const riskNums = history.map(h => RISK_TO_NUM[h.deliveryRisk] ?? 1)

  const appliedCount = history.filter(h => h.applied).length
  const executionSuccessRate = history.length > 0 ? Math.round((appliedCount / history.length) * 100) : 0

  const costs = history.map(h => h.cost).filter((c): c is number => c !== null)
  const durations = history.map(h => h.duration).filter((d): d is number => d !== null)
  const averageClaudeCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : null
  const averageRuntime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null

  const latestScore = scores[0] ?? null
  const overallPlatformHealth = latestScore === null ? 'Unknown' : healthFromScore(latestScore)

  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const appliedLastWeek = history.filter(h => h.applied && now - new Date(h.timestamp).getTime() <= weekMs).length

  return {
    overallPlatformHealth,
    developmentVelocity: `${appliedLastWeek} applied change${appliedLastWeek === 1 ? '' : 's'} in the last 7 days`,
    executionSuccessRate,
    engineeringTrend: trendFromSeries(scores, true),
    technicalDebtTrend: trendFromSeries(debtScores, true),
    releaseReadiness,
    riskTrend: trendFromSeries(riskNums, false),
    runtimePerformance: averageRuntime !== null ? `${Math.round(averageRuntime / 1000)}s average over ${durations.length} run(s)` : 'Unavailable',
    averageClaudeCost,
    averageRuntime,
    deploymentSuccess: null,
  }
}
