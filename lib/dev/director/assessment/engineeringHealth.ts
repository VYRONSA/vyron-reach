import type { QualityGateReport, RiskAssessment, EngineeringHealth } from './assessmentTypes'

/**
 * Engineering Health — a pure combination of an already-computed
 * QualityGateReport and RiskAssessment, on the 4-level scale this
 * milestone introduces (Healthy/Attention Required/At Risk/Critical).
 * Deliberately does not read AssessmentInput directly or duplicate any
 * gate/risk logic — it only combines the two outputs, so there is
 * exactly one place quality is scored and exactly one place risk is
 * scored, and this function can never disagree with either.
 */
export function evaluateEngineeringHealth(gates: QualityGateReport, risk: RiskAssessment): EngineeringHealth {
  const coreGatesFailing = gates.gates.some(
    g => g.status === 'Failing' && (g.gate === 'Build Status' || g.gate === 'TypeScript Status' || g.gate === 'Execution Health')
  )

  if (coreGatesFailing && risk.overall === 'High') return 'Critical'
  if (risk.overall === 'High' || gates.failing >= 2) return 'At Risk'
  if (risk.overall === 'Medium' || gates.failing === 1) return 'Attention Required'
  return 'Healthy'
}
