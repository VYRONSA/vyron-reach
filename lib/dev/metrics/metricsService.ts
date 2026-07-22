import { subscribe } from '../events/eventBus'
import * as planningStateService from '../planningState/planningStateService'
import { listWorkforceTasks } from '../director/workforce/workforceTaskStore'
import { getMetricsState, processMetricEvent, getAllTestRuns, resetEventCursor } from './metricsStore'
import type { MetricsState, MetricsKpis, DurationAccumulator, TestRunRecord } from './metricsTypes'

/**
 * The Metrics Service's orchestration layer: subscribing to the Event
 * Service (the ONLY input path for everything except Testing metrics —
 * see metricsTypes.ts's TestRunInput) and turning raw counters/duration
 * accumulators into the percentages/averages/trends this milestone calls
 * "metrics." Existing services never do this arithmetic themselves.
 */

function average(acc: DurationAccumulator | undefined): number | null {
  if (!acc || acc.count === 0) return null
  return acc.totalMs / acc.count
}

function percentage(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return (numerator / denominator) * 100
}

/**
 * The one place this milestone reads another service's state directly
 * rather than via an event — "Planning accuracy" is a point-in-time
 * gauge (completed batches / total batches right now), not something
 * that happened at a moment in time the way every other metric here is.
 * planningStateService.listAllBatches() is an ordinary, already-existing
 * read function; nothing about Planning changes to support this, and
 * Planning still computes nothing metrics-shaped itself — this function
 * does the one division, here, not there.
 */
export function computePlanningAccuracyGauge(): number | null {
  const batches = planningStateService.listAllBatches()
  const eligible = batches.filter(b => !b.archived)
  if (eligible.length === 0) return null
  const completed = eligible.filter(b => b.status === 'Complete').length
  return (completed / eligible.length) * 100
}

export function computeKpis(state: MetricsState, testRuns: TestRunRecord[], planningAccuracyPercentage: number | null): MetricsKpis {
  const c = state.counters
  const d = state.durations
  const get = (name: string) => c[name] ?? 0

  const autonomous = get('automation.autonomousDecisions')
  const manual = get('automation.manualOverrides')

  const testsExecuted = testRuns.reduce((sum, r) => sum + r.executed, 0)
  const testsPassed = testRuns.reduce((sum, r) => sum + r.passed, 0)
  const testsFailed = testRuns.reduce((sum, r) => sum + r.failed, 0)
  const regressionFailures = testRuns.reduce((sum, r) => sum + r.regressionFailures, 0)
  const totalTestDurationMs = testRuns.reduce((sum, r) => sum + r.durationMs, 0)

  return {
    throughput: {
      projectsStarted: get('throughput.projectsStarted'),
      projectsCompleted: get('throughput.projectsCompleted'),
      featuresPlanned: get('throughput.featuresPlanned'),
      featuresDelivered: get('throughput.featuresDelivered'),
      tasksAssigned: get('throughput.tasksAssigned'),
      tasksCompleted: get('throughput.tasksCompleted'),
      averageFeatureDurationMs: average(d['throughput.featureDuration']),
      averageProjectDurationMs: average(d['throughput.projectDuration']),
    },
    automation: {
      autonomousDecisions: autonomous,
      manualOverrides: manual,
      automationPercentage: percentage(autonomous, autonomous + manual),
      ceoInterventionPercentage: percentage(manual, autonomous + manual),
      directorDecisions: get('automation.directorDecisions'),
      workerDecisions: get('automation.workerDecisions'),
      schedulerDecisions: get('automation.schedulerDecisions'),
      recoveryEvents: get('automation.recoveryEvents'),
    },
    quality: {
      technicalDebtCreated: get('quality.technicalDebtCreated'),
      technicalDebtResolved: get('quality.technicalDebtResolved'),
      knowledgeUpdates: get('quality.knowledgeUpdates'),
      documentationGenerated: get('quality.documentationGenerated'),
      assessmentAccuracyPercentage: percentage(get('quality.assessmentsHealthy'), get('quality.assessmentsTotal')),
      riskPredictionAccuracyPercentage: percentage(get('quality.riskFlagsConfirmed'), get('quality.riskFlagsHigh')),
      planningAccuracyPercentage,
    },
    reliability: {
      recoveryCount: get('reliability.recoveryCount'),
      averageRecoveryDurationMs: average(d['reliability.recoveryDuration']),
      notificationFailures: get('reliability.notificationFailures'),
      escalationFrequency: get('reliability.escalationFrequency'),
      schedulerCycles: get('reliability.schedulerCycles'),
      workerFailures: get('reliability.workerFailures'),
      retryCounts: get('reliability.retryCounts'),
      incidentsOpened: get('reliability.incidentsOpened'),
      incidentsResolved: get('reliability.incidentsResolved'),
      averageIncidentDurationMs: average(d['reliability.incidentDuration']),
      rollbacksApproved: get('reliability.rollbacksApproved'),
    },
    performance: {
      averagePlanningDurationMs: average(d['performance.planningDuration']),
      averageAssessmentDurationMs: average(d['performance.assessmentDuration']),
      averageWorkerDurationMs: average(d['performance.workerDuration']),
      averageSchedulingDurationMs: average(d['performance.schedulingDuration']),
      averageNotificationDurationMs: average(d['performance.notificationDuration']),
      averageEscalationDurationMs: average(d['performance.escalationDuration']),
    },
    testing: {
      testsExecuted,
      testsPassed,
      testsFailed,
      regressionFailures,
      averageExecutionDurationMs: testRuns.length > 0 ? totalTestDurationMs / testRuns.length : null,
    },
  }
}

/** The current, live KPI view — counters as of the last processed event, plus the Planning accuracy gauge read fresh. */
export function getCurrentKpis(): MetricsKpis {
  return computeKpis(getMetricsState(), getAllTestRuns(), computePlanningAccuracyGauge())
}

export type TopProject = { project: string; completedBatches: number; completedTasks: number; activityScore: number }

/**
 * "Top projects" (the Dashboard section) — another point-in-time gauge,
 * same reasoning as computePlanningAccuracyGauge: which project is
 * "most active" isn't a fact that happened at a moment in time the way
 * an event is, it's a ranking over current state, read directly from
 * Planning and Workforce (both already-existing read functions) rather
 * than tracked as yet another incremental per-project counter set.
 */
export function getTopProjects(limit = 5): TopProject[] {
  const projects = planningStateService.listProjects().filter(p => !p.archived)
  const ranked = projects.map(p => {
    const completedBatches = planningStateService.listBatches(p.slug).filter(b => b.status === 'Complete').length
    const completedTasks = listWorkforceTasks(p.slug).filter(t => t.filesChanged !== null).length
    return { project: p.slug, completedBatches, completedTasks, activityScore: completedBatches + completedTasks }
  })
  return ranked.sort((a, b) => b.activityScore - a.activityScore).slice(0, limit)
}

let unsubscribe: (() => void) | null = null

/**
 * Wires the Event Service subscription — idempotent within a process (a
 * second call is a no-op while already subscribed), so
 * metricsBootstrap.ts's own singleton guard is defense in depth, not the
 * only thing preventing a double-subscribe.
 *
 * Resets the persisted dedup cursor first (see resetEventCursor's doc
 * comment) — this process's eventBus instance is about to start counting
 * from seq 1 again, so the cursor must too, or this process's very first
 * event would be mistaken for something already processed by whichever
 * process ran before it and silently dropped.
 */
export function startMetricsSubscription(): void {
  if (unsubscribe) return
  resetEventCursor()
  unsubscribe = subscribe(event => {
    processMetricEvent(event)
  })
}

/** Exposed for tests — no production caller ever needs to stop listening. */
export function stopMetricsSubscription(): void {
  unsubscribe?.()
  unsubscribe = null
}
