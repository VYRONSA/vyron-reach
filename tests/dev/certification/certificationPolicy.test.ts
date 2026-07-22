import { describe, it, expect } from 'vitest'
import { certifyFeature, computeQualityScore } from '../../../lib/dev/certification/certificationPolicy'
import type { CertificationCriteria } from '../../../lib/dev/certification/certificationTypes'

function criteria(overrides: Partial<CertificationCriteria> = {}): CertificationCriteria {
  return {
    id: 'c1',
    name: 'test',
    enabled: true,
    project: null,
    maxInterventionsForAutonomous: 0,
    maxInterventionsForAssisted: 3,
    requireAtLeastOneCompletedTask: true,
    recoveryDisqualifiesAutonomous: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function record(overrides: { tasksCompleted?: number; ceoInterventions?: number; manualOverrides?: number; recoveryEvents?: number } = {}) {
  return { tasksCompleted: 1, ceoInterventions: 0, manualOverrides: 0, recoveryEvents: 0, ...overrides }
}

describe('Certification Policy — certifyFeature', () => {
  it('returns Manual Delivery when no criteria matched', () => {
    expect(certifyFeature(record(), null)).toBe('Manual Delivery')
  })

  it('returns Manual Delivery when tasksCompleted is 0 and the criteria requires at least one', () => {
    expect(certifyFeature(record({ tasksCompleted: 0 }), criteria())).toBe('Manual Delivery')
  })

  it('a zero-task feature CAN still certify if the criteria does not require completed tasks', () => {
    expect(certifyFeature(record({ tasksCompleted: 0 }), criteria({ requireAtLeastOneCompletedTask: false }))).toBe('Certified Autonomous')
  })

  it('zero interventions and zero recovery events certifies Autonomous', () => {
    expect(certifyFeature(record(), criteria())).toBe('Certified Autonomous')
  })

  it('interventions within the assisted threshold but above autonomous certifies Assisted', () => {
    expect(certifyFeature(record({ ceoInterventions: 2 }), criteria())).toBe('Certified Assisted')
  })

  it('interventions above the assisted threshold certifies Manual Delivery', () => {
    expect(certifyFeature(record({ ceoInterventions: 5 }), criteria())).toBe('Manual Delivery')
  })

  it('combines ceoInterventions and manualOverrides into one intervention count', () => {
    expect(certifyFeature(record({ ceoInterventions: 2, manualOverrides: 2 }), criteria())).toBe('Manual Delivery') // 4 total > maxInterventionsForAssisted(3)
  })

  it('recoveryDisqualifiesAutonomous downgrades an otherwise-autonomous feature to Assisted, not Manual', () => {
    const result = certifyFeature(record({ recoveryEvents: 1 }), criteria({ recoveryDisqualifiesAutonomous: true, maxInterventionsForAssisted: 3 }))
    expect(result).toBe('Certified Assisted')
  })

  it('recovery events are ignored when the criteria does not disqualify on them', () => {
    expect(certifyFeature(record({ recoveryEvents: 5 }), criteria({ recoveryDisqualifiesAutonomous: false }))).toBe('Certified Autonomous')
  })

  it('is configuration-driven — the same record produces different results under different criteria', () => {
    const strict = criteria({ maxInterventionsForAutonomous: 0, maxInterventionsForAssisted: 0 })
    const lenient = criteria({ maxInterventionsForAutonomous: 10, maxInterventionsForAssisted: 10 })
    const r = record({ ceoInterventions: 1 })
    expect(certifyFeature(r, strict)).toBe('Manual Delivery')
    expect(certifyFeature(r, lenient)).toBe('Certified Autonomous')
  })
})

describe('Certification Policy — computeQualityScore', () => {
  it('is 0 when nothing was completed', () => {
    expect(
      computeQualityScore({ planningCompleted: false, architectureCompleted: false, knowledgeGathered: false, assessmentCompleted: false, testsExecuted: false, documentationGenerated: 0 })
    ).toBe(0)
  })

  it('is 100 when every signal is achieved', () => {
    expect(
      computeQualityScore({ planningCompleted: true, architectureCompleted: true, knowledgeGathered: true, assessmentCompleted: true, testsExecuted: true, documentationGenerated: 3 })
    ).toBe(100)
  })

  it('treats documentationGenerated as a boolean signal (any count > 0 counts the same as many)', () => {
    const one = computeQualityScore({ planningCompleted: true, architectureCompleted: false, knowledgeGathered: false, assessmentCompleted: false, testsExecuted: false, documentationGenerated: 1 })
    const many = computeQualityScore({ planningCompleted: true, architectureCompleted: false, knowledgeGathered: false, assessmentCompleted: false, testsExecuted: false, documentationGenerated: 50 })
    expect(one).toBe(many)
  })

  it('is proportional — half the signals achieved is 50', () => {
    expect(
      computeQualityScore({ planningCompleted: true, architectureCompleted: true, knowledgeGathered: true, assessmentCompleted: false, testsExecuted: false, documentationGenerated: 0 })
    ).toBe(50)
  })
})
