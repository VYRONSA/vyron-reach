import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising metricsBootstrap.ts's in-memory bootstrapPromise singleton, mirroring every other bootstrap test in this suite. */
async function freshMetricsBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/metrics/metricsBootstrap')
}

describe('Metrics Bootstrap — starts the Event Service subscription and an initial snapshot', () => {
  it('processes a real published event once running', async () => {
    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    await runMetricsBootstrap()

    // vi.resetModules() also gives eventBus.ts and metricsStore.ts fresh
    // instances — re-import them so this test observes the same module
    // registry the bootstrap actually subscribed through.
    const eventBus = await import('../../../lib/dev/events/eventBus')
    const metricsStore = await import('../../../lib/dev/metrics/metricsStore')

    const project = uniqueSlug()
    eventBus.publish({ category: 'Worker Assignment', project, type: 'task-assigned', payload: { taskId: 't1' } })

    await waitFor(() => metricsStore.getMetricsState().counters['throughput.tasksAssigned'] === 1)
  })

  it('takes an initial snapshot for every granularity immediately, not just on the first tick', async () => {
    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    await runMetricsBootstrap()

    const metricsStore = await import('../../../lib/dev/metrics/metricsStore')
    expect(metricsStore.getLatestSnapshot('hourly')).not.toBeNull()
    expect(metricsStore.getLatestSnapshot('daily')).not.toBeNull()
    expect(metricsStore.getLatestSnapshot('weekly')).not.toBeNull()
    expect(metricsStore.getLatestSnapshot('monthly')).not.toBeNull()
  })
})

describe('Metrics Bootstrap — single startup per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    const p1 = runMetricsBootstrap()
    const p2 = runMetricsBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once startup completes', async () => {
    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    await runMetricsBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'metrics-bootstrap.lock'))).toBe(false)
  })
})

describe('Metrics Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'metrics-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )

    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    await runMetricsBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'metrics-bootstrap.lock'))).toBe(false)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'metrics-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runMetricsBootstrap } = await freshMetricsBootstrap()
    await runMetricsBootstrap()

    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
    const metricsStore = await import('../../../lib/dev/metrics/metricsStore')
    expect(metricsStore.getLatestSnapshot('daily')).toBeNull() // never ran — the "live" holder owns bootstrap
  })
})

describe('Metrics Bootstrap — recovery after restart', () => {
  it('a resumed process keeps accumulating from the durably persisted counters, not from zero', async () => {
    const first = await freshMetricsBootstrap()
    await first.runMetricsBootstrap()
    const firstBus = await import('../../../lib/dev/events/eventBus')
    const project = uniqueSlug()
    firstBus.publish({ category: 'Worker Assignment', project, type: 'task-assigned', payload: { taskId: 't1' } })
    const firstStore = await import('../../../lib/dev/metrics/metricsStore')
    await waitFor(() => firstStore.getMetricsState().counters['throughput.tasksAssigned'] === 1)

    // "Restart" — a fresh bootstrap module instance, exactly like the
    // singleton tests above; the durable state on disk is untouched by
    // vi.resetModules().
    const second = await freshMetricsBootstrap()
    await second.runMetricsBootstrap()
    const secondStore = await import('../../../lib/dev/metrics/metricsStore')
    expect(secondStore.getMetricsState().counters['throughput.tasksAssigned']).toBe(1)
  })

  it('a NEW event published after restart is still processed, not silently dropped as a false duplicate (regression: eventBus.ts resets its own seq counter to 0 on every restart, so a fresh process\'s first event reuses seq=1 — the persisted dedup cursor must reset too, or that reused seq looks like something already processed)', async () => {
    const first = await freshMetricsBootstrap()
    await first.runMetricsBootstrap()
    const firstBus = await import('../../../lib/dev/events/eventBus')
    const project = uniqueSlug()
    firstBus.publish({ category: 'Worker Assignment', project, type: 'task-assigned', payload: { taskId: 't1' } }) // this process's seq 1
    const firstStore = await import('../../../lib/dev/metrics/metricsStore')
    await waitFor(() => firstStore.getMetricsState().counters['throughput.tasksAssigned'] === 1)

    const second = await freshMetricsBootstrap()
    await second.runMetricsBootstrap()
    const secondBus = await import('../../../lib/dev/events/eventBus')
    // The fresh eventBus instance also starts back at seq 1 — the exact
    // same seq value the first process already recorded as processed.
    secondBus.publish({ category: 'Worker Completion', project, type: 'task-completed', payload: { taskId: 't1' } })
    const secondStore = await import('../../../lib/dev/metrics/metricsStore')
    await waitFor(() => secondStore.getMetricsState().counters['throughput.tasksCompleted'] === 1)
  })
})
