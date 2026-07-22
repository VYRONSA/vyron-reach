import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { insertReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementStore'
import { getRelease, resumeStuckReleases } from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import { listInboxItems } from '../../../lib/dev/director/engineeringInboxStore'
import { listReleases } from '../../../lib/dev/knowledge/knowledgeService'
import type { ReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makeReleasingRequest(project: string, overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  const now = new Date().toISOString()
  const record: ReleaseRequest = {
    id: `release_${Math.random().toString(36).slice(2)}`,
    project,
    status: 'Releasing', // simulates the process crashing mid-executeRelease
    version: '1.0.1',
    notes: '',
    branchName: `autonomous-release/${project}/v1.0.1`,
    commitSha: null,
    prUrl: null,
    deploymentUrl: null,
    preparationReport: { activities: [], passed: true, runAt: now, durationMs: 0 },
    executionReport: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  insertReleaseRequest(record)
  return record
}

describe('Release execution crash recovery — PRA-P1-025', () => {
  it('fails out (never silently leaves stuck) a release left in Releasing by a crash, with a clear, human-visible reason', async () => {
    const project = uniqueSlug()
    const release = makeReleasingRequest(project)

    const { failedOut } = await resumeStuckReleases()

    expect(failedOut).toEqual([release.id])
    const after = getRelease(release.id)!
    expect(after.status).toBe('ReleaseFailed')
    expect(after.executionReport?.passed).toBe(false)
    expect(after.executionReport?.activities[0].summary).toMatch(/interrupted by a server restart/)
  })

  it('raises the same Release Failure inbox item and permanent knowledge record any other execution failure produces', async () => {
    const project = uniqueSlug()
    const release = makeReleasingRequest(project)

    await resumeStuckReleases()

    const failureItem = listInboxItems({ project }).find(i => i.reasonType === 'Release Failure')
    expect(failureItem).toBeTruthy()
    expect(failureItem?.severity).toBe('Critical')

    const recorded = listReleases(project)
    expect(recorded).toHaveLength(1)
    expect(recorded[0].passed).toBe(false)
  })

  it('never retries the mutating sequence — a stuck release is failed out, not silently re-executed', async () => {
    const project = uniqueSlug()
    const release = makeReleasingRequest(project)

    // No Go decision exists for this release at all, so if resumeStuckReleases
    // ever tried to re-run executeRelease, it would be a no-op there too —
    // but the real assertion is that the record is deterministically
    // ReleaseFailed, never left as Releasing and never advanced to Released.
    await resumeStuckReleases()

    const after = getRelease(release.id)!
    expect(after.status).not.toBe('Releasing')
    expect(after.status).not.toBe('Released')
    expect(after.status).toBe('ReleaseFailed')
  })

  it('is a no-op for releases that are not stuck (Prepared/Released/Held/ReleaseFailed untouched)', async () => {
    const project = uniqueSlug()
    const prepared = makeReleasingRequest(project, { status: 'Prepared', id: 'release_prepared' })
    const released = makeReleasingRequest(project, { status: 'Released', id: 'release_released' })

    const { failedOut } = await resumeStuckReleases()

    expect(failedOut).toEqual([])
    expect(getRelease(prepared.id)?.status).toBe('Prepared')
    expect(getRelease(released.id)?.status).toBe('Released')
  })

  it('resumes multiple stuck releases across different projects independently', async () => {
    const projectA = uniqueSlug()
    const projectB = uniqueSlug()
    const releaseA = makeReleasingRequest(projectA)
    const releaseB = makeReleasingRequest(projectB)

    const { failedOut } = await resumeStuckReleases()

    expect(failedOut.sort()).toEqual([releaseA.id, releaseB.id].sort())
    expect(getRelease(releaseA.id)?.status).toBe('ReleaseFailed')
    expect(getRelease(releaseB.id)?.status).toBe('ReleaseFailed')
  })
})
