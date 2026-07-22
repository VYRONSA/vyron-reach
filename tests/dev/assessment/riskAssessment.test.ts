import { describe, it, expect } from 'vitest'
import { evaluateRiskAssessment } from '../../../lib/dev/director/assessment/riskAssessment'
import type { AssessmentInput } from '../../../lib/dev/director/assessment/assessmentTypes'

function baseInput(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
  return {
    project: 'acme',
    buildStatus: 'Passing',
    typescriptStatus: 'Passing',
    totalMilestones: 1,
    blockedMilestoneIds: [],
    totalBatches: 1,
    activeBatchIds: ['b1'],
    orphanedBatchIds: [],
    danglingDependencyIds: [],
    completedBatchIds: [],
    completedMilestoneIds: [],
    batchCompletionRecordedIds: [],
    milestoneCompletionRecordedIds: [],
    technicalDebtRecordCount: 0,
    previousTechnicalDebtRecordCount: 0,
    openRiskSeverities: [],
    recentJobStatuses: [],
    activeBatchLastJobFailed: false,
    recoveryEventCount: 0,
    openInboxCount: 0,
    directorState: 'Running',
    ...overrides,
  }
}

describe('Risk Assessment — Open Risks / Risk Severity', () => {
  it('is Low with no open risks', () => {
    const r = evaluateRiskAssessment(baseInput({ openRiskSeverities: [] }))
    expect(r.factors.find(f => f.factor === 'Open Risks')?.level).toBe('Low')
  })

  it('escalates Open Risks with count', () => {
    expect(evaluateRiskAssessment(baseInput({ openRiskSeverities: ['Low'] })).factors.find(f => f.factor === 'Open Risks')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ openRiskSeverities: ['Low', 'Low', 'Low'] })).factors.find(f => f.factor === 'Open Risks')?.level).toBe('High')
  })

  it('Risk Severity reacts specifically to High-severity risks, not just count', () => {
    expect(evaluateRiskAssessment(baseInput({ openRiskSeverities: ['Low', 'Low', 'Low'] })).factors.find(f => f.factor === 'Risk Severity')?.level).toBe('Low')
    expect(evaluateRiskAssessment(baseInput({ openRiskSeverities: ['High'] })).factors.find(f => f.factor === 'Risk Severity')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ openRiskSeverities: ['High', 'High'] })).factors.find(f => f.factor === 'Risk Severity')?.level).toBe('High')
  })
})

describe('Risk Assessment — Blocked Milestones', () => {
  it('escalates with the number of At-Risk milestones', () => {
    expect(evaluateRiskAssessment(baseInput({ blockedMilestoneIds: [] })).factors.find(f => f.factor === 'Blocked Milestones')?.level).toBe('Low')
    expect(evaluateRiskAssessment(baseInput({ blockedMilestoneIds: ['m1'] })).factors.find(f => f.factor === 'Blocked Milestones')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ blockedMilestoneIds: ['m1', 'm2'] })).factors.find(f => f.factor === 'Blocked Milestones')?.level).toBe('High')
  })
})

describe('Risk Assessment — Stalled Batches', () => {
  it('is High exactly when the Active batch\'s last job failed', () => {
    expect(evaluateRiskAssessment(baseInput({ activeBatchLastJobFailed: true })).factors.find(f => f.factor === 'Stalled Batches')?.level).toBe('High')
    expect(evaluateRiskAssessment(baseInput({ activeBatchLastJobFailed: false })).factors.find(f => f.factor === 'Stalled Batches')?.level).toBe('Low')
  })
})

describe('Risk Assessment — Technical Debt Growth', () => {
  it('is Low on a project\'s first-ever assessment (baseline equals the current count, zero delta)', () => {
    const r = evaluateRiskAssessment(baseInput({ technicalDebtRecordCount: 10, previousTechnicalDebtRecordCount: 10 }))
    expect(r.factors.find(f => f.factor === 'Technical Debt Growth')?.level).toBe('Low')
  })

  it('is Low when debt count did not grow', () => {
    const r = evaluateRiskAssessment(baseInput({ technicalDebtRecordCount: 5, previousTechnicalDebtRecordCount: 5 }))
    expect(r.factors.find(f => f.factor === 'Technical Debt Growth')?.level).toBe('Low')
  })

  it('escalates with the growth delta against the prior recorded baseline', () => {
    expect(evaluateRiskAssessment(baseInput({ technicalDebtRecordCount: 6, previousTechnicalDebtRecordCount: 5 })).factors.find(f => f.factor === 'Technical Debt Growth')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ technicalDebtRecordCount: 10, previousTechnicalDebtRecordCount: 5 })).factors.find(f => f.factor === 'Technical Debt Growth')?.level).toBe('High')
  })

  it('never uses the wall clock — only the durable previousTechnicalDebtRecordCount input', () => {
    const inputA = baseInput({ technicalDebtRecordCount: 5, previousTechnicalDebtRecordCount: 5 })
    const inputB = baseInput({ technicalDebtRecordCount: 5, previousTechnicalDebtRecordCount: 5 })
    expect(JSON.stringify(evaluateRiskAssessment(inputA))).toBe(JSON.stringify(evaluateRiskAssessment(inputB)))
  })
})

describe('Risk Assessment — Repeated Failures', () => {
  it('is Low with zero recent failures', () => {
    const r = evaluateRiskAssessment(baseInput({ recentJobStatuses: ['Completed', 'Completed'] }))
    expect(r.factors.find(f => f.factor === 'Repeated Failures')?.level).toBe('Low')
  })

  it('escalates with the failure rate over the recent-jobs window', () => {
    expect(evaluateRiskAssessment(baseInput({ recentJobStatuses: ['Failed', 'Completed', 'Completed', 'Completed'] })).factors.find(f => f.factor === 'Repeated Failures')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ recentJobStatuses: ['Failed', 'Failed', 'Completed'] })).factors.find(f => f.factor === 'Repeated Failures')?.level).toBe('High')
  })
})

describe('Risk Assessment — Recovery Frequency', () => {
  it('escalates with the number of recorded recovery events', () => {
    expect(evaluateRiskAssessment(baseInput({ recoveryEventCount: 0 })).factors.find(f => f.factor === 'Recovery Frequency')?.level).toBe('Low')
    expect(evaluateRiskAssessment(baseInput({ recoveryEventCount: 1 })).factors.find(f => f.factor === 'Recovery Frequency')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ recoveryEventCount: 3 })).factors.find(f => f.factor === 'Recovery Frequency')?.level).toBe('High')
  })
})

describe('Risk Assessment — Outstanding CEO Decisions', () => {
  it('escalates with the number of open inbox items', () => {
    expect(evaluateRiskAssessment(baseInput({ openInboxCount: 0 })).factors.find(f => f.factor === 'Outstanding CEO Decisions')?.level).toBe('Low')
    expect(evaluateRiskAssessment(baseInput({ openInboxCount: 1 })).factors.find(f => f.factor === 'Outstanding CEO Decisions')?.level).toBe('Medium')
    expect(evaluateRiskAssessment(baseInput({ openInboxCount: 2 })).factors.find(f => f.factor === 'Outstanding CEO Decisions')?.level).toBe('High')
  })
})

describe('Risk Assessment — overall is the worst factor, not an average', () => {
  it('is Low when every factor is Low', () => {
    expect(evaluateRiskAssessment(baseInput()).overall).toBe('Low')
  })

  it('is High when exactly one factor is High and everything else is Low', () => {
    const r = evaluateRiskAssessment(baseInput({ openInboxCount: 5 }))
    expect(r.overall).toBe('High')
  })

  it('is not diluted by many Low factors alongside one High factor', () => {
    const r = evaluateRiskAssessment(
      baseInput({ openInboxCount: 5, blockedMilestoneIds: [], openRiskSeverities: [], recoveryEventCount: 0 })
    )
    expect(r.overall).toBe('High') // an average of 8 factors (1 High, 7 Low) would round to Low — worst-wins does not
  })

  it('is a pure function — identical input produces byte-identical output', () => {
    const input = baseInput({ openInboxCount: 3, recoveryEventCount: 2 })
    expect(JSON.stringify(evaluateRiskAssessment(input))).toBe(JSON.stringify(evaluateRiskAssessment(input)))
  })
})
