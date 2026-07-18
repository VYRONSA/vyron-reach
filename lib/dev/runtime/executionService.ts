import type { DevelopmentSession } from '../developmentOrchestrator'
import type { DevelopmentDependencyStatus } from '../developmentDependencyEngine'
import type { DevelopmentConversationMemory } from '../developmentConversationMemoryEngine'
import type { ExecutiveActionQueue } from '../executiveActionEngine'
import type { GitIntelligence } from '../gitIntelligence'
import type { DeploymentIntelligence } from '../deploymentIntelligence'
import { getHandovers, type Handover } from '../handoverStorage'
import type { DevelopmentJob } from './runtimeTypes'
import { buildDevelopmentContext } from './runtimeContextBuilder'
import { planNextDevelopmentTask, type PlannedTask } from './developmentPlanningEngine'
import type { GeneratedPrompt } from '../promptIntelligenceEngine'
import { completeDevelopmentCycle, parseClaudeReport } from '../developmentCompletionEngine'
import { applyKnowledgeUpdates, previewKnowledgeUpdates } from './knowledgeUpdateEngine'
import { buildReviewPackage, type ReviewPackage } from './reviewPackage'
import { getProjectBySlug } from '../projectsData'
import { milestonesForProject } from '../milestonesStorage'
import { batchesForProject } from '../batchesStorage'
import { debtForProject } from '../technicalDebtStorage'
import { decisionsForProject } from '../decisionsStorage'
import {
  buildExecutiveEngineeringReport,
  computeClientEngineeringFindings,
  type ExecutiveEngineeringReport,
} from '../intelligence/engineeringIntelligenceEngine'
import type { EngineeringFinding } from '../intelligence/types'
import { evaluateEngineeringStrategy } from '../director/engineeringDirector'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import { getKnowledgeNote } from '../knowledgeData'
import { runQualityGates } from '../operations/qualityGateEngine'
import { assessRisks } from '../operations/riskAssessmentEngine'
import { deriveLifecycleStage } from '../operations/lifecycleManager'
import { determineReleaseReadiness } from '../operations/releaseReadinessEngine'
import { buildDeploymentSnapshot } from '../operations/deploymentOperationsIntelligence'
import { buildExecutiveOperationsDashboard } from '../operations/executiveOperationsDashboard'
import type {
  ContinuousValidationResult,
  DeploymentSnapshot,
  ExecutiveOperationsDashboard,
  OperationsSnapshot,
  QualityGateReport,
  ReleaseReadinessResult,
  RiskAssessment,
  RollbackPoint,
} from '../operations/operationsTypes'
import { runAgentWorkforce, type WorkforceReport } from '../agents/agentWorkforce'
import { buildExecutionLearningRecord } from '../learning/executionAnalytics'
import type { RelevantKnowledge } from '../learning/learningTypes'

const POLL_INTERVAL_MS = 2000
const RUNNING_STATUSES = new Set<DevelopmentJob['status']>(['Queued', 'Running', 'Validating'])

export type ExecutionPhase =
  | 'idle'
  | 'loading-repository'
  | 'generating-context'
  | 'planning'
  | 'blocked'
  | 'queued'
  | 'running'
  | 'validating'
  | 'awaiting-review'
  | 'applying'
  | 'completed'
  | 'rejected'
  | 'failed'
  | 'cancelled'

export type ExecutionState = {
  phase: ExecutionPhase
  job: DevelopmentJob | null
  plannedTask: PlannedTask | null
  /** The autonomous prompt actually built for this execution — exposed only for the "copy prompt instead" fallback when the runtime itself is unavailable, never rendered during normal operation. */
  prompt: GeneratedPrompt | null
  workforceReport: WorkforceReport | null
  engineeringReport: ExecutiveEngineeringReport | null
  strategy: ExecutiveEngineeringStrategy | null
  relevantKnowledge: RelevantKnowledge | null
  validationResult: ContinuousValidationResult | null
  gateReport: QualityGateReport | null
  riskAssessment: RiskAssessment | null
  releaseReadiness: ReleaseReadinessResult | null
  deploymentSnapshot: DeploymentSnapshot | null
  dashboard: ExecutiveOperationsDashboard | null
  dnaUpdated: number
  reviewPackage: ReviewPackage | null
  error: string | null
}

const INITIAL_STATE: ExecutionState = {
  phase: 'idle',
  job: null,
  plannedTask: null,
  prompt: null,
  workforceReport: null,
  engineeringReport: null,
  strategy: null,
  relevantKnowledge: null,
  validationResult: null,
  gateReport: null,
  riskAssessment: null,
  releaseReadiness: null,
  deploymentSnapshot: null,
  reviewPackage: null,
  dashboard: null,
  dnaUpdated: 0,
  error: null,
}

export type ExecutionServiceDeps = {
  slug: string
  session: DevelopmentSession
  dependencies: DevelopmentDependencyStatus
  memory: DevelopmentConversationMemory
  latestHandover: Handover | null
  queue: ExecutiveActionQueue
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

/** Shared by execute() (pre-run planning) and approve() (post-apply revalidation) so the Engineering Intelligence composition isn't duplicated. */
async function computeEngineeringReport(slug: string, jobHistory: DevelopmentJob[]): Promise<ExecutiveEngineeringReport> {
  const project = getProjectBySlug(slug)
  const milestones = milestonesForProject(slug)
  const batches = batchesForProject(slug)
  const debt = debtForProject(slug)
  const decisions = decisionsForProject(slug)
  const handovers = getHandovers().filter(h => h.project === slug)
  const hasSqlDocumentation = getKnowledgeNote('sql').content.trim() !== ''

  const { findings: serverFindings } = await fetchJson<{ findings: EngineeringFinding[] }>(
    `/api/dev/intelligence/report?hasSqlDocumentation=${hasSqlDocumentation}`
  )
  const clientFindings = computeClientEngineeringFindings({ project, milestones, batches, debt, decisions, jobs: jobHistory, handovers })
  const productCompletion = batches.length > 0 ? Math.round((batches.filter(b => b.status === 'Complete').length / batches.length) * 100) : 0
  return buildExecutiveEngineeringReport(serverFindings, clientFindings, productCompletion)
}

/**
 * The Execution Service — the runtime's orchestration entry point,
 * extracted out of MissionControl.tsx so both the dashboard widget and the
 * per-Batch Execute screen share one implementation instead of two
 * diverging copies. A tiny pub/sub controller (subscribe/state), not a
 * React hook itself — components/dev/useExecutionService.ts adapts it for
 * React.
 *
 * The key behavior change from the previous MissionControl-embedded
 * version: reaching a Completed job no longer auto-applies. It runs
 * Continuous Validation once and stops at 'awaiting-review' — the CEO
 * must call approve() (which runs the full apply pipeline, now including
 * the Knowledge Update Engine) or reject() before anything is written to
 * the Handover/Batch/Milestone/knowledge stores.
 */
export function createExecutionService(deps: ExecutionServiceDeps) {
  let state: ExecutionState = { ...INITIAL_STATE }
  const listeners = new Set<(s: ExecutionState) => void>()
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let workforceReport: WorkforceReport | null = null
  /** Captured once when the job reaches awaiting-review, so approve() reuses this real build+TypeScript run instead of paying for a second one. */
  let rollbackPointsFromReview: RollbackPoint[] = []

  function setState(patch: Partial<ExecutionState>) {
    state = { ...state, ...patch }
    for (const listener of listeners) listener(state)
  }

  function subscribe(listener: (s: ExecutionState) => void): () => void {
    listeners.add(listener)
    listener(state)
    return () => listeners.delete(listener)
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function buildReviewPackageFromJob(validation: ContinuousValidationResult | null) {
    const job = state.job
    if (!job?.result) return
    const parsed = parseClaudeReport(job.result)
    setState({ reviewPackage: buildReviewPackage(parsed, job, validation, workforceReport, previewKnowledgeUpdates(parsed)) })
  }

  async function runValidationForReview() {
    try {
      const { validation, rollbackPoints } = await fetchJson<{ validation: ContinuousValidationResult; rollbackPoints: RollbackPoint[] }>(
        '/api/dev/operations/validate',
        { method: 'POST' }
      )
      rollbackPointsFromReview = rollbackPoints
      setState({ validationResult: validation, phase: 'awaiting-review' })
      buildReviewPackageFromJob(validation)
    } catch (err) {
      // Validation failing to run at all is not the same as the build/TS
      // failing — the job's own result is still there to review.
      setState({
        phase: 'awaiting-review',
        error: err instanceof Error ? `Continuous Validation could not run: ${err.message}` : 'Continuous Validation could not run.',
      })
      buildReviewPackageFromJob(null)
    }
  }

  function poll(id: string) {
    pollTimer = setTimeout(async () => {
      try {
        const { job: latest } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${id}`)
        setState({ job: latest })

        if (RUNNING_STATUSES.has(latest.status)) {
          setState({ phase: latest.status === 'Validating' ? 'validating' : latest.status === 'Running' ? 'running' : 'queued' })
          poll(id)
        } else if (latest.status === 'Completed' && !latest.appliedAt && !latest.rejectedAt) {
          await runValidationForReview()
        } else if (latest.status === 'Failed') {
          setState({ phase: 'failed' })
        } else if (latest.status === 'Cancelled') {
          setState({ phase: 'cancelled' })
        } else if (latest.status === 'Rejected') {
          setState({ phase: 'rejected' })
        } else if (latest.appliedAt) {
          setState({ phase: 'completed' })
        }
      } catch {
        // transient poll failure — try again on the next tick
        poll(id)
      }
    }, POLL_INTERVAL_MS)
  }

  async function execute(): Promise<void> {
    stopPolling()
    // Captured before the state reset below: when execute() is called as a
    // Retry (state.job is still the previous attempt), a session id that
    // made it far enough to be captured lets the next run resume that
    // Claude session instead of starting cold. A fresh Execute Batch click
    // from idle always has state.job === null here, so this is naturally a
    // no-op in that case — no separate "is this a retry" flag needed.
    const resumeSessionId = state.job?.claudeSessionId ?? undefined
    setState({ ...INITIAL_STATE, phase: 'loading-repository' })
    try {
      const { jobs: history } = await fetchJson<{ jobs: DevelopmentJob[] }>(`/api/dev/runtime/jobs?project=${encodeURIComponent(deps.slug)}`)

      const report = await computeEngineeringReport(deps.slug, history)
      setState({ engineeringReport: report })

      setState({ phase: 'generating-context' })
      const queryText = deps.queue.topAction?.title ?? deps.session.currentObjective ?? deps.session.currentBatch?.objective ?? ''
      const { knowledge } = await fetchJson<{ knowledge: RelevantKnowledge }>(
        `/api/dev/learning/knowledge?project=${encodeURIComponent(deps.slug)}&taskText=${encodeURIComponent(queryText)}`
      )
      setState({ relevantKnowledge: knowledge })

      const projectHandovers = getHandovers().filter(h => h.project === deps.slug)
      const context = buildDevelopmentContext(
        deps.slug,
        deps.session,
        deps.memory,
        deps.latestHandover,
        history,
        knowledge,
        projectHandovers.slice(1, 3)
      )

      const strategyResult = evaluateEngineeringStrategy(context, report, deps.queue, deps.dependencies)
      setState({ strategy: strategyResult })

      const { task, prompt } = planNextDevelopmentTask(context, deps.session, deps.dependencies, deps.queue, report, strategyResult)
      setState({ plannedTask: task, prompt, phase: 'planning' })

      const workforce = await runAgentWorkforce({
        context,
        report,
        strategy: strategyResult,
        task,
        previousExecution: context.previousRuntimeExecution,
        developmentRules: context.developmentRules,
      })
      workforceReport = workforce
      setState({ workforceReport: workforce })

      if (!workforce.readyForApply) {
        setState({ phase: 'blocked', error: `Workforce blocked execution: ${workforce.executiveSummary}` })
        return
      }

      const { job: created } = await fetchJson<{ job: DevelopmentJob }>('/api/dev/runtime/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: deps.slug,
          milestoneId: deps.session.currentMilestone?.id ?? '',
          batchId: deps.session.currentBatch?.id ?? '',
          objective: task?.description ?? '',
          prompt: prompt.fullText,
          resumeSessionId,
        }),
      })
      setState({ job: created, phase: 'queued' })
      poll(created.id)
    } catch (err) {
      setState({ phase: 'blocked', error: err instanceof Error ? err.message : 'Failed to start the runtime.' })
    }
  }

  /**
   * Operations Integration: after Approve, re-runs Engineering Intelligence
   * and the Director against the just-applied state, then Quality Gates →
   * Risk Assessment → Release Readiness → an Operations Snapshot → the
   * Executive Operations Dashboard, and — new — the Knowledge Update
   * Engine (Architecture Decisions / Technical Debt / Risk Register /
   * Development Journal). Gates/Risk/Readiness/Deployment Snapshot only
   * compute when git/deployment intelligence were actually passed in.
   */
  async function approve(): Promise<void> {
    const completedJob = state.job
    if (!completedJob || !completedJob.result || completedJob.status !== 'Completed') return
    setState({ phase: 'applying' })

    try {
      await fetchJson(`/api/dev/runtime/jobs/${completedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const completionResult = completeDevelopmentCycle(completedJob.projectSlug, completedJob.result, {
        claudeModel: completedJob.runtime,
        originalPrompt: completedJob.prompt,
        runtimeJobId: completedJob.id,
        runtimeDurationMs: completedJob.duration,
        runtimeCostUsd: completedJob.cost,
        claudeSessionId: completedJob.claudeSessionId,
        gitDiffSummary: completedJob.gitDiffSummary ?? '',
      })

      // Authoritative counts of what was actually written — the review
      // package shown during awaiting-review already displayed the
      // (identical, since both derive from the same parsed text) preview.
      const knowledgeUpdateSummary = applyKnowledgeUpdates(
        completionResult.parsed,
        completedJob,
        completionResult.handover,
        completedJob.projectSlug,
        completedJob.batchId
      )
      setState({
        reviewPackage: state.reviewPackage ? { ...state.reviewPackage, knowledgeUpdates: knowledgeUpdateSummary } : state.reviewPackage,
      })

      const { jobs: historyAfter } = await fetchJson<{ jobs: DevelopmentJob[] }>(
        `/api/dev/runtime/jobs?project=${encodeURIComponent(deps.slug)}`
      )
      const reportAfter = await computeEngineeringReport(deps.slug, historyAfter)
      setState({ engineeringReport: reportAfter })
      const contextAfter = buildDevelopmentContext(
        deps.slug,
        deps.session,
        deps.memory,
        getHandovers().filter(h => h.project === deps.slug)[0] ?? null,
        historyAfter
      )
      const strategyAfter = evaluateEngineeringStrategy(contextAfter, reportAfter, deps.queue, deps.dependencies)
      setState({ strategy: strategyAfter })

      const gates = runQualityGates(completedJob, reportAfter)
      setState({ gateReport: gates })

      let readinessResult: ReleaseReadinessResult = { readiness: 'Blocked', reason: 'Git Intelligence unavailable — cannot assess risk.' }
      const rollbackPoints = rollbackPointsFromReview
      const validation = state.validationResult

      if (deps.git) {
        const risk = assessRisks(gates, deps.git, reportAfter, strategyAfter, historyAfter)
        setState({ riskAssessment: risk })
        const stage = deriveLifecycleStage(completedJob, gates, deps.deployment ?? null)
        readinessResult = determineReleaseReadiness(stage, gates, risk, deps.deployment ?? null)
        setState({ releaseReadiness: readinessResult })

        if (deps.deployment) {
          const projectHandovers = getHandovers()
            .filter(h => h.project === deps.slug)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          setState({ deploymentSnapshot: buildDeploymentSnapshot(deps.git, deps.deployment, projectHandovers, rollbackPoints) })
        }
      }

      const learningRecord = buildExecutionLearningRecord(
        completedJob,
        completionResult.handover,
        reportAfter,
        strategyAfter,
        workforceReport,
        deps.session.project?.name ?? deps.slug,
        contextAfter.currentPhase
      )
      const learningUpdate = await fetchJson<{ newDNAEntries: unknown[] }>('/api/dev/learning/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learningRecord),
      })
      setState({ dnaUpdated: learningUpdate.newDNAEntries.length })

      await fetchJson('/api/dev/operations/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          projectSlug: deps.slug,
          jobId: completedJob.id,
          engineeringScore: reportAfter.engineeringScore,
          overallHealth: reportAfter.overallHealth,
          deliveryRisk: reportAfter.deliveryRisk,
          technicalDebtScore: reportAfter.technicalDebtScore,
          productCompletion: reportAfter.productCompletion,
          buildStatus: validation?.buildStatus ?? completedJob.buildStatus,
          typescriptStatus: validation?.typescriptStatus ?? completedJob.typescriptStatus,
          cost: completedJob.cost,
          duration: completedJob.duration,
          applied: true,
        }),
      })

      const { history: opsHistory } = await fetchJson<{ history: OperationsSnapshot[] }>(
        `/api/dev/operations/snapshot?project=${encodeURIComponent(deps.slug)}`
      )
      setState({ dashboard: buildExecutiveOperationsDashboard(opsHistory, readinessResult.readiness) })

      const { job: applied } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${completedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'applied' }),
      })
      setState({ job: applied, phase: 'completed' })
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : 'Failed to apply the result.', phase: 'awaiting-review' })
    }
  }

  /** No knowledge writes — the job is left visible in Runtime History with rejectedAt/rejectionReason for a later Retry to learn from. */
  async function reject(reason?: string): Promise<void> {
    const completedJob = state.job
    if (!completedJob) return
    try {
      const { job: rejected } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${completedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })
      setState({ job: rejected, phase: 'rejected' })
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : 'Failed to reject the result.' })
    }
  }

  async function cancel(): Promise<void> {
    const job = state.job
    if (!job) return
    stopPolling()
    try {
      const { job: cancelled } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      setState({ job: cancelled, phase: 'cancelled' })
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : 'Failed to cancel the job.' })
    }
  }

  /** The context builder already surfaces the previous Failed/Rejected job via previousRuntimeExecution/runtimeHistory, so simply re-running execute() gives the next attempt full visibility into why the last one didn't succeed — no separate retry logic needed. */
  async function retry(): Promise<void> {
    await execute()
  }

  function dismiss(): void {
    stopPolling()
    setState({ ...INITIAL_STATE })
  }

  function getState(): ExecutionState {
    return state
  }

  return { subscribe, getState, execute, approve, reject, cancel, retry, dismiss }
}

export type ExecutionService = ReturnType<typeof createExecutionService>
