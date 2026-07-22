import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { createInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { buildDashboardSnapshot } from '../../../lib/dev/events/dashboardSnapshot'
import { getCurrentSeq } from '../../../lib/dev/events/eventBus'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedProject(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
}

describe('Dashboard Snapshot — late subscriber synchronization', () => {
  it('bundles current state from every relevant store into one payload', () => {
    const project = uniqueSlug()
    seedProject(project)
    patchDirectorStatus(project, { state: 'Running' })
    createInboxItem({ project, batchId: null, batchNumber: null, reasonType: 'Approval Required', severity: 'High', reason: 'x', recommendedAction: 'x' })

    const snapshot = buildDashboardSnapshot(project)

    expect(snapshot.projects.some(p => p.slug === project)).toBe(true)
    expect(snapshot.directorStatuses.some(s => s.project === project && s.state === 'Running')).toBe(true)
    expect(snapshot.inboxItems.some(i => i.project === project)).toBe(true)
    expect(snapshot.schedulerState).toBeDefined()
    expect(Array.isArray(snapshot.escalationStates)).toBe(true)
    expect(Array.isArray(snapshot.notifications)).toBe(true)
  })

  it('scopes every list to the requested project when one is given', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    seedProject(projectA)
    seedProject(projectB)
    patchDirectorStatus(projectA, { state: 'Running' })
    patchDirectorStatus(projectB, { state: 'Idle' })

    const snapshot = buildDashboardSnapshot(projectA)

    expect(snapshot.projects.map(p => p.slug)).toEqual([projectA])
    expect(snapshot.directorStatuses.map(s => s.project)).toEqual([projectA])
  })

  it('returns every project when no project filter is given', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    seedProject(projectA)
    seedProject(projectB)

    const snapshot = buildDashboardSnapshot()

    const slugs = snapshot.projects.map(p => p.slug)
    expect(slugs).toContain(projectA)
    expect(slugs).toContain(projectB)
  })

  it('carries the Event Service\'s current seq as of the moment the snapshot was read, so the client knows exactly where to resume from', () => {
    const project = uniqueSlug()
    seedProject(project)
    const before = getCurrentSeq()
    const snapshot = buildDashboardSnapshot(project)
    expect(snapshot.seq).toBeGreaterThanOrEqual(before)
  })
})
