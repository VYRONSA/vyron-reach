import type { BuildIntelligence } from './buildIntelligence'
import type { GitIntelligence } from './gitIntelligence'

/**
 * Presentation layer only — DEF-004. Translates the Build Intelligence
 * Engine's already-computed result (lib/dev/buildIntelligence.ts) into
 * Executive-readable language. This module never re-checks the build,
 * never re-runs TypeScript, never scans for diagnostics of its own — it
 * only reads the pass/fail flags Build Intelligence already produced
 * (lastBuildStatus, lastTypeScriptStatus, buildWarningCount,
 * buildConfidence) and Git Intelligence's already-computed repository
 * facts (branch, commit), and formats them. Anything neither engine
 * records (the literal build command's stdout, a file-level diagnostic
 * list) is reported as honestly unavailable rather than re-derived —
 * that would be a second, competing diagnostics path, which is exactly
 * what "no duplicate diagnostics" rules out.
 */

export type ExecutiveBuildFailureReport = {
  executiveSummary: string
  failureCategory: string
  rootCause: string
  impact: string
  recommendedEngineeringAction: string
  filesInvolved: string[]
  buildCommand: string
  buildOutput: string
  typescriptDiagnostics: string
  eslintDiagnostics: string
  aiEngineeringRecommendation: string
  retryRecommendation: string
  repositoryBranch: string
  repositoryCommit: string
  lastCheckedAt: string
  buildConfidence: BuildIntelligence['buildConfidence']
}

/**
 * The one build command this repository's own package.json declares for
 * "build" — a static, verifiable repository fact, not a guess and not
 * something read from the build's own stdout (which is never captured).
 */
const KNOWN_BUILD_COMMAND = 'next build (package.json "build" script)'

const RETRY_GOVERNANCE_NOTE =
  'Builds are never retried automatically. Fix the underlying cause locally, verify with the build command above, then trigger a new build/validation run manually — Engineering governance is unchanged by this report.'

function fmt(iso: string): string {
  if (!iso || iso === 'Unavailable') return 'Unavailable'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

/**
 * One report per failed build — null when the last recorded build did
 * not fail, mirroring buildExecutiveValidationReport's "empty when
 * valid" contract. Never called to decide whether the build failed;
 * BuildIntelligence.lastBuildStatus already decided that.
 */
export function buildExecutiveBuildFailureReport(build: BuildIntelligence, git: GitIntelligence): ExecutiveBuildFailureReport | null {
  if (build.lastBuildStatus !== 'Failing') return null

  const typescriptFailing = build.lastTypeScriptStatus === 'Failing'
  const checkedAt = fmt(build.buildTimestamp)

  const failureCategory = typescriptFailing ? 'TypeScript Compilation Failure' : 'Build Failure (Non-TypeScript)'

  const rootCause = typescriptFailing
    ? `The last recorded TypeScript check failed (checked ${checkedAt}). The build cannot succeed while type errors are present.`
    : `The last recorded build failed (checked ${checkedAt}) while the TypeScript check itself passed — the failure is outside type-checking (for example, a bundler, static generation, or lint-as-error failure).`

  const impact =
    'Engineering cannot ship or deploy new work from this branch until the build is fixed. ' +
    `Build Confidence: ${build.buildConfidence} — this reflects only how recently the result was checked, not whether it can be trusted to still be accurate.`

  const recommendedEngineeringAction = typescriptFailing
    ? 'Run npx tsc --noEmit locally and fix the reported type errors, then run the build command below to confirm.'
    : 'Run the build command below locally and fix the reported errors.'

  const aiEngineeringRecommendation = typescriptFailing
    ? 'Resolve outstanding TypeScript errors, then fix the failing build before starting new work.'
    : 'Fix the failing build before starting new work.'

  const executiveSummary = `The last recorded build failed on branch "${git.branch}"${
    typescriptFailing ? ', caused by a failing TypeScript check' : ''
  }. No passing build has been recorded since ${checkedAt}.`

  return {
    executiveSummary,
    failureCategory,
    rootCause,
    impact,
    recommendedEngineeringAction,
    // Build Intelligence records only pass/fail status, never which files were
    // involved — honestly empty rather than guessed from an unrelated scan.
    filesInvolved: [],
    buildCommand: KNOWN_BUILD_COMMAND,
    buildOutput:
      'Not captured — the Build Intelligence Engine records only the last pass/fail result and warning count, never build stdout. ' +
      `Build warnings recorded: ${build.buildWarningCount}.`,
    typescriptDiagnostics: typescriptFailing
      ? `TypeScript Status: Failing (checked ${checkedAt}). No per-error diagnostic text is recorded — only the pass/fail result.`
      : `TypeScript Status: Passing (checked ${checkedAt}).`,
    eslintDiagnostics:
      'Not available — ESLint is not run automatically by the Build Intelligence Engine, so no lint diagnostic result is recorded for this build.',
    aiEngineeringRecommendation,
    retryRecommendation: RETRY_GOVERNANCE_NOTE,
    repositoryBranch: git.branch,
    repositoryCommit: git.commitMessage !== 'Unavailable' ? `${git.commitHash} — ${git.commitMessage}` : git.commitHash,
    lastCheckedAt: checkedAt,
    buildConfidence: build.buildConfidence,
  }
}
