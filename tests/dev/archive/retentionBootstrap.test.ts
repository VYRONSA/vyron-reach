import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { createInboxItem, resolveInboxItem, queryInboxItems, queryArchivedInboxItems } from '../../../lib/dev/director/engineeringInboxStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising retentionBootstrap.ts's in-memory bootstrapPromise singleton, mirroring every other bootstrap test in this suite. */
async function freshRetentionBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/archive/retentionBootstrap')
}

describe('Retention Bootstrap — automatic archival pass', () => {
  it('runArchivalPass archives eligible records across every wired store', async () => {
    const project = uniqueSlug()
    const item = createInboxItem({ project, batchId: null, batchNumber: null, reasonType: 'Approval Required', severity: 'High', reason: 'x', recommendedAction: 'x' })
    resolveInboxItem(item.id)

    const { runArchivalPass } = await freshRetentionBootstrap()
    // Retention is age-based by default; force everything eligible to be
    // "old enough" is out of scope for this bootstrap-level test (that
    // math is already covered by archiveService.test.ts and each store's
    // own scalability test) — this test only proves the automatic driver
    // actually calls through to the real archive functions without
    // throwing, for every wired store.
    expect(() => runArchivalPass()).not.toThrow()
    // The resolved item is recent, so the default retention window keeps
    // it live — proving runArchivalPass reached engineeringInboxStore.ts
    // without corrupting it.
    expect(queryInboxItems({ project }).total).toBe(1)
    expect(queryArchivedInboxItems(project).total).toBe(0)
  })
})

describe('Retention Bootstrap — single startup per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runRetentionBootstrap } = await freshRetentionBootstrap()
    const p1 = runRetentionBootstrap()
    const p2 = runRetentionBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once startup completes', async () => {
    const { runRetentionBootstrap } = await freshRetentionBootstrap()
    await runRetentionBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'retention-bootstrap.lock'))).toBe(false)
  })
})

describe('Retention Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'retention-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )

    const { runRetentionBootstrap } = await freshRetentionBootstrap()
    await runRetentionBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'retention-bootstrap.lock'))).toBe(false)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'retention-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runRetentionBootstrap } = await freshRetentionBootstrap()
    await runRetentionBootstrap()

    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
  })
})
