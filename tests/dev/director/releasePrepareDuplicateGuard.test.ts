import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import {
  prepareRelease,
  submitReleaseControlDecision,
  listReleases,
  ReleaseAlreadyActiveError,
} from '../../../lib/dev/director/releaseManagement/releaseManagementService'

let isolated: IsolatedDataDir
let cwd: string

// A release must actually pass preparation (git status shows a pending
// change, the branch name is free) for a Go decision's executeRelease to
// get past its synchronous "preparationReport.passed" early-return and
// reach its first real await — otherwise it flips straight to
// 'ReleaseFailed' before this test's next statement runs, and the
// 'Releasing' guard would never be exercised.
const exec = async (cmd: string, args: string[]) => {
  if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: ' M some-file.txt\n', stderr: '' }
  if (cmd === 'git' && args[0] === 'rev-parse') return { code: 1, stdout: '', stderr: '' }
  return { code: 0, stdout: '', stderr: '' }
}

beforeEach(() => {
  isolated = useIsolatedDataDir()
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-release-guard-'))
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }))
})

afterEach(() => {
  isolated.cleanup()
  fs.rmSync(cwd, { recursive: true, force: true })
})

describe('prepareRelease — structural duplicate guard (PRA-P1-029)', () => {
  it('rejects a second prepareRelease while one is already Prepared for the project', async () => {
    const project = uniqueSlug()
    const first = await prepareRelease(project, cwd, exec)
    expect(first.status).toBe('Prepared')

    await expect(prepareRelease(project, cwd, exec)).rejects.toThrow(ReleaseAlreadyActiveError)
    expect(listReleases(project).length).toBe(1)
  })

  it('rejects while the existing release is Releasing', async () => {
    const project = uniqueSlug()
    const first = await prepareRelease(project, cwd, exec)
    submitReleaseControlDecision(project, first.id, { executive: 'cfo', decision: 'Go', reason: 'approved' }, cwd, exec)

    await expect(prepareRelease(project, cwd, exec)).rejects.toThrow(ReleaseAlreadyActiveError)
  })

  it('allows a new prepareRelease once the prior one is Held (no longer active)', async () => {
    const project = uniqueSlug()
    const first = await prepareRelease(project, cwd, exec)
    submitReleaseControlDecision(project, first.id, { executive: 'cfo', decision: 'Hold', reason: 'not yet' }, cwd, exec)

    const second = await prepareRelease(project, cwd, exec)
    expect(second.id).not.toBe(first.id)
    expect(listReleases(project).length).toBe(2)
  })

  it('does not block a different project\'s prepareRelease', async () => {
    const projectA = uniqueSlug()
    const projectB = uniqueSlug()
    await prepareRelease(projectA, cwd, exec)

    const releaseB = await prepareRelease(projectB, cwd, exec)
    expect(releaseB.status).toBe('Prepared')
  })
})
