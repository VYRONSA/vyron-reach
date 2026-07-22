import path from 'node:path'
import { withFileLock } from '../fileLock'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import * as planningStateService from '../planningState/planningStateService'
import type { ProjectStatus } from '../projectsData'
import { getDirectorStatus } from '../director/directorRuntimeStore'
import { resumeServerDirector } from '../director/serverExecutionLoop'
import { runAssessment } from '../director/assessment/assessmentService'
import type { EngineeringAssessment, RiskLevel } from '../director/assessment/assessmentTypes'
import { listInboxItems } from '../director/engineeringInboxStore'
import { raiseNotification } from '../notifications/notificationService'
import { publish } from '../events/eventBus'
import { getSchedulerState, recordCycle } from './schedulerStore'
import { evaluateEligibility, computePriorityScore, rankProjects } from './schedulingPolicy'
import { hasAvailableWork } from './serverHandoffBuilder'
import { isAwaitingExecutiveGoDecision } from '../initiation/executiveControl'
import { attemptHandoff } from '../initiation/initiationHandoff'
import type { ProjectSchedulingInfo, SchedulerCycleResult } from './schedulerTypes'

/**
 * The Scheduler Service — the ONLY thing that decides which project's
 * Engineering Director runs, resumes, or waits. It never touches Director
 * internals: starting/resuming a project means calling the same
 * startServerDirector/resumeServerDirector functions serverExecutionLoop.ts
 * already exports and already protects with directorLock.ts's
 * loop-ownership lock — attempting to schedule an already-running
 * Director is already a safe no-op at that layer (acquireLoopOwnership
 * returns null), so the Scheduler doesn't need, and deliberately doesn't
 * build, a second locking mechanism for "one Director per project." It
 * only adds one lock of its own: around a single scheduling cycle itself
 * (see CYCLE_LOCK_FILE below), so two overlapping cycles (a slow one and
 * the next tick firing before it finished) can't both decide to start
 * the same newly-eligible project at once.
 */

export const DEFAULT_MAX_CONCURRENT_DIRECTORS = 3

function cycleLockFile(): string {
  return path.join(getVyronDevDataDir(), 'scheduler-cycle.lock')
}

function findRiskFactorLevel(assessment: EngineeringAssessment, factorName: string): RiskLevel {
  return assessment.riskAssessment.factors.find(f => f.factor === factorName)?.level ?? 'Low'
}

const RISK_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2 }

/**
 * The worst level among every risk factor EXCEPT Recovery Frequency —
 * used for the scheduling score's "Risk Level" (urgency) term
 * specifically. Recovery Frequency already gets its own, separately
 * tuned, strictly negative RECOVERY_PENALTY term (see
 * schedulingPolicy.ts) — folding it into the urgency signal too would
 * make a flaky project's "this needs attention" boost fight its own
 * "this needs to stabilize first" penalty, and the mission wants
 * unstable projects deprioritized, not double-counted in both
 * directions. assessment.riskAssessment.overall (the Assessment
 * Service's own field) is left completely untouched — this exclusion is
 * local to how the Scheduler weighs urgency, not a change to what the
 * Assessment Service reports.
 */
function urgencyRiskLevel(assessment: EngineeringAssessment): RiskLevel {
  let worst: RiskLevel = 'Low'
  for (const factor of assessment.riskAssessment.factors) {
    if (factor.factor === 'Recovery Frequency') continue
    if (RISK_RANK[factor.level] > RISK_RANK[worst]) worst = factor.level
  }
  return worst
}

export type EvaluateProjectResult = ProjectSchedulingInfo & { assessment: EngineeringAssessment }

/** Gathers everything needed to score one project this cycle — director state, available work, and a fresh Assessment Service read (never computed by the Scheduler itself; "Workers do not compute assessments" applies equally to the Scheduler, which only ever consumes runAssessment's output). */
function evaluateProject(projectSlug: string, projectStatus: ProjectStatus, now: string, schedulerLastExecutedAt: string | null): EvaluateProjectResult {
  const directorState = getDirectorStatus(projectSlug).state
  const availableWork = hasAvailableWork(projectSlug)
  const awaitingExecutiveGo = isAwaitingExecutiveGoDecision(projectSlug)
  const eligibility = evaluateEligibility(directorState, availableWork, awaitingExecutiveGo)
  const { assessment } = runAssessment(projectSlug)
  const openInboxCount = listInboxItems({ project: projectSlug, status: 'Open' }).length

  const { score, factors } = computePriorityScore({
    project: projectSlug,
    engineeringHealth: assessment.engineeringHealth,
    riskLevel: urgencyRiskLevel(assessment),
    outstandingCeoDecisions: openInboxCount,
    projectStatus,
    recoveryFrequencyRisk: findRiskFactorLevel(assessment, 'Recovery Frequency'),
    lastExecutedAt: schedulerLastExecutedAt,
    now,
  })

  return { project: projectSlug, eligibility, priorityScore: score, factors, assessment }
}

/**
 * The Scheduler's only call into execution — converged onto
 * initiationHandoff.ts's attemptHandoff, the single function every start
 * path in this app now shares (the manual "Start Development" route and
 * an Executive's Go decision go through the exact same function). The
 * Scheduler no longer builds its own handoff or calls startServerDirector
 * directly, and no longer re-checks Executive Go/Hold itself here —
 * attemptHandoff enforces that gate unconditionally for every caller, so
 * a second check here would be redundant, not defense-in-depth.
 */
function startOrResumeProject(projectSlug: string): boolean {
  const status = getDirectorStatus(projectSlug)
  if (status.state === 'Waiting for CEO' || status.state === 'Blocked' || status.state === 'Running' || status.state === 'Planning') {
    return false // never touched — the Scheduler only starts Idle/Completed projects with available work
  }
  return attemptHandoff(projectSlug) === null
}

export type SchedulingCycleOptions = {
  now?: string
  maxConcurrent?: number
}

/**
 * Runs exactly one scheduling cycle: discovers projects, evaluates and
 * ranks every one of them (even ineligible ones — the dashboard's
 * "Current execution order" wants the full picture), then starts as many
 * top-ranked Eligible projects as available execution slots allow.
 * Synchronous by design (only fire-and-forget async calls happen inside
 * — startServerDirector and raiseNotification, neither awaited) so the
 * whole cycle can run inside withFileLock's synchronous critical section
 * without any risk of a slow network call holding the lock open.
 */
export function runSchedulingCycle(options: SchedulingCycleOptions = {}): SchedulerCycleResult {
  return withFileLock(cycleLockFile(), () => runSchedulingCycleLocked(options))
}

function runSchedulingCycleLocked(options: SchedulingCycleOptions): SchedulerCycleResult {
  const cycleStartedAt = Date.now()
  const now = options.now ?? new Date().toISOString()
  const maxConcurrent = options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT_DIRECTORS
  const errors: { project: string; message: string }[] = []

  const schedulerState = getSchedulerState()
  const projects = planningStateService.listProjects().filter(p => !p.archived)

  const evaluations: EvaluateProjectResult[] = []
  for (const project of projects) {
    try {
      evaluations.push(evaluateProject(project.slug, project.status, now, schedulerState.lastExecutedAt[project.slug] ?? null))
    } catch (err) {
      errors.push({ project: project.slug, message: err instanceof Error ? err.message : String(err) })
    }
  }

  const order = rankProjects(
    evaluations.map((e): ProjectSchedulingInfo => ({ project: e.project, eligibility: e.eligibility, priorityScore: e.priorityScore, factors: e.factors }))
  )
  const eligible = order.filter(i => i.eligibility === 'Eligible')

  const runningCount = order.filter(i => i.eligibility === 'Running').length
  const availableSlots = Math.max(0, maxConcurrent - runningCount)

  const toStart = eligible.slice(0, availableSlots)
  const started: string[] = []
  for (const item of toStart) {
    try {
      if (startOrResumeProject(item.project)) started.push(item.project)
    } catch (err) {
      errors.push({ project: item.project, message: err instanceof Error ? err.message : String(err) })
    }
  }

  const waiting = eligible.filter(i => !started.includes(i.project)).map(i => i.project)

  const result: SchedulerCycleResult = { timestamp: now, order, started, waiting, errors }

  const previouslyWaiting = new Set(schedulerState.waitingNotified)
  recordCycle(result)
  emitCycleNotifications(result, previouslyWaiting)

  // One cross-project 'Scheduler Activity' event per cycle — the
  // dashboard's Scheduler panel is inherently a whole-cycle view (current
  // execution order across every project), not a single-project one, so
  // this doesn't need the per-project fan-out every other producer here
  // uses.
  publish({
    category: 'Scheduler Activity',
    project: '*',
    type: 'cycle-completed',
    // durationMs is a raw measurement of this cycle's own wall-clock
    // execution time — the Metrics Service (Production Validation 2.1,
    // Milestone 2.1.1) is what turns a stream of these into an average;
    // this file still never computes an average, percentage, or trend
    // itself.
    payload: { started: result.started, waiting: result.waiting, errorCount: result.errors.length, durationMs: Date.now() - cycleStartedAt },
  })

  return result
}

/** No direct provider calls — every notification goes through raiseNotification (the Notification Service), matching Milestone 4.1's single integration point exactly. Fire-and-forget: the Scheduler never blocks a cycle on delivery. */
function emitCycleNotifications(result: SchedulerCycleResult, previouslyWaiting: Set<string>): void {
  for (const project of result.started) {
    void raiseNotification({
      type: 'Project Started',
      project,
      title: `${project}: Engineering Director started by Scheduler`,
      message: `The Cross-Project Execution Scheduler started this project's Engineering Director.`,
      severity: 'Info',
      metadata: {},
    })
  }
  for (const project of result.waiting) {
    if (previouslyWaiting.has(project)) continue // already notified last cycle — don't repeat every tick
    void raiseNotification({
      type: 'Project Waiting',
      project,
      title: `${project}: waiting for an execution slot`,
      message: 'This project is eligible to run but no execution slot is available yet.',
      severity: 'Low',
      metadata: {},
    })
  }
  for (const error of result.errors) {
    void raiseNotification({
      type: 'Scheduling Error',
      project: error.project,
      title: `${error.project}: scheduling error`,
      message: error.message,
      severity: 'Medium',
      metadata: {},
    })
  }
}
