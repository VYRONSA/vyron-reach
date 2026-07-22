import { randomUUID } from 'node:crypto'
import * as knowledgeService from '../../knowledge/knowledgeService'
import { createInboxItem } from '../engineeringInboxStore'
import { raiseNotification } from '../../notifications/notificationService'
import {
  insertReleaseRequest,
  getReleaseRequest,
  listReleaseRequests,
  updateReleaseRequest,
  appendReleaseControlDecision,
  listReleaseControlDecisions,
} from './releaseManagementStore'
import {
  createRealExec,
  readPackageVersion,
  computeNextVersion,
  releaseBranchName,
  runReleasePreparation,
  runVersionManagement,
  runReleaseNotes,
  runGitCommitValidation,
  runBranchValidation,
  runMergeReadinessPreCheck,
  pendingGoResults,
  executeGitCommitValidation,
  executeBranchValidation,
  executePullRequestCreation,
  executeMergeReadinessCheck,
  executeCiCdTriggering,
  executeDeploymentExecution,
  executeDeploymentVerification,
  hasGitRemote,
  hasWorkflowsConfigured,
} from './releaseManagementRunners'
import { isDeploymentConfigured } from '../../deploymentIntelligence'
import type {
  ExecImpl,
  ReleaseActivityResult,
  ReleaseControlDecision,
  ReleaseControlDecisionType,
  ReleaseReport,
  ReleaseRequest,
  ReleaseRequestStatus,
  ReleaseRunContext,
} from './releaseManagementTypes'

/**
 * Autonomous Release Management's orchestrator — two structurally
 * separate functions, mirroring lib/dev/initiation/executiveControlService.ts's
 * own separation exactly: prepareRelease (automatic, read-only/local,
 * no Go required) and executeRelease (the ONLY function that ever runs
 * a mutating git/gh/vercel command, reachable exclusively from a
 * verified 'Go' decision). Nothing in this file calls executeRelease
 * except submitReleaseControlDecision, and executeRelease itself
 * re-verifies the Go decision at its own entry — defense in depth, not
 * just trusting the caller.
 */

export class ReleaseNotFoundError extends Error {
  constructor(id: string) {
    super(`ReleaseRequest '${id}' not found.`)
    this.name = 'ReleaseNotFoundError'
  }
}

export class ReleaseConflictError extends Error {
  constructor(
    public readonly id: string,
    public readonly actualStatus: string,
    public readonly allowed: string[]
  ) {
    super(`ReleaseRequest '${id}' is '${actualStatus}', expected one of: ${allowed.join(', ')}.`)
    this.name = 'ReleaseConflictError'
  }
}

export class ReleaseControlInputError extends Error {
  constructor(id: string, reason: string) {
    super(`ReleaseRequest '${id}': invalid Go/Hold decision — ${reason}`)
    this.name = 'ReleaseControlInputError'
  }
}

// PRA-P1-029 remediation — mirrors certificationClassifier.ts's
// "don't create a second Open record for the same feature" guard: nothing
// audited currently double-calls prepareRelease for the same project, but
// there was no structural protection if a future caller ever did, so a
// second call while one is already Prepared/Releasing would have silently
// created a second, independent ReleaseRequest.
export class ReleaseAlreadyActiveError extends Error {
  constructor(
    public readonly project: string,
    public readonly existingId: string,
    public readonly existingStatus: ReleaseRequestStatus
  ) {
    super(`Project '${project}' already has an active release ('${existingId}', status '${existingStatus}') — resolve it before preparing another.`)
    this.name = 'ReleaseAlreadyActiveError'
  }
}

export function describeReleaseManagementError(err: unknown): { status: number; error: string } | null {
  if (err instanceof ReleaseNotFoundError) return { status: 404, error: err.message }
  if (err instanceof ReleaseConflictError) return { status: 409, error: err.message }
  if (err instanceof ReleaseControlInputError) return { status: 400, error: err.message }
  if (err instanceof ReleaseAlreadyActiveError) return { status: 409, error: err.message }
  return null
}

export type ReleaseApplicability = {
  pullRequestCreation: boolean
  ciCdTriggering: boolean
  deploymentExecution: boolean
}

export async function determineApplicability(cwd: string, exec: ExecImpl): Promise<ReleaseApplicability> {
  return {
    pullRequestCreation: await hasGitRemote({ cwd, exec }),
    ciCdTriggering: hasWorkflowsConfigured(cwd),
    deploymentExecution: isDeploymentConfigured(cwd),
  }
}

export function getRelease(id: string): ReleaseRequest | null {
  return getReleaseRequest(id)
}

export function listReleases(project?: string): ReleaseRequest[] {
  return listReleaseRequests(project)
}

/**
 * Runs only the six preparatory activities — never touches git, gh, or
 * vercel. Creates a Prepared ReleaseRequest and raises a real Inbox item
 * + notification so a human sees it needs a Go/Hold decision, using the
 * same Engineering Inbox surface every other required intervention in
 * this app already uses (GlobalEngineeringInboxView shows it regardless
 * of the project's own Director state, which by this point is already
 * legitimately 'Completed' — this function deliberately never touches
 * DirectorRuntimeStatus itself).
 */
export async function prepareRelease(project: string, cwd: string = process.cwd(), exec: ExecImpl = createRealExec()): Promise<ReleaseRequest> {
  const active = listReleaseRequests(project).find(r => r.status === 'Prepared' || r.status === 'Releasing')
  if (active) throw new ReleaseAlreadyActiveError(project, active.id, active.status)

  const start = Date.now()
  const id = randomUUID()
  const currentVersion = readPackageVersion(cwd) ?? '0.0.0'
  const version = computeNextVersion(currentVersion)
  const branchName = releaseBranchName(project, version)

  const baseCtx: ReleaseRunContext = { project, releaseId: id, cwd, version, branchName, notes: '', exec }

  const results: ReleaseActivityResult[] = []
  results.push(await runReleasePreparation(baseCtx))
  results.push(await runVersionManagement(baseCtx))
  const notesResult = await runReleaseNotes(baseCtx)
  results.push(notesResult)
  const notes = notesResult.detail
  const ctx: ReleaseRunContext = { ...baseCtx, notes }
  results.push(await runGitCommitValidation(ctx))
  results.push(await runBranchValidation(ctx))
  results.push(await runMergeReadinessPreCheck(ctx))
  results.push(...pendingGoResults())

  const passed = results.every(r => r.status !== 'Failed')
  const preparationReport: ReleaseReport = { activities: results, passed, runAt: new Date().toISOString(), durationMs: Date.now() - start }

  const now = new Date().toISOString()
  const record: ReleaseRequest = {
    id,
    project,
    status: 'Prepared',
    version,
    notes,
    branchName,
    commitSha: null,
    prUrl: null,
    deploymentUrl: null,
    preparationReport,
    executionReport: null,
    createdAt: now,
    updatedAt: now,
  }
  insertReleaseRequest(record)

  const failedSummary = results
    .filter(r => r.status === 'Failed')
    .map(r => `${r.activity}: ${r.summary}`)
    .join(' | ')
  const reason = passed
    ? `Release v${version} has been prepared and is ready for review.`
    : `Release v${version} preparation found blocking issue(s): ${failedSummary}`

  const item = createInboxItem({
    project,
    batchId: null,
    batchNumber: null,
    reasonType: 'Release Go/Hold Required',
    reason,
    severity: passed ? 'Medium' : 'High',
    recommendedAction: 'Review the prepared release and record a Go or Hold decision.',
    // PRA-P1-019: re-preparing this exact release reopens the same item instead of piling up duplicates.
    sourceRef: id,
  })
  await raiseNotification({
    type: 'Release Go/Hold Required',
    project,
    title: `${project}: release v${version} awaiting Go/Hold`,
    message: reason,
    severity: passed ? 'Medium' : 'High',
    metadata: { releaseId: id, inboxItemId: item.id },
  })

  knowledgeService.recordTimelineEvent({
    project,
    source: 'Headless',
    category: 'Release',
    title: `Release v${version} prepared`,
    detail: reason,
  })

  return record
}

export type SubmitReleaseControlDecisionInput = {
  executive: string
  decision: ReleaseControlDecisionType
  reason: string
}

/**
 * Mirrors submitExecutiveControlDecision exactly: only a 'Go' decision,
 * on a genuinely Prepared release, ever kicks off executeRelease — the
 * one function in this whole module capable of touching git/gh/vercel
 * for real. `cwd`/`exec` are threaded through explicitly (never
 * defaulted silently here) so a caller that prepared a release against
 * a specific working tree/exec implementation (production: the real
 * repo; tests: an isolated fixture) can never have executeRelease fall
 * back to its own defaults — the exact bug a live verification pass
 * caught: omitting these here previously meant an approved release
 * would execute against process.cwd() and a real subprocess exec
 * regardless of what prepareRelease was actually given.
 *
 * PRA-P1-026/027 remediation: the status CAS (updateReleaseRequest, which
 * runs inside a real file lock) is now the single source of truth for
 * whether THIS submission took effect — the decision record is appended
 * only after that outcome is known, tagged `effective` accordingly, and
 * the release-not-Prepared error carries the freshly re-read actual
 * status. Previously the decision was appended unconditionally before
 * the CAS ever ran, so two concurrent submissions (double-click, or two
 * executives) both got a permanent record even if they disagreed, with
 * no indication of which one "won"; and the conflict error/fallback
 * return value used the pre-mutation snapshot read at the top of this
 * function, which could already be stale by the time the CAS itself ran.
 */
export function submitReleaseControlDecision(
  project: string,
  releaseId: string,
  input: SubmitReleaseControlDecisionInput,
  cwd: string = process.cwd(),
  exec: ExecImpl = createRealExec()
): ReleaseRequest {
  const existing = getReleaseRequest(releaseId)
  if (!existing || existing.project !== project) throw new ReleaseNotFoundError(releaseId)
  if (!input.reason?.trim()) throw new ReleaseControlInputError(releaseId, 'reason is required.')

  const targetStatus: ReleaseRequestStatus = input.decision === 'Hold' ? 'Held' : 'Releasing'
  const applied = updateReleaseRequest(releaseId, c => (c.status === 'Prepared' ? { ...c, status: targetStatus, updatedAt: new Date().toISOString() } : null))

  const decision: ReleaseControlDecision = {
    id: randomUUID(),
    releaseId,
    project,
    executive: input.executive,
    decidedAt: new Date().toISOString(),
    decision: input.decision,
    reason: input.reason.trim(),
    effective: applied !== null,
  }
  appendReleaseControlDecision(decision)

  if (!applied) {
    // Lost the race (or the release genuinely wasn't Prepared) — re-read
    // rather than trust the pre-mutation `existing` snapshot above, which
    // may already be stale by now.
    const current = getReleaseRequest(releaseId) ?? existing
    throw new ReleaseConflictError(releaseId, current.status, ['Prepared'])
  }

  knowledgeService.recordTimelineEvent({
    project,
    source: 'Manual',
    category: 'Business Decision',
    title: `Release Control: ${input.decision}`,
    detail: `${input.executive}: ${decision.reason}`,
  })

  if (input.decision === 'Go') void executeRelease(project, releaseId, cwd, exec)
  return applied
}

async function failRelease(project: string, releaseId: string, version: string, results: ReleaseActivityResult[], start: number): Promise<void> {
  const executionReport: ReleaseReport = { activities: results, passed: false, runAt: new Date().toISOString(), durationMs: Date.now() - start }
  updateReleaseRequest(releaseId, c => ({ ...c, status: 'ReleaseFailed', executionReport, updatedAt: new Date().toISOString() }))
  knowledgeService.recordRelease({
    project,
    version,
    passed: false,
    durationMs: executionReport.durationMs,
    activities: results.map(r => ({ activity: r.activity, status: r.status, summary: r.summary })),
  })

  const failed = results.filter(r => r.status === 'Failed')
  const reason = failed.map(a => `${a.activity}: ${a.summary}`).join(' | ') || 'Release execution failed.'
  const item = createInboxItem({
    project,
    batchId: null,
    batchNumber: null,
    reasonType: 'Release Failure',
    reason,
    severity: 'Critical',
    recommendedAction: 'Review the release evidence, address the failure, and prepare a new release.',
    // PRA-P1-019: a repeated failure for this exact release reopens the same item instead of piling up duplicates.
    sourceRef: releaseId,
  })
  await raiseNotification({
    type: 'Release Failure',
    project,
    title: `${project}: release v${version} failed`,
    message: reason,
    severity: 'Critical',
    metadata: { releaseId, inboxItemId: item.id },
  })
}

/**
 * PRA-P1-025 remediation — finds every ReleaseRequest a crash or restart
 * left stuck in 'Releasing'. Unlike Provisioning (PRA-P1-015), execution
 * here is deliberately NOT resumed/retried: executeRelease's mutating
 * steps (git commit, branch push, PR creation, deployment) have no
 * per-step checkpoint the way provisionProgramme's tempId map does, so a
 * blind retry after an unknown partial failure risks a duplicate commit,
 * a second PR, or a second deployment attempt against whatever the first,
 * interrupted attempt already did to the real repository. Failing the
 * record out cleanly — the same permanent, human-visible path
 * failRelease already uses for any other execution failure — is the
 * correct behavior when what actually happened can't be safely
 * determined automatically: it surfaces the exact "Release Failure"
 * inbox item and notification every other execution failure produces,
 * so a human reviews the real repository/deployment state before
 * preparing a new release for this project, rather than the record
 * being silently and permanently stuck with no signal at all.
 */
export async function resumeStuckReleases(): Promise<{ failedOut: string[] }> {
  const stuck = listReleaseRequests().filter(r => r.status === 'Releasing')
  const failedOut: string[] = []

  for (const release of stuck) {
    const interrupted: ReleaseActivityResult = {
      activity: 'Release Preparation',
      status: 'Failed',
      summary: 'Release execution was interrupted by a server restart before it could complete.',
      detail:
        'This release was left in "Releasing" status by a crash or restart mid-execution. Some mutating steps ' +
        '(commit/branch/push/PR/deployment) may have partially completed against the real repository — verify the ' +
        'actual repository and deployment state manually before preparing a new release for this project.',
      durationMs: null,
    }
    await failRelease(release.project, release.id, release.version, [interrupted], Date.now())
    failedOut.push(release.id)
  }

  return { failedOut }
}

/**
 * The only function in this module that ever runs a mutating git/gh/
 * vercel command. Re-verifies a 'Go' decision exists for this exact
 * releaseId at its own entry — defense in depth, independent of whether
 * the caller already checked, so a future retry/resume path can never
 * accidentally reach the mutating sequence without this being
 * independently true. `--prod` never appears anywhere in this call
 * chain: deployment is always a preview, production promotion stays a
 * human action entirely outside this subsystem.
 */
export async function executeRelease(project: string, releaseId: string, cwd: string = process.cwd(), exec: ExecImpl = createRealExec()): Promise<void> {
  const decisions = listReleaseControlDecisions(releaseId)
  if (!decisions.some(d => d.decision === 'Go')) return

  const release = getReleaseRequest(releaseId)
  if (!release || release.project !== project) return
  if (!release.preparationReport.passed) {
    updateReleaseRequest(releaseId, c => ({ ...c, status: 'ReleaseFailed', updatedAt: new Date().toISOString() }))
    return
  }

  const start = Date.now()
  const ctx: ReleaseRunContext = { project, releaseId, cwd, version: release.version, branchName: release.branchName, notes: release.notes, exec }
  const results: ReleaseActivityResult[] = []

  try {
    const commitResult = await executeGitCommitValidation(ctx)
    results.push(commitResult)
    if (commitResult.status === 'Failed') return await failRelease(project, releaseId, release.version, results, start)

    const branchResult = await executeBranchValidation(ctx)
    results.push(branchResult)
    if (branchResult.status === 'Failed') return await failRelease(project, releaseId, release.version, results, start)

    const applicability = await determineApplicability(cwd, exec)

    let prUrl: string | null = null
    if (applicability.pullRequestCreation) {
      const prResult = await executePullRequestCreation(ctx)
      results.push(prResult)
      if (prResult.status === 'Failed') return await failRelease(project, releaseId, release.version, results, start)
      prUrl = prResult.summary.match(/https:\/\/\S+/)?.[0] ?? null

      results.push(await executeMergeReadinessCheck(ctx))
      // A not-yet-mergeable PR is common and expected (review pending) — it doesn't
      // block a preview deployment below, only recorded as real, structured evidence.
    } else {
      results.push({ activity: 'Pull Request Creation', status: 'Not Applicable', summary: 'No git remote configured.', detail: '', durationMs: null })
      results.push({ activity: 'Merge Readiness', status: 'Not Applicable', summary: 'No pull request exists to check.', detail: '', durationMs: null })
    }

    results.push(await executeCiCdTriggering(ctx))

    let deploymentUrl: string | null = null
    if (applicability.deploymentExecution) {
      const deployResult = await executeDeploymentExecution(ctx)
      results.push(deployResult)
      if (deployResult.status === 'Failed') return await failRelease(project, releaseId, release.version, results, start)
      deploymentUrl = deployResult.summary.match(/https:\/\/\S+/)?.[0] ?? null

      if (deploymentUrl) {
        const verifyResult = await executeDeploymentVerification(deploymentUrl)
        results.push(verifyResult)
        if (verifyResult.status === 'Failed') return await failRelease(project, releaseId, release.version, results, start)
      }
    } else {
      results.push({ activity: 'Deployment Execution', status: 'Not Applicable', summary: 'No deployment provider configured.', detail: '', durationMs: null })
      results.push({ activity: 'Deployment Verification', status: 'Not Applicable', summary: 'No deployment was executed.', detail: '', durationMs: null })
    }

    const commitSha = commitResult.summary.match(/([0-9a-f]{7,40})/)?.[1] ?? null
    const executionReport: ReleaseReport = { activities: results, passed: true, runAt: new Date().toISOString(), durationMs: Date.now() - start }
    updateReleaseRequest(releaseId, c => ({ ...c, status: 'Released', commitSha, prUrl, deploymentUrl, executionReport, updatedAt: new Date().toISOString() }))

    knowledgeService.recordRelease({
      project,
      version: release.version,
      passed: true,
      durationMs: executionReport.durationMs,
      activities: results.map(r => ({ activity: r.activity, status: r.status, summary: r.summary })),
    })
  } catch (err) {
    results.push({
      activity: 'Deployment Execution',
      status: 'Failed',
      summary: 'An unexpected error occurred during release execution.',
      detail: err instanceof Error ? err.message : String(err),
      durationMs: null,
    })
    await failRelease(project, releaseId, release.version, results, start)
  }
}
