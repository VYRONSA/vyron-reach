import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { startServerDirector } from '../../../lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import * as releaseManagementService from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import type { HandoffInput } from '../../../lib/dev/director/executionSnapshotTypes'
import type { Batch } from '../../../lib/dev/batchesStorage'
import type { Milestone } from '../../../lib/dev/milestonesStorage'

let isolated: IsolatedDataDir
let cwd: string

beforeEach(() => {
  isolated = useIsolatedDataDir()
  // The Director loop calls prepareRelease(project) with no cwd/exec
  // override, so it defaults to process.cwd() and a real child_process
  // exec. Redirect both to a disposable fixture here so this test never
  // runs real git/gh commands against the actual repository.
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-release-order-'))
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }))
})

afterEach(() => {
  vi.restoreAllMocks()
  isolated.cleanup()
  fs.rmSync(cwd, { recursive: true, force: true })
})

function milestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm1', project: '', title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '',
    progress: 100, status: 'Complete', archived: false, sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'b1', milestone: 'm1', batchNumber: 'B1', objective: 'x', summary: '', completedTasks: '',
    lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Complete', archived: false,
    sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function handoff(project: string, overrides: Partial<HandoffInput> = {}): HandoffInput {
  return {
    project, projectName: project, projectTagline: '', projectDescription: '',
    milestones: [], batches: [], decisions: [], technicalDebt: [], openRisks: [],
    developmentRules: '', productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
    ...overrides,
  }
}

describe('Release preparation runs before Completed is committed — PRA-P1-028', () => {
  it('prepareRelease is called while the project is not yet Completed, and Completed is only set afterward', async () => {
    const project = uniqueSlug()
    let stateAtPrepareCall: string | null = null
    const realPrepareRelease = releaseManagementService.prepareRelease.bind(releaseManagementService)
    const stubExec = async () => ({ code: 0, stdout: '', stderr: '' })

    // Delegates to the real implementation (against the disposable fixture
    // cwd/exec, not the loop's own defaults) so the rest of the loop and
    // this test's own assertion on the resulting ReleaseRequest still
    // reflect genuine behavior — only the call's timing is being observed.
    vi.spyOn(releaseManagementService, 'prepareRelease').mockImplementation(async p => {
      stateAtPrepareCall = getDirectorStatus(p).state
      return realPrepareRelease(p, cwd, stubExec)
    })

    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
    }))

    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    expect(stateAtPrepareCall).not.toBeNull()
    expect(stateAtPrepareCall).not.toBe('Completed')
    expect(releaseManagementService.listReleases(project).length).toBeGreaterThan(0)
  }, 15000)
})
