import { createDevelopmentJob, getDevelopmentJob } from '../runtime/runtimeEngine'
import { runVerification, describeVerificationFailure } from './qualityAssurance/qualityAssuranceService'
import { prepareRelease } from './releaseManagement/releaseManagementService'
import { captureChangedFilePaths } from '../gitDiffCapture'
import { parseClaudeReport, splitReportItems } from '../developmentCompletionEngine'
import type { ExecutionIdentity } from '../runtime/executionIdentity'
import * as knowledgeService from '../knowledge/knowledgeService'
import { refreshEngineeringContextIfNeeded } from './liveKnowledgeRefresh'
import { runAssessment } from './assessment/assessmentService'
import { assignWorkerRole } from './workforce/taskAssignment'
import { getWorkerRoleConfig } from './workforce/workerRoles'
import { createWorkforceTask, attachRuntimeJobId, recordWorkforceTaskCompletion, recentWorkforceTasks } from './workforce/workforceTaskStore'
import { buildWorkerTaskResult, validateWorkerOutput } from './workforce/workerReview'
import { detectWorkforceConflict, resolveWorkforceConflict } from './workforce/conflictResolution'
import { getGitIntelligence } from '../gitIntelligence'
import { acquireLoopOwnership, releaseLoopOwnership } from './directorLock'
import { getExecutionSnapshot, saveExecutionSnapshot } from './executionSnapshotStore'
import {
  enforceSnapshotPlanningState,
  getCurrentBatch,
  getMilestoneForBatch,
  isProjectComplete,
  isPhaseComplete,
  completeBatchInSnapshot,
} from './serverPlanningState'
import { buildServerDevelopmentContext, buildServerAutonomousPrompt } from './serverContextBuilder'
import { summarizeAttribution } from './engineeringIntelligence/engineeringIntelligenceService'
import { patchDirectorStatus, getDirectorStatus, listDirectorStatuses } from './directorRuntimeStore'
import { createInboxItem } from './engineeringInboxStore'
import { appendDirectorHistory } from './directorHistoryStore'
import { raiseNotification } from '../notifications/notificationService'
import type { HandoffInput, ExecutionSnapshot } from './executionSnapshotTypes'
import type { VerificationReport } from './qualityAssurance/qualityAssuranceTypes'
import type { InterventionReasonType, InterventionSeverity, ProjectExecutionState } from './directorRuntimeTypes'
import type { NotificationEventType } from '../notifications/notificationTypes'

/**
 * The Autonomous Engineering Director's real execution engine — runs
 * entirely server-side, as an async loop living in this Node process.
 * This is what makes execution survive the browser closing: nothing here
 * is reachable from, or waits on, any browser tab. What it reads/writes
 * is exclusively: the ExecutionSnapshot (this project's server-owned
 * planning-state mirror), the Runtime job store, lastValidation.json, and
 * the Director's own status/inbox/history/notification stores — all
 * file-backed, all already server-only.
 *
 * Exactly one loop may ever run per project. That guarantee comes from
 * acquireLoopOwnership/releaseLoopOwnership (directorLock.ts) — a durable,
 * filesystem-anchored lock, deliberately not an in-memory Set. An
 * in-memory guard is only a true mutex within one shared module instance,
 * and Next.js does not guarantee that different route files importing
 * this module share an instance (route loading, module re-evaluation, and
 * separate requests can each end up with their own copy, which is exactly
 * how this used to produce duplicate concurrent loops and duplicate
 * jobs). The lock file is anchored in the filesystem instead, so every
 * route/request/process is coordinating through the same inode.
 *
 * The one thing that does NOT survive a server-process restart is this
 * loop's own in-flight `await` — a crashed process loses whatever
 * setTimeout/poll chain was running. recoverActiveDirectorsOnStartup()
 * (exported below, invoked exactly once per process by
 * recoveryBootstrap.ts via instrumentation.ts's register() hook — see
 * that file, not a bare module-load side effect anymore) is what makes
 * that recoverable: it simply re-attempts runServerLoop for every project
 * that was Running/Planning. That attempt is safe to make unconditionally
 * even if something calls it more than once — acquireLoopOwnership
 * deterministically decides whether it actually does anything: a live
 * holder makes it a no-op, a stale (dead-process) holder gets reclaimed
 * and resumed. Recovery is not a heuristic guess based on matching an
 * error-message string.
 */

const POLL_INTERVAL_MS = 3000
const TERMINAL_JOB_STATUSES = new Set(['Completed', 'Failed', 'Cancelled', 'Rejected'])

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * PRA-P1-022 remediation — an in-process concurrency ceiling on how many
 * projects' loops may be actively mid-execution (inside runLoopBodyInner)
 * at once in this server process. Before this, recoverActiveDirectorsOnStartup
 * fired a loop for every recoverable project with no throttling, and
 * startServerDirector/resumeServerDirector similarly fire-and-forgot per
 * project — at scale (many projects started/recovered simultaneously),
 * each running its own real build/typecheck verification concurrently in
 * the same process.cwd(), this was a resource-starvation risk (CPU/
 * memory/git-worktree contention), not a correctness bug: the
 * loop-ownership lock (directorLock.ts) already guarantees at most one
 * loop per PROJECT, this guarantees at most N loops TOTAL per PROCESS.
 *
 * A simple in-memory counter + FIFO queue, deliberately NOT a durable
 * store: this is a live resource-usage limit for the current process,
 * not governance state — resetting to 0 on every restart (nothing was
 * actually running to remember) is exactly correct, and every queued
 * waiter here is a request that hasn't started its loop yet, so there is
 * nothing to recover if the process restarts before it's dequeued (the
 * caller's own retry/recovery path already covers that).
 *
 * Configurable via VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS for operators
 * who need a different ceiling than the default; falls back to 5 for any
 * unset/invalid value.
 */
const MAX_CONCURRENT_PROJECT_LOOPS = (() => {
  const raw = Number(process.env.VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS)
  return Number.isFinite(raw) && raw > 0 ? raw : 5
})()

let activeLoopCount = 0
const concurrencyQueue: (() => void)[] = []

/** Exported for direct testing of the queueing behavior only — every real caller goes through runLoopBody, never this directly. */
export function acquireConcurrencySlot(): Promise<void> {
  if (activeLoopCount < MAX_CONCURRENT_PROJECT_LOOPS) {
    activeLoopCount += 1
    return Promise.resolve()
  }
  return new Promise<void>(resolve => {
    concurrencyQueue.push(() => {
      activeLoopCount += 1
      resolve()
    })
  })
}

/** Exported for direct testing of the queueing behavior only — every real caller goes through runLoopBody, never this directly. */
export function releaseConcurrencySlot(): void {
  activeLoopCount -= 1
  const next = concurrencyQueue.shift()
  if (next) next()
}

/** Test-only introspection — never used by production code paths. */
export function getConcurrencyStateForTests(): { active: number; queued: number; max: number } {
  return { active: activeLoopCount, queued: concurrencyQueue.length, max: MAX_CONCURRENT_PROJECT_LOOPS }
}

type ServerIntervention = {
  reasonType: InterventionReasonType
  severity: InterventionSeverity
  reason: string
  recommendedAction: string
}

/** "Validate dependencies" — the pre-flight check, using only what the handoff snapshot froze at Start Development time (High-priority technical debt / High-severity risk, the same blocking signals developmentDependencyEngine.ts already established). */
function findPreflightBlocker(snapshot: ExecutionSnapshot, batchId: string): ServerIntervention | null {
  const debt = snapshot.technicalDebt.find(d => !d.relatedBatch || d.relatedBatch === batchId)
  if (debt) {
    return {
      reasonType: 'Technical Debt Escalation',
      severity: 'Critical',
      reason: `High-priority technical debt "${debt.title}" is unresolved.`,
      recommendedAction: 'Resolve the outstanding technical debt, then resolve this inbox item to resume.',
    }
  }
  const risk = snapshot.openRisks[0]
  if (risk) {
    return {
      reasonType: 'Business Decision Required',
      severity: 'Critical',
      reason: `High-severity risk "${risk.title}" is open.`,
      recommendedAction: 'Resolve or explicitly accept the risk, then resolve this inbox item to resume.',
    }
  }
  return null
}

/**
 * "Determine if CEO intervention is required" — post-execution, from
 * the full Autonomous Quality Assurance report (Build/TypeScript are
 * two of its ten activities now, not the whole picture). Requirement 5
 * — structured failure information: `reason` names every Failed
 * activity and its summary, never a generic message; the full
 * VerificationReport itself is what gets durably recorded separately
 * (see runLoopBody's call to knowledgeService.recordVerification).
 */
function findPostExecutionIntervention(report: VerificationReport): ServerIntervention | null {
  if (report.passed) return null
  return {
    reasonType: 'Quality Assurance Failure',
    severity: 'Critical',
    reason: describeVerificationFailure(report) ?? 'Verification failed.',
    recommendedAction: 'Review the verification evidence and fix the reported failure(s), then resolve this inbox item to resume.',
  }
}

async function pause(project: string, batchId: string | null, batchNumber: string | null, intervention: ServerIntervention) {
  const item = createInboxItem({
    project,
    batchId,
    batchNumber,
    reasonType: intervention.reasonType,
    reason: intervention.reason,
    severity: intervention.severity,
    recommendedAction: intervention.recommendedAction,
  })
  patchDirectorStatus(project, {
    state: intervention.reasonType === 'Technical Debt Escalation' || intervention.reasonType === 'Business Decision Required' ? 'Blocked' : 'Waiting for CEO',
    currentActivity: `Waiting for CEO: ${intervention.reasonType}`,
    waitingReason: intervention.reason,
    waitingInboxItemId: item.id,
  })
  appendDirectorHistory({ project, event: `Paused — ${intervention.reasonType}`, batchId, detail: intervention.reason })
  await raiseNotification({
    type: mapReasonToEventType(intervention.reasonType),
    project,
    title: `${project}: ${intervention.reasonType}`,
    message: intervention.reason,
    severity: intervention.severity,
    metadata: { batchId: batchId ?? '', inboxItemId: item.id },
  })
  await raiseNotification({
    type: 'Engineering Paused',
    project,
    title: `${project}: engineering paused`,
    message: `Autonomous execution paused — ${intervention.reasonType}.`,
    severity: 'Medium',
    metadata: { batchId: batchId ?? '', inboxItemId: item.id },
  })
}

function mapReasonToEventType(reasonType: InterventionReasonType): NotificationEventType {
  switch (reasonType) {
    case 'Security Review':
      return 'Security Approval Required'
    case 'Business Decision Required':
    case 'Technical Debt Escalation':
      return 'Business Rule Required'
    case 'Build Failure':
    case 'Deployment Approval':
    case 'Approval Required':
    case 'Worker Review Required':
    default:
      return 'CEO Approval Required'
  }
}

/**
 * The loop itself. One iteration = one batch. Every step maps directly to
 * the mission's Execution Lifecycle diagram — selection and dependency
 * validation come from the ExecutionSnapshot alone (no browser needed);
 * context/prompt building, launching Claude, and validation are the same
 * real operations the browser-attended path used, just invoked directly
 * instead of over HTTP from a client controller.
 *
 * The loop body only — assumes the caller already holds this project's
 * loop-ownership lock (acquireLoopOwnership) and will release it. Split
 * out from runServerLoop so startServerDirector/resumeServerDirector can
 * acquire the lock BEFORE their own setup writes (saving the snapshot,
 * patching status, appending history), not just before the loop's
 * iteration logic — otherwise two concurrent callers could both pass
 * their own state checks and both perform setup, corrupting the display
 * (e.g. a later "Planning" write silently clobbering an earlier, already
 * genuinely-paused "Blocked" status) even though only one of them ever
 * actually got to run the loop itself.
 *
 * PRA-P1-022 remediation: wraps runLoopBodyInner (the actual iteration
 * logic, unchanged below) in a global, in-process concurrency ceiling —
 * see acquireConcurrencySlot/releaseConcurrencySlot just above. Every one
 * of this function's three callers (runServerLoop's recovery path,
 * startServerDirector, resumeServerDirector) already funnels through
 * here, so this is the single place that needs to enforce the ceiling
 * rather than each call site duplicating it.
 */
async function runLoopBody(project: string, loopOptions: { forceContextRefresh?: boolean } = {}): Promise<void> {
  await acquireConcurrencySlot()
  try {
    await runLoopBodyInner(project, loopOptions)
  } finally {
    releaseConcurrencySlot()
  }
}

async function runLoopBodyInner(project: string, loopOptions: { forceContextRefresh?: boolean } = {}): Promise<void> {
  // Only the very first iteration of THIS loopBody invocation may be a
  // forced (recovery) refresh — every iteration after that goes back to
  // ordinary comparison-based behavior, reading whatever lastKnownVersions
  // that first iteration just recorded.
  let forceContextRefresh = loopOptions.forceContextRefresh ?? false

  for (;;) {
      const snapshot = getExecutionSnapshot(project)
      if (!snapshot) {
        patchDirectorStatus(project, { state: 'Idle', currentActivity: 'No execution snapshot found', error: 'Missing execution snapshot' })
        return
      }

      // Checked at the top of every iteration (never mid-batch — an
      // in-flight Claude run is never interrupted destructively): Cancel
      // and Pause both take effect at the next natural boundary between
      // batches, whether the state was flipped by a CEO action
      // (pauseServerDirector/cancelServerDirector) or by this same loop's
      // own previous iteration pausing for an intervention.
      const status = getDirectorStatus(project)
      if (status.state === 'Cancelled' || status.state === 'Waiting for CEO' || status.state === 'Blocked') return

      const planningEnforced = enforceSnapshotPlanningState(snapshot)

      // ---- Live Knowledge Refresh (Version 2.0, Milestone 2.2) ----
      // The synchronization boundary: reached here on every iteration —
      // before a new batch begins, immediately after the previous one
      // completes, and (since resumeServerDirector/
      // recoverActiveDirectorsOnStartup both re-enter via runLoopBody)
      // after a CEO approval resume and after recovery. Never reached
      // mid-batch. Comparison-based against this run's last-known
      // versions, so any number of edits made while a batch was executing
      // collapse into at most one refresh here.
      const { snapshot: enforced, versions: contextVersions, refreshed } = refreshEngineeringContextIfNeeded(
        planningEnforced,
        status.lastKnownVersions,
        { force: forceContextRefresh }
      )
      forceContextRefresh = false
      saveExecutionSnapshot(enforced)
      if (refreshed) patchDirectorStatus(project, { lastKnownVersions: contextVersions })

      // ---- Headless Engineering Assessment (Version 2.0, Milestone 2.3) ----
      // Requested at the exact same synchronization boundary as Live
      // Knowledge Refresh, immediately above — never mid-batch. The
      // Assessment Service is the ONLY producer of these three values;
      // the Director only ever copies its output onto DirectorRuntimeStatus,
      // never interprets raw project data to derive them itself.
      const { assessment } = runAssessment(project)
      patchDirectorStatus(project, {
        riskLevel: assessment.riskAssessment.overall,
        engineeringHealth: assessment.engineeringHealth,
        qualityGates: assessment.qualityGates,
      })

      if (isProjectComplete(enforced)) {
        // ---- Autonomous Release Management ----
        // PRA-P1-028 remediation: prepared BEFORE the project is marked
        // Completed below (previously the reverse). A crash between
        // marking Completed and preparing the release used to be able to
        // leave a Completed project with no ReleaseRequest ever created —
        // silently, forever, since Completed is no longer Running/Planning,
        // so recoverActiveDirectorsOnStartup would never revisit it to
        // retry. Reordering closes that window entirely rather than
        // needing a second reconciliation pass: real preparation only (no
        // git/gh/vercel command runs here) — the mutating sequence is
        // reachable exclusively from a human's Go decision (see
        // releaseManagementService.ts). Still wrapped in try/catch so an
        // unexpected error here degrades to a logged gap rather than an
        // uncaught exception, and never blocks completion itself from
        // being recorded.
        try {
          await prepareRelease(project)
        } catch (err) {
          appendDirectorHistory({
            project,
            event: 'Release preparation failed unexpectedly',
            batchId: null,
            detail: err instanceof Error ? err.message : String(err),
          })
        }

        patchDirectorStatus(project, {
          state: 'Completed',
          currentActivity: 'All batches complete',
          currentBatchId: null,
          currentBatchNumber: null,
          currentAiTask: null,
          remainingBatches: 0,
          completedBatches: enforced.batches.length,
          totalBatches: enforced.batches.length,
          completedAt: new Date().toISOString(),
          waitingReason: null,
          waitingInboxItemId: null,
        })
        appendDirectorHistory({ project, event: 'Development completed', batchId: null, detail: 'No batches remain.' })
        await raiseNotification({
          type: 'Project Completed',
          project,
          title: 'Development completed',
          message: `${project}: every batch has completed.`,
          severity: 'Info',
          metadata: {},
        })
        return
      }

      const currentBatch = getCurrentBatch(enforced)
      if (!currentBatch) return // defensive — isProjectComplete already covers the "no batches" case

      const totalBatches = enforced.batches.length
      const completedBatches = enforced.batches.filter(b => b.status === 'Complete').length
      const remainingBatches = totalBatches - completedBatches
      const currentMilestone = getMilestoneForBatch(enforced, currentBatch)

      const blocker = findPreflightBlocker(enforced, currentBatch.id)
      if (blocker) {
        patchDirectorStatus(project, {
          currentBatchId: currentBatch.id,
          currentBatchNumber: currentBatch.batchNumber,
          currentMilestoneId: currentMilestone?.id ?? null,
          currentMilestoneTitle: currentMilestone?.title ?? null,
          currentPhase: currentMilestone?.phase ?? 'Unknown',
          totalBatches,
          completedBatches,
          remainingBatches,
        })
        await pause(project, currentBatch.id, currentBatch.batchNumber, blocker)
        return
      }

      patchDirectorStatus(project, {
        state: 'Running',
        currentActivity: 'Building engineering context',
        currentBatchId: currentBatch.id,
        currentBatchNumber: currentBatch.batchNumber,
        currentMilestoneId: currentMilestone?.id ?? null,
        currentMilestoneTitle: currentMilestone?.title ?? null,
        currentPhase: currentMilestone?.phase ?? 'Unknown',
        totalBatches,
        completedBatches,
        remainingBatches,
        waitingReason: null,
        waitingInboxItemId: null,
      })

      // ---- Headless AI Workforce (Version 2.0 Phase 3, Milestone 3.1) ----
      // The Director assigns work to the most appropriate worker role,
      // informed by the Assessment Service output computed earlier this
      // same synchronization boundary (never recomputed here — "Workers
      // do not compute assessments," and neither does this assignment
      // step). The resulting WorkforceTask freezes the same four version
      // values every ExecutionIdentity already freezes, immutable for
      // this batch's lifetime.
      const workerAssignment = assignWorkerRole(currentBatch.objective, assessment)
      const workerRoleConfig = getWorkerRoleConfig(workerAssignment.role)
      const workforceTask = createWorkforceTask({
        project,
        phase: currentMilestone?.phase ?? 'Unknown',
        milestoneId: currentMilestone?.id ?? null,
        batchId: currentBatch.id,
        requiredRole: workerAssignment.role,
        executionContextVersion: contextVersions.executionContextVersion,
        knowledgeVersion: contextVersions.knowledgeVersion,
        planningVersion: contextVersions.planningVersion,
        dnaVersion: contextVersions.dnaVersion,
      })
      patchDirectorStatus(project, { currentWorkerRole: workerAssignment.role })

      const git = getGitIntelligence()
      const context = buildServerDevelopmentContext(enforced, currentBatch, currentMilestone)
      const prompt = buildServerAutonomousPrompt(context, currentBatch, workerRoleConfig)

      const identity: ExecutionIdentity = {
        product: enforced.projectName,
        project: enforced.project,
        phase: currentMilestone?.phase ?? 'Unknown',
        milestoneId: currentMilestone?.id ?? null,
        milestoneTitle: currentMilestone?.title ?? null,
        batchId: currentBatch.id,
        batchNumber: currentBatch.batchNumber,
        batchVersion: currentBatch.updatedAt,
        batchStatus: currentBatch.status,
        repositoryCommit: git.commitHash !== 'Unavailable' ? git.commitHash : null,
        runtimeJobId: null,
        ceoDecision: 'Pending',
        // Frozen at this iteration's synchronization boundary (the refresh
        // check above), NOT recomputed here — Version 2.0 Milestone 2.2
        // requires these four values stay immutable for this batch's
        // entire lifetime, however long Claude takes to run.
        knowledgeVersion: contextVersions.knowledgeVersion,
        planningVersion: contextVersions.planningVersion,
        dnaVersion: contextVersions.dnaVersion,
        executionContextVersion: contextVersions.executionContextVersion,
        executionTimestamp: new Date().toISOString(),
      }
      patchDirectorStatus(project, { currentActivity: 'Launching Claude', currentAiTask: `Batch ${currentBatch.batchNumber}` })

      const job = createDevelopmentJob({
        projectSlug: project,
        milestoneId: currentMilestone?.id ?? '',
        batchId: currentBatch.id,
        objective: currentBatch.objective || `Continue implementing Batch ${currentBatch.batchNumber}.`,
        prompt: prompt.fullText,
        executionIdentity: identity,
      })

      patchDirectorStatus(project, { currentJobId: job.id })
      attachRuntimeJobId(workforceTask.id, job.id)

      const finalJob = await waitForJobTerminal(job.id)

      if (finalJob.status !== 'Completed') {
        const reason = finalJob.error ?? `Runtime job ended with status "${finalJob.status}".`
        await pause(project, currentBatch.id, currentBatch.batchNumber, {
          reasonType: 'Approval Required',
          severity: 'High',
          reason,
          recommendedAction: 'Review the runtime job history and either retry manually or resolve this inbox item to retry automatically.',
        })
        return
      }

      // Parsed once, here — a pure function of finalJob.result with no
      // dependency on validation having run, moved ahead of it purely so
      // it's available to the worker-review step below without a
      // second pass. Requirement 3's applicability decision (just below)
      // deliberately does NOT use this report's self-reported file list
      // — it uses the real `git diff --name-only` instead, since a
      // worker's own prose about what it changed is not ground truth.
      const parsed = parseClaudeReport(finalJob.result ?? '')

      // ---- Autonomous Quality Assurance ----
      // Replaces "compiles" as the bar for "good": ten possible
      // verification activities (tests, static analysis, security
      // scanning, ...), each a real result or an honest gap, never
      // fabricated. See lib/dev/director/qualityAssurance/.
      patchDirectorStatus(project, { currentActivity: 'Running quality assurance' })
      const changedFiles = await captureChangedFilePaths(process.cwd())
      const verification = await runVerification({ project, batchId: currentBatch.id, cwd: process.cwd(), changedFiles })
      patchDirectorStatus(project, { buildStatus: verification.buildStatus, typescriptStatus: verification.typescriptStatus })

      // Requirement 6/9 — every run becomes part of the permanent
      // engineering record, passed or failed, and is retrievable both
      // by future Engineering Intelligence runs and directly via
      // knowledgeService.listVerifications.
      knowledgeService.recordVerification({
        project,
        batchId: currentBatch.id,
        milestoneId: currentMilestone?.id ?? null,
        source: 'Headless',
        passed: verification.passed,
        durationMs: verification.durationMs,
        activities: verification.activities.map(a => ({ activity: a.activity, status: a.status, summary: a.summary })),
      })

      const intervention = findPostExecutionIntervention(verification)
      if (intervention) {
        await pause(project, currentBatch.id, currentBatch.batchNumber, intervention)
        return
      }

      patchDirectorStatus(project, { currentActivity: 'Reviewing worker output' })

      // ---- Worker review and validation (Milestone 3.1) ----
      // "Only validated work updates Planning or Knowledge." Neither the
      // batch-completion write below nor any Knowledge Service call runs
      // unless the worker's output passes this gate — a Rejected result
      // or an unresolved conflict pauses for CEO review instead, exactly
      // like every other intervention path in this loop.
      const workerResult = buildWorkerTaskResult(workforceTask.id, workerAssignment.role, parsed)
      recordWorkforceTaskCompletion(workforceTask.id, workerResult.filesChanged)

      const reviewOutcome = validateWorkerOutput(workerResult, verification.buildStatus, verification.typescriptStatus)

      const recentTasks = recentWorkforceTasks(project, 20)
      const conflict = detectWorkforceConflict(
        { ...workforceTask, filesChanged: workerResult.filesChanged },
        workerResult.filesChanged,
        recentTasks
      )
      const resolvedConflict = conflict ? resolveWorkforceConflict(conflict, assessment) : null
      const conflictBlocks = resolvedConflict ? resolvedConflict.resolution.includes('siding with the blocking position') : false

      if (reviewOutcome.decision === 'Rejected' || conflictBlocks) {
        const reasons = [...reviewOutcome.reasons]
        if (resolvedConflict) reasons.push(`${resolvedConflict.description} ${resolvedConflict.resolution}`)
        await pause(project, currentBatch.id, currentBatch.batchNumber, {
          reasonType: 'Worker Review Required',
          severity: conflictBlocks ? 'High' : 'Medium',
          reason: reasons.join(' '),
          recommendedAction: 'Review the worker task result and either address the issue manually or resolve this inbox item to retry automatically.',
        })
        return
      }

      const previousMilestoneStatus = currentMilestone?.status ?? null
      const previousPhase = currentMilestone?.phase ?? null
      const wasPhaseCompleteBefore = previousPhase ? isPhaseComplete(enforced, previousPhase) : false

      const advanced = completeBatchInSnapshot(enforced, currentBatch.id)
      // The snapshot's own `completions` array is now a lightweight runtime
      // cache ONLY — it exists purely so estimateCompletion() below can read
      // back each recent batch's job duration for this run's ETA. It is no
      // longer the historical record: the Knowledge Service calls just below
      // are. Losing this array (or the whole snapshot) loses nothing
      // permanent — see executionSnapshotTypes.ts.
      const completionRecord = {
        batchId: currentBatch.id,
        batchNumber: currentBatch.batchNumber,
        milestoneId: currentMilestone?.id ?? '',
        milestoneTitle: currentMilestone?.title ?? '',
        objective: currentBatch.objective,
        summary: parsed.executiveSummary || 'No executive summary reported.',
        completedAt: new Date().toISOString(),
        runtimeJobId: finalJob.id,
      }
      const withCompletion: ExecutionSnapshot = { ...advanced, completions: [completionRecord, ...advanced.completions] }
      saveExecutionSnapshot(withCompletion)

      appendDirectorHistory({
        project,
        event: `Batch ${currentBatch.batchNumber} completed and auto-approved`,
        batchId: currentBatch.id,
        detail: `Runtime job ${finalJob.id}.`,
      })

      // ---- Server Knowledge Engine (Version 2.0, Milestone 2.1) ----
      // The Knowledge Service is the ONLY writer for engineering history —
      // every permanent record for this batch's completion is recorded
      // here, replacing what used to live only in the snapshot's
      // completions array. This is what closes the "headless completions
      // bypass the Knowledge Update Engine" gap: the browser-attended path
      // (knowledgeUpdateEngine.ts) and this headless path now both produce
      // durable Decisions/Technical Debt/Risks/Journal/Handover records,
      // just through the shared Knowledge Service instead of two separate
      // implementations.
      const commonKnowledgeFields = {
        project,
        batchId: currentBatch.id,
        milestoneId: currentMilestone?.id ?? null,
        runtimeJobId: finalJob.id,
        source: 'Headless' as const,
      }

      knowledgeService.recordBatchCompletion({
        ...commonKnowledgeFields,
        batchId: currentBatch.id,
        batchNumber: currentBatch.batchNumber,
        objective: currentBatch.objective,
        summary: parsed.executiveSummary || 'No executive summary reported.',
      })

      // Engineering Intelligence attribution (requirement 6) — which
      // organisational-knowledge sources actually informed this batch's
      // prompt, and which categories had nothing relevant (requirement 7),
      // recorded durably against the exact record that already represents
      // this batch's AI output.
      const attribution = context.engineeringIntelligence
        ? summarizeAttribution(context.engineeringIntelligence)
        : { sourceRefs: [], gapSourceTypes: [] }

      knowledgeService.recordHandover({
        ...commonKnowledgeFields,
        phase: currentMilestone?.phase ?? 'Unknown',
        objective: currentBatch.objective,
        executiveSummary: parsed.executiveSummary,
        filesCreated: parsed.filesCreated,
        filesModified: parsed.filesModified,
        filesDeleted: parsed.filesDeleted,
        buildStatus: parsed.buildStatus,
        typescriptStatus: parsed.typescriptStatus,
        gitDiffSummary: git.commitHash !== 'Unavailable' ? git.commitHash : null,
        knowledgeSourcesConsulted: attribution.sourceRefs,
        knowledgeGapSources: attribution.gapSourceTypes,
      })

      for (const decision of splitReportItems(parsed.architectureDecisions)) {
        knowledgeService.recordArchitectureDecision({ ...commonKnowledgeFields, decision, reason: 'Recorded automatically from an execution report.' })
      }
      for (const title of splitReportItems(parsed.technicalDebtIdentified)) {
        knowledgeService.recordTechnicalDebt({
          ...commonKnowledgeFields,
          title,
          description: `Identified during automated execution of ${currentBatch.objective || 'a development job'}.`,
          priority: 'Medium',
        })
      }
      for (const title of splitReportItems(parsed.risksIdentified)) {
        knowledgeService.recordRisk({
          ...commonKnowledgeFields,
          title,
          description: `Identified during automated execution of ${currentBatch.objective || 'a development job'}.`,
          severity: 'Medium',
        })
      }
      knowledgeService.appendJournalEntry({
        ...commonKnowledgeFields,
        summary: parsed.executiveSummary,
        wins: parsed.recommendations,
        problems: parsed.risksIdentified,
        nextActions: parsed.nextSuggestedBatch,
      })

      const newMilestone = currentMilestone ? withCompletion.milestones.find(m => m.id === currentMilestone.id) : null
      if (newMilestone && newMilestone.status === 'Complete' && previousMilestoneStatus !== 'Complete') {
        appendDirectorHistory({ project, event: `Milestone "${newMilestone.title}" completed`, batchId: currentBatch.id, detail: '' })
        knowledgeService.recordMilestoneCompletion({
          ...commonKnowledgeFields,
          milestoneId: newMilestone.id,
          milestoneTitle: newMilestone.title,
          phase: previousPhase ?? 'Unknown',
        })
        await raiseNotification({
          type: 'Milestone Completed',
          project,
          title: `Milestone completed: ${newMilestone.title}`,
          message: `${project}: milestone "${newMilestone.title}" is complete.`,
          severity: 'Info',
          metadata: { milestoneId: newMilestone.id },
        })
        if (previousPhase && !wasPhaseCompleteBefore && isPhaseComplete(withCompletion, previousPhase)) {
          appendDirectorHistory({ project, event: `Phase "${previousPhase}" completed`, batchId: currentBatch.id, detail: '' })
          await raiseNotification({
            type: 'Phase Completed',
            project,
            title: `Phase completed: ${previousPhase}`,
            message: `${project}: every milestone in phase "${previousPhase}" is complete.`,
            severity: 'Info',
            metadata: { phase: previousPhase },
          })
        }
      }

      patchDirectorStatus(project, {
        currentActivity: 'Batch approved — selecting next batch',
        lastAdvancedAt: new Date().toISOString(),
        ...estimateCompletion(withCompletion),
      })
    // Loop continues — next iteration re-derives from the persisted
    // snapshot, which enforceSnapshotPlanningState (top of loop) will
    // have already auto-promoted to the next batch.
  }
}

/**
 * Acquires this project's loop-ownership lock and runs the loop body
 * under it, releasing it however the loop ends (completed, paused,
 * blocked, cancelled, or an unexpected throw). Used wherever nothing has
 * acquired the lock yet — recovery and, historically, direct entry;
 * startServerDirector/resumeServerDirector now acquire it themselves
 * first so their own setup writes are covered too (see runLoopBody's doc
 * comment). This is exclusively the recovery/direct-entry path (never
 * called by startServerDirector/resumeServerDirector), which is exactly
 * why the forced refresh below belongs here: reaching this function with
 * a successfully-acquired lock means the recorded owner was dead — a
 * genuine crash reclaim, not a live loop continuing — so Version 2.0
 * Milestone 2.2's "recovery must never replay stale engineering context"
 * is enforced by forcing the very first synchronization-boundary check
 * inside runLoopBody to reload from the durable sources unconditionally,
 * rather than trusting whatever versions were last recorded before the
 * crash (which a plain comparison could mistake for "unchanged" if the
 * crash happened to occur with nothing pending).
 */
async function runServerLoop(project: string): Promise<void> {
  const owner = acquireLoopOwnership(project)
  if (!owner) return // another still-alive holder already owns this project's loop — exit immediately, never start a second one
  // This function is exclusively the recovery/direct-entry path (see its
  // own doc comment above) — reaching here with a successfully-acquired
  // lock always means a genuine crash reclaim. Recorded as a durable
  // history event specifically so Version 2.0 Milestone 2.3's Risk
  // Assessment "Recovery Frequency" factor has a real, countable signal
  // to read instead of fabricating one.
  appendDirectorHistory({ project, event: 'Recovered from crash', batchId: null, detail: '' })
  try {
    await runLoopBody(project, { forceContextRefresh: true })
  } finally {
    releaseLoopOwnership(project, owner)
  }
}

/** Average batch duration comes from each completed run's own recorded job.duration (the actual Claude execution time) — never from batch.createdAt, which reflects when the batch was planned, not when it ran. */
function estimateCompletion(snapshot: ExecutionSnapshot): { averageBatchDurationMs: number | null; estimatedCompletionAt: string | null } {
  const durations = snapshot.completions
    .map(c => getDevelopmentJob(c.runtimeJobId)?.duration ?? null)
    .filter((d): d is number => d !== null)
  if (durations.length === 0) return { averageBatchDurationMs: null, estimatedCompletionAt: null }
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
  const remaining = snapshot.batches.filter(b => b.status !== 'Complete').length
  return { averageBatchDurationMs: avg, estimatedCompletionAt: new Date(Date.now() + remaining * avg).toISOString() }
}

async function waitForJobTerminal(jobId: string) {
  for (;;) {
    const job = getDevelopmentJob(jobId)
    if (job && TERMINAL_JOB_STATUSES.has(job.status)) return job
    await sleep(POLL_INTERVAL_MS)
  }
}

/**
 * Start Development — persists the browser's one-time hand-off as the
 * initial snapshot, then kicks the loop off. Fire-and-forget: the caller
 * (the /handoff API route) returns immediately, the loop keeps running in
 * this process regardless of what the browser does next.
 *
 * Acquires the loop-ownership lock BEFORE any of this project's state is
 * touched, not just before the loop's own iteration logic — so that under
 * concurrent handoff requests for the same project, only the single
 * request that actually wins the lock performs the setup writes (saving
 * the snapshot, patching status, appending history) at all. The losers do
 * nothing, rather than each writing their own redundant copy and
 * potentially clobbering a status the winner has since legitimately
 * advanced past.
 */
export function startServerDirector(handoff: HandoffInput): void {
  const owner = acquireLoopOwnership(handoff.project)
  if (!owner) return // another concurrent handoff for this project already won — do nothing further

  void (async () => {
    try {
      const now = new Date().toISOString()
      const snapshot: ExecutionSnapshot = {
        ...handoff,
        completions: [],
        handedOffAt: now,
      }
      saveExecutionSnapshot(snapshot)
      patchDirectorStatus(handoff.project, {
        state: 'Planning',
        currentActivity: 'Selecting next executable batch',
        startedAt: now,
        completedAt: null,
        error: null,
        totalBatches: handoff.batches.length,
        completedBatches: handoff.batches.filter(b => b.status === 'Complete').length,
        // A brand-new run has no continuity with any previous run's
        // engineering context — force the first synchronization boundary
        // inside runLoopBody to load fresh rather than possibly (and
        // coincidentally) matching a stale value left over from before.
        lastKnownVersions: null,
      })
      appendDirectorHistory({ project: handoff.project, event: 'Autonomous development started', batchId: null, detail: 'CEO pressed Start Development.' })
      await runLoopBody(handoff.project)
    } finally {
      releaseLoopOwnership(handoff.project, owner)
    }
  })()
}

export function pauseServerDirector(project: string): void {
  const status = getDirectorStatus(project)
  if (status.state !== 'Running' && status.state !== 'Planning') return
  patchDirectorStatus(project, { state: 'Waiting for CEO', currentActivity: 'Paused by CEO', waitingReason: 'Paused by CEO' })
  appendDirectorHistory({ project, event: 'Paused by CEO', batchId: null, detail: '' })
  void raiseNotification({
    type: 'Engineering Paused',
    project,
    title: `${project}: paused by CEO`,
    message: 'Autonomous execution paused by CEO request.',
    severity: 'Info',
    metadata: {},
  })
}

/**
 * Re-enters the loop for a project sitting at Waiting for CEO / Blocked —
 * called by the inbox route the instant an item is resolved, or by manual
 * Resume, never by the browser owning execution itself.
 *
 * Acquires the loop-ownership lock BEFORE checking/changing state, for the
 * same reason as startServerDirector: under concurrent resume requests for
 * the same project, only the request that wins the lock should touch
 * status/history/notifications at all — otherwise every concurrent caller
 * would pass the same "is this Waiting for CEO/Blocked" check and each
 * write its own redundant "Resumed" record, even though only one of them
 * ever actually runs the loop.
 */
export function resumeServerDirector(project: string): void {
  const owner = acquireLoopOwnership(project)
  if (!owner) return // either still genuinely running, or another concurrent resume already won

  void (async () => {
    try {
      const status = getDirectorStatus(project)
      if (status.state !== 'Waiting for CEO' && status.state !== 'Blocked') return // nothing to resume — release below and do nothing further

      patchDirectorStatus(project, { state: 'Running', currentActivity: 'Resuming', waitingReason: null, waitingInboxItemId: null })
      appendDirectorHistory({ project, event: 'Resumed', batchId: status.currentBatchId, detail: '' })
      await raiseNotification({
        type: 'Engineering Resumed',
        project,
        title: `${project}: engineering resumed`,
        message: 'Autonomous execution resumed.',
        severity: 'Info',
        metadata: {},
      })
      await runLoopBody(project)
    } finally {
      releaseLoopOwnership(project, owner)
    }
  })()
}

const TERMINAL_DIRECTOR_STATES: ReadonlySet<ProjectExecutionState> = new Set(['Completed', 'Cancelled'])

/**
 * CB-001 remediation (PRA-P1-020) — cancelServerDirector previously
 * mutated state unconditionally, with no check that the project wasn't
 * already Completed: a single call could silently regress a finished
 * project back to Cancelled, discarding completedAt/final state. Two
 * genuinely different terminal outcomes exist (Completed, Cancelled), so
 * "terminal" alone isn't a uniform reject — an already-Cancelled project
 * is treated as an idempotent no-op (repeating the same cancellation
 * intent should never error), while an already-Completed project is a
 * real conflict (cancelling it would produce a DIFFERENT terminal outcome
 * than the one already recorded) and is rejected with an explicit error
 * rather than silently mutated.
 */
export class DirectorLifecycleError extends Error {
  constructor(
    public readonly project: string,
    public readonly actualState: ProjectExecutionState
  ) {
    super(`Director for '${project}' is already '${actualState}' — cancelling would discard that outcome and cannot be done silently.`)
    this.name = 'DirectorLifecycleError'
  }
}

export function describeDirectorError(err: unknown): { status: number; error: string } | null {
  if (err instanceof DirectorLifecycleError) return { status: 409, error: err.message }
  return null
}

export function cancelServerDirector(project: string): void {
  const status = getDirectorStatus(project)
  if (TERMINAL_DIRECTOR_STATES.has(status.state)) {
    if (status.state === 'Cancelled') return // already the requested outcome — idempotent no-op, not an error
    throw new DirectorLifecycleError(project, status.state) // Completed — a different terminal outcome, reject rather than silently overwrite it
  }

  patchDirectorStatus(project, { state: 'Cancelled', currentActivity: 'Cancelled by CEO' })
  appendDirectorHistory({ project, event: 'Cancelled by CEO', batchId: null, detail: '' })
}

/**
 * Crash recovery — invoked exactly once per application process by
 * recoveryBootstrap.ts's runRecoveryBootstrap(), itself called from
 * instrumentation.ts's register() hook, which Next.js guarantees runs
 * once per server instance before any request is served. (This function
 * is unchanged from when it ran as a bare module-load side effect —only
 * WHO calls it, and when, has moved; see recoveryBootstrap.ts.) Also safe
 * to call more than once regardless, same as always: acquireLoopOwnership
 * silently no-ops for any project a live loop already owns.
 *
 * Only 'Running'/'Planning' projects are candidates: 'Waiting for
 * CEO'/'Blocked' are intentionally paused pending-approval state and must
 * stay exactly as they are until a human resolves the inbox item, or
 * they'd just immediately re-hit the same condition and re-pause.
 *
 * For every candidate, this deterministically attempts to reacquire that
 * project's loop lock (see directorLock.ts):
 *   - If a still-alive process already owns it, the attempt is a no-op —
 *     the loop is genuinely still running, nothing to recover.
 *   - If the recorded owner is dead (a crash or a killed/restarted
 *     server), the lock is reclaimed and the loop resumes: execution
 *     identity, runtime state, and any pending-approval state all come
 *     straight from the persisted ExecutionSnapshot/DirectorRuntimeStatus,
 *     which the crash never touched — enforceSnapshotPlanningState (top
 *     of the loop) picks up from exactly the batch the snapshot says is
 *     still current, and a fresh job is created for it (the interrupted
 *     one, orphaned by runtimeEngine.ts's own pid-liveness reconciliation,
 *     is never revived — retrying is a new sequential attempt, not a
 *     second concurrent one, since the lock guarantees only one loop
 *     instance is ever advancing this project at a time).
 * No error-message pattern matching is involved — the lock ownership
 * check is the entire, deterministic recovery decision.
 */
export function recoverActiveDirectorsOnStartup(): void {
  for (const status of listDirectorStatuses()) {
    if (status.state !== 'Running' && status.state !== 'Planning') continue
    if (!getExecutionSnapshot(status.project)) continue
    // No logging here deliberately: acquireLoopOwnership silently no-ops
    // when a live loop already owns the project. Only a genuine reclaim
    // actually proceeds into runServerLoop, whose own normal
    // status/history updates already reflect that it's running.
    void runServerLoop(status.project)
  }
}
