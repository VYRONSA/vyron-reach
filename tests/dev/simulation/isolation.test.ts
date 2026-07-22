import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { getVyronDevDataDir, runWithIsolatedDataDir } from '../../../lib/dev/vyronDevDataDir'
import { publish, subscribe, getCurrentSeq, runWithIsolatedEventBus } from '../../../lib/dev/events/eventBus'
import { writeJsonStore, readJsonStore } from '../../../lib/dev/director/fileJsonStore'
import type { DashboardEvent } from '../../../lib/dev/events/eventTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/**
 * Production Validation 2.1, Milestone 2.1.3 — these tests exist because
 * "No production-state corruption" is the single most safety-critical
 * requirement this milestone introduces. runWithIsolatedDataDir and
 * runWithIsolatedEventBus are what make the Simulation Service able to
 * run real, unmodified production service functions without any risk of
 * touching the real .vyron-dev/ directory or the real Event Service —
 * these tests prove that guarantee directly, independent of anything
 * simulation-specific.
 */

describe('Isolated Data Dir — basic override', () => {
  it('getVyronDevDataDir returns the override while inside runWithIsolatedDataDir', () => {
    const simDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-test-'))
    try {
      runWithIsolatedDataDir(simDir, () => {
        expect(getVyronDevDataDir()).toBe(simDir)
      })
    } finally {
      fs.rmSync(simDir, { recursive: true, force: true })
    }
  })

  it('reverts to the outer directory once the callback returns', () => {
    const before = getVyronDevDataDir()
    const simDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-test-'))
    try {
      runWithIsolatedDataDir(simDir, () => {})
      expect(getVyronDevDataDir()).toBe(before)
    } finally {
      fs.rmSync(simDir, { recursive: true, force: true })
    }
  })

  it('a real store write inside the override lands in the simulation directory, never the outer one', () => {
    const simDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-test-'))
    try {
      runWithIsolatedDataDir(simDir, () => {
        writeJsonStore('probe.json', { value: 'from-simulation' })
      })
      expect(fs.existsSync(path.join(simDir, 'probe.json'))).toBe(true)
      expect(fs.existsSync(path.join(isolated.dir, 'probe.json'))).toBe(false)
      // And the outer (test-isolated) directory reads its own default, untouched.
      expect(readJsonStore('probe.json', { value: 'outer-default' })).toEqual({ value: 'outer-default' })
    } finally {
      fs.rmSync(simDir, { recursive: true, force: true })
    }
  })

  it('propagates through an async chain — the override survives real await boundaries', async () => {
    const simDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-test-'))
    try {
      await runWithIsolatedDataDir(simDir, async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        expect(getVyronDevDataDir()).toBe(simDir)
        await Promise.resolve()
        writeJsonStore('async-probe.json', { ok: true })
      })
      expect(fs.existsSync(path.join(simDir, 'async-probe.json'))).toBe(true)
    } finally {
      fs.rmSync(simDir, { recursive: true, force: true })
    }
  })

  it('two overlapping isolated runs, interleaved via async, never see each other\'s directory', async () => {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-a-'))
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-b-'))
    try {
      const observedA: string[] = []
      const observedB: string[] = []

      const runA = runWithIsolatedDataDir(dirA, async () => {
        observedA.push(getVyronDevDataDir())
        await new Promise(resolve => setTimeout(resolve, 10)) // yield — B's callback interleaves here
        observedA.push(getVyronDevDataDir())
      })
      const runB = runWithIsolatedDataDir(dirB, async () => {
        observedB.push(getVyronDevDataDir())
        await new Promise(resolve => setTimeout(resolve, 5))
        observedB.push(getVyronDevDataDir())
      })

      await Promise.all([runA, runB])

      expect(observedA).toEqual([dirA, dirA])
      expect(observedB).toEqual([dirB, dirB])
    } finally {
      fs.rmSync(dirA, { recursive: true, force: true })
      fs.rmSync(dirB, { recursive: true, force: true })
    }
  })

  it('a concurrent operation OUTSIDE the isolated run never observes the override, even while it is active', async () => {
    const simDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-sim-test-'))
    try {
      const outerObserved: string[] = []
      const outerBefore = getVyronDevDataDir()

      const simRun = runWithIsolatedDataDir(simDir, async () => {
        await new Promise(resolve => setTimeout(resolve, 15))
      })
      // Fired "concurrently" with the simulation above, but from OUTSIDE its run() callback.
      await new Promise(resolve => setTimeout(resolve, 5))
      outerObserved.push(getVyronDevDataDir())

      await simRun
      expect(outerObserved).toEqual([outerBefore])
    } finally {
      fs.rmSync(simDir, { recursive: true, force: true })
    }
  })
})

describe('Isolated Event Bus — basic isolation', () => {
  it('an event published inside runWithIsolatedEventBus never reaches a listener subscribed on the global bus', async () => {
    const globalReceived: DashboardEvent[] = []
    const unsubscribe = subscribe(e => globalReceived.push(e))
    try {
      await runWithIsolatedEventBus(async () => {
        publish({ category: 'Worker Assignment', project: 'sim-project', type: 'task-assigned', payload: { taskId: 'sim-1' } })
      })
      expect(globalReceived).toHaveLength(0)
    } finally {
      unsubscribe()
    }
  })

  it('a listener subscribed inside the isolated bus only ever sees events published inside that same isolated run', async () => {
    const isolatedReceived: DashboardEvent[] = []
    await runWithIsolatedEventBus(async () => {
      subscribe(e => isolatedReceived.push(e))
      publish({ category: 'Worker Assignment', project: 'sim', type: 'task-assigned', payload: { taskId: 't1' } })
    })
    // Publishing on the global bus afterward must never reach the isolated listener either (it's gone with its bus).
    publish({ category: 'Worker Assignment', project: 'prod', type: 'task-assigned', payload: { taskId: 't2' } })
    expect(isolatedReceived).toHaveLength(1)
    expect(isolatedReceived[0].project).toBe('sim')
  })

  it('the isolated bus starts its own seq numbering from a fresh 0, independent of the global bus\'s current count', async () => {
    publish({ category: 'Recovery', project: '*', type: 'x', payload: {} })
    publish({ category: 'Recovery', project: '*', type: 'x', payload: {} })
    const globalSeqBefore = getCurrentSeq()
    expect(globalSeqBefore).toBeGreaterThanOrEqual(2)

    await runWithIsolatedEventBus(async () => {
      const isolatedEvent = publish({ category: 'Worker Assignment', project: 'sim', type: 'task-assigned', payload: {} })
      expect(isolatedEvent.seq).toBe(1) // fresh bus, not continuing the global count
    })

    expect(getCurrentSeq()).toBe(globalSeqBefore) // the global bus's own count is completely unaffected
  })

  it('two overlapping isolated bus runs, interleaved via async, never cross-deliver events to each other', async () => {
    const receivedA: string[] = []
    const receivedB: string[] = []

    const runA = runWithIsolatedEventBus(async () => {
      subscribe(e => receivedA.push(e.project))
      await new Promise(resolve => setTimeout(resolve, 10))
      publish({ category: 'Worker Assignment', project: 'sim-a', type: 'task-assigned', payload: {} })
    })
    const runB = runWithIsolatedEventBus(async () => {
      subscribe(e => receivedB.push(e.project))
      await new Promise(resolve => setTimeout(resolve, 5))
      publish({ category: 'Worker Assignment', project: 'sim-b', type: 'task-assigned', payload: {} })
    })

    await Promise.all([runA, runB])

    expect(receivedA).toEqual(['sim-a'])
    expect(receivedB).toEqual(['sim-b'])
  })
})
