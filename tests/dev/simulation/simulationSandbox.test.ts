import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { runIsolatedSimulation } from '../../../lib/dev/simulation/simulationSandbox'
import { getVyronDevDataDir } from '../../../lib/dev/vyronDevDataDir'
import { subscribe, publish } from '../../../lib/dev/events/eventBus'
import { writeJsonStore, readJsonStore } from '../../../lib/dev/director/fileJsonStore'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import type { DashboardEvent } from '../../../lib/dev/events/eventTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Simulation Sandbox — combined isolation', () => {
  it('scopes both the data directory and the event bus for the duration of fn', async () => {
    let observedDataDir = ''
    const observedEvents: DashboardEvent[] = []

    await runIsolatedSimulation(async () => {
      observedDataDir = getVyronDevDataDir()
      subscribe(e => observedEvents.push(e))
      writeJsonStore('probe.json', { value: 1 })
      publish({ category: 'Worker Assignment', project: 'sim', type: 'task-assigned', payload: {} })
    })

    expect(observedDataDir).not.toBe(isolated.dir) // a genuinely different, throwaway directory
    expect(observedEvents).toHaveLength(1)
  })

  it('cleans up the throwaway directory after fn completes', async () => {
    let dirUsed = ''
    await runIsolatedSimulation(async () => {
      dirUsed = getVyronDevDataDir()
      writeJsonStore('probe.json', { value: 1 })
    })
    expect(fs.existsSync(dirUsed)).toBe(false)
  })

  it('cleans up even when fn throws', async () => {
    let dirUsed = ''
    await expect(
      runIsolatedSimulation(async () => {
        dirUsed = getVyronDevDataDir()
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(fs.existsSync(dirUsed)).toBe(false)
  })

  it('real production service calls inside the sandbox never touch the outer (real) directory', async () => {
    await runIsolatedSimulation(async () => {
      planningStateService.createProject({ name: 'sim-project', slug: 'sim-project', description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    })
    // The outer, test-isolated "real" directory never saw this project.
    expect(planningStateService.listProjects().find(p => p.slug === 'sim-project')).toBeUndefined()
  })

  it('events published inside the sandbox never reach a listener subscribed outside it', async () => {
    const outerReceived: DashboardEvent[] = []
    const unsubscribe = subscribe(e => outerReceived.push(e))
    try {
      await runIsolatedSimulation(async () => {
        publish({ category: 'Worker Assignment', project: 'sim', type: 'task-assigned', payload: {} })
      })
      expect(outerReceived).toHaveLength(0)
    } finally {
      unsubscribe()
    }
  })

  it('two sequential simulation runs never see each other\'s data', async () => {
    await runIsolatedSimulation(async () => {
      writeJsonStore('marker.json', { run: 'first' })
      expect(readJsonStore('marker.json', { run: 'default' })).toEqual({ run: 'first' })
    })
    await runIsolatedSimulation(async () => {
      // A fresh throwaway directory — the first run's file must not exist here.
      expect(readJsonStore('marker.json', { run: 'default' })).toEqual({ run: 'default' })
    })
  })

  it('the outer directory\'s own store is completely unaffected after a simulation runs', async () => {
    writeJsonStore('outer.json', { owner: 'outer' })
    await runIsolatedSimulation(async () => {
      writeJsonStore('outer.json', { owner: 'simulation' })
    })
    expect(readJsonStore('outer.json', { owner: 'MISSING' })).toEqual({ owner: 'outer' })
    expect(fs.existsSync(path.join(isolated.dir, 'outer.json'))).toBe(true)
  })
})
