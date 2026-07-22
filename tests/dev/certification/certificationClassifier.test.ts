import { describe, it, expect } from 'vitest'
import { applyEvent, type CertificationState } from '../../../lib/dev/certification/certificationClassifier'
import type { CertificationCriteria } from '../../../lib/dev/certification/certificationTypes'
import type { DashboardEvent, DashboardEventCategory } from '../../../lib/dev/events/eventTypes'

const EMPTY: CertificationState = { lastEventSeq: 0, records: [] }

function defaultCriteria(overrides: Partial<CertificationCriteria> = {}): CertificationCriteria[] {
  return [
    {
      id: 'default',
      name: 'default',
      enabled: true,
      project: null,
      maxInterventionsForAutonomous: 0,
      maxInterventionsForAssisted: 3,
      requireAtLeastOneCompletedTask: true,
      recoveryDisqualifiesAutonomous: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    },
  ]
}

let seqCounter = 0
function event(category: DashboardEventCategory, type: string, payload: Record<string, unknown>, overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  seqCounter += 1
  return { id: `e-${seqCounter}`, seq: seqCounter, category, project: 'acme', type, payload, timestamp: '2026-01-01T00:00:00.000Z', ...overrides }
}

describe('Certification Classifier — feature lifecycle', () => {
  it('batch-created opens a new feature record with Planning already completed', () => {
    const state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1', batchNumber: 'B1' }), defaultCriteria())
    expect(state.records).toHaveLength(1)
    expect(state.records[0]).toMatchObject({ project: 'acme', batchId: 'b1', batchNumber: 'B1', status: 'Open', planningCompleted: true })
  })

  it('a second batch-created for a batchId that already has a record never creates a duplicate — even with a genuinely new, non-duplicate seq', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-created', { batchId: 'b1' }), defaultCriteria()) // a second, properly-sequenced event for the same batchId
    expect(state.records.filter(r => r.batchId === 'b1')).toHaveLength(1)
  })

  it('batch-completed closes the record, computes delivery duration, and assigns a certification result', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { timestamp: '2026-01-01T00:00:00.000Z' }), defaultCriteria())
    state = applyEvent(state, event('Worker Assignment', 'task-assigned', { taskId: 't1', batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Worker Completion', 'task-completed', { taskId: 't1', batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-completed', { batchId: 'b1' }, { timestamp: '2026-01-01T01:00:00.000Z' }), defaultCriteria())

    const record = state.records[0]
    expect(record.status).toBe('Certified')
    expect(record.deliveryDurationMs).toBe(60 * 60 * 1000)
    expect(record.result).toBe('Certified Autonomous') // zero interventions, at least one completed task
    expect(record.criteriaId).toBe('default')
  })

  it('batch-completed for an unknown batchId (no matching Open record) is a safe no-op', () => {
    const state = applyEvent(EMPTY, event('Planning Changes', 'batch-completed', { batchId: 'nonexistent' }), defaultCriteria())
    expect(state.records).toHaveLength(0)
  })
})

describe('Certification Classifier — no duplicate certification', () => {
  it('never reapplies an event whose seq is not strictly greater than lastEventSeq', () => {
    const e = event('Worker Assignment', 'task-assigned', { taskId: 't1', batchId: 'b1' }, { seq: 5 })
    const state = { ...EMPTY, lastEventSeq: 5 }
    expect(applyEvent(state, e, defaultCriteria())).toBe(state)
  })
})

describe('Certification Classifier — task and knowledge correlation via batchId', () => {
  it('tallies tasksGenerated/tasksCompleted only for the matching open batchId', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-created', { batchId: 'b2' }), defaultCriteria())
    state = applyEvent(state, event('Worker Assignment', 'task-assigned', { taskId: 't1', batchId: 'b1' }), defaultCriteria())

    const b1 = state.records.find(r => r.batchId === 'b1')!
    const b2 = state.records.find(r => r.batchId === 'b2')!
    expect(b1.tasksGenerated).toBe(1)
    expect(b2.tasksGenerated).toBe(0)
  })

  it('Architecture Decision knowledge events mark architectureCompleted, Handover events increment documentationGenerated', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Knowledge Updates', 'timeline-event-recorded', { timelineCategory: 'Architecture Decision', title: 'x', batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Knowledge Updates', 'timeline-event-recorded', { timelineCategory: 'Handover', title: 'x', batchId: 'b1' }), defaultCriteria())

    const record = state.records[0]
    expect(record.architectureCompleted).toBe(true)
    expect(record.knowledgeGathered).toBe(true)
    expect(record.documentationGenerated).toBe(1)
  })

  it('a Knowledge Updates event with no batchId (null) is never attributed to any feature', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }), defaultCriteria())
    state = applyEvent(state, event('Knowledge Updates', 'timeline-event-recorded', { timelineCategory: 'Architecture Decision', title: 'x', batchId: null }), defaultCriteria())
    expect(state.records[0].architectureCompleted).toBe(false)
  })
})

describe('Certification Classifier — project-scoped and global signals', () => {
  it('Assessment Updates credits every open feature for that project, not other projects', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-created', { batchId: 'b2' }, { project: 'other' }), defaultCriteria())
    state = applyEvent(state, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Healthy' }, { project: 'acme' }), defaultCriteria())

    expect(state.records.find(r => r.batchId === 'b1')!.assessmentCompleted).toBe(true)
    expect(state.records.find(r => r.batchId === 'b2')!.assessmentCompleted).toBe(false)
  })

  it('a Testing event credits every open feature everywhere', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-created', { batchId: 'b2' }, { project: 'other' }), defaultCriteria())
    state = applyEvent(state, event('Testing', 'test-run-recorded', { testRunId: 'r1', executed: 10, passed: 10, failed: 0 }, { project: '*' }), defaultCriteria())

    expect(state.records.every(r => r.testsExecuted)).toBe(true)
  })

  it('a Recovery event increments recoveryEvents for every open feature everywhere', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Recovery', 'director-recovery-completed', { durationMs: 100 }, { project: '*' }), defaultCriteria())
    expect(state.records[0].recoveryEvents).toBe(1)
  })

  it('a Certified (closed) feature never gets credited by a later project/global event', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Planning Changes', 'batch-completed', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Healthy' }, { project: 'acme' }), defaultCriteria())
    expect(state.records[0].assessmentCompleted).toBe(false) // closed before the assessment arrived
  })
})

describe('Certification Classifier — CEO interventions vs manual overrides', () => {
  it('every closed inbox item counts as a CEO intervention; only Dismissed counts as a manual override', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Engineering Inbox', 'item-closed', { itemId: 'i1', status: 'Resolved' }, { project: 'acme' }), defaultCriteria())
    state = applyEvent(state, event('Engineering Inbox', 'item-closed', { itemId: 'i2', status: 'Dismissed' }, { project: 'acme' }), defaultCriteria())

    expect(state.records[0].ceoInterventions).toBe(2)
    expect(state.records[0].manualOverrides).toBe(1)
  })
})
