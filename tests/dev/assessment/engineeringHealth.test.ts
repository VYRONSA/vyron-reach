import { describe, it, expect } from 'vitest'
import { evaluateEngineeringHealth } from '../../../lib/dev/director/assessment/engineeringHealth'
import type { QualityGateReport, RiskAssessment, GateStatus, RiskLevel } from '../../../lib/dev/director/assessment/assessmentTypes'

function gates(statuses: Partial<Record<'Build Status' | 'TypeScript Status' | 'Execution Health', GateStatus>> = {}): QualityGateReport {
  const all: QualityGateReport['gates'] = [
    { gate: 'Build Status', status: statuses['Build Status'] ?? 'Passing', detail: '' },
    { gate: 'TypeScript Status', status: statuses['TypeScript Status'] ?? 'Passing', detail: '' },
    { gate: 'Test Status', status: 'Unknown', detail: '' },
    { gate: 'Planning Consistency', status: 'Passing', detail: '' },
    { gate: 'Dependency Consistency', status: 'Passing', detail: '' },
    { gate: 'Completion Consistency', status: 'Passing', detail: '' },
    { gate: 'Execution Health', status: statuses['Execution Health'] ?? 'Passing', detail: '' },
  ]
  return { gates: all, passing: all.filter(g => g.status === 'Passing').length, failing: all.filter(g => g.status === 'Failing').length, unknown: all.filter(g => g.status === 'Unknown').length }
}

function risk(overall: RiskLevel): RiskAssessment {
  return { factors: [], overall }
}

describe('Engineering Health — combination rules', () => {
  it('is Healthy when everything passes and risk is Low', () => {
    expect(evaluateEngineeringHealth(gates(), risk('Low'))).toBe('Healthy')
  })

  it('is Attention Required when risk is Medium with otherwise-clean gates', () => {
    expect(evaluateEngineeringHealth(gates(), risk('Medium'))).toBe('Attention Required')
  })

  it('is Attention Required when exactly one gate fails and risk is Low', () => {
    expect(evaluateEngineeringHealth(gates({ 'Build Status': 'Failing' }), risk('Low'))).toBe('Attention Required')
  })

  it('is At Risk when overall risk is High', () => {
    expect(evaluateEngineeringHealth(gates(), risk('High'))).toBe('At Risk')
  })

  it('is At Risk when two or more gates fail, even with Low risk', () => {
    expect(evaluateEngineeringHealth(gates({ 'Build Status': 'Failing', 'TypeScript Status': 'Failing' }), risk('Low'))).toBe('At Risk')
  })

  it('is Critical when a core gate (Build/TypeScript/Execution Health) fails AND risk is High', () => {
    expect(evaluateEngineeringHealth(gates({ 'Build Status': 'Failing' }), risk('High'))).toBe('Critical')
    expect(evaluateEngineeringHealth(gates({ 'Execution Health': 'Failing' }), risk('High'))).toBe('Critical')
  })

  it('is not Critical when a non-core gate fails, even with High risk — falls to At Risk instead', () => {
    // Planning/Dependency/Completion Consistency failing isn't a "core" gate for Critical purposes.
    const withNonCoreFailure = gates()
    withNonCoreFailure.gates = withNonCoreFailure.gates.map(g => (g.gate === 'Planning Consistency' ? { ...g, status: 'Failing' as const } : g))
    withNonCoreFailure.failing = 1
    withNonCoreFailure.passing -= 1
    expect(evaluateEngineeringHealth(withNonCoreFailure, risk('High'))).toBe('At Risk')
  })

  it('is a pure function of its two inputs — never reads anything else', () => {
    const g = gates({ 'Build Status': 'Failing' })
    const r = risk('Medium')
    expect(evaluateEngineeringHealth(g, r)).toBe(evaluateEngineeringHealth(g, r))
  })
})
