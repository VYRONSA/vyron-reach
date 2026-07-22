import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { createRealExec, releaseBranchName, executeDeploymentVerification } from '../../../lib/dev/director/releaseManagement/releaseManagementRunners'
import { prepareRelease, submitReleaseControlDecision, getRelease } from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { listInboxItems } from '../../../lib/dev/director/engineeringInboxStore'
import { buildEngineeringIntelligenceContext } from '../../../lib/dev/director/engineeringIntelligence/engineeringIntelligenceService'
// The permanent Knowledge Service record (has `passed`) — distinct from
// releaseManagementService's own listReleases, which returns the working
// ReleaseRequest[] (status/report shape, no top-level `passed` field). The
// two functions share a name across modules; this test wants the former.
import { listReleases } from '../../../lib/dev/knowledge/knowledgeService'
import type { ExecImpl, ExecResult } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

/**
 * Never touches the real repo or any real infrastructure — every git
 * operation runs against a throwaway local working repo + a throwaway
 * local bare repo standing in for "origin," and `gh`/`vercel` are
 * intercepted by a fake ExecImpl that returns canned output. This is
 * exactly the isolation the CEO's approved plan requires for this
 * directive's verification.
 */
function fakeExec(overrides: Record<string, (args: string[], cwd: string) => ExecResult | Promise<ExecResult>>): ExecImpl {
  const real = createRealExec()
  return async (cmd, args, cwd) => {
    if (overrides[cmd]) return overrides[cmd](args, cwd)
    return real(cmd, args, cwd)
  }
}

function run(cmd: string, args: string[], cwd: string): void {
  const { execFileSync } = require('node:child_process') as typeof import('node:child_process')
  execFileSync(cmd, args, { cwd, stdio: 'pipe' })
}

type GitFixture = { workDir: string; bareDir: string; cleanup: () => void }

function createGitFixture(): GitFixture {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-release-work-'))
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-release-bare-'))

  run('git', ['init', '--bare', '-b', 'master'], bareDir)

  run('git', ['init', '-b', 'master'], workDir)
  run('git', ['config', 'user.email', 'autonomous@vyron.test'], workDir)
  run('git', ['config', 'user.name', 'VYRON DEV Test Fixture'], workDir)
  fs.writeFileSync(path.join(workDir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2))
  fs.writeFileSync(path.join(workDir, 'README.md'), '# fixture\n')
  run('git', ['add', '-A'], workDir)
  run('git', ['commit', '-m', 'initial commit'], workDir)
  run('git', ['remote', 'add', 'origin', bareDir], workDir)
  run('git', ['push', 'origin', 'master'], workDir)

  return {
    workDir,
    bareDir,
    cleanup: () => {
      fs.rmSync(workDir, { recursive: true, force: true })
      fs.rmSync(bareDir, { recursive: true, force: true })
    },
  }
}

let isolated: IsolatedDataDir
let fixture: GitFixture

beforeEach(() => {
  isolated = useIsolatedDataDir()
  fixture = createGitFixture()
})

afterEach(() => {
  isolated.cleanup()
  fixture.cleanup()
})

const ghPrExec = fakeExec({
  gh: async args => {
    if (args[0] === 'pr' && args[1] === 'create') return { code: 0, stdout: 'https://github.com/fake-org/fake-repo/pull/1\n', stderr: '' }
    if (args[0] === 'pr' && args[1] === 'view') return { code: 0, stdout: JSON.stringify({ mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN' }), stderr: '' }
    return { code: 1, stdout: '', stderr: 'unrecognised gh command in test fixture' }
  },
})

describe('Autonomous Release Management — verification', () => {
  it('demonstrates successful release preparation with real, structured evidence', async () => {
    const project = uniqueSlug()
    fs.writeFileSync(path.join(fixture.workDir, 'feature.txt'), 'a real pending change\n')

    const release = await prepareRelease(project, fixture.workDir, ghPrExec)

    expect(release.status).toBe('Prepared')
    expect(release.version).toBe('1.0.1') // deterministic patch bump from 1.0.0
    expect(release.branchName).toBe(releaseBranchName(project, '1.0.1'))
    expect(release.preparationReport.passed).toBe(true)

    const byActivity = Object.fromEntries(release.preparationReport.activities.map(a => [a.activity, a]))
    expect(byActivity['Release Preparation'].status).toBe('Passed')
    expect(byActivity['Version Management'].summary).toContain('1.0.1')
    expect(byActivity['Git Commit Validation'].status).toBe('Passed') // real pending change detected
    expect(byActivity['Branch Validation'].status).toBe('Passed')
    expect(byActivity['Merge Readiness'].status).toBe('Passed') // no unresolved High risks
    expect(byActivity['Pull Request Creation'].status).toBe('Skipped') // awaiting Go — never attempted

    // Director feedback for the awaiting-decision case.
    const items = listInboxItems({ project })
    const goHoldItem = items.find(i => i.reasonType === 'Release Go/Hold Required')
    expect(goHoldItem).toBeTruthy()
    expect(goHoldItem?.reason).toContain('1.0.1')
  })

  it('demonstrates a failed release path — an unresolved High-severity risk blocks Merge Readiness', async () => {
    const project = uniqueSlug()
    fs.writeFileSync(path.join(fixture.workDir, 'feature.txt'), 'a real pending change\n')
    planningStateService.createProject({ slug: project, name: project, description: '', category: '', status: 'active', progress: 0, color: '', icon: '' })
    planningStateService.createRisk(project, {
      title: 'Unencrypted payroll export',
      description: 'Payroll export writes plaintext to disk.',
      severity: 'High',
      probability: 'Medium',
      mitigation: '',
      owner: 'Unassigned',
      status: 'Open',
    })

    const release = await prepareRelease(project, fixture.workDir, ghPrExec)

    expect(release.preparationReport.passed).toBe(false)
    const merge = release.preparationReport.activities.find(a => a.activity === 'Merge Readiness')!
    expect(merge.status).toBe('Failed')
    expect(merge.summary).toContain('High-severity risk')

    const goHoldItem = listInboxItems({ project }).find(i => i.reasonType === 'Release Go/Hold Required')
    expect(goHoldItem?.severity).toBe('High')
    expect(goHoldItem?.reason).toContain('Merge Readiness')

    // Defense in depth — a Go recorded against a blocked release must never execute the mutating sequence.
    // cwd/exec passed explicitly, same as every other call in this file — omitting them here previously
    // meant this call defaulted to process.cwd() and a real subprocess exec, the exact live-verification
    // bug submitReleaseControlDecision's own doc comment describes.
    const decided = submitReleaseControlDecision(project, release.id, { executive: 'ceo@test', decision: 'Go', reason: 'Approving despite the finding.' }, fixture.workDir, ghPrExec)
    expect(decided.status).toBe('Releasing')
    await waitFor(() => getRelease(release.id)!.status !== 'Releasing', { timeoutMs: 15_000 })
    const after = getRelease(release.id)!
    expect(after.status).toBe('ReleaseFailed')
    expect(after.executionReport).toBeNull() // never even started the mutating sequence
  }, 20_000)

  it('demonstrates Director feedback and a permanent record on a genuine execution failure (branch collision)', async () => {
    const project = uniqueSlug()
    fs.writeFileSync(path.join(fixture.workDir, 'feature.txt'), 'a real pending change\n')

    const release = await prepareRelease(project, fixture.workDir, ghPrExec)
    expect(release.preparationReport.passed).toBe(true)

    // Sabotage: create the exact branch the release plans to use, so the real mutating Branch Validation collides for real.
    run('git', ['branch', release.branchName], fixture.workDir)

    submitReleaseControlDecision(project, release.id, { executive: 'ceo@test', decision: 'Go', reason: 'Approved.' }, fixture.workDir, ghPrExec)
    await waitFor(() => getRelease(release.id)!.status !== 'Releasing', { timeoutMs: 15_000 })

    const after = getRelease(release.id)!
    expect(after.status).toBe('ReleaseFailed')
    expect(after.executionReport?.passed).toBe(false)
    const branchResult = after.executionReport?.activities.find(a => a.activity === 'Branch Validation')
    expect(branchResult?.status).toBe('Failed')
    expect(branchResult?.summary).toContain('already exists')

    const failureItem = listInboxItems({ project }).find(i => i.reasonType === 'Release Failure')
    expect(failureItem).toBeTruthy()
    expect(failureItem?.reason).toContain('Branch Validation')

    // Requirement 6/9 — recorded permanently regardless of outcome, retrievable directly and via Engineering Intelligence.
    const recorded = listReleases(project)
    expect(recorded).toHaveLength(1)
    expect(recorded[0].passed).toBe(false)

    const context = buildEngineeringIntelligenceContext({
      project, queryText: 'release', currentBatchId: null,
      snapshotDecisions: [], snapshotTechnicalDebt: [], snapshotOpenRisks: [], snapshotDevelopmentRules: '',
    })
    const releaseSection = context.sections.find(s => s.sourceType === 'Release History')
    expect(releaseSection?.items[0]?.summary).toContain('Branch Validation')
  }, 20_000)

  it('demonstrates a full successful release execution (commit, branch, push, PR — never against real infrastructure)', async () => {
    const project = uniqueSlug()
    fs.writeFileSync(path.join(fixture.workDir, 'feature.txt'), 'a real pending change\n')

    const release = await prepareRelease(project, fixture.workDir, ghPrExec)
    expect(release.preparationReport.passed).toBe(true)

    submitReleaseControlDecision(project, release.id, { executive: 'ceo@test', decision: 'Go', reason: 'Approved for release.' }, fixture.workDir, ghPrExec)
    await waitFor(() => getRelease(release.id)!.status !== 'Releasing', { timeoutMs: 15_000 })

    const after = getRelease(release.id)!
    expect(after.status).toBe('Released')
    expect(after.executionReport?.passed).toBe(true)
    expect(after.commitSha).toBeTruthy()
    expect(after.prUrl).toBe('https://github.com/fake-org/fake-repo/pull/1')

    // Real git state — the release branch genuinely exists and was genuinely pushed to the fixture's "origin".
    const branches = require('node:child_process').execFileSync('git', ['branch', '--list', release.branchName], { cwd: fixture.workDir }).toString()
    expect(branches).toContain(release.branchName)

    const recorded = listReleases(project)
    expect(recorded).toHaveLength(1)
    expect(recorded[0].passed).toBe(true)
  }, 20_000)

  it('deployment verification correctly reports a real HTTP check (no external network)', async () => {
    const server = http.createServer((_req, res) => res.end('ok'))
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    try {
      const result = await executeDeploymentVerification(`http://127.0.0.1:${port}/`)
      expect(result.status).toBe('Passed')
      expect(result.summary).toContain('200')

      const failed = await executeDeploymentVerification(`http://127.0.0.1:${port}/does-not-exist-route-but-still-200-since-fixture-echoes`)
      expect(failed.status).toBe('Passed') // this tiny fixture server 200s on every path — still a real HTTP round trip
    } finally {
      server.close()
    }
  })
})
