import { describe, it, expect } from 'vitest'
import { applyEvent } from '../../../lib/dev/metrics/metricClassifier'
import type { MetricsState } from '../../../lib/dev/metrics/metricsTypes'
import type { DashboardEvent, DashboardEventCategory } from '../../../lib/dev/events/eventTypes'

const EMPTY: MetricsState = { counters: {}, durations: {}, spans: {}, pendingRiskFlags: {}, lastEventSeq: 0 }

let seqCounter = 0
function event(category: DashboardEventCategory, type: string, payload: Record<string, unknown>, overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  seqCounter += 1
  return {
    id: `e-${seqCounter}`,
    seq: seqCounter,
    category,
    project: 'acme',
    type,
    payload,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Metric Classifier — no duplicate metrics', () => {
  it('never reapplies an event whose seq is not strictly greater than lastEventSeq', () => {
    const e = event('Worker Assignment', 'task-assigned', { taskId: 't1' }, { seq: 5 })
    const state = { ...EMPTY, lastEventSeq: 5 }
    const next = applyEvent(state, e)
    expect(next).toBe(state) // literally unchanged, not just equal
  })

  it('applying the same event twice through two separate calls only counts once', () => {
    const e = event('Worker Assignment', 'task-assigned', { taskId: 't1' })
    const once = applyEvent(EMPTY, e)
    const twice = applyEvent(once, e)
    expect(twice.counters['throughput.tasksAssigned']).toBe(1)
  })
})

describe('Metric Classifier — throughput', () => {
  it('Project Status director-state-changed to Running counts a project start', () => {
    const next = applyEvent(EMPTY, event('Project Status', 'director-state-changed', { state: 'Running' }))
    expect(next.counters['throughput.projectsStarted']).toBe(1)
  })

  it('Project Status director-state-changed to Completed counts a project completion', () => {
    const next = applyEvent(EMPTY, event('Project Status', 'director-state-changed', { state: 'Completed' }))
    expect(next.counters['throughput.projectsCompleted']).toBe(1)
  })

  it('a project-status-changed type (Planning entity status, not Director state) does not count as a director decision', () => {
    const next = applyEvent(EMPTY, event('Project Status', 'project-status-changed', { status: 'paused' }))
    expect(next.counters['automation.directorDecisions']).toBeUndefined()
  })

  it('batch-created counts Features Planned, batch-completed counts Features Delivered', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }))
    state = applyEvent(state, event('Planning Changes', 'planning-version-bumped', { planningVersion: 2 }))
    state = applyEvent(state, event('Planning Changes', 'batch-completed', { batchId: 'b1' }))
    expect(state.counters['throughput.featuresPlanned']).toBe(1)
    expect(state.counters['throughput.featuresDelivered']).toBe(1)
  })

  it('computes average feature duration by correlating batch-created and batch-completed via batchId', () => {
    let state = applyEvent(EMPTY, event('Planning Changes', 'batch-created', { batchId: 'b1' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Planning Changes', 'batch-completed', { batchId: 'b1' }, { timestamp: '2026-01-01T01:00:00.000Z' }))
    expect(state.durations['throughput.featureDuration']).toEqual({ count: 1, totalMs: 60 * 60 * 1000 })
    expect(state.spans['feature:b1']).toBeUndefined() // span closed, not left dangling
  })

  it('Worker Assignment/Completion tally tasks and compute average worker duration via taskId', () => {
    let state = applyEvent(EMPTY, event('Worker Assignment', 'task-assigned', { taskId: 't1' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Worker Completion', 'task-completed', { taskId: 't1' }, { timestamp: '2026-01-01T00:05:00.000Z' }))
    expect(state.counters['throughput.tasksAssigned']).toBe(1)
    expect(state.counters['throughput.tasksCompleted']).toBe(1)
    expect(state.durations['performance.workerDuration']).toEqual({ count: 1, totalMs: 5 * 60 * 1000 })
  })
})

describe('Metric Classifier — automation', () => {
  it('classifies Worker/Scheduler/Director activity as autonomous decisions, and Inbox closures as manual overrides', () => {
    let state = applyEvent(EMPTY, event('Worker Assignment', 'task-assigned', { taskId: 't1' }))
    state = applyEvent(state, event('Scheduler Activity', 'cycle-completed', { started: ['p1'], waiting: ['p2'], errorCount: 0 }))
    state = applyEvent(state, event('Engineering Inbox', 'item-closed', { itemId: 'i1', status: 'Resolved' }))

    expect(state.counters['automation.autonomousDecisions']).toBe(3) // 1 worker + 2 scheduler (started+waiting)
    expect(state.counters['automation.manualOverrides']).toBe(1)
    expect(state.counters['automation.schedulerDecisions']).toBe(2)
  })

  it('Recovery events increment both reliability.recoveryCount and automation.recoveryEvents', () => {
    const state = applyEvent(EMPTY, event('Recovery', 'director-recovery-completed', { durationMs: 120 }, { project: '*' }))
    expect(state.counters['reliability.recoveryCount']).toBe(1)
    expect(state.counters['automation.recoveryEvents']).toBe(1)
    expect(state.durations['reliability.recoveryDuration']).toEqual({ count: 1, totalMs: 120 })
  })
})

describe('Metric Classifier — quality', () => {
  it('Knowledge Updates with timelineCategory Technical Debt counts technical debt created', () => {
    const state = applyEvent(EMPTY, event('Knowledge Updates', 'timeline-event-recorded', { timelineCategory: 'Technical Debt', title: 'x' }))
    expect(state.counters['quality.knowledgeUpdates']).toBe(1)
    expect(state.counters['quality.technicalDebtCreated']).toBe(1)
  })

  it('Knowledge Updates with timelineCategory Handover counts documentation generated', () => {
    const state = applyEvent(EMPTY, event('Knowledge Updates', 'timeline-event-recorded', { timelineCategory: 'Handover', title: 'x' }))
    expect(state.counters['quality.documentationGenerated']).toBe(1)
  })

  it('technical-debt-resolved (Planning Changes) counts resolution, distinct from creation', () => {
    const state = applyEvent(EMPTY, event('Planning Changes', 'technical-debt-resolved', { debtId: 'd1', title: 'x' }))
    expect(state.counters['quality.technicalDebtResolved']).toBe(1)
    expect(state.counters['quality.technicalDebtCreated']).toBeUndefined()
  })

  it('Assessment Updates tallies total and healthy counts, and samples duration when provided', () => {
    let state = applyEvent(EMPTY, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Healthy', riskLevel: 'Low', durationMs: 42 }))
    state = applyEvent(state, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Critical', riskLevel: 'High', durationMs: 58 }))
    expect(state.counters['quality.assessmentsTotal']).toBe(2)
    expect(state.counters['quality.assessmentsHealthy']).toBe(1)
    expect(state.durations['performance.assessmentDuration']).toEqual({ count: 2, totalMs: 100 })
    expect(state.counters['quality.riskFlagsHigh']).toBe(1)
  })

  it('a High risk flag confirmed by a same-day Escalation reminder counts toward risk prediction accuracy', () => {
    let state = applyEvent(EMPTY, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Critical', riskLevel: 'High' }, { timestamp: '2026-01-01T08:00:00.000Z' }))
    state = applyEvent(state, event('Escalation', 'reminder-sent', { inboxItemId: 'i1', level: 1 }, { timestamp: '2026-01-01T20:00:00.000Z' }))
    expect(state.counters['quality.riskFlagsConfirmed']).toBe(1)
    expect(state.pendingRiskFlags.acme).toBeUndefined() // consumed, not left pending forever
  })

  it('a High risk flag NOT followed by same-day escalation is never confirmed', () => {
    let state = applyEvent(EMPTY, event('Assessment Updates', 'assessment-changed', { engineeringHealth: 'Critical', riskLevel: 'High' }, { timestamp: '2026-01-01T08:00:00.000Z' }))
    state = applyEvent(state, event('Escalation', 'reminder-sent', { inboxItemId: 'i1', level: 1 }, { timestamp: '2026-01-03T08:00:00.000Z' }))
    expect(state.counters['quality.riskFlagsConfirmed']).toBeUndefined()
  })
})

describe('Metric Classifier — reliability', () => {
  it('Notification Delivery failures and retries are tallied, and delivery duration is measured queued-to-terminal', () => {
    let state = applyEvent(EMPTY, event('Notification Delivery', 'delivery-queued', { deliveryId: 'd1', provider: 'Email', status: 'Queued' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Notification Delivery', 'delivery-status-changed', { deliveryId: 'd1', provider: 'Email', status: 'Retrying' }, { timestamp: '2026-01-01T00:00:05.000Z' }))
    state = applyEvent(state, event('Notification Delivery', 'delivery-status-changed', { deliveryId: 'd1', provider: 'Email', status: 'Failed' }, { timestamp: '2026-01-01T00:00:10.000Z' }))
    expect(state.counters['reliability.retryCounts']).toBe(1)
    expect(state.counters['reliability.notificationFailures']).toBe(1)
    expect(state.durations['performance.notificationDuration']).toEqual({ count: 1, totalMs: 10_000 })
  })

  it('an Engineering Inbox item opened for Worker Review Required counts a worker failure', () => {
    const state = applyEvent(EMPTY, event('Engineering Inbox', 'item-opened', { itemId: 'i1', reasonType: 'Worker Review Required', severity: 'High' }))
    expect(state.counters['reliability.workerFailures']).toBe(1)
  })

  it('an Engineering Inbox item opened for any other reason does not count a worker failure', () => {
    const state = applyEvent(EMPTY, event('Engineering Inbox', 'item-opened', { itemId: 'i1', reasonType: 'Approval Required', severity: 'High' }))
    expect(state.counters['reliability.workerFailures']).toBeUndefined()
  })

  it('Scheduler Activity tallies cycles and samples scheduling duration', () => {
    const state = applyEvent(EMPTY, event('Scheduler Activity', 'cycle-completed', { started: [], waiting: [], errorCount: 0, durationMs: 250 }))
    expect(state.counters['reliability.schedulerCycles']).toBe(1)
    expect(state.durations['performance.schedulingDuration']).toEqual({ count: 1, totalMs: 250 })
  })

  it('escalation reminders tally escalation frequency', () => {
    let state = applyEvent(EMPTY, event('Escalation', 'reminder-sent', { inboxItemId: 'i1', level: 1 }))
    state = applyEvent(state, event('Escalation', 'reminder-sent', { inboxItemId: 'i2', level: 1 }))
    expect(state.counters['reliability.escalationFrequency']).toBe(2)
  })

  // Wave 4 (Orphaned Event Category) — 'Operations' events now flow into
  // real, displayed metrics (reliability.incidentsOpened/Resolved,
  // reliability.rollbacksApproved, and an incident-duration sample), the
  // same "real consumer" bar every other category in this file already
  // meets.
  it('an Operations incident-opened event tallies incidentsOpened', () => {
    const state = applyEvent(EMPTY, event('Operations', 'incident-opened', { incidentId: 'inc1', severity: 'Critical', relatedReleaseId: 'r1' }))
    expect(state.counters['reliability.incidentsOpened']).toBe(1)
  })

  it('an Operations incident-resolved event tallies incidentsResolved and samples its duration', () => {
    const state = applyEvent(EMPTY, event('Operations', 'incident-resolved', { incidentId: 'inc1', severity: 'Critical', durationMs: 45_000 }))
    expect(state.counters['reliability.incidentsResolved']).toBe(1)
    expect(state.durations['reliability.incidentDuration']).toEqual({ count: 1, totalMs: 45_000 })
  })

  it('an Operations rollback-decision event only tallies rollbacksApproved on a Go, never on a Hold, and never counts as an autonomous decision', () => {
    let state = applyEvent(EMPTY, event('Operations', 'rollback-decision', { incidentId: 'inc1', decision: 'Hold', executive: 'ceo' }))
    expect(state.counters['reliability.rollbacksApproved']).toBeUndefined()
    expect(state.counters['automation.autonomousDecisions']).toBeUndefined()

    state = applyEvent(state, event('Operations', 'rollback-decision', { incidentId: 'inc2', decision: 'Go', executive: 'ceo' }))
    expect(state.counters['reliability.rollbacksApproved']).toBe(1)
    expect(state.counters['automation.autonomousDecisions']).toBeUndefined()
  })

  it('Operations incident-refreshed and rollback-pending events are deliberately not counted (re-observations, not new facts)', () => {
    let state = applyEvent(EMPTY, event('Operations', 'incident-refreshed', { incidentId: 'inc1', severity: 'High', status: 'Open' }))
    state = applyEvent(state, event('Operations', 'rollback-pending', { incidentId: 'inc1', rollbackTargetReleaseId: 'r0' }))
    expect(state.counters['reliability.incidentsOpened']).toBeUndefined()
    expect(Object.keys(state.counters)).toHaveLength(0)
  })
})

describe('Metric Classifier — performance spans', () => {
  it('measures planning duration from entering Planning to entering Running', () => {
    let state = applyEvent(EMPTY, event('Project Status', 'director-state-changed', { state: 'Planning' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Project Status', 'director-state-changed', { state: 'Running' }, { timestamp: '2026-01-01T00:10:00.000Z' }))
    expect(state.durations['performance.planningDuration']).toEqual({ count: 1, totalMs: 10 * 60 * 1000 })
  })

  it('escalation duration is measured monitoring-started to monitoring-closed via inboxItemId', () => {
    let state = applyEvent(EMPTY, event('Escalation', 'monitoring-started', { inboxItemId: 'i1', ruleId: 'default' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Escalation', 'monitoring-closed', { inboxItemId: 'i1', outcome: 'Resolved' }, { timestamp: '2026-01-01T02:00:00.000Z' }))
    expect(state.durations['performance.escalationDuration']).toEqual({ count: 1, totalMs: 2 * 60 * 60 * 1000 })
  })

  it('project duration survives a pause/resume cycle — the span opens once and is not reset by a second Running transition', () => {
    let state = applyEvent(EMPTY, event('Project Status', 'director-state-changed', { state: 'Running' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    state = applyEvent(state, event('Project Status', 'director-state-changed', { state: 'Running' }, { timestamp: '2026-01-01T05:00:00.000Z' })) // resumed after a pause
    state = applyEvent(state, event('Project Status', 'director-state-changed', { state: 'Completed' }, { timestamp: '2026-01-01T06:00:00.000Z' }))
    // Duration measured from the FIRST Running, not the resume — 6 hours, not 1.
    expect(state.durations['throughput.projectDuration']).toEqual({ count: 1, totalMs: 6 * 60 * 60 * 1000 })
  })
})

describe('Metric Classifier — negative/malformed duration safety', () => {
  it('never records a negative duration sample (e.g. an end event that somehow precedes its start)', () => {
    let state = applyEvent(EMPTY, event('Worker Assignment', 'task-assigned', { taskId: 't1' }, { timestamp: '2026-01-01T01:00:00.000Z' }))
    state = applyEvent(state, event('Worker Completion', 'task-completed', { taskId: 't1' }, { timestamp: '2026-01-01T00:00:00.000Z' }))
    expect(state.durations['performance.workerDuration']).toBeUndefined()
  })
})
