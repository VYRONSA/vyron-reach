import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { startServerDirector, resumeServerDirector, recoverActiveDirectorsOnStartup } from '../../../lib/dev/director/serverExecutionLoop'
import { getDirectorStatus, patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { saveExecutionSnapshot } from '../../../lib/dev/director/executionSnapshotStore'
import { listTimeline } from '../../../lib/dev/knowledge/knowledgeService'
import { computeEngineeringContextVersions } from '../../../lib/dev/director/engineeringContextVersion'
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

function handoff(project: string, overrides: Partial<HandoffInput> = {}): HandoffInput {
  return {
    project, projectName: project, projectTagline: '', projectDescription: '',
    milestones: [milestone(project)], batches: [batch()],
    decisions: [], technicalDebt: [], openRisks: [], developmentRules: '',
    productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
    ...overrides,
  }
}

describe('Live Knowledge Refresh — wired into Start Development', () => {
  it('performs an initial refresh and records lastKnownVersions on the run status', async () => {
    const project = uniqueSlug()
    startServerDirector(handoff(project))

    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    const status = getDirectorStatus(project)
    expect(status.lastKnownVersions).not.toBeNull()
    expect(status.lastKnownVersions).toEqual(computeEngineeringContextVersions(project))
  })

  it('logs a Knowledge Refresh timeline event for the initial load', async () => {
    const project = uniqueSlug()
    startServerDirector(handoff(project))
    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    expect(listTimeline(project).some(e => e.category === 'Knowledge Refresh')).toBe(true)
  })
})

describe('Live Knowledge Refresh — wired into CEO approval resume', () => {
  it('refreshes and records lastKnownVersions after a resume', async () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked' })
    saveExecutionSnapshot({ ...handoff(project), completions: [], handedOffAt: new Date().toISOString() })

    resumeServerDirector(project)
    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    expect(getDirectorStatus(project).lastKnownVersions).not.toBeNull()
  })
})

describe('Live Knowledge Refresh — Recovery never replays stale engineering context', () => {
  it('forces a refresh on recovery even when the persisted lastKnownVersions already matches current state exactly', async () => {
    const project = uniqueSlug()
    const currentVersions = computeEngineeringContextVersions(project)

    // Seed a status as if a previous process had already refreshed and
    // recorded these exact versions right before it crashed.
    patchDirectorStatus(project, { state: 'Running', lastKnownVersions: currentVersions })
    saveExecutionSnapshot({ ...handoff(project), completions: [], handedOffAt: new Date().toISOString() })

    recoverActiveDirectorsOnStartup()
    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    // A comparison-based (non-forced) check would have found versions
    // already matching and skipped — recovery must refresh anyway.
    const refreshEvents = listTimeline(project).filter(e => e.category === 'Knowledge Refresh')
    expect(refreshEvents.length).toBeGreaterThanOrEqual(1)
    expect(refreshEvents[refreshEvents.length - 1].detail).toMatch(/forced refresh/i)
  })

  it('contrast: an ordinary CEO-approval resume (not recovery) with matching versions does NOT force a redundant refresh', async () => {
    const project = uniqueSlug()
    const currentVersions = computeEngineeringContextVersions(project)
    patchDirectorStatus(project, { state: 'Blocked', lastKnownVersions: currentVersions })
    saveExecutionSnapshot({ ...handoff(project), completions: [], handedOffAt: new Date().toISOString() })

    resumeServerDirector(project)
    await waitFor(() => getDirectorStatus(project).state === 'Completed')

    // Unlike the recovery case above, nothing changed and this was a
    // normal resume, not a crash reclaim — comparison-based skip applies.
    expect(listTimeline(project).filter(e => e.category === 'Knowledge Refresh')).toHaveLength(0)
    expect(getDirectorStatus(project).lastKnownVersions).toEqual(currentVersions)
  })
})
