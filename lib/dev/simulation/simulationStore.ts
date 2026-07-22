import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { ScenarioId, SimulationReport, SimulationStatus } from './simulationTypes'

/**
 * "Generate permanent reports." Deliberately on the ordinary
 * fileJsonStore primitives (readJsonStore/updateJsonStore) reading
 * whatever getVyronDevDataDir() currently resolves to OUTSIDE any
 * runIsolatedSimulation scope — a report is evidence ABOUT a simulation,
 * meant to outlive the simulation's own throwaway sandbox directory
 * (which is deleted the moment the run finishes, see
 * simulationSandbox.ts), so it is written to the real data directory
 * (the same one every other permanent record in this app — Evidence
 * Packs, Knowledge Service domains — already lives in), never inside the
 * sandbox. simulationService.ts is the only caller, and only calls this
 * after runIsolatedSimulation has already returned.
 */

const FILE = 'simulation-reports.json'
/** Reports are permanent evidence, not an operational log — capped only to bound worst-case file size over a very long-running deployment running many stress tests, the same reasoning metricsStore.ts's snapshot cap uses. */
const MAX_REPORTS = 5000

export function saveSimulationReport(report: SimulationReport): void {
  updateJsonStore<SimulationReport[]>(FILE, [], current => [report, ...current].slice(0, MAX_REPORTS))
}

export function getSimulationReport(id: string): SimulationReport | null {
  return readJsonStore<SimulationReport[]>(FILE, []).find(r => r.id === id) ?? null
}

export type SimulationReportQueryFilter = {
  scenario?: ScenarioId
  status?: SimulationStatus
  dateRange?: DateRangeFilter
}

export function querySimulationReports(filter: SimulationReportQueryFilter = {}, page: PageRequest = {}): PageResult<SimulationReport> {
  let items = readJsonStore<SimulationReport[]>(FILE, [])
  if (filter.scenario) items = items.filter(r => r.scenario === filter.scenario)
  if (filter.status) items = items.filter(r => r.status === filter.status)
  if (filter.dateRange) items = items.filter(r => inDateRange(r.startedAt, filter.dateRange))
  items = [...items].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return paginate(items, page)
}

export function listAllSimulationReports(): SimulationReport[] {
  return readJsonStore<SimulationReport[]>(FILE, [])
}

/** Records that a simulation has started — before the (possibly slow, for Enterprise load) run actually executes, so "Running simulations" on the dashboard reflects reality rather than only ever showing finished runs. */
export function markSimulationRunning(id: string, scenario: ScenarioId, configuration: SimulationReport['configuration']): SimulationReport {
  const placeholder: SimulationReport = {
    id,
    status: 'Running',
    scenario,
    configuration,
    startedAt: new Date().toISOString(),
    completedAt: null,
    timeline: [],
    measurements: {
      completionRate: null,
      recoveryRate: null,
      failureRate: null,
      averageThroughput: null,
      averageInterventionRate: null,
      automationPercentage: null,
      averageRecoveryDurationMs: null,
      queueGrowth: 0,
      workerUtilisation: null,
      schedulerUtilisation: null,
    },
    failures: [],
    recoveries: [],
    certificationOutcome: null,
    summary: 'Simulation in progress...',
    error: null,
  }
  saveSimulationReport(placeholder)
  return placeholder
}

export function replaceSimulationReport(id: string, report: SimulationReport): void {
  updateJsonStore<SimulationReport[]>(FILE, [], current => current.map(r => (r.id === id ? report : r)))
}
