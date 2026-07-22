import { describe, it, expect } from 'vitest'
import { buildExecutiveBuildFailureReport } from '../../lib/dev/executiveBuildFailureTranslator'
import type { BuildIntelligence } from '../../lib/dev/buildIntelligence'
import type { GitIntelligence } from '../../lib/dev/gitIntelligence'

function makeBuild(overrides: Partial<BuildIntelligence> = {}): BuildIntelligence {
  return {
    buildAvailable: true,
    lastBuildStatus: 'Failing',
    lastTypeScriptStatus: 'Passing',
    buildWarningCount: 0,
    buildResultDisplay: 'FAILED',
    buildTimestamp: '2026-07-21T06:03:45.217Z',
    buildEnvironment: 'production',
    buildReadiness: 'Blocked',
    buildConfidence: 'High',
    ...overrides,
  }
}

function makeGit(overrides: Partial<GitIntelligence> = {}): GitIntelligence {
  return {
    repositoryAvailable: true,
    branch: 'master',
    commitHash: 'abc1234',
    commitMessage: 'Release Engineering Director v1.0',
    commitDate: '2026-07-20T10:00:00.000Z',
    filesChanged: 0,
    filesAdded: null,
    filesDeleted: 0,
    filesModified: 0,
    aheadBehind: null,
    workingTreeStatus: 'Clean',
    ...overrides,
  }
}

describe('Executive Build Failure Translator — presentation layer over the unchanged Build Intelligence Engine', () => {
  it('returns null when the last recorded build did not fail', () => {
    expect(buildExecutiveBuildFailureReport(makeBuild({ lastBuildStatus: 'Passing' }), makeGit())).toBeNull()
    expect(buildExecutiveBuildFailureReport(makeBuild({ lastBuildStatus: 'Unknown' }), makeGit())).toBeNull()
  })

  it('produces every required Executive field when the build is failing', () => {
    const report = buildExecutiveBuildFailureReport(makeBuild(), makeGit())
    expect(report).not.toBeNull()
    const r = report!

    expect(r.executiveSummary.length).toBeGreaterThan(0)
    expect(r.failureCategory.length).toBeGreaterThan(0)
    expect(r.rootCause.length).toBeGreaterThan(0)
    expect(r.impact.length).toBeGreaterThan(0)
    expect(r.recommendedEngineeringAction.length).toBeGreaterThan(0)
    expect(Array.isArray(r.filesInvolved)).toBe(true)
    expect(r.buildCommand.length).toBeGreaterThan(0)
    expect(r.buildOutput.length).toBeGreaterThan(0)
    expect(r.typescriptDiagnostics.length).toBeGreaterThan(0)
    expect(r.eslintDiagnostics.length).toBeGreaterThan(0)
    expect(r.aiEngineeringRecommendation.length).toBeGreaterThan(0)
    expect(r.retryRecommendation.length).toBeGreaterThan(0)
  })

  it('categorizes a failing TypeScript check as TypeScript Compilation Failure, distinct from a non-TypeScript build failure', () => {
    const tsFailure = buildExecutiveBuildFailureReport(makeBuild({ lastTypeScriptStatus: 'Failing' }), makeGit())!
    expect(tsFailure.failureCategory).toBe('TypeScript Compilation Failure')
    expect(tsFailure.executiveSummary).toMatch(/TypeScript/)

    const nonTsFailure = buildExecutiveBuildFailureReport(makeBuild({ lastTypeScriptStatus: 'Passing' }), makeGit())!
    expect(nonTsFailure.failureCategory).toBe('Build Failure (Non-TypeScript)')
    expect(nonTsFailure.executiveSummary).not.toMatch(/TypeScript/)
  })

  it('never fabricates build output, diagnostics, or files involved that the Build Intelligence Engine does not record', () => {
    const r = buildExecutiveBuildFailureReport(makeBuild(), makeGit())!
    expect(r.filesInvolved).toEqual([])
    expect(r.buildOutput).toMatch(/Not captured/)
    expect(r.eslintDiagnostics).toMatch(/Not available/)
  })

  it('never recommends an automatic retry — governance requires manual verification first', () => {
    const r = buildExecutiveBuildFailureReport(makeBuild(), makeGit())!
    expect(r.retryRecommendation).toMatch(/never retried automatically/)
    expect(r.retryRecommendation).not.toMatch(/will retry/i)
  })

  it('reflects the real repository branch and commit from Git Intelligence, not a placeholder', () => {
    const r = buildExecutiveBuildFailureReport(makeBuild(), makeGit({ branch: 'feature/payments', commitHash: 'deadbeef', commitMessage: 'Add webhook handler' }))!
    expect(r.repositoryBranch).toBe('feature/payments')
    expect(r.executiveSummary).toMatch(/feature\/payments/)
    expect(r.repositoryCommit).toBe('deadbeef — Add webhook handler')
  })
})
