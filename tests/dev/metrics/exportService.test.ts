import { describe, it, expect } from 'vitest'
import { exportKpisAsJson, exportKpisAsCsv, exportSnapshotsAsJson, exportSnapshotsAsCsv, flattenKpis } from '../../../lib/dev/metrics/exportService'
import type { MetricsKpis, MetricSnapshot } from '../../../lib/dev/metrics/metricsTypes'

function kpis(overrides: Partial<MetricsKpis['throughput']> = {}): MetricsKpis {
  return {
    throughput: { projectsStarted: 3, projectsCompleted: 1, featuresPlanned: 5, featuresDelivered: 2, tasksAssigned: 10, tasksCompleted: 8, averageFeatureDurationMs: 1000, averageProjectDurationMs: null, ...overrides },
    automation: { autonomousDecisions: 9, manualOverrides: 1, automationPercentage: 90, ceoInterventionPercentage: 10, directorDecisions: 4, workerDecisions: 3, schedulerDecisions: 2, recoveryEvents: 1 },
    quality: { technicalDebtCreated: 2, technicalDebtResolved: 1, knowledgeUpdates: 6, documentationGenerated: 3, assessmentAccuracyPercentage: 80, riskPredictionAccuracyPercentage: 50, planningAccuracyPercentage: 40 },
    reliability: { recoveryCount: 1, averageRecoveryDurationMs: 500, notificationFailures: 0, escalationFrequency: 2, schedulerCycles: 10, workerFailures: 1, retryCounts: 3, incidentsOpened: 2, incidentsResolved: 1, averageIncidentDurationMs: 600, rollbacksApproved: 1 },
    performance: { averagePlanningDurationMs: 100, averageAssessmentDurationMs: 200, averageWorkerDurationMs: 300, averageSchedulingDurationMs: 50, averageNotificationDurationMs: 400, averageEscalationDurationMs: 5000 },
    testing: { testsExecuted: 100, testsPassed: 95, testsFailed: 5, regressionFailures: 1, averageExecutionDurationMs: 30_000 },
  }
}

describe('Export Service — flattenKpis', () => {
  it('flattens every nested category.field into one flat record', () => {
    const flat = flattenKpis(kpis())
    expect(flat['throughput.projectsStarted']).toBe(3)
    expect(flat['automation.automationPercentage']).toBe(90)
    expect(flat['testing.testsExecuted']).toBe(100)
  })

  it('preserves null values rather than dropping or coercing them', () => {
    const flat = flattenKpis(kpis())
    expect(flat['throughput.averageProjectDurationMs']).toBeNull()
  })
})

describe('Export Service — JSON', () => {
  it('round-trips the exact KPI structure', () => {
    const k = kpis()
    const parsed = JSON.parse(exportKpisAsJson(k))
    expect(parsed).toEqual(k)
  })
})

describe('Export Service — CSV', () => {
  it('produces a header row and exactly one data row for a current-KPI export', () => {
    const csv = exportKpisAsCsv(kpis())
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('throughput.projectsStarted')
    expect(lines[1].split(',')).toHaveLength(lines[0].split(',').length)
  })

  it('renders null as an empty cell, not the string "null"', () => {
    const csv = exportKpisAsCsv(kpis())
    const [header, row] = csv.trim().split('\n')
    const idx = header.split(',').indexOf('throughput.averageProjectDurationMs')
    expect(row.split(',')[idx]).toBe('')
  })

  it('escapes values containing commas or quotes', () => {
    // A snapshot's periodKey never contains these, but the CSV writer is
    // generic — prove it handles a value that would otherwise corrupt column alignment.
    const snapshot: MetricSnapshot = { id: 's1', granularity: 'daily', timestamp: 't', periodKey: 'has,comma', kpis: kpis() }
    const csv = exportSnapshotsAsCsv([snapshot])
    expect(csv).toContain('"has,comma"')
  })

  it('produces one row per snapshot for a history export', () => {
    const snapshots: MetricSnapshot[] = [
      { id: 's1', granularity: 'daily', timestamp: 't1', periodKey: '2026-01-01', kpis: kpis() },
      { id: 's2', granularity: 'daily', timestamp: 't2', periodKey: '2026-01-02', kpis: kpis({ projectsStarted: 4 }) },
    ]
    const csv = exportSnapshotsAsCsv(snapshots)
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
  })

  it('handles an empty snapshot list without throwing', () => {
    expect(() => exportSnapshotsAsCsv([])).not.toThrow()
    expect(exportSnapshotsAsCsv([])).toContain('periodKey')
  })
})

describe('Export Service — snapshot JSON', () => {
  it('round-trips a snapshot list exactly', () => {
    const snapshots: MetricSnapshot[] = [{ id: 's1', granularity: 'weekly', timestamp: 't1', periodKey: '2026-W01', kpis: kpis() }]
    expect(JSON.parse(exportSnapshotsAsJson(snapshots))).toEqual(snapshots)
  })
})
