import { randomUUID } from 'node:crypto'
import { runIsolatedSimulation } from './simulationSandbox'
import { executeSimulation } from './simulationRunner'
import { markSimulationRunning, replaceSimulationReport, getSimulationReport, querySimulationReports, listAllSimulationReports } from './simulationStore'
import { SCENARIO_IDS } from './simulationScenarios'
import type { FaultInjection, LoadProfileConfig, LoadProfileLabel, ScenarioId, SimulationConfig, SimulationReport } from './simulationTypes'

/**
 * The Simulation Service's public API. Each call to runSimulation gets
 * its own throwaway sandbox (runIsolatedSimulation mints a fresh temp
 * directory and a fresh isolated event bus per call — see
 * simulationSandbox.ts), so multiple simulations can safely run
 * concurrently without any risk of interfering with each other or with
 * the real, live production data/event bus — "Running simulations"
 * (plural) is a natural consequence of the isolation design, not
 * something this file has to coordinate itself.
 */
export type RunSimulationInput = {
  scenario: ScenarioId
  loadProfile: LoadProfileLabel
  customLoad?: LoadProfileConfig
  seed?: number
  faults?: FaultInjection[]
}

export async function runSimulation(input: RunSimulationInput): Promise<SimulationReport> {
  const id = randomUUID()
  const config: SimulationConfig = {
    id,
    scenario: input.scenario,
    loadProfile: input.loadProfile,
    customLoad: input.customLoad,
    seed: input.seed ?? 1,
    faults: input.faults ?? [],
    createdAt: new Date().toISOString(),
  }

  markSimulationRunning(id, config.scenario, config)

  try {
    const result = await runIsolatedSimulation(() => executeSimulation(config))
    const report: SimulationReport = { id, status: 'Completed', error: null, ...result }
    replaceSimulationReport(id, report)
    return report
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const failed: SimulationReport = {
      id,
      status: 'Failed',
      scenario: config.scenario,
      configuration: config,
      startedAt: config.createdAt,
      completedAt: new Date().toISOString(),
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
      summary: `Simulation failed: ${message}`,
      error: message,
    }
    replaceSimulationReport(id, failed)
    return failed
  }
}

export function getSimulation(id: string): SimulationReport | null {
  return getSimulationReport(id)
}

export { querySimulationReports, listAllSimulationReports }
export { SCENARIO_IDS }
