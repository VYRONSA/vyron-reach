import type { DeploymentIntelligence } from '../deploymentIntelligence'
import type { LifecycleStage, QualityGateReport, ReleaseReadinessResult, RiskAssessment } from './operationsTypes'

/**
 * Five mutually exclusive states, derived from Quality Gates + Risk
 * Assessment + Lifecycle Stage + Deployment Intelligence — no new
 * judgment, just a priority-ordered read of what those already concluded.
 * "Ready for QA" is reachable but its reason is always honest about there
 * being no automated tests to actually run (this repo has none).
 */
export function determineReleaseReadiness(
  stage: LifecycleStage,
  gates: QualityGateReport,
  risk: RiskAssessment,
  deployment: DeploymentIntelligence | null
): ReleaseReadinessResult {
  if (!gates.allPassed) {
    return { readiness: 'Blocked', reason: `${gates.failedGates.length} quality gate(s) failed: ${gates.failedGates.map(g => g.gate).join(', ')}.` }
  }
  if (risk.overallRisk === 'Critical') {
    const critical = risk.factors.find(f => f.level === 'Critical')
    return { readiness: 'Blocked', reason: `Overall risk is Critical (${critical?.category ?? 'unknown factor'}: ${critical?.evidence ?? ''}).` }
  }
  if (stage === 'Reviewing' || stage === 'Applied') {
    return { readiness: 'Ready for Review', reason: 'Quality gates passed; the change is awaiting further validation.' }
  }
  if (stage === 'Testing') {
    return { readiness: 'Ready for QA', reason: 'Quality gates passed; no automated tests exist in this repository to run.' }
  }
  if (!deployment || !deployment.deploymentAvailable) {
    return { readiness: 'Blocked', reason: 'Deployment is not configured for this project.' }
  }
  if (deployment.environment !== 'Production') {
    return { readiness: 'Ready for Staging', reason: `Deployment configured for ${deployment.environment}.` }
  }
  if (risk.overallRisk === 'High') {
    return { readiness: 'Ready for Staging', reason: 'Production deployment is configured, but overall risk is High — stage before promoting further.' }
  }
  return { readiness: 'Ready for Production', reason: 'Quality gates passed, risk is not High/Critical, and production deployment is configured.' }
}
