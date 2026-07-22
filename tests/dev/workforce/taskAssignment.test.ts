import { describe, it, expect } from 'vitest'
import { assignWorkerRole } from '../../../lib/dev/director/workforce/taskAssignment'
import type { EngineeringAssessment, QualityGateReport, RiskAssessment } from '../../../lib/dev/director/assessment/assessmentTypes'

function gates(overrides: Partial<Record<string, 'Passing' | 'Failing' | 'Unknown'>> = {}): QualityGateReport {
  const names = ['Build Status', 'TypeScript Status', 'Test Status', 'Planning Consistency', 'Dependency Consistency', 'Completion Consistency', 'Execution Health'] as const
  const list = names.map(gate => ({ gate, status: overrides[gate] ?? ('Passing' as const), detail: '' }))
  return { gates: list, passing: list.filter(g => g.status === 'Passing').length, failing: list.filter(g => g.status === 'Failing').length, unknown: list.filter(g => g.status === 'Unknown').length }
}

function risk(overrides: Partial<Record<string, 'Low' | 'Medium' | 'High'>> = {}): RiskAssessment {
  const names = ['Open Risks', 'Risk Severity', 'Blocked Milestones', 'Stalled Batches', 'Technical Debt Growth', 'Repeated Failures', 'Recovery Frequency', 'Outstanding CEO Decisions'] as const
  const factors = names.map(factor => ({ factor, level: overrides[factor] ?? ('Low' as const), detail: '' }))
  const overall = factors.some(f => f.level === 'High') ? ('High' as const) : factors.some(f => f.level === 'Medium') ? ('Medium' as const) : ('Low' as const)
  return { factors, overall }
}

function assessment(overrides: Partial<EngineeringAssessment> = {}): EngineeringAssessment {
  return {
    project: 'acme',
    qualityGates: gates(),
    riskAssessment: risk(),
    engineeringHealth: 'Healthy',
    technicalDebtBaseline: 0,
    ...overrides,
  }
}

describe('Task Assignment — Assessment Service drives priority (Quality Gates)', () => {
  it('assigns QA Engineer when Build Status is failing, regardless of batch text', () => {
    const a = assignWorkerRole('Add a new database migration', assessment({ qualityGates: gates({ 'Build Status': 'Failing' }) }))
    expect(a.role).toBe('QA Engineer')
    expect(a.reason).toMatch(/Build Status/)
  })

  it('assigns QA Engineer when TypeScript Status is failing', () => {
    expect(assignWorkerRole('anything', assessment({ qualityGates: gates({ 'TypeScript Status': 'Failing' }) })).role).toBe('QA Engineer')
  })

  it('assigns QA Engineer when a data-integrity gate is failing', () => {
    expect(assignWorkerRole('anything', assessment({ qualityGates: gates({ 'Planning Consistency': 'Failing' }) })).role).toBe('QA Engineer')
  })
})

describe('Task Assignment — Engineering Health', () => {
  it('assigns QA Engineer when Engineering Health is Critical', () => {
    expect(assignWorkerRole('Add a new UI component', assessment({ engineeringHealth: 'Critical' })).role).toBe('QA Engineer')
  })

  it('assigns QA Engineer when Engineering Health is At Risk', () => {
    expect(assignWorkerRole('Add a new UI component', assessment({ engineeringHealth: 'At Risk' })).role).toBe('QA Engineer')
  })
})

describe('Task Assignment — Outstanding CEO Decisions and Blocked work', () => {
  it('assigns Documentation Engineer when Outstanding CEO Decisions is High', () => {
    const a = assignWorkerRole('Add a new API endpoint', assessment({ riskAssessment: risk({ 'Outstanding CEO Decisions': 'High' }) }))
    expect(a.role).toBe('Documentation Engineer')
  })

  it('assigns Architecture Engineer when Blocked Milestones is High', () => {
    const a = assignWorkerRole('Add a new API endpoint', assessment({ riskAssessment: risk({ 'Blocked Milestones': 'High' }) }))
    expect(a.role).toBe('Architecture Engineer')
  })

  it('assigns Architecture Engineer when Technical Debt Growth risk is High', () => {
    const a = assignWorkerRole('Add a new API endpoint', assessment({ riskAssessment: risk({ 'Technical Debt Growth': 'High' }) }))
    expect(a.role).toBe('Architecture Engineer')
  })
})

describe('Task Assignment — falls back to batch text when nothing urgent is outstanding', () => {
  it('assigns by domain keyword match when the project is healthy', () => {
    expect(assignWorkerRole('Add a new database migration', assessment()).role).toBe('Database Engineer')
    expect(assignWorkerRole('Update the CI deployment pipeline', assessment()).role).toBe('DevOps Engineer')
  })

  it('defaults to Backend Engineer when nothing matches and nothing is urgent', () => {
    expect(assignWorkerRole('xyzzy plugh', assessment()).role).toBe('Backend Engineer')
  })
})

describe('Task Assignment — priority order is deterministic and stable', () => {
  it('a failing core gate always outranks a Critical health rating alone appearing together', () => {
    const a = assignWorkerRole('anything', assessment({ qualityGates: gates({ 'Build Status': 'Failing' }), engineeringHealth: 'Critical' }))
    expect(a.reason).toMatch(/Build Status/) // cites the gate failure, not the health rating, confirming gate check runs first
  })

  it('is a pure function — identical input always returns identical output', () => {
    const input = assessment({ riskAssessment: risk({ 'Blocked Milestones': 'High' }) })
    expect(assignWorkerRole('x', input)).toEqual(assignWorkerRole('x', input))
  })
})
