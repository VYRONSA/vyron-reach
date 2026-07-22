import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { runSchedulingCycle } from '../../../lib/dev/scheduler/schedulerService'
import { getSchedulerState, recordCycle } from '../../../lib/dev/scheduler/schedulerStore'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { getDirectorStatus, patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { acquireLoopOwnership, releaseLoopOwnership } from '../../../lib/dev/director/directorLock'
import { appendDirectorHistory } from '../../../lib/dev/director/directorHistoryStore'
import { getJob, updateJob } from '../../../lib/dev/runtime/runtimeStorage'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedProject(project: string, batchStatus: 'Active' | 'Complete' = 'Active', status: planningStateService.PlanningProjectInput['status'] = 'active') {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status, progress: 0, color: '#000', icon: 'x' })
  const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
  planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: batchStatus })
}

/**
 * runtimeQueue.ts serializes real job execution GLOBALLY across every project
 * (not per-project), so a second concurrently-started project's job can still
 * be sitting in 'Queued' behind the first project's job when cleanup begins.
 * executionStateMachine.ts's TRANSITIONS only allow Queued -> Running/Cancelled,
 * never Queued -> Failed, so unconditionally sending 'Failed' silently no-ops
 * and the poll below would hang forever. Poll the job's actual current status
 * on every attempt and issue whichever terminal transition is legal for it.
 */
async function terminateJob(jobId: string, timeoutMs = 20000) {
  await waitFor(
    () => {
      const job = getJob(jobId)
      if (!job) return false
      if (job.status === 'Completed' || job.status === 'Failed' || job.status === 'Cancelled' || job.status === 'Rejected') return true
      if (job.status === 'Queued') {
        updateJob(jobId, { status: 'Cancelled', completedAt: new Date().toISOString() })
        return false
      }
      if (job.status === 'Running' || job.status === 'Validating') {
        updateJob(jobId, { status: 'Failed', error: 'Simulated failure for test isolation', completedAt: new Date().toISOString() })
        return false
      }
      return false
    },
    { timeoutMs, intervalMs: 200 }
  )
}

/** Every project the Scheduler actually starts must have its job terminated (mirroring tests/dev/workforce/workforceIntegration.test.ts's established pattern), or the loop's poll would run forever after this test's isolated data dir is torn down. */
async function cleanupStartedProjects(started: string[]) {
  for (const project of started) {
    await waitFor(() => getDirectorStatus(project).currentJobId !== null, { timeoutMs: 10000 })
    const jobId = getDirectorStatus(project).currentJobId
    if (jobId) {
      await terminateJob(jobId)
    }
    await waitFor(() => getDirectorStatus(project).state === 'Waiting for CEO', { timeoutMs: 20000 })
    await waitFor(
      () => {
        const owner = acquireLoopOwnership(project)
        if (!owner) return false
        releaseLoopOwnership(project, owner)
        return true
      },
      { timeoutMs: 20000 }
    )
  }
}

describe('Scheduler Service — one project', () => {
  it('starts a single eligible Idle project', async () => {
    const project = uniqueSlug()
    seedProject(project)

    const result = runSchedulingCycle()

    expect(result.started).toEqual([project])
    expect(result.order.find(i => i.project === project)?.eligibility).toBe('Eligible')
    await cleanupStartedProjects(result.started)
  }, 30000)
})

describe('Scheduler Service — eligibility classification (no real execution needed)', () => {
  it('never starts a Blocked project', () => {
    const project = uniqueSlug()
    seedProject(project)
    patchDirectorStatus(project, { state: 'Blocked' })

    const result = runSchedulingCycle()

    expect(result.started).not.toContain(project)
    expect(result.order.find(i => i.project === project)?.eligibility).toBe('Blocked')
    expect(getDirectorStatus(project).state).toBe('Blocked') // untouched
  })

  it('never starts a Waiting-for-CEO project', () => {
    const project = uniqueSlug()
    seedProject(project)
    patchDirectorStatus(project, { state: 'Waiting for CEO' })

    const result = runSchedulingCycle()

    expect(result.started).not.toContain(project)
    expect(result.order.find(i => i.project === project)?.eligibility).toBe('WaitingForCeo')
  })

  it('classifies a project with no available work (all batches Complete) as Completed, and never starts it', () => {
    const project = uniqueSlug()
    seedProject(project, 'Complete')
    patchDirectorStatus(project, { state: 'Completed' })

    const result = runSchedulingCycle()

    expect(result.started).not.toContain(project)
    expect(result.order.find(i => i.project === project)?.eligibility).toBe('Completed')
  })

  it('classifies an already-Running project as Running, and never touches it again (duplicate scheduling requests safely no-op)', () => {
    const project = uniqueSlug()
    seedProject(project)
    patchDirectorStatus(project, { state: 'Running' })

    const result1 = runSchedulingCycle()
    const result2 = runSchedulingCycle()

    expect(result1.started).not.toContain(project)
    expect(result2.started).not.toContain(project)
    expect(getDirectorStatus(project).state).toBe('Running') // never restarted
  })
})

describe('Scheduler Service — mixed priorities and concurrency limits', () => {
  it('ranks Failing-build projects above healthy ones and starts only up to maxConcurrent, leaving the rest Waiting', async () => {
    // Seeding open High-severity risks/debt to influence ranking is
    // deliberately avoided here: the exact same data also feeds
    // findPreflightBlocker (unchanged, pre-existing Director behavior),
    // which would legitimately block these projects before they ever
    // reach job creation — a real interaction, not a bug, but the wrong
    // tool for differentiating scores in a test that also needs the
    // "started" projects to safely proceed. buildStatus and project
    // status are both safe: neither is read by findPreflightBlocker.
    const unhealthyA = uniqueSlug('unhealthy-a')
    const unhealthyB = uniqueSlug('unhealthy-b')
    const healthyActive = uniqueSlug('healthy-active')
    const healthyPaused = uniqueSlug('healthy-paused')

    seedProject(unhealthyA)
    patchDirectorStatus(unhealthyA, { buildStatus: 'Failing' })
    seedProject(unhealthyB)
    patchDirectorStatus(unhealthyB, { buildStatus: 'Failing' })
    seedProject(healthyActive, 'Active', 'active')
    seedProject(healthyPaused, 'Active', 'paused')

    const result = runSchedulingCycle({ maxConcurrent: 2 })

    const rank = (p: string) => result.order.findIndex(i => i.project === p)
    expect(rank(unhealthyA)).toBeLessThan(rank(healthyActive)) // a failing build outranks a healthy active project
    expect(rank(healthyActive)).toBeLessThan(rank(healthyPaused)) // active outranks paused, all else equal

    expect(result.started.sort()).toEqual([unhealthyA, unhealthyB].sort())
    expect(result.waiting).toContain(healthyActive)
    expect(result.waiting).toContain(healthyPaused)

    await cleanupStartedProjects(result.started)
  }, 30000)

  it('a High Recovery-Frequency risk (flaky project) is deprioritized below an otherwise-identical stable project', () => {
    const stable = uniqueSlug('stable')
    const flaky = uniqueSlug('flaky')
    seedProject(stable)
    seedProject(flaky)
    for (let i = 0; i < 3; i++) appendDirectorHistory({ project: flaky, event: 'Recovered from crash', batchId: null, detail: '' })

    const result = runSchedulingCycle({ maxConcurrent: 0 }) // decision-only, nothing actually started

    const rank = (p: string) => result.order.findIndex(i => i.project === p)
    expect(rank(stable)).toBeLessThan(rank(flaky))
  })
})

describe('Scheduler Service — starvation prevention (simulated elapsed time, no real waiting)', () => {
  it('a long-waiting lower-priority project eventually outranks a recently-executed higher-priority one', () => {
    const highPriority = uniqueSlug('high')
    const staleProject = uniqueSlug('stale')
    seedProject(highPriority)
    patchDirectorStatus(highPriority, { buildStatus: 'Failing' })
    for (let i = 0; i < 3; i++) {
      planningStateService.createRisk(highPriority, { title: `R${i}`, description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    }
    seedProject(staleProject)

    // First cycle: highPriority clearly outranks the (equally never-run) staleProject.
    const first = runSchedulingCycle({ maxConcurrent: 0, now: '2026-01-01T00:00:00.000Z' })
    const firstRank = (p: string) => first.order.findIndex(i => i.project === p)
    expect(firstRank(highPriority)).toBeLessThan(firstRank(staleProject))

    // Simulate highPriority having just been executed (resets its own staleness to ~0)
    // while staleProject has now waited five real days — recorded directly via the
    // same store the Scheduler itself reads, no real waiting involved.
    recordCycle({ timestamp: '2026-01-01T00:00:00.000Z', order: [], started: [highPriority], waiting: [], errors: [] })

    const later = runSchedulingCycle({ maxConcurrent: 0, now: '2026-01-06T00:00:00.000Z' })
    const laterRank = (p: string) => later.order.findIndex(i => i.project === p)
    expect(laterRank(staleProject)).toBeLessThan(laterRank(highPriority))
  })
})

describe('Scheduler Service — persists every cycle', () => {
  it('records the cycle in SchedulerState, survivable across a simulated restart', () => {
    const project = uniqueSlug()
    seedProject(project, 'Complete')
    patchDirectorStatus(project, { state: 'Completed' })

    runSchedulingCycle()

    const state = getSchedulerState()
    expect(state.totalCycles).toBe(1)
    expect(state.lastCycleResult?.order.some(i => i.project === project)).toBe(true)
  })
})
