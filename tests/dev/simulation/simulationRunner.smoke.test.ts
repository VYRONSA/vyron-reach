import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { runIsolatedSimulation } from '../../../lib/dev/simulation/simulationSandbox'
import { executeSimulation } from '../../../lib/dev/simulation/simulationRunner'
import type { SimulationConfig } from '../../../lib/dev/simulation/simulationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function config(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { id: 'smoke-1', scenario: 'single-feature', loadProfile: 'Small', seed: 42, faults: [], createdAt: '2026-01-01T00:00:00.000Z', ...overrides }
}

describe('Simulation Runner — smoke test (single-feature)', () => {
  it('runs end to end and produces a sensible report', async () => {
    const report = await runIsolatedSimulation(() => executeSimulation(config()))
    expect(report.timeline.length).toBeGreaterThan(0)
    expect(report.measurements.completionRate).toBe(100)
    expect(report.certificationOutcome).not.toBeNull()
    expect(report.certificationOutcome!.certifiedAutonomous + report.certificationOutcome!.certifiedAssisted + report.certificationOutcome!.manualDelivery).toBe(1)
    expect(report.summary).toContain('single-feature')
  })
})

describe('Simulation Runner — smoke test across every scenario at Small load', () => {
  const scenarios: SimulationConfig['scenario'][] = [
    'single-feature',
    'multiple-features',
    'single-project',
    'multiple-projects',
    'concurrent-projects',
    'blocked-project',
    'ceo-approval-delay',
    'recovery-during-execution',
    'worker-failure',
    'notification-failure',
    'escalation-chain',
    'long-running-project',
    'large-knowledge-base',
    'large-planning-set',
  ]

  for (const scenario of scenarios) {
    it(`runs "${scenario}" without throwing and produces a complete report`, async () => {
      const report = await runIsolatedSimulation(() => executeSimulation(config({ scenario, id: `smoke-${scenario}` })))
      expect(report.timeline.length).toBeGreaterThan(0)
      expect(report.scenario).toBe(scenario)
      expect(report.certificationOutcome).not.toBeNull()
      expect(typeof report.summary).toBe('string')
    }, 30000)
  }
})

describe('Simulation Runner — never touches the outer (real) data directory', () => {
  it('the outer directory has zero simulated projects after the run', async () => {
    await runIsolatedSimulation(() => executeSimulation(config({ scenario: 'multiple-projects', id: 'no-leak' })))
    const planningStateService = await import('../../../lib/dev/planningState/planningStateService')
    expect(planningStateService.listProjects().filter(p => p.slug.startsWith('sim-'))).toHaveLength(0)
  })
})
