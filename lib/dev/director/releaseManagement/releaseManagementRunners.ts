import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import * as knowledgeService from '../../knowledge/knowledgeService'
import * as planningStateService from '../../planningState/planningStateService'
import { isDeploymentConfigured } from '../../deploymentIntelligence'
import type { ExecImpl, ExecResult, ReleaseActivityResult, ReleaseRunContext } from './releaseManagementTypes'

/**
 * Every activity Autonomous Release Management can perform — the
 * preparatory six run automatically and never mutate anything; the
 * remaining ones only ever run from releaseManagementService.ts's
 * executeRelease, which itself only runs after a verified Go decision.
 * All `gh`/`vercel`/`git` calls go through the injected `ctx.exec` seam
 * (never child_process directly) so tests can substitute a fake and
 * verify this file's logic without touching real infrastructure.
 */

/** Production binds this; tests bind a fake. Mirrors qualityAssuranceRunners.ts's execFile pattern exactly. */
export function createRealExec(): ExecImpl {
  return (cmd, args, cwd) =>
    new Promise<ExecResult>(resolve => {
      execFile(cmd, args, { cwd, timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024, shell: true }, (err, stdout, stderr) => {
        const code = typeof err?.code === 'number' ? err.code : err ? 1 : 0
        resolve({ code, stdout: stdout ?? '', stderr: stderr ?? '' })
      })
    })
}

export function readPackageVersion(cwd: string): string | null {
  try {
    const raw = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw) as { version?: string }
    return typeof parsed.version === 'string' ? parsed.version : null
  } catch {
    return null
  }
}

/** Deterministic patch bump — no conventional-commit convention exists anywhere in this codebase to base a smarter (minor/major) bump on; a fabricated "smart" categorization would be worse than an honest, simple default. */
export function computeNextVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(n => Number(n))
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return currentVersion
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
}

export function releaseBranchName(project: string, version: string): string {
  return `autonomous-release/${project}/v${version}`
}

// ---- Preparatory activities (read-only, run automatically, no Go required) ----

export async function runReleasePreparation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const version = readPackageVersion(ctx.cwd)
  if (version === null) {
    return {
      activity: 'Release Preparation',
      status: 'Failed',
      summary: 'Could not read package.json version.',
      detail: `No readable "version" field found in ${path.join(ctx.cwd, 'package.json')}.`,
      durationMs: Date.now() - start,
    }
  }
  const handovers = knowledgeService.listHandovers(ctx.project)
  const batchCompletions = knowledgeService.listBatchCompletions(ctx.project)
  const milestoneCompletions = knowledgeService.listMilestoneCompletions(ctx.project)
  const verifications = knowledgeService.listVerifications(ctx.project)

  // PRA-P1-024 remediation — defense in depth, matching executeRelease's
  // own re-check of the Go decision rather than trusting only that every
  // Complete batch already passed QA inside the loop. listVerifications
  // returns newest-first (append-only, prepended), so [0] is the most
  // recent run. Currently unreachable via any audited code path (every
  // Complete batch does pass QA to get there first), but this is the
  // safety net if a batch's status is ever set Complete through any other
  // path (a future migration, a manual planning-state edit) — this
  // activity now actually fails instead of only ever reporting a count.
  // No verification history at all is left as-is (not itself a failure —
  // never fabricates a pass/fail judgment where no evidence exists).
  const mostRecentVerification = verifications[0] ?? null
  if (mostRecentVerification && !mostRecentVerification.passed) {
    const failedActivities = mostRecentVerification.activities.filter(a => a.status === 'Failed')
    const failedSummary = failedActivities.map(a => `${a.activity}: ${a.summary}`).join(' | ')
    return {
      activity: 'Release Preparation',
      status: 'Failed',
      summary: `Most recent verification run (${mostRecentVerification.timestamp}) failed.`,
      detail: failedSummary || 'The most recent recorded verification run did not pass, but recorded no per-activity failure detail.',
      durationMs: Date.now() - start,
    }
  }

  return {
    activity: 'Release Preparation',
    status: 'Passed',
    summary: `${batchCompletions.length} batch(es), ${milestoneCompletions.length} milestone(s), ${verifications.length} verification run(s) on record.`,
    detail: `Current version: ${version}. Handovers: ${handovers.length}. Batch completions: ${batchCompletions.length}. Milestone completions: ${milestoneCompletions.length}. Verification runs: ${verifications.length}.`,
    durationMs: Date.now() - start,
  }
}

export async function runVersionManagement(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const current = readPackageVersion(ctx.cwd)
  if (current === null) {
    return {
      activity: 'Version Management',
      status: 'Failed',
      summary: 'Could not read the current version.',
      detail: `No readable "version" field found in ${path.join(ctx.cwd, 'package.json')}.`,
      durationMs: Date.now() - start,
    }
  }
  const next = computeNextVersion(current)
  return {
    activity: 'Version Management',
    status: 'Passed',
    summary: `${current} → ${next} (patch).`,
    detail: `Deterministic patch bump — no conventional-commit convention exists in this repository to base a minor/major decision on.`,
    durationMs: Date.now() - start,
  }
}

export async function runReleaseNotes(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const batchCompletions = knowledgeService.listBatchCompletions(ctx.project)
  const milestoneCompletions = knowledgeService.listMilestoneCompletions(ctx.project)
  const lines: string[] = []
  for (const m of milestoneCompletions.slice(0, 20)) lines.push(`- Milestone: ${m.milestoneTitle} (${m.phase})`)
  for (const b of batchCompletions.slice(0, 20)) lines.push(`- Batch ${b.batchNumber}: ${b.objective || b.summary}`)
  const notes = lines.length > 0 ? lines.join('\n') : 'No recorded batch or milestone completions were found for this project.'
  return {
    activity: 'Release Notes',
    status: 'Passed',
    summary: `${lines.length} line(s) composed from real completion records.`,
    detail: notes,
    durationMs: Date.now() - start,
  }
}

const UNMERGED_PREFIXES = ['UU ', 'AA ', 'DD ']

export async function runGitCommitValidation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const result = await ctx.exec('git', ['status', '--porcelain'], ctx.cwd)
  const durationMs = Date.now() - start
  if (result.code !== 0) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'git status failed.', detail: result.stderr || result.stdout, durationMs }
  }
  const lines = result.stdout.split('\n').filter(Boolean)
  const unmerged = lines.filter(l => UNMERGED_PREFIXES.some(p => l.startsWith(p)))
  if (unmerged.length > 0) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: `${unmerged.length} unmerged path(s) found.`, detail: unmerged.join('\n'), durationMs }
  }
  if (lines.length === 0) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'No pending changes to release.', detail: 'git status --porcelain returned nothing — there is nothing new to commit for this release.', durationMs }
  }
  return { activity: 'Git Commit Validation', status: 'Passed', summary: `${lines.length} changed file(s), no unmerged paths.`, detail: lines.join('\n'), durationMs }
}

export async function runBranchValidation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const result = await ctx.exec('git', ['rev-parse', '--verify', '--quiet', ctx.branchName], ctx.cwd)
  const durationMs = Date.now() - start
  // rev-parse --verify --quiet exits 0 (branch exists) or non-zero (doesn't) — non-zero is the success case here.
  if (result.code === 0) {
    return {
      activity: 'Branch Validation',
      status: 'Failed',
      summary: `Branch "${ctx.branchName}" already exists.`,
      detail: 'Refusing to reuse or rename an existing branch — this activity hard-fails on collision rather than silently picking a different name.',
      durationMs,
    }
  }
  return { activity: 'Branch Validation', status: 'Passed', summary: `Branch name "${ctx.branchName}" is available.`, detail: '', durationMs }
}

/** Real, blocking Risk Governance check — the same bar the existing Executive Risk Gate already holds at Provisioning (lib/dev/initiation/riskGate.ts), extended to gate a release: any unresolved High-severity risk fails this activity. */
export async function runMergeReadinessPreCheck(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const openHighRisks = planningStateService.listRisks(ctx.project).filter(r => r.status === 'Open' && r.severity === 'High')
  const durationMs = Date.now() - start
  if (openHighRisks.length > 0) {
    return {
      activity: 'Merge Readiness',
      status: 'Failed',
      summary: `${openHighRisks.length} unresolved High-severity risk(s).`,
      detail: openHighRisks.map(r => `${r.title}: ${r.description}`).join('\n'),
      durationMs,
    }
  }
  return { activity: 'Merge Readiness', status: 'Passed', summary: 'No unresolved High-severity risks.', detail: '', durationMs }
}

function gapResult(activity: ReleaseActivityResult['activity'], reason: string): ReleaseActivityResult {
  return { activity, status: 'Skipped', summary: 'Awaiting Release Go/Hold decision.', detail: reason, durationMs: null }
}

/** The four mutating activities are always reported as Skipped (not Failed, not fabricated Passed) in the preparation report — they haven't run yet, and won't until a human records Go. */
export function pendingGoResults(): ReleaseActivityResult[] {
  return [
    gapResult('Pull Request Creation', 'Not attempted — a release must be approved before its branch is pushed and a pull request opened.'),
    gapResult('CI/CD Triggering', 'Not attempted — awaiting Release Go/Hold.'),
    gapResult('Deployment Execution', 'Not attempted — awaiting Release Go/Hold.'),
    gapResult('Deployment Verification', 'Not attempted — awaiting Release Go/Hold.'),
  ]
}

// ---- Execution activities (only reachable from executeRelease, after a verified Go) ----

export async function executeGitCommitValidation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const status = await ctx.exec('git', ['status', '--porcelain'], ctx.cwd)
  if (status.code !== 0 || !status.stdout.trim()) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'Nothing to commit at execution time.', detail: status.stderr || 'git status --porcelain returned nothing.', durationMs: Date.now() - start }
  }

  try {
    const pkgPath = path.join(ctx.cwd, 'package.json')
    const raw = fs.readFileSync(pkgPath, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>
    parsed.version = ctx.version
    fs.writeFileSync(pkgPath, `${JSON.stringify(parsed, null, 2)}\n`)
  } catch (err) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'Could not write the release version into package.json.', detail: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start }
  }

  const add = await ctx.exec('git', ['add', '-A'], ctx.cwd)
  if (add.code !== 0) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'git add failed.', detail: add.stderr, durationMs: Date.now() - start }
  }
  // A multi-line commit message passed as a single `-m` argv entry is
  // fragile once execFile shells out (embedded newlines can break
  // cmd.exe's quoting on Windows) — `-F <file>` is the standard, robust
  // way git itself supports for a message of arbitrary length/content.
  const messageFile = path.join(os.tmpdir(), `vyron-release-message-${randomUUID()}.txt`)
  const commit = await (async () => {
    try {
      fs.writeFileSync(messageFile, `Release v${ctx.version}\n\n${ctx.notes}\n`)
      return await ctx.exec('git', ['commit', '-F', messageFile], ctx.cwd)
    } finally {
      fs.rmSync(messageFile, { force: true })
    }
  })()
  if (commit.code !== 0) {
    return { activity: 'Git Commit Validation', status: 'Failed', summary: 'git commit failed.', detail: commit.stderr || commit.stdout, durationMs: Date.now() - start }
  }
  const sha = await ctx.exec('git', ['rev-parse', 'HEAD'], ctx.cwd)
  return {
    activity: 'Git Commit Validation',
    status: 'Passed',
    summary: `Committed as ${sha.stdout.trim().slice(0, 12) || 'unknown'}.`,
    detail: commit.stdout,
    durationMs: Date.now() - start,
  }
}

export async function executeBranchValidation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const exists = await ctx.exec('git', ['rev-parse', '--verify', '--quiet', ctx.branchName], ctx.cwd)
  if (exists.code === 0) {
    return { activity: 'Branch Validation', status: 'Failed', summary: `Branch "${ctx.branchName}" already exists.`, detail: 'Refusing to reuse an existing branch.', durationMs: Date.now() - start }
  }
  const checkout = await ctx.exec('git', ['checkout', '-b', ctx.branchName], ctx.cwd)
  if (checkout.code !== 0) {
    return { activity: 'Branch Validation', status: 'Failed', summary: 'git checkout -b failed.', detail: checkout.stderr, durationMs: Date.now() - start }
  }
  // Never --force, never master/main directly — this always pushes the newly-created, distinctly-named release branch.
  const push = await ctx.exec('git', ['push', 'origin', ctx.branchName], ctx.cwd)
  if (push.code !== 0) {
    return { activity: 'Branch Validation', status: 'Failed', summary: 'git push failed.', detail: push.stderr || push.stdout, durationMs: Date.now() - start }
  }
  return { activity: 'Branch Validation', status: 'Passed', summary: `Branch "${ctx.branchName}" created and pushed.`, detail: push.stdout || push.stderr, durationMs: Date.now() - start }
}

export async function hasGitRemote(ctx: Pick<ReleaseRunContext, 'cwd' | 'exec'>): Promise<boolean> {
  const result = await ctx.exec('git', ['remote'], ctx.cwd)
  return result.code === 0 && result.stdout.trim().length > 0
}

const PR_URL_PATTERN = /https:\/\/\S+/

export async function executePullRequestCreation(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  // `--body-file` (same reasoning as git commit's `-F` above) — a
  // multi-line release-notes body passed as a single `--body` argv
  // entry is fragile once execFile shells out on Windows.
  const bodyFile = path.join(os.tmpdir(), `vyron-release-pr-body-${randomUUID()}.md`)
  let result: ExecResult
  try {
    fs.writeFileSync(bodyFile, ctx.notes)
    result = await ctx.exec('gh', ['pr', 'create', '--base', 'master', '--head', ctx.branchName, '--title', `Release v${ctx.version}`, '--body-file', bodyFile], ctx.cwd)
  } finally {
    fs.rmSync(bodyFile, { force: true })
  }
  const durationMs = Date.now() - start
  if (result.code !== 0) {
    return { activity: 'Pull Request Creation', status: 'Failed', summary: 'gh pr create failed.', detail: result.stderr || result.stdout, durationMs }
  }
  const match = result.stdout.match(PR_URL_PATTERN)
  if (!match) {
    return { activity: 'Pull Request Creation', status: 'Failed', summary: 'gh pr create returned no PR URL.', detail: result.stdout, durationMs }
  }
  return { activity: 'Pull Request Creation', status: 'Passed', summary: `Pull request opened: ${match[0]}`, detail: result.stdout, durationMs }
}

export async function executeMergeReadinessCheck(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const result = await ctx.exec('gh', ['pr', 'view', ctx.branchName, '--json', 'mergeable,mergeStateStatus'], ctx.cwd)
  const durationMs = Date.now() - start
  if (result.code !== 0) {
    return { activity: 'Merge Readiness', status: 'Failed', summary: 'gh pr view failed.', detail: result.stderr || result.stdout, durationMs }
  }
  try {
    const parsed = JSON.parse(result.stdout) as { mergeable?: string; mergeStateStatus?: string }
    const mergeable = parsed.mergeable === 'MERGEABLE'
    return {
      activity: 'Merge Readiness',
      status: mergeable ? 'Passed' : 'Failed',
      summary: `mergeable: ${parsed.mergeable ?? 'unknown'}, state: ${parsed.mergeStateStatus ?? 'unknown'}.`,
      detail: result.stdout,
      durationMs,
    }
  } catch {
    return { activity: 'Merge Readiness', status: 'Failed', summary: 'gh pr view returned unparseable output.', detail: result.stdout, durationMs }
  }
}

export function hasWorkflowsConfigured(cwd: string): boolean {
  try {
    return fs.existsSync(path.join(cwd, '.github', 'workflows')) && fs.readdirSync(path.join(cwd, '.github', 'workflows')).length > 0
  } catch {
    return false
  }
}

export async function executeCiCdTriggering(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  return {
    activity: 'CI/CD Triggering',
    status: 'Not Applicable',
    summary: 'No CI/CD workflow is configured in this repository.',
    detail: `No .github/workflows directory (or an empty one) exists at ${ctx.cwd} — there is nothing to trigger.`,
    durationMs: null,
  }
}

const DEPLOYMENT_URL_PATTERN = /https:\/\/\S+\.vercel\.app\S*/

/** Preview deployments only — `--prod` never appears in this argv array anywhere in this file. Production promotion stays a human action outside this subsystem, permanently, not just by default. */
export async function executeDeploymentExecution(ctx: ReleaseRunContext): Promise<ReleaseActivityResult> {
  const start = Date.now()
  const result = await ctx.exec('vercel', ['deploy', '--yes'], ctx.cwd)
  const durationMs = Date.now() - start
  if (result.code !== 0) {
    return { activity: 'Deployment Execution', status: 'Failed', summary: 'vercel deploy failed.', detail: result.stderr || result.stdout, durationMs }
  }
  const match = (result.stdout + result.stderr).match(DEPLOYMENT_URL_PATTERN)
  if (!match) {
    return { activity: 'Deployment Execution', status: 'Failed', summary: 'vercel deploy did not return a deployment URL.', detail: result.stdout + result.stderr, durationMs }
  }
  return { activity: 'Deployment Execution', status: 'Passed', summary: `Preview deployed: ${match[0]}`, detail: result.stdout, durationMs }
}

export async function executeDeploymentVerification(deploymentUrl: string): Promise<ReleaseActivityResult> {
  const start = Date.now()
  try {
    const response = await fetch(deploymentUrl, { method: 'GET', redirect: 'follow' })
    const durationMs = Date.now() - start
    const ok = response.status >= 200 && response.status < 400
    return {
      activity: 'Deployment Verification',
      status: ok ? 'Passed' : 'Failed',
      summary: `HTTP ${response.status} from ${deploymentUrl}.`,
      detail: `Response status: ${response.status} ${response.statusText}.`,
      durationMs,
    }
  } catch (err) {
    return {
      activity: 'Deployment Verification',
      status: 'Failed',
      summary: 'Could not reach the deployment URL.',
      detail: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }
  }
}
