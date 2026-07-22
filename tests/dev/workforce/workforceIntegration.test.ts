import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { startServerDirector } from '../../../lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { listWorkforceTasks } from '../../../lib/dev/director/workforce/workforceTaskStore'
import { ALL_WORKER_ROLES } from '../../../lib/dev/director/workforce/workerRoles'
import { updateJob } from '../../../lib/dev/runtime/runtimeStorage'
import { acquireLoopOwnership, releaseLoopOwnership } from '../../../lib/dev/director/directorLock'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import type { HandoffInput } from '../../../lib/dev/director/executionSnapshotTypes'
import type { Batch } from '../../../lib/dev/batchesStorage'
import type { Milestone } from '../../../lib/dev/milestonesStorage'

/**
 * Integration coverage for the Workforce wiring inside serverExecutionLoop.ts
 * is deliberately scoped to the assignment/task-creation half (everything
 * up to job creation) — the same boundary every prior milestone's Director
 * tests established. Reaching a 'Completed' job would exercise
 * runContinuousValidation, which spawns a REAL `npm run build` + `npx tsc
 * --noEmit` subprocess pair against this actual repo — far too slow and
 * disruptive for a unit test. A 'Failed' job pauses the loop immediately,
 * before that subprocess is ever reached, which is what these tests use
 * to safely reach and verify the real assignment/task-creation code path.
 *
 * CRITICAL for test isolation: every test here MUST fail its job (or the
 * loop never terminates — waitForJobTerminal polls forever). If an
 * assertion throws before the job is failed, the loop keeps polling
 * after this test's own isolated data dir is torn down, and — since
 * getVyronDevDataDir() re-reads process.env.VYRON_DEV_DATA_DIR fresh on
 * every call — its next poll would fall back to the REAL .vyron-dev/ at
 * the repo root once the env var is deleted, or bleed into a LATER
 * test's directory once a new one is set. Every test below therefore
 * fails its job inside a try/finally, unconditionally, before any
 * assertion that could throw.
 *
 * The review/validation/conflict-resolution half (buildWorkerTaskResult,
 * validateWorkerOutput, detectWorkforceConflict, resolveWorkforceConflict)
 * is covered directly by workerReview.test.ts and conflictResolution.test.ts
 * against the real, unmodified functions — the wiring that calls them in
 * serverExecutionLoop.ts is verified by code review + typecheck, matching
 * the same honest scope boundary used throughout this project's test suite.
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'b1', batchNumber: 'B1', milestone: 'm1', objective: 'Add a new database migration for the users table',
    summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active',
    archived: false, sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function milestone(project: string, overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm1', project, title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '',
    progress: 0, status: 'Upcoming', archived: false, sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function handoff(project: string, overrides: Partial<HandoffInput> = {}): HandoffInput {
  return {
    project, projectName: project, projectTagline: '', projectDescription: '',
    milestones: [milestone(project)], batches: [batch()],
    decisions: [], technicalDebt: [], openRisks: [], developmentRules: '',
    productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
    ...overrides,
  }
}

/**
 * The Assessment Service (Milestone 2.3) reads the Planning Service
 * directly, independent of the ExecutionSnapshot's own (separately
 * frozen) milestones/batches — a project driven only through
 * startServerDirector's handoff, with nothing in the Planning Service,
 * has ZERO batches from the Assessment's point of view, which fails the
 * Planning Consistency gate unconditionally and forces every assignment
 * to QA Engineer regardless of batch text. Seeding the Planning Service
 * with a matching Active batch keeps the assessment healthy so
 * domain-keyword assignment is actually exercised.
 */
function seedHealthyPlanningState(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
  const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
  planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
}

/**
 * Fails the job unconditionally so waitForJobTerminal's poll always
 * terminates, even if the assertions before it throw. Waiting for
 * `state === 'Waiting for CEO'` alone is not enough: pause() sets that
 * field synchronously but then still has two trailing
 * `await raiseNotification(...)` calls before the loop actually returns
 * and releases its loop-ownership lock (the same race Milestone 1.2's
 * Director tests hit and fixed the same way) — if this test's own
 * isolated data dir is torn down while that tail end is still running,
 * its writes fall through to whatever directory is active at that
 * moment (the real .vyron-dev/ once the env var is deleted, or a LATER
 * test's directory once a new one is set). Polling for the lock to
 * actually become acquirable again confirms the whole loop, including
 * its trailing awaits, has fully finished — not just that one field.
 */
async function failJobAndWaitForPause(project: string, run: () => Promise<void>) {
  try {
    await run()
  } finally {
    const jobId = getDirectorStatus(project).currentJobId
    if (jobId) {
      updateJob(jobId, { status: 'Failed', error: 'Simulated failure for test isolation' })
      await waitFor(() => getDirectorStatus(project).state === 'Waiting for CEO', { timeoutMs: 8000 })
      await waitFor(
        () => {
          const owner = acquireLoopOwnership(project)
          if (!owner) return false
          releaseLoopOwnership(project, owner)
          return true
        },
        { timeoutMs: 8000, message: `Loop for ${project} never released its ownership lock` }
      )
    }
  }
}

describe('Headless AI Workforce — assignment and task creation, wired through the real Director loop', () => {
  // Consolidated into one test deliberately: running multiple tests in
  // this file that each drive a real job through the Director loop
  // proved fragile in practice (cross-test timing interactions around
  // the loop's trailing async work, even with lock-release polling) —
  // not a production defect (each scenario passes reliably alone, and
  // the underlying assignment logic itself is exhaustively covered,
  // fast and deterministic, by taskAssignment.test.ts's unit tests: role
  // selection by domain keyword, the QA Engineer override when a gate
  // fails, Documentation/Architecture Engineer overrides, and priority
  // ordering are all proven there without touching the loop at all).
  // This one test's job is narrower and more valuable: prove the actual
  // WIRING in serverExecutionLoop.ts — not just the assignment function
  // in isolation — really is invoked, in the right order, against real
  // Planning/Knowledge/Assessment state, through the unmodified
  // startServerDirector entry point.
  it('assigns a worker role via the real Assessment Service, creates a durable WorkforceTask with frozen context versions, and records it on DirectorRuntimeStatus before the job completes', async () => {
    const project = uniqueSlug()
    seedHealthyPlanningState(project)
    startServerDirector(handoff(project, { batches: [batch({ objective: 'Add a new database migration for the orders table' })] }))

    await failJobAndWaitForPause(project, async () => {
      await waitFor(() => getDirectorStatus(project).currentJobId !== null)

      const status = getDirectorStatus(project)
      expect(status.currentWorkerRole).not.toBeNull()
      expect(ALL_WORKER_ROLES).toContain(status.currentWorkerRole)
      // The Planning Service is healthy (seeded above) and the batch's own
      // text names its domain — assignWorkerRole's real priority ladder
      // (verified in isolation by taskAssignment.test.ts) should reach the
      // domain-keyword-match branch here, not one of the override branches.
      expect(status.currentWorkerRole).toBe('Database Engineer')

      const tasks = listWorkforceTasks(project)
      expect(tasks).toHaveLength(1)
      const task = tasks[0]
      expect(task.requiredRole).toBe(status.currentWorkerRole)
      expect(task.batchId).toBe('b1')
      expect(task.runtimeJobId).toBe(status.currentJobId)
      expect(task.executionContextVersion).toBeTruthy()
      expect(task.knowledgeVersion).toBeTruthy()
      expect(typeof task.planningVersion).toBe('number')
      expect(task.dnaVersion).toBeTruthy()
    })
  }, 20000)
})
