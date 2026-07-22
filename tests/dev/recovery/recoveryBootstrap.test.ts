import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { recoverActiveDirectorsOnStartup } from '../../../lib/dev/director/serverExecutionLoop'
import { getDirectorStatus, patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { saveExecutionSnapshot } from '../../../lib/dev/director/executionSnapshotStore'
import type { HandoffInput } from '../../../lib/dev/director/executionSnapshotTypes'
import type { Batch } from '../../../lib/dev/batchesStorage'
import type { Milestone } from '../../../lib/dev/milestonesStorage'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising recoveryBootstrap.ts's in-memory bootstrapPromise singleton, which by design must NOT be reset between ordinary calls within one process. */
async function freshRecoveryBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/director/recoveryBootstrap')
}

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'b1', batchNumber: 'B1', milestone: 'm1', objective: '', summary: '', completedTasks: '',
    lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Complete', archived: false,
    sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function milestone(project: string, overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm1', project, title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '',
    progress: 0, status: 'Upcoming', archived: false, sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function seedRecoverableProject(project: string) {
  patchDirectorStatus(project, { state: 'Running' })
  const h: HandoffInput = {
    project, projectName: project, projectTagline: '', projectDescription: '',
    milestones: [milestone(project)], batches: [batch()],
    decisions: [], technicalDebt: [], openRisks: [], developmentRules: '',
    productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
  }
  saveExecutionSnapshot({ ...h, completions: [], handedOffAt: new Date().toISOString() })
}

describe('Recovery — single recovery per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller in the same process, regardless of how many times it is called', async () => {
    const { runRecoveryBootstrap } = await freshRecoveryBootstrap()
    const p1 = runRecoveryBootstrap()
    const p2 = runRecoveryBootstrap()
    const p3 = runRecoveryBootstrap()
    expect(p1).toBe(p2)
    expect(p2).toBe(p3)
    await p1
  })

  it('writes exactly one startup-recovery record even when called concurrently many times', async () => {
    const { runRecoveryBootstrap } = await freshRecoveryBootstrap()
    await Promise.all(Array.from({ length: 10 }, () => runRecoveryBootstrap()))
    const record = JSON.parse(fs.readFileSync(path.join(isolated.dir, 'recovery-bootstrap.json'), 'utf-8'))
    expect(record.pid).toBe(process.pid)
  })

  it('releases the bootstrap lock once recovery completes', async () => {
    const { runRecoveryBootstrap } = await freshRecoveryBootstrap()
    await runRecoveryBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'recovery-bootstrap.lock'))).toBe(false)
  })
})

describe('Recovery — bootstrap lock reclaim (crash recovery of the recovery process itself)', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'recovery-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )
    const { runRecoveryBootstrap } = await freshRecoveryBootstrap()
    await runRecoveryBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'recovery-bootstrap.json'))).toBe(true)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'recovery-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const { runRecoveryBootstrap } = await freshRecoveryBootstrap()
    await runRecoveryBootstrap()

    expect(fs.existsSync(path.join(isolated.dir, 'recovery-bootstrap.json'))).toBe(false)
    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
  })
})

describe('Recovery — crash recovery of interrupted Director loops', () => {
  it('re-attempts every Running/Planning project that has a persisted execution snapshot', async () => {
    const running = uniqueSlug('running')
    seedRecoverableProject(running)

    recoverActiveDirectorsOnStartup()

    await waitFor(() => getDirectorStatus(running).state === 'Completed')
  })

  it('skips a Running project that has no persisted execution snapshot, rather than crashing', () => {
    const orphaned = uniqueSlug('orphaned')
    patchDirectorStatus(orphaned, { state: 'Running' }) // no snapshot saved
    expect(() => recoverActiveDirectorsOnStartup()).not.toThrow()
    // acquireLoopOwnership is never even attempted for this project — synchronously verifiable.
    expect(getDirectorStatus(orphaned).state).toBe('Running')
  })

  it('never touches an Idle, Completed, Blocked, or Waiting-for-CEO project', () => {
    const idle = uniqueSlug('idle')
    const completed = uniqueSlug('completed')
    const blocked = uniqueSlug('blocked')
    const waiting = uniqueSlug('waiting')
    patchDirectorStatus(completed, { state: 'Completed' })
    patchDirectorStatus(blocked, { state: 'Blocked' })
    patchDirectorStatus(waiting, { state: 'Waiting for CEO' })
    // `idle` is never patched at all — getDirectorStatus defaults it to Idle.

    recoverActiveDirectorsOnStartup()

    expect(getDirectorStatus(idle).state).toBe('Idle')
    expect(getDirectorStatus(completed).state).toBe('Completed')
    expect(getDirectorStatus(blocked).state).toBe('Blocked')
    expect(getDirectorStatus(waiting).state).toBe('Waiting for CEO')
  })
})

describe('Recovery — loop ownership / stale lock reclaim during crash recovery', () => {
  it('reclaims a Director loop lock left by a process that crashed mid-run and resumes it', async () => {
    const project = uniqueSlug('crashed')
    seedRecoverableProject(project)
    const lockFile = path.join(isolated.dir, 'director-locks', `${project}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'dead-owner', pid: 999_999_999, acquiredAt: new Date().toISOString() }), 'utf-8')

    recoverActiveDirectorsOnStartup()

    await waitFor(() => getDirectorStatus(project).state === 'Completed')
  })

  it('does not touch a project whose loop is still genuinely owned by a live process — no second concurrent loop is started', () => {
    const project = uniqueSlug('alive')
    seedRecoverableProject(project)
    const lockFile = path.join(isolated.dir, 'director-locks', `${project}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'live-owner', pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    recoverActiveDirectorsOnStartup()

    // acquireLoopOwnership's liveness check runs synchronously before any
    // await, so a failed acquisition is observable immediately with no
    // polling needed — a genuine reclaim would instead have removed this file.
    expect(fs.existsSync(lockFile)).toBe(true)
    expect(JSON.parse(fs.readFileSync(lockFile, 'utf-8')).owner).toBe('live-owner')
    expect(getDirectorStatus(project).state).toBe('Running')
  })
})
