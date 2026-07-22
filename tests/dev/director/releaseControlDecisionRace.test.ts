import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { insertReleaseRequest, listReleaseControlDecisions } from '../../../lib/dev/director/releaseManagement/releaseManagementStore'
import { submitReleaseControlDecision, getRelease, ReleaseConflictError } from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import type { ReleaseRequest, ExecImpl } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/** Never touches real git/gh/vercel — `git status --porcelain` returning nothing makes executeGitCommitValidation fail immediately, so a 'Go' decision's fire-and-forget executeRelease call safely no-ops into ReleaseFailed instead of running any real command. */
const noopExec: ExecImpl = async () => ({ code: 0, stdout: '', stderr: '' })

function makePreparedRelease(project: string, overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  const now = new Date().toISOString()
  const record: ReleaseRequest = {
    id: `release_${Math.random().toString(36).slice(2)}`,
    project,
    status: 'Prepared',
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

describe('Release Control Decision race — PRA-P1-026/027', () => {
  it('a losing concurrent decision is still permanently recorded, tagged as not effective', () => {
    const project = uniqueSlug()
    const release = makePreparedRelease(project)

    const first = submitReleaseControlDecision(project, release.id, { executive: 'ceo-a@test', decision: 'Hold', reason: 'First decision.' })
    expect(first.status).toBe('Held')

    // The second submission races against an already-decided release.
    let secondError: unknown = null
    try {
      submitReleaseControlDecision(project, release.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Second, losing decision.' })
    } catch (err) {
      secondError = err
    }
    expect(secondError).toBeInstanceOf(ReleaseConflictError)

    const decisions = listReleaseControlDecisions(release.id)
    expect(decisions).toHaveLength(2)
    const winning = decisions.find(d => d.executive === 'ceo-a@test')!
    const losing = decisions.find(d => d.executive === 'ceo-b@test')!
    expect(winning.effective).toBe(true)
    expect(losing.effective).toBe(false)
    // Never silently dropped — the losing decision's content is still on the permanent record.
    expect(losing.reason).toBe('Second, losing decision.')
  })

  it('the conflict error carries the real current status, never the stale pre-mutation snapshot (PRA-P1-027)', () => {
    const project = uniqueSlug()
    const release = makePreparedRelease(project)

    submitReleaseControlDecision(project, release.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Go first.' }, isolated.dir, noopExec)

    try {
      submitReleaseControlDecision(project, release.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Too late.' }, isolated.dir, noopExec)
      expect.fail('expected a ReleaseConflictError')
    } catch (err) {
      expect(err).toBeInstanceOf(ReleaseConflictError)
      const conflict = err as ReleaseConflictError
      // 'Releasing' (the real current status right after the winning Go), never 'Prepared' (the stale snapshot read at the top of the losing call).
      expect(conflict.actualStatus).toBe('Releasing')
    }
  })

  it('disagreeing decisions (Go then Hold) still resolve deterministically — only the winner ever reaches executeRelease', () => {
    const project = uniqueSlug()
    const release = makePreparedRelease(project)

    const goResult = submitReleaseControlDecision(project, release.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Approving.' }, isolated.dir, noopExec)
    expect(goResult.status).toBe('Releasing')

    expect(() =>
      submitReleaseControlDecision(project, release.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Objecting, too late.' }, isolated.dir, noopExec)
    ).toThrow(ReleaseConflictError)

    // Only one decision ever took effect; the release was never left ambiguously between Go and Hold.
    const decisions = listReleaseControlDecisions(release.id)
    expect(decisions.filter(d => d.effective)).toHaveLength(1)
    expect(decisions.find(d => d.effective)?.decision).toBe('Go')
    expect(getRelease(release.id)?.status).not.toBe('Held')
  })

  it('a normal, non-racing decision on a Prepared release still succeeds exactly as before', () => {
    const project = uniqueSlug()
    const release = makePreparedRelease(project)

    const result = submitReleaseControlDecision(project, release.id, { executive: 'ceo@test', decision: 'Hold', reason: 'Not ready yet.' })

    expect(result.status).toBe('Held')
    const [decision] = listReleaseControlDecisions(release.id)
    expect(decision.effective).toBe(true)
  })
})
