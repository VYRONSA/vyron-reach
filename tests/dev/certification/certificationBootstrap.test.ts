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

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — mirrors every other bootstrap test in this suite (metricsBootstrap.test.ts, escalationBootstrap.test.ts, ...). */
async function freshCertificationBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/certification/certificationBootstrap')
}

describe('Certification Bootstrap — starts the Event Service subscription', () => {
  it('processes a real published batch-created event once running', async () => {
    const { runCertificationBootstrap } = await freshCertificationBootstrap()
    await runCertificationBootstrap()

    const eventBus = await import('../../../lib/dev/events/eventBus')
    const certificationStore = await import('../../../lib/dev/certification/certificationStore')

    const project = uniqueSlug()
    eventBus.publish({ category: 'Planning Changes', project, type: 'batch-created', payload: { batchId: 'b1' } })

    await waitFor(() => certificationStore.getFeatureCertificationForBatch('b1') !== null)
  })
})

describe('Certification Bootstrap — single startup per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runCertificationBootstrap } = await freshCertificationBootstrap()
    const p1 = runCertificationBootstrap()
    const p2 = runCertificationBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once startup completes', async () => {
    const { runCertificationBootstrap } = await freshCertificationBootstrap()
    await runCertificationBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'certification-bootstrap.lock'))).toBe(false)
  })
})

describe('Certification Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(path.join(isolated.dir, 'certification-bootstrap.lock'), JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runCertificationBootstrap } = await freshCertificationBootstrap()
    await runCertificationBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'certification-bootstrap.lock'))).toBe(false)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'certification-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runCertificationBootstrap } = await freshCertificationBootstrap()
    await runCertificationBootstrap()

    expect(fs.existsSync(lockFile)).toBe(true)
    const certificationStore = await import('../../../lib/dev/certification/certificationStore')
    expect(certificationStore.getFeatureCertificationForBatch('never-created')).toBeNull()
  })
})

describe('Certification Bootstrap — recovery after restart', () => {
  it('a resumed process keeps updating the same durably persisted feature record, not a fresh one', async () => {
    const first = await freshCertificationBootstrap()
    await first.runCertificationBootstrap()
    const firstBus = await import('../../../lib/dev/events/eventBus')
    const project = uniqueSlug()
    firstBus.publish({ category: 'Planning Changes', project, type: 'batch-created', payload: { batchId: 'b1' } })
    const firstStore = await import('../../../lib/dev/certification/certificationStore')
    await waitFor(() => firstStore.getFeatureCertificationForBatch('b1') !== null)

    // "Restart" — a fresh bootstrap module instance; durable state on disk is untouched by vi.resetModules().
    const second = await freshCertificationBootstrap()
    await second.runCertificationBootstrap()
    const secondBus = await import('../../../lib/dev/events/eventBus')
    secondBus.publish({ category: 'Worker Assignment', project, type: 'task-assigned', payload: { taskId: 't1', batchId: 'b1' } })
    const secondStore = await import('../../../lib/dev/certification/certificationStore')
    await waitFor(() => secondStore.getFeatureCertificationForBatch('b1')?.tasksGenerated === 1)
    // Still the same record (one Open feature for b1), not a duplicate created by the resumed process.
    expect(secondStore.listOpenFeatures(project)).toHaveLength(1)
  })
})
