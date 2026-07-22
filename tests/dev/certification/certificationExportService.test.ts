import { describe, it, expect } from 'vitest'
import { exportFeaturesAsJson, exportFeaturesAsCsv, exportSummaryAsJson, exportSummaryAsCsv, toPdfReadyDocument } from '../../../lib/dev/certification/certificationExportService'
import type { EvidencePack, FeatureCertification, ProjectCertificationSummary } from '../../../lib/dev/certification/certificationTypes'

function feature(overrides: Partial<FeatureCertification> = {}): FeatureCertification {
  return {
    id: 'f1',
    project: 'acme',
    batchId: 'b1',
    batchNumber: 'B1',
    status: 'Certified',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T01:00:00.000Z',
    deliveryDurationMs: 3_600_000,
    planningCompleted: true,
    architectureCompleted: true,
    knowledgeGathered: true,
    assessmentCompleted: true,
    tasksGenerated: 2,
    tasksCompleted: 2,
    testsExecuted: true,
    documentationGenerated: 1,
    recoveryEvents: 0,
    ceoInterventions: 0,
    manualOverrides: 0,
    result: 'Certified Autonomous',
    criteriaId: 'default',
    ...overrides,
  }
}

function summary(overrides: Partial<ProjectCertificationSummary> = {}): ProjectCertificationSummary {
  return {
    project: 'acme',
    totalFeatures: 5,
    certifiedAutonomous: 4,
    certifiedAssisted: 1,
    manualDelivery: 0,
    automationPercentage: 80,
    averageInterventionRate: 0.2,
    averageDeliveryDurationMs: 3_000_000,
    averageQualityScore: 90,
    averageRecoveryFrequency: 0,
    ...overrides,
  }
}

function evidencePack(overrides: Partial<EvidencePack> = {}): EvidencePack {
  return {
    id: 'p1',
    featureCertificationId: 'f1',
    project: 'acme',
    batchId: 'b1',
    generatedAt: '2026-01-01T02:00:00.000Z',
    finalCertification: 'Certified Autonomous',
    automationScore: 100,
    timeline: [{ timestamp: '2026-01-01T00:30:00.000Z', category: 'Handover', title: 'Batch delivered', detail: 'x' }],
    metrics: { tasksGenerated: 2, tasksCompleted: 2, deliveryDurationMs: 3_600_000 },
    recoveryHistory: { recoveryEvents: 0 },
    testingSummary: { executed: 10, passed: 10, failed: 0, runs: 1 },
    architectureSummary: [{ decision: 'Use approach X', reason: 'because', timestamp: '2026-01-01T00:15:00.000Z' }],
    knowledgeSummary: [{ domain: 'handovers', count: 1 }],
    ceoInvolvement: { ceoInterventions: 0, manualOverrides: 0, resolvedItems: [] },
    ...overrides,
  }
}

describe('Certification Export — features', () => {
  it('round-trips feature records as JSON', () => {
    const features = [feature()]
    expect(JSON.parse(exportFeaturesAsJson(features))).toEqual(features)
  })

  it('produces one CSV row per feature with a header', () => {
    const csv = exportFeaturesAsCsv([feature(), feature({ id: 'f2', batchId: 'b2' })])
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
    expect(lines[0]).toContain('result')
  })

  it('handles an empty feature list', () => {
    expect(exportFeaturesAsCsv([])).toBe('')
  })
})

describe('Certification Export — summaries', () => {
  it('round-trips a summary as JSON', () => {
    expect(JSON.parse(exportSummaryAsJson(summary()))).toEqual(summary())
  })

  it('produces exactly one CSV row for a summary', () => {
    const csv = exportSummaryAsCsv(summary())
    expect(csv.trim().split('\n')).toHaveLength(2)
  })
})

describe('Certification Export — PDF-ready structured output', () => {
  it('produces a titled document with every evidence section as a heading', () => {
    const doc = toPdfReadyDocument(evidencePack())
    const headings = doc.sections.map(s => s.heading)
    expect(headings).toEqual([
      'Final Certification',
      'Metrics',
      'Recovery History',
      'Testing Summary',
      'Architecture Summary',
      'Knowledge Summary',
      'CEO Involvement',
      'Timeline',
    ])
    expect(doc.title).toContain('acme')
    expect(doc.title).toContain('b1')
  })

  it('never produces actual PDF bytes — the shape is plain structured data', () => {
    const doc = toPdfReadyDocument(evidencePack())
    expect(() => JSON.stringify(doc)).not.toThrow()
  })
})
