import { createDevelopmentJob, getDevelopmentJob } from '../runtime/runtimeEngine'
import { runContinuousValidation } from '../operations/continuousValidationEngine'
import { parseClaudeReport } from '../developmentCompletionEngine'
import type { ExecutionIdentity } from '../runtime/executionIdentity'
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
import { patchDirectorStatus, getDirectorStatus, listDirectorStatuses } from './directorRuntimeStore'
import { createInboxItem } from './engineeringInboxStore'
import { appendDirectorHistory } from './directorHistoryStore'
import { raiseNotification } from '../notifications/notificationService'
import type { HandoffInput, ExecutionSnapshot } from './executionSnapshotTypes'
import type { InterventionReasonType, InterventionSeverity } from './directorRuntimeTypes'
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

/** "Determine if CEO intervention is required" — post-execution, from the real build/TypeScript result. Quality Gates / Risk Assessment / Multi-Agent Workforce remain browser-attended-only concepts; see "Remaining Limitations". */
function findPostExecutionIntervention(buildStatus: string, typescriptStatus: string): ServerIntervention | null {
  if (buildStatus === 'Failing' || typescriptStatus === 'Failing') {
    return {
      reasonType: 'Build Failure',
      severity: 'Critical',
      reason: `Build: ${buildStatus}, TypeScript: ${typescriptStatus}.`,
      recommendedAction: 'Review the build/TypeScript output and fix the reported errors, then resolve this inbox item to resume.',
    }
  }
  return null
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
 */
async function runLoopBody(project: string): Promise<void> {
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

      const enforced = enforceSnapshotPlanningState(snapshot)
      saveExecutionSnapshot(enforced)

      if (isProjectComplete(enforced)) {
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

      const git = getGitIntelligence()
      const context = buildServerDevelopmentContext(enforced, currentBatch, currentMilestone)
      const prompt = buildServerAutonomousPrompt(context, currentBatch)

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
        knowledgeVersion: enforced.knowledgeVersion,
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

      patchDirectorStatus(project, { currentActivity: 'Validating implementation' })
      const validation = await runContinuousValidation(process.cwd())
      patchDirectorStatus(project, { buildStatus: validation.buildStatus, typescriptStatus: validation.typescriptStatus })

      const intervention = findPostExecutionIntervention(validation.buildStatus, validation.typescriptStatus)
      if (intervention) {
        await pause(project, currentBatch.id, currentBatch.batchNumber, intervention)
        return
      }

      patchDirectorStatus(project, { currentActivity: 'Updating knowledge and project state' })
      const parsed = parseClaudeReport(finalJob.result ?? '')

      const previousMilestoneStatus = currentMilestone?.status ?? null
      const previousPhase = currentMilestone?.phase ?? null
      const wasPhaseCompleteBefore = previousPhase ? isPhaseComplete(enforced, previousPhase) : false

      const advanced = completeBatchInSnapshot(enforced, currentBatch.id)
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

      const newMilestone = currentMilestone ? withCompletion.milestones.find(m => m.id === currentMilestone.id) : null
      if (newMilestone && newMilestone.status === 'Complete' && previousMilestoneStatus !== 'Complete') {
        appendDirectorHistory({ project, event: `Milestone "${newMilestone.title}" completed`, batchId: currentBatch.id, detail: '' })
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

/** Acquires this project's loop-ownership lock and runs the loop body under it, releasing it however the loop ends (completed, paused, blocked, cancelled, or an unexpected throw). Used wherever nothing has acquired the lock yet — recovery and, historically, direct entry; startServerDirector/resumeServerDirector now acquire it themselves first so their own setup writes are covered too (see runLoopBody's doc comment). */
async function runServerLoop(project: string): Promise<void> {
  const owner = acquireLoopOwnership(project)
  if (!owner) return // another still-alive holder already owns this project's loop — exit immediately, never start a second one
  try {
    await runLoopBody(project)
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
        knowledgeVersion: `debt:${handoff.technicalDebt.length}|risk:${handoff.openRisks.length}|dec:${handoff.decisions.length}@${now}`,
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

export function cancelServerDirector(project: string): void {
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
