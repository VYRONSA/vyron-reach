import type { AssessmentInput, RiskFactor, RiskAssessment, RiskLevel } from './assessmentTypes'

const LEVEL_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2 }

function worseOf(a: RiskLevel, b: RiskLevel): RiskLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}

/**
 * Risk Assessment — pure, deterministic evaluation of eight factors from
 * the gathered AssessmentInput. Overall risk is the single worst factor,
 * not an average — the same "one severe factor makes the whole project
 * risky" rule lib/dev/operations/riskAssessmentEngine.ts already uses,
 * kept consistent here rather than reinvented differently.
 */
export function evaluateRiskAssessment(input: AssessmentInput): RiskAssessment {
  const factors: RiskFactor[] = [
    openRisksFactor(input),
    riskSeverityFactor(input),
    blockedMilestonesFactor(input),
    stalledBatchesFactor(input),
    technicalDebtGrowthFactor(input),
    repeatedFailuresFactor(input),
    recoveryFrequencyFactor(input),
    outstandingCeoDecisionsFactor(input),
  ]

  const overall = factors.reduce<RiskLevel>((acc, f) => worseOf(acc, f.level), 'Low')

  return { factors, overall }
}

function openRisksFactor(input: AssessmentInput): RiskFactor {
  const count = input.openRiskSeverities.length
  const level: RiskLevel = count === 0 ? 'Low' : count <= 2 ? 'Medium' : 'High'
  return { factor: 'Open Risks', level, detail: `${count} open risk(s) on the Risk Register.` }
}

function riskSeverityFactor(input: AssessmentInput): RiskFactor {
  const highCount = input.openRiskSeverities.filter(s => s === 'High').length
  const level: RiskLevel = highCount === 0 ? 'Low' : highCount === 1 ? 'Medium' : 'High'
  return { factor: 'Risk Severity', level, detail: `${highCount} open High-severity risk(s).` }
}

function blockedMilestonesFactor(input: AssessmentInput): RiskFactor {
  const count = input.blockedMilestoneIds.length
  const level: RiskLevel = count === 0 ? 'Low' : count === 1 ? 'Medium' : 'High'
  return { factor: 'Blocked Milestones', level, detail: `${count} milestone(s) marked At Risk.` }
}

function stalledBatchesFactor(input: AssessmentInput): RiskFactor {
  const level: RiskLevel = input.activeBatchLastJobFailed ? 'High' : 'Low'
  return {
    factor: 'Stalled Batches',
    level,
    detail: input.activeBatchLastJobFailed
      ? "The Active batch's most recent runtime job ended Failed/Cancelled without a newer successful attempt."
      : 'No Active batch is stalled on a failed attempt.',
  }
}

/** Growth is measured against the immediately preceding assessment's own recorded count — a durable, already-persisted baseline, never a wall-clock comparison. A project's very first assessment compares against itself (zero delta) rather than a distinct "no baseline" case — see AssessmentInput.previousTechnicalDebtRecordCount's doc comment. */
function technicalDebtGrowthFactor(input: AssessmentInput): RiskFactor {
  const delta = input.technicalDebtRecordCount - input.previousTechnicalDebtRecordCount
  const level: RiskLevel = delta <= 0 ? 'Low' : delta <= 2 ? 'Medium' : 'High'
  return { factor: 'Technical Debt Growth', level, detail: `Technical debt records: ${input.previousTechnicalDebtRecordCount} → ${input.technicalDebtRecordCount} (${delta >= 0 ? '+' : ''}${delta}).` }
}

/** Failure rate over a fixed-size recent-jobs window (see assessmentGather.ts) — never "all jobs ever," which would make the signal drift purely from history length growing. */
function repeatedFailuresFactor(input: AssessmentInput): RiskFactor {
  const total = input.recentJobStatuses.length
  const failures = input.recentJobStatuses.filter(s => s === 'Failed').length
  const rate = total === 0 ? 0 : failures / total
  const level: RiskLevel = rate === 0 ? 'Low' : rate < 0.5 ? 'Medium' : 'High'
  return { factor: 'Repeated Failures', level, detail: `${failures} of the last ${total} runtime job(s) failed.` }
}

function recoveryFrequencyFactor(input: AssessmentInput): RiskFactor {
  const count = input.recoveryEventCount
  const level: RiskLevel = count === 0 ? 'Low' : count <= 2 ? 'Medium' : 'High'
  return { factor: 'Recovery Frequency', level, detail: `${count} crash recovery event(s) recorded for this project.` }
}

function outstandingCeoDecisionsFactor(input: AssessmentInput): RiskFactor {
  const count = input.openInboxCount
  const level: RiskLevel = count === 0 ? 'Low' : count === 1 ? 'Medium' : 'High'
  return { factor: 'Outstanding CEO Decisions', level, detail: `${count} open Engineering Inbox item(s) awaiting a CEO decision.` }
}
