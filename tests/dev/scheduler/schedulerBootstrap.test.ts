import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { listInAppNotifications } from '../../../lib/dev/notifications/inAppNotificationStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedCompletedProject(project: string) {
  // A Completed-with-no-work project needs zero real Director execution to
  // reach a terminal cycle — exactly what these bootstrap tests need, since
  // they're only exercising the singleton/lock machinery, not scheduling itself.
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'complete', progress: 100, color: '#000', icon: 'x' })
}

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising schedulerBootstrap.ts's in-memory bootstrapPromise singleton, mirroring deliveryBootstrap.test.ts's and recoveryBootstrap.test.ts's identical pattern. */
async function freshSchedulerBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/scheduler/schedulerBootstrap')
}

describe('Scheduler Bootstrap — runs an initial cycle on resume', () => {
  it('runs a scheduling cycle and persists it via the Scheduler Store', async () => {
    const project = uniqueSlug()
    seedCompletedProject(project)

    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    await runSchedulerBootstrap()

    const { getSchedulerState } = await import('../../../lib/dev/scheduler/schedulerStore')
    const state = getSchedulerState()
    expect(state.totalCycles).toBe(1)
    expect(state.lastCycleResult?.order.some(i => i.project === project)).toBe(true)
  })

  it('raises a Scheduler Recovered notification', async () => {
    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    await runSchedulerBootstrap()

    await waitFor(() => listInAppNotifications().some(n => n.type === 'Scheduler Recovered'))
  })
})

describe('Scheduler Bootstrap — single recovery per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    const p1 = runSchedulerBootstrap()
    const p2 = runSchedulerBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once the initial cycle completes', async () => {
    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    await runSchedulerBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'scheduler-bootstrap.lock'))).toBe(false)
  })
})

describe('Scheduler Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'scheduler-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )
    const project = uniqueSlug()
    seedCompletedProject(project)

    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    await runSchedulerBootstrap()

    const { getSchedulerState } = await import('../../../lib/dev/scheduler/schedulerStore')
    expect(getSchedulerState().totalCycles).toBe(1)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'scheduler-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runSchedulerBootstrap } = await freshSchedulerBootstrap()
    await runSchedulerBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
    const { getSchedulerState } = await import('../../../lib/dev/scheduler/schedulerStore')
    expect(getSchedulerState().totalCycles).toBe(0) // never ran — the "live" holder owns bootstrap
  })
})
