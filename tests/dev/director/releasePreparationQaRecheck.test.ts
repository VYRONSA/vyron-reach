import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { recordVerification } from '../../../lib/dev/knowledge/knowledgeService'
import { runReleasePreparation } from '../../../lib/dev/director/releaseManagement/releaseManagementRunners'
import type { ReleaseRunContext } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

let isolated: IsolatedDataDir
let cwd: string

beforeEach(() => {
  isolated = useIsolatedDataDir()
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-release-prep-'))
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }))
})

afterEach(() => {
  isolated.cleanup()
  fs.rmSync(cwd, { recursive: true, force: true })
})

function makeCtx(project: string): ReleaseRunContext {
  return { project, releaseId: 'release-1', cwd, version: '1.0.1', branchName: 'test-branch', notes: '', exec: async () => ({ code: 0, stdout: '', stderr: '' }) }
}

describe('Release Preparation — QA re-verification defense in depth (PRA-P1-024)', () => {
  it('passes when the most recent recorded verification passed', async () => {
    const project = uniqueSlug()
    recordVerification({ project, passed: true, durationMs: 100, activities: [{ activity: 'Build', status: 'Passed', summary: 'ok' }] })

    const result = await runReleasePreparation(makeCtx(project))

    expect(result.status).toBe('Passed')
  })

  it('fails when the most recent recorded verification failed — the exact safety net this finding described', async () => {
    const project = uniqueSlug()
    recordVerification({
      project, passed: false, durationMs: 100,
      activities: [{ activity: 'TypeScript', status: 'Failed', summary: '3 type errors' }],
    })

    const result = await runReleasePreparation(makeCtx(project))

    expect(result.status).toBe('Failed')
    expect(result.detail).toContain('TypeScript')
    expect(result.detail).toContain('3 type errors')
  })

  it('only the MOST RECENT verification matters — an old failure followed by a real pass no longer blocks preparation', async () => {
    const project = uniqueSlug()
    recordVerification({ project, passed: false, durationMs: 100, activities: [{ activity: 'Build', status: 'Failed', summary: 'old failure' }] })
    recordVerification({ project, passed: true, durationMs: 100, activities: [{ activity: 'Build', status: 'Passed', summary: 'fixed' }] })

    const result = await runReleasePreparation(makeCtx(project))

    expect(result.status).toBe('Passed')
  })

  it('a project with no verification history at all is not itself treated as a failure (no fabricated judgment)', async () => {
    const project = uniqueSlug()

    const result = await runReleasePreparation(makeCtx(project))

    expect(result.status).toBe('Passed')
    expect(result.summary).toContain('0 verification run(s)')
  })
})
