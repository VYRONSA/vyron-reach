import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { saveSimulationReport, getSimulationReport, querySimulationReports, listAllSimulationReports, markSimulationRunning, replaceSimulationReport } from '../../../lib/dev/simulation/simulationStore'
import type { SimulationConfig, SimulationReport } from '../../../lib/dev/simulation/simulationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function config(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { id: 'c1', scenario: 'single-feature', loadProfile: 'Small', seed: 1, faults: [], createdAt: '2026-01-01T00:00:00.000Z', ...overrides }
}

function report(overrides: Partial<SimulationReport> = {}): SimulationReport {
  return {
    id: 'r1',
    status: 'Completed',
    scenario: 'single-feature',
    configuration: config(),
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:05.000Z',
    timeline: [],
    measurements: {
      completionRate: 100,
      recoveryRate: null,
      failureRate: 0,
      averageThroughput: 1,
      averageInterventionRate: 0,
      automationPercentage: 100,
      averageRecoveryDurationMs: null,
      queueGrowth: 0,
      workerUtilisation: 1,
      schedulerUtilisation: null,
    },
    failures: [],
    recoveries: [],
    certificationOutcome: { certifiedAutonomous: 1, certifiedAssisted: 0, manualDelivery: 0 },
    summary: 'test summary',
    error: null,
    ...overrides,
  }
}

describe('Simulation Store — restart survival', () => {
  it('a fresh read sees a report a prior process wrote', () => {
    saveSimulationReport(report())
    expect(getSimulationReport('r1')?.summary).toBe('test summary')
  })
})

describe('Simulation Store — queries', () => {
  it('filters by scenario and status, paginates', () => {
    saveSimulationReport(report({ id: 'r1', scenario: 'single-feature', status: 'Completed' }))
    saveSimulationReport(report({ id: 'r2', scenario: 'worker-failure', status: 'Failed' }))
    saveSimulationReport(report({ id: 'r3', scenario: 'single-feature', status: 'Running' }))

    expect(querySimulationReports({ scenario: 'single-feature' }).total).toBe(2)
    expect(querySimulationReports({ status: 'Failed' }).total).toBe(1)
    expect(querySimulationReports({}, { pageSize: 2 }).items).toHaveLength(2)
  })

  it('lists newest first', () => {
    saveSimulationReport(report({ id: 'old', startedAt: '2026-01-01T00:00:00.000Z' }))
    saveSimulationReport(report({ id: 'new', startedAt: '2026-01-02T00:00:00.000Z' }))
    expect(querySimulationReports().items[0].id).toBe('new')
  })

  it('listAllSimulationReports returns every record regardless of pagination', () => {
    for (let i = 0; i < 30; i++) saveSimulationReport(report({ id: `r${i}` }))
    expect(listAllSimulationReports()).toHaveLength(30)
  })
})

describe('Simulation Store — running placeholder + replace', () => {
  it('markSimulationRunning creates a visible Running placeholder immediately', () => {
    markSimulationRunning('r1', 'single-feature', config())
    expect(getSimulationReport('r1')?.status).toBe('Running')
    expect(querySimulationReports({ status: 'Running' }).total).toBe(1)
  })

  it('replaceSimulationReport swaps the placeholder for the final report in place', () => {
    markSimulationRunning('r1', 'single-feature', config())
    replaceSimulationReport('r1', report({ id: 'r1', status: 'Completed' }))
    expect(getSimulationReport('r1')?.status).toBe('Completed')
    expect(listAllSimulationReports()).toHaveLength(1) // never duplicated, replaced in place
  })
})
