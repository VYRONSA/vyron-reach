import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { runSimulation, getSimulation } from '../../../lib/dev/simulation/simulationService'
import { querySimulationReports } from '../../../lib/dev/simulation/simulationStore'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/**
 * Strips run-specific wall-clock timestamps (real, since no virtual
 * clock — see simulationRunner.ts's header doc) so two runs of the
 * identical config can be compared for structural/decision equality.
 * `averageRecoveryDurationMs` is excluded from `measurements` for the
 * same reason: it measures real elapsed wall-clock time during fault
 * recovery (the same category as this app's Scheduler/Assessment
 * `durationMs` event fields) — a genuine performance number, not a
 * decision the seeded RNG controls, so it is never expected to be
 * byte-identical between two runs the way every RNG-driven count/rate
 * below it is.
 */
function normalize(report: Awaited<ReturnType<typeof runSimulation>>) {
  const { averageRecoveryDurationMs: _averageRecoveryDurationMs, ...deterministicMeasurements } = report.measurements
  return {
    scenario: report.scenario,
    measurements: deterministicMeasurements,
    certificationOutcome: report.certificationOutcome,
    failureTypes: report.failures.map(f => f.faultType),
    recoveryTypes: report.recoveries.map(r => r.faultType),
    timelineShape: report.timeline.map(t => `${t.step}:${t.type}`),
  }
}

describe('Simulation Service — deterministic replay / repeatability', () => {
  it('the same scenario, load profile, seed, and faults produce structurally identical results', async () => {
    const first = await runSimulation({ scenario: 'worker-failure', loadProfile: 'Small', seed: 7 })
    const second = await runSimulation({ scenario: 'worker-failure', loadProfile: 'Small', seed: 7 })
    expect(normalize(first)).toEqual(normalize(second))
  }, 20000)

  it('a different seed can produce a different outcome (the RNG is actually being consulted, not ignored)', async () => {
    // Five independent seeds keeps the probability of all of them
    // coincidentally producing the exact same intervention rate low
    // enough to trust, without this test depending on any specific
    // seed's outcome — deterministicRandom.test.ts already proves the
    // underlying PRNG itself diverges reliably per seed; this only needs
    // to confirm the runner actually consults it, not re-prove the PRNG.
    const results = await Promise.all([1, 2, 3, 4, 5].map(seed => runSimulation({ scenario: 'ceo-approval-delay', loadProfile: 'Small', seed })))
    const interventionCounts = results.map(r => r.measurements.averageInterventionRate)
    expect(new Set(interventionCounts).size).toBeGreaterThan(1)
  }, 45000) // real simulation runs — can exceed a short timeout under full-suite parallel load (many other test files' forks competing for the same real file I/O)
})

describe('Simulation Service — fault injection', () => {
  it('every configured fault produces exactly one recorded failure and one recorded recovery', async () => {
    const report = await runSimulation({
      scenario: 'single-project',
      loadProfile: 'Small',
      seed: 1,
      faults: [{ type: 'process-restart', afterStep: 2 }],
    })
    expect(report.failures).toHaveLength(1)
    expect(report.recoveries).toHaveLength(1)
    expect(report.failures[0].faultType).toBe('process-restart')
    expect(report.measurements.recoveryRate).toBe(100)
  })

  it('fault timing is reproducible — the fault fires at the same step every time', async () => {
    const first = await runSimulation({ scenario: 'single-project', loadProfile: 'Small', seed: 3, faults: [{ type: 'scheduler-interruption', afterStep: 4 }] })
    const second = await runSimulation({ scenario: 'single-project', loadProfile: 'Small', seed: 3, faults: [{ type: 'scheduler-interruption', afterStep: 4 }] })
    expect(first.failures[0].step).toBe(second.failures[0].step)
  }, 20000)

  it('multiple faults each recover independently', async () => {
    const report = await runSimulation({
      scenario: 'single-project',
      loadProfile: 'Small',
      seed: 1,
      faults: [
        { type: 'process-restart', afterStep: 2 },
        { type: 'scheduler-interruption', afterStep: 6 },
      ],
    })
    expect(report.failures).toHaveLength(2)
    expect(report.recoveries).toHaveLength(2)
  })

  it('a scenario\'s own default faults fire when the caller specifies none', async () => {
    const report = await runSimulation({ scenario: 'worker-failure', loadProfile: 'Small', seed: 1 })
    expect(report.failures.length).toBeGreaterThan(0)
  })
})

describe('Simulation Service — large workloads', () => {
  it('completes an Enterprise-scale large-planning-set run without error', async () => {
    const report = await runSimulation({ scenario: 'large-planning-set', loadProfile: 'Enterprise', seed: 1 })
    expect(report.status).toBe('Completed')
    expect(report.timeline.length).toBeGreaterThan(50)
  }, 45000)
})

describe('Simulation Service — concurrent projects', () => {
  it('a concurrent-projects scenario certifies features across every project, not just the first', async () => {
    const report = await runSimulation({ scenario: 'concurrent-projects', loadProfile: 'Small', seed: 1 })
    expect(report.certificationOutcome).not.toBeNull()
    const total = report.certificationOutcome!.certifiedAutonomous + report.certificationOutcome!.certifiedAssisted + report.certificationOutcome!.manualDelivery
    expect(total).toBeGreaterThan(1) // multiple projects' features, not one
  })

  it('multiple simulations can run concurrently without interfering with each other\'s results', async () => {
    const [a, b] = await Promise.all([
      runSimulation({ scenario: 'single-project', loadProfile: 'Small', seed: 11 }),
      runSimulation({ scenario: 'worker-failure', loadProfile: 'Small', seed: 22 }),
    ])
    expect(a.scenario).toBe('single-project')
    expect(b.scenario).toBe('worker-failure')
    expect(a.id).not.toBe(b.id)
  }, 20000)
})

describe('Simulation Service — historical reports', () => {
  it('every completed run is queryable afterward via getSimulation and querySimulationReports', async () => {
    const report = await runSimulation({ scenario: 'single-feature', loadProfile: 'Small', seed: 1 })
    expect(getSimulation(report.id)?.id).toBe(report.id)
    expect(querySimulationReports({ scenario: 'single-feature' }).items.some(r => r.id === report.id)).toBe(true)
  })
})

describe('Simulation Service — no production-state corruption', () => {
  it('a simulation never creates real projects visible to the outer (real) Planning Service', async () => {
    await runSimulation({ scenario: 'multiple-projects', loadProfile: 'Medium', seed: 1 })
    expect(planningStateService.listProjects().filter(p => p.category === 'simulation')).toHaveLength(0)
  })

  it('the simulation report itself IS persisted in the real/outer store (evidence, not simulated data)', async () => {
    const report = await runSimulation({ scenario: 'single-feature', loadProfile: 'Small', seed: 1 })
    // Read via the outer (real, test-isolated) data dir directly — proves
    // the report survives even though the simulation's own sandbox was deleted.
    expect(querySimulationReports().items.some(r => r.id === report.id)).toBe(true)
  })
})
