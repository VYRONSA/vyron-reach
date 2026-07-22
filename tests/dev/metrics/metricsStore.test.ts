import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { getMetricsState, processMetricEvent, recordSnapshot, getLatestSnapshot, querySnapshots, recordTestRun, listTestRuns } from '../../../lib/dev/metrics/metricsStore'
import type { DashboardEvent } from '../../../lib/dev/events/eventTypes'
import type { MetricSnapshot } from '../../../lib/dev/metrics/metricsTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function event(seq: number, overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return { id: `e-${seq}`, seq, category: 'Worker Assignment', project: 'acme', type: 'task-assigned', payload: { taskId: `t${seq}` }, timestamp: '2026-01-01T00:00:00.000Z', ...overrides }
}

describe('Metrics Store — defaults and restart survival', () => {
  it('starts with empty counters', () => {
    const state = getMetricsState()
    expect(state.counters).toEqual({})
    expect(state.lastEventSeq).toBe(0)
  })

  it('a fresh read sees everything a prior process wrote', () => {
    processMetricEvent(event(1))
    const state = getMetricsState()
    expect(state.counters['throughput.tasksAssigned']).toBe(1)
    expect(state.lastEventSeq).toBe(1)
  })
})

describe('Metrics Store — processMetricEvent never loses a concurrent-style sequence of writes', () => {
  it('accumulates correctly across many sequential calls', () => {
    for (let i = 1; i <= 25; i++) processMetricEvent(event(i))
    expect(getMetricsState().counters['throughput.tasksAssigned']).toBe(25)
    expect(getMetricsState().lastEventSeq).toBe(25)
  })
})

describe('Metrics Store — snapshots', () => {
  function snapshot(periodKey: string, timestamp: string): MetricSnapshot {
    return {
      id: `s-${periodKey}`,
      granularity: 'daily',
      timestamp,
      periodKey,
      kpis: {
        throughput: { projectsStarted: 0, projectsCompleted: 0, featuresPlanned: 0, featuresDelivered: 0, tasksAssigned: 0, tasksCompleted: 0, averageFeatureDurationMs: null, averageProjectDurationMs: null },
        automation: { autonomousDecisions: 0, manualOverrides: 0, automationPercentage: null, ceoInterventionPercentage: null, directorDecisions: 0, workerDecisions: 0, schedulerDecisions: 0, recoveryEvents: 0 },
        quality: { technicalDebtCreated: 0, technicalDebtResolved: 0, knowledgeUpdates: 0, documentationGenerated: 0, assessmentAccuracyPercentage: null, riskPredictionAccuracyPercentage: null, planningAccuracyPercentage: null },
        reliability: { recoveryCount: 0, averageRecoveryDurationMs: null, notificationFailures: 0, escalationFrequency: 0, schedulerCycles: 0, workerFailures: 0, retryCounts: 0, incidentsOpened: 0, incidentsResolved: 0, averageIncidentDurationMs: null, rollbacksApproved: 0 },
        performance: { averagePlanningDurationMs: null, averageAssessmentDurationMs: null, averageWorkerDurationMs: null, averageSchedulingDurationMs: null, averageNotificationDurationMs: null, averageEscalationDurationMs: null },
        testing: { testsExecuted: 0, testsPassed: 0, testsFailed: 0, regressionFailures: 0, averageExecutionDurationMs: null },
      },
    }
  }

  it('records and reads back the latest snapshot per granularity', () => {
    recordSnapshot(snapshot('2026-01-01', '2026-01-01T00:00:00.000Z'))
    recordSnapshot(snapshot('2026-01-02', '2026-01-02T00:00:00.000Z'))
    expect(getLatestSnapshot('daily')?.periodKey).toBe('2026-01-02')
  })

  it('paginates snapshots', () => {
    for (let i = 1; i <= 5; i++) recordSnapshot(snapshot(`2026-01-0${i}`, `2026-01-0${i}T00:00:00.000Z`))
    const page = querySnapshots('daily', {}, { pageSize: 2 })
    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(5)
  })
})

describe('Metrics Store — test runs', () => {
  it('records and lists externally-reported test runs', () => {
    recordTestRun({ executed: 100, passed: 98, failed: 2, regressionFailures: 0, durationMs: 30_000 })
    const page = listTestRuns()
    expect(page.total).toBe(1)
    expect(page.items[0].executed).toBe(100)
  })
})
