import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { processCertificationEvent, getFeatureCertificationForBatch, listOpenFeatures, queryFeatureCertifications, listCertifiedFeatures, saveEvidencePack, getEvidencePack, getEvidencePackForFeature, listEvidencePacks } from '../../../lib/dev/certification/certificationStore'
import type { DashboardEvent } from '../../../lib/dev/events/eventTypes'
import type { EvidencePack } from '../../../lib/dev/certification/certificationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

let seqCounter = 0
function event(project: string, batchId: string, type: string, overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  seqCounter += 1
  return { id: `e-${seqCounter}`, seq: seqCounter, category: 'Planning Changes', project, type, payload: { batchId }, timestamp: '2026-01-01T00:00:00.000Z', ...overrides }
}

describe('Certification Store — processCertificationEvent restart survival', () => {
  it('a fresh read sees a feature record a prior process created', () => {
    const project = uniqueSlug()
    processCertificationEvent(event(project, 'b1', 'batch-created'))
    expect(getFeatureCertificationForBatch('b1')?.project).toBe(project)
  })

  it('accumulates correctly across many sequential calls', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 10; i++) processCertificationEvent(event(project, `b${i}`, 'batch-created'))
    expect(listOpenFeatures(project)).toHaveLength(10)
  })
})

describe('Certification Store — queries', () => {
  it('filters by project/status/result and paginates', () => {
    const project = uniqueSlug()
    processCertificationEvent(event(project, 'b1', 'batch-created'))
    processCertificationEvent(event(project, 'b1', 'batch-completed'))
    processCertificationEvent(event(project, 'b2', 'batch-created'))

    const certified = queryFeatureCertifications({ project, status: 'Certified' })
    expect(certified.total).toBe(1)
    const open = queryFeatureCertifications({ project, status: 'Open' })
    expect(open.total).toBe(1)
  })

  it('listCertifiedFeatures returns every Certified record regardless of pagination', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 30; i++) {
      processCertificationEvent(event(project, `b${i}`, 'batch-created'))
      processCertificationEvent(event(project, `b${i}`, 'batch-completed'))
    }
    expect(listCertifiedFeatures(project)).toHaveLength(30)
  })
})

describe('Certification Store — evidence packs', () => {
  function pack(overrides: Partial<EvidencePack> = {}): EvidencePack {
    return {
      id: 'p1',
      featureCertificationId: 'f1',
      project: 'acme',
      batchId: 'b1',
      generatedAt: '2026-01-01T00:00:00.000Z',
      finalCertification: 'Certified Autonomous',
      automationScore: 100,
      timeline: [],
      metrics: { tasksGenerated: 1, tasksCompleted: 1, deliveryDurationMs: 1000 },
      recoveryHistory: { recoveryEvents: 0 },
      testingSummary: { executed: 0, passed: 0, failed: 0, runs: 0 },
      architectureSummary: [],
      knowledgeSummary: [],
      ceoInvolvement: { ceoInterventions: 0, manualOverrides: 0, resolvedItems: [] },
      ...overrides,
    }
  }

  it('saves and retrieves an evidence pack by id and by featureCertificationId', () => {
    saveEvidencePack(pack())
    expect(getEvidencePack('p1')?.batchId).toBe('b1')
    expect(getEvidencePackForFeature('f1')?.id).toBe('p1')
  })

  it('paginates evidence packs', () => {
    for (let i = 0; i < 5; i++) saveEvidencePack(pack({ id: `p${i}`, featureCertificationId: `f${i}` }))
    expect(listEvidencePacks({ pageSize: 2 }).items).toHaveLength(2)
    expect(listEvidencePacks({ pageSize: 2 }).total).toBe(5)
  })
})
