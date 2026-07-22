import { describe, it, expect } from 'vitest'
import { evaluateQualityGates } from '../../../lib/dev/director/assessment/qualityGates'
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

describe('Quality Gates — Build / TypeScript / Test Status', () => {
  it('passes through the already-computed build and typescript status verbatim, never re-deriving it', () => {
    const report = evaluateQualityGates(baseInput({ buildStatus: 'Failing', typescriptStatus: 'Passing' }))
    expect(report.gates.find(g => g.gate === 'Build Status')?.status).toBe('Failing')
    expect(report.gates.find(g => g.gate === 'TypeScript Status')?.status).toBe('Passing')
  })

  it('Test Status is always Unknown — no test runner signal exists, and it is never fabricated', () => {
    const report = evaluateQualityGates(baseInput())
    expect(report.gates.find(g => g.gate === 'Test Status')?.status).toBe('Unknown')
  })
})

describe('Quality Gates — Planning Consistency', () => {
  it('passes with exactly one Active batch and no orphaned batches', () => {
    const report = evaluateQualityGates(baseInput({ activeBatchIds: ['b1'], orphanedBatchIds: [] }))
    expect(report.gates.find(g => g.gate === 'Planning Consistency')?.status).toBe('Passing')
  })

  it('fails with zero Active batches', () => {
    const report = evaluateQualityGates(baseInput({ activeBatchIds: [] }))
    expect(report.gates.find(g => g.gate === 'Planning Consistency')?.status).toBe('Failing')
  })

  it('fails with more than one Active batch', () => {
    const report = evaluateQualityGates(baseInput({ activeBatchIds: ['b1', 'b2'] }))
    expect(report.gates.find(g => g.gate === 'Planning Consistency')?.status).toBe('Failing')
  })

  it('fails when a batch references a missing milestone', () => {
    const report = evaluateQualityGates(baseInput({ orphanedBatchIds: ['b1'] }))
    expect(report.gates.find(g => g.gate === 'Planning Consistency')?.status).toBe('Failing')
  })
})

describe('Quality Gates — Dependency Consistency', () => {
  it('passes with no dangling dependency edges', () => {
    const report = evaluateQualityGates(baseInput({ danglingDependencyIds: [] }))
    expect(report.gates.find(g => g.gate === 'Dependency Consistency')?.status).toBe('Passing')
  })

  it('fails when a dependency edge references a deleted milestone/batch', () => {
    const report = evaluateQualityGates(baseInput({ danglingDependencyIds: ['dep1'] }))
    expect(report.gates.find(g => g.gate === 'Dependency Consistency')?.status).toBe('Failing')
  })
})

describe('Quality Gates — Completion Consistency', () => {
  it('passes when every completed batch/milestone has a matching Knowledge Service record', () => {
    const report = evaluateQualityGates(
      baseInput({
        completedBatchIds: ['b1'], batchCompletionRecordedIds: ['b1'],
        completedMilestoneIds: ['m1'], milestoneCompletionRecordedIds: ['m1'],
      })
    )
    expect(report.gates.find(g => g.gate === 'Completion Consistency')?.status).toBe('Passing')
  })

  it('fails when a completed batch has no Knowledge Service completion record', () => {
    const report = evaluateQualityGates(baseInput({ completedBatchIds: ['b1'], batchCompletionRecordedIds: [] }))
    expect(report.gates.find(g => g.gate === 'Completion Consistency')?.status).toBe('Failing')
  })

  it('fails when a completed milestone has no Knowledge Service completion record', () => {
    const report = evaluateQualityGates(baseInput({ completedMilestoneIds: ['m1'], milestoneCompletionRecordedIds: [] }))
    expect(report.gates.find(g => g.gate === 'Completion Consistency')?.status).toBe('Failing')
  })

  it('passes trivially when nothing is complete yet', () => {
    const report = evaluateQualityGates(baseInput({ completedBatchIds: [], completedMilestoneIds: [] }))
    expect(report.gates.find(g => g.gate === 'Completion Consistency')?.status).toBe('Passing')
  })
})

describe('Quality Gates — Execution Health', () => {
  it('passes when the Director is progressing normally', () => {
    const report = evaluateQualityGates(baseInput({ directorState: 'Running', activeBatchLastJobFailed: false }))
    expect(report.gates.find(g => g.gate === 'Execution Health')?.status).toBe('Passing')
  })

  it('fails when the Director is Blocked', () => {
    const report = evaluateQualityGates(baseInput({ directorState: 'Blocked' }))
    expect(report.gates.find(g => g.gate === 'Execution Health')?.status).toBe('Failing')
  })

  it('fails when the Active batch\'s last job failed', () => {
    const report = evaluateQualityGates(baseInput({ activeBatchLastJobFailed: true }))
    expect(report.gates.find(g => g.gate === 'Execution Health')?.status).toBe('Failing')
  })
})

describe('Quality Gates — report totals', () => {
  it('counts passing/failing/unknown across exactly the 7 gates', () => {
    const report = evaluateQualityGates(baseInput())
    expect(report.gates).toHaveLength(7)
    expect(report.passing + report.failing + report.unknown).toBe(7)
    expect(report.unknown).toBe(1) // Test Status only
  })

  it('is a pure function — identical input produces byte-identical output', () => {
    const input = baseInput({ danglingDependencyIds: ['x'], activeBatchIds: [] })
    expect(JSON.stringify(evaluateQualityGates(input))).toBe(JSON.stringify(evaluateQualityGates(input)))
  })
})
