import type { ExecutiveEngineeringReport, EngineeringHealth } from '../intelligence/engineeringIntelligenceEngine'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { GitIntelligence } from '../gitIntelligence'
import type { QualityGateReport, RiskAssessment, RiskFactor, RiskLevel } from './operationsTypes'

const HEALTH_TO_RISK: Record<EngineeringHealth, RiskLevel> = {
  Excellent: 'Low',
  Good: 'Low',
  Fair: 'Medium',
  Poor: 'High',
  Critical: 'Critical',
}
const RISK_RANK: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']

function implementationRisk(gates: QualityGateReport): RiskFactor {
  const failed = gates.failedGates.length
  const level: RiskLevel = failed === 0 ? 'Low' : failed === 1 ? 'Medium' : failed <= 2 ? 'High' : 'Critical'
  return { category: 'Implementation', level, evidence: `${failed} of ${gates.results.length} quality gates failed.` }
}

function deploymentRisk(git: GitIntelligence): RiskFactor {
  const level: RiskLevel = !git.repositoryAvailable ? 'High' : git.workingTreeStatus === 'Modified' ? 'Medium' : 'Low'
  return {
    category: 'Deployment',
    level,
    evidence: `Repository available: ${git.repositoryAvailable}; working tree status: ${git.workingTreeStatus}.`,
  }
}

/** Reuses the same Repository Health (Code + Git findings) the Autonomous Engineering Director already computed — relabeled as a risk level, not re-derived. */
function architectureRisk(report: ExecutiveEngineeringReport): RiskFactor {
  return {
    category: 'Architecture',
    level: HEALTH_TO_RISK[report.repositoryHealth],
    evidence: `Repository Health: ${report.repositoryHealth} (from Code + Git Intelligence findings).`,
  }
}

/** Recurring failures/execution loops are Runtime Intelligence's own signal for "this keeps breaking the same way" — the direct evidence for regression risk. */
function regressionRisk(report: ExecutiveEngineeringReport): RiskFactor {
  const relevant = report.findings.filter(
    f => f.module === 'Runtime' && (f.category === 'Recurring Failure' || f.category === 'Execution Loop')
  )
  const level: RiskLevel = relevant.length === 0 ? 'Low' : relevant.length === 1 ? 'Medium' : 'High'
  return {
    category: 'Regression',
    level,
    evidence: relevant.length > 0 ? relevant.map(f => f.evidence).join(' | ') : 'No Recurring Failure or Execution Loop findings.',
  }
}

function runtimeRisk(jobs: DevelopmentJob[]): RiskFactor {
  const recent = jobs.slice(0, 5)
  if (recent.length === 0) return { category: 'Runtime', level: 'Low', evidence: 'No runtime job history recorded yet.' }
  const failures = recent.filter(j => j.status === 'Failed').length
  const failureRate = failures / recent.length
  const level: RiskLevel = failureRate >= 0.5 ? 'High' : failures > 0 ? 'Medium' : 'Low'
  return { category: 'Runtime', level, evidence: `${failures} of the last ${recent.length} runtime jobs failed.` }
}

/**
 * The Risk Assessment Engine — six factors, each with mandatory evidence.
 * Commercial Risk is reused directly from the Autonomous Engineering
 * Director's own assessment rather than recomputed, since the Director
 * already derived it (as an explicit proxy — this system has no real
 * commercial/revenue data). Overall risk is the worst individual factor,
 * not an average — one Critical factor makes the whole assessment
 * Critical.
 */
export function assessRisks(
  gates: QualityGateReport,
  git: GitIntelligence,
  report: ExecutiveEngineeringReport,
  strategy: ExecutiveEngineeringStrategy,
  jobs: DevelopmentJob[]
): RiskAssessment {
  const factors: RiskFactor[] = [
    implementationRisk(gates),
    deploymentRisk(git),
    architectureRisk(report),
    regressionRisk(report),
    {
      category: 'Commercial',
      level: strategy.commercialRisk,
      evidence: `Reused from the Autonomous Engineering Director's Commercial Risk assessment (a Delivery Risk / Product Completion proxy).`,
    },
    runtimeRisk(jobs),
  ]

  const overallRisk = factors.reduce<RiskLevel>(
    (worst, f) => (RISK_RANK.indexOf(f.level) > RISK_RANK.indexOf(worst) ? f.level : worst),
    'Low'
  )

  return { factors, overallRisk }
}
