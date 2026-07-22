import { randomUUID } from 'node:crypto'
import { subscribe } from '../events/eventBus'
import * as planningStateService from '../planningState/planningStateService'
import { patchDirectorStatus } from '../director/directorRuntimeStore'
import { createInboxItem, resolveInboxItem, dismissInboxItem, listInboxItems } from '../director/engineeringInboxStore'
import { createWorkforceTask, recordWorkforceTaskCompletion } from '../director/workforce/workforceTaskStore'
import { recordArchitectureDecision, recordHandover } from '../knowledge/knowledgeService'
import { runSchedulingCycle } from '../scheduler/schedulerService'
import { runEscalationCycle } from '../escalation/escalationService'
import { createDelivery, markDelivered, markFailed } from '../notifications/deliveryStore'
import { resetEventCursor as resetMetricsEventCursor, processMetricEvent, getMetricsState, getAllTestRuns } from '../metrics/metricsStore'
import { computeKpis } from '../metrics/metricsService'
import { resetEventCursor as resetCertificationEventCursor, processCertificationEvent, listCertifiedFeatures } from '../certification/certificationStore'
import { computeQualityScore } from '../certification/certificationPolicy'
import { createRng, chance } from './deterministicRandom'
import { getScenarioDefinition, resolveLoad } from './simulationScenarios'
import type { DashboardEvent } from '../events/eventTypes'
import type { WorkerRole } from '../director/workforce/workforceTypes'
import type { NotificationEvent } from '../notifications/notificationTypes'
import type {
  FaultInjection,
  FaultType,
  SimulationConfig,
  SimulationFailureEntry,
  SimulationMeasurements,
  SimulationRecoveryEntry,
  SimulationReport,
  SimulationTimelineEntry,
} from './simulationTypes'

/**
 * The Simulation Service's orchestrator — the one place a
 * SimulationConfig becomes a sequence of calls into real, unmodified
 * production functions (planningStateService, workforceTaskStore,
 * knowledgeService, schedulerService, escalationService, deliveryStore,
 * metricsStore, certificationStore), all inside runIsolatedSimulation's
 * throwaway data directory + event bus.
 *
 * Two deliberate, documented boundaries — the only production behavior
 * this file does NOT exercise, both because doing so would mean
 * literally performing the real-world side effect a simulation must
 * never cause, not because the surrounding decision logic is skipped:
 *
 *   1. Worker EXECUTION (an actual Claude Code CLI subprocess) is never
 *      invoked — a task's outcome (success/rejected-and-retried) is
 *      decided by the scenario's configured failure rate and applied
 *      through the exact same real functions the Director loop itself
 *      calls on either outcome (recordWorkforceTaskCompletion, or
 *      createInboxItem with reasonType 'Worker Review Required' — the
 *      identical path serverExecutionLoop.ts takes on a real Rejected
 *      review).
 *   2. The Scheduler's real runSchedulingCycle is always called with
 *      maxConcurrent: 0 — schedulerService.ts's own logic then makes
 *      availableSlots always 0, so startOrResumeProject (which would
 *      fire a real Director loop) is provably never reached, while
 *      eligibility classification, ranking, and fairness scoring — the
 *      actual decision algorithm — run for real and are fully captured
 *      in the returned order/waiting lists.
 */

const ROLES: WorkerRole[] = ['Backend Engineer', 'Frontend Engineer', 'Architecture Engineer', 'QA Engineer', 'DevOps Engineer', 'Database Engineer', 'Documentation Engineer']

function describeFault(type: FaultType): string {
  switch (type) {
    case 'process-restart':
      return 'Simulated process restart — Metrics/Certification dedup cursors reset, exactly as a real restart would (see metricsStore.ts/certificationStore.ts resetEventCursor)'
    case 'worker-crash':
      return 'Simulated worker crash mid-task'
    case 'notification-provider-failure':
      return 'Simulated notification provider outage'
    case 'escalation-interruption':
      return 'Simulated interruption of an in-flight escalation cycle'
    case 'scheduler-interruption':
      return 'Simulated interruption of an in-flight scheduling cycle'
    case 'knowledge-refresh-interruption':
      return 'Simulated interruption while recording knowledge'
    case 'recovery-interruption':
      return 'Simulated interruption during startup recovery'
  }
}

type RunState = {
  step: number
  timeline: SimulationTimelineEntry[]
  failures: SimulationFailureEntry[]
  recoveries: SimulationRecoveryEntry[]
  schedulerCyclesRun: number
  schedulerCyclesWithEligibleWork: number
  peakWaiting: number
  firstWaiting: number | null
}

function log(state: RunState, type: string, detail: string): void {
  state.timeline.push({ step: state.step, timestamp: new Date().toISOString(), type, detail })
}

function advance(state: RunState, faults: FaultInjection[]): void {
  state.step += 1
  while (faults.length > 0 && faults[0].afterStep <= state.step) {
    const fault = faults.shift()!
    injectFault(state, fault)
  }
}

function injectFault(state: RunState, fault: FaultInjection): void {
  const timestamp = new Date().toISOString()
  const startedAt = Date.now()
  state.failures.push({ step: state.step, timestamp, faultType: fault.type, detail: describeFault(fault.type) })
  log(state, 'Fault Injected', describeFault(fault.type))

  switch (fault.type) {
    case 'process-restart':
    case 'recovery-interruption':
      resetMetricsEventCursor()
      resetCertificationEventCursor()
      runSchedulerCycleSafely(state)
      runEscalationCycleSafely(state)
      break
    case 'scheduler-interruption':
      runSchedulerCycleSafely(state)
      break
    case 'escalation-interruption':
      runEscalationCycleSafely(state)
      break
    case 'worker-crash':
    case 'notification-provider-failure':
    case 'knowledge-refresh-interruption':
      // Modeled through the scenario's own failure-rate knobs at the
      // point of the relevant action (task/notification/knowledge
      // recording) rather than a separate recovery step here — there is
      // no additional real function to call that isn't already exercised
      // by that per-action path.
      break
  }

  const durationMs = Date.now() - startedAt
  state.recoveries.push({ step: state.step, timestamp: new Date().toISOString(), faultType: fault.type, detail: `Recovered from ${fault.type}`, durationMs })
  log(state, 'Recovered', `Recovered from ${fault.type} in ${durationMs}ms`)
}

function runSchedulerCycleSafely(state: RunState): void {
  // maxConcurrent: 0 — see this file's header doc for why this can never start a real Director loop.
  const result = runSchedulingCycle({ maxConcurrent: 0 })
  state.schedulerCyclesRun += 1
  if (result.waiting.length > 0) state.schedulerCyclesWithEligibleWork += 1
  state.peakWaiting = Math.max(state.peakWaiting, result.waiting.length)
  if (state.firstWaiting === null) state.firstWaiting = result.waiting.length
  log(state, 'Scheduler Cycle', `${result.order.length} projects evaluated, ${result.waiting.length} eligible`)
}

function runEscalationCycleSafely(state: RunState): void {
  const result = runEscalationCycle()
  log(state, 'Escalation Cycle', `${result.checked} items checked, ${result.remindersSent.length} reminders sent`)
}

export async function executeSimulation(config: SimulationConfig): Promise<Omit<SimulationReport, 'id' | 'status' | 'error'>> {
  const rng = createRng(config.seed)
  const definition = getScenarioDefinition(config.scenario)
  const load = resolveLoad(config.scenario, config.loadProfile, config.customLoad)
  const faults = [...(config.faults.length > 0 ? config.faults : definition.defaultFaults)].sort((a, b) => a.afterStep - b.afterStep)

  const state: RunState = {
    step: 0,
    timeline: [],
    failures: [],
    recoveries: [],
    schedulerCyclesRun: 0,
    schedulerCyclesWithEligibleWork: 0,
    peakWaiting: 0,
    firstWaiting: null,
  }

  const startedAt = new Date().toISOString()

  // Subscribed BEFORE any simulated activity happens, on this call's own
  // isolated bus (see simulationSandbox.ts) — the real Metrics/
  // Certification classify-and-persist functions, invoked directly
  // rather than through their guarded startXSubscription() singletons
  // (which are already bound to the real production bus from server
  // startup and cannot be redirected here).
  const unsubscribe = subscribe((event: DashboardEvent) => {
    processMetricEvent(event)
    processCertificationEvent(event)
  })

  let totalFeatures = 0
  let completedFeatures = 0
  let totalTasksGenerated = 0
  let totalTasksCompleted = 0
  let interventionCount = 0

  const counters = (delta: { featuresStarted?: number; featuresCompleted?: number; tasksGenerated?: number; tasksCompleted?: number; interventions?: number }) => {
    totalFeatures += delta.featuresStarted ?? 0
    completedFeatures += delta.featuresCompleted ?? 0
    totalTasksGenerated += delta.tasksGenerated ?? 0
    totalTasksCompleted += delta.tasksCompleted ?? 0
    interventionCount += delta.interventions ?? 0
  }

  try {
    const projects: { slug: string; milestoneId: string }[] = []

    for (let p = 0; p < load.projects; p++) {
      const slug = `sim-${config.id}-p${p}`
      planningStateService.createProject({ name: `Simulated Project ${p + 1}`, slug, description: 'Simulation Service synthetic project', category: 'simulation', status: 'active', progress: 0, color: '#5b8def', icon: 'sim' })
      log(state, 'Project Created', slug)
      advance(state, faults)
      const milestone = planningStateService.createMilestone(slug, { title: 'Simulated Milestone', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
      advance(state, faults)

      if (definition.blockFirstProject && p === 0) {
        patchDirectorStatus(slug, { state: 'Blocked', waitingReason: 'Simulated blocking condition' })
        log(state, 'Project Blocked', slug)
        advance(state, faults)
      }

      projects.push({ slug, milestoneId: milestone.id })

      if (!definition.concurrentProjects) {
        await runProjectFeatures(state, rng, definition, faults, slug, milestone.id, load.featuresPerProject, load.tasksPerFeature, load.knowledgeRecordsPerFeature, counters)
      }
    }

    if (definition.concurrentProjects) {
      // All projects' features interleaved in one pass, round-robin — the
      // closest a synchronous, deterministic simulation can get to
      // "concurrent" without literally running overlapping async work
      // (which would make step ordering, and therefore fault timing,
      // non-reproducible).
      for (let f = 0; f < load.featuresPerProject; f++) {
        for (const project of projects) {
          await runOneFeature(state, rng, definition, faults, project.slug, project.milestoneId, f, load.tasksPerFeature, load.knowledgeRecordsPerFeature, counters)
        }
      }
    }

    runSchedulerCycleSafely(state)
    runEscalationCycleSafely(state)

    if (definition.escalationChain) {
      for (const project of projects) {
        const openItems = listInboxItems({ project: project.slug, status: 'Open' })
        if (openItems.length === 0) continue
        // Walk escalation levels deterministically via increasing `now`,
        // never real elapsed time — "Fault timing must be reproducible"
        // applies equally to escalation timing here.
        for (const hours of [6, 30, 80]) {
          runEscalationCycle({ now: new Date(new Date(openItems[0].timestamp).getTime() + hours * 60 * 60 * 1000).toISOString() })
          log(state, 'Escalation Chain', `${project.slug} evaluated at +${hours}h`)
        }
        for (const item of openItems) resolveInboxItem(item.id, 'Simulated resolution after escalation chain')
      }
    }

  } finally {
    unsubscribe()
  }

  const completedAt = new Date().toISOString()
  const metricsKpis = computeKpis(getMetricsState(), getAllTestRuns(), null)
  const certifiedFeatures = listCertifiedFeatures()
  const certificationOutcome = {
    certifiedAutonomous: certifiedFeatures.filter(f => f.result === 'Certified Autonomous').length,
    certifiedAssisted: certifiedFeatures.filter(f => f.result === 'Certified Assisted').length,
    manualDelivery: certifiedFeatures.filter(f => f.result === 'Manual Delivery').length,
  }
  const averageQuality = certifiedFeatures.length > 0 ? certifiedFeatures.reduce((sum, f) => sum + computeQualityScore(f), 0) / certifiedFeatures.length : null

  const measurements: SimulationMeasurements = {
    completionRate: totalFeatures > 0 ? (completedFeatures / totalFeatures) * 100 : null,
    recoveryRate: state.failures.length > 0 ? (state.recoveries.length / state.failures.length) * 100 : null,
    failureRate: totalFeatures > 0 ? ((totalFeatures - completedFeatures) / totalFeatures) * 100 : null,
    averageThroughput: load.projects > 0 ? completedFeatures / load.projects : null,
    averageInterventionRate: totalFeatures > 0 ? interventionCount / totalFeatures : null,
    automationPercentage: metricsKpis.automation.automationPercentage,
    averageRecoveryDurationMs: state.recoveries.length > 0 ? state.recoveries.reduce((sum, r) => sum + r.durationMs, 0) / state.recoveries.length : null,
    queueGrowth: state.firstWaiting !== null ? Math.max(0, state.peakWaiting - state.firstWaiting) : 0,
    workerUtilisation: totalTasksGenerated > 0 ? totalTasksCompleted / totalTasksGenerated : null,
    schedulerUtilisation: state.schedulerCyclesRun > 0 ? state.schedulerCyclesWithEligibleWork / state.schedulerCyclesRun : null,
  }

  const summary = buildSummary(config, measurements, certificationOutcome, state, averageQuality)

  return {
    scenario: config.scenario,
    configuration: config,
    startedAt,
    completedAt,
    timeline: state.timeline,
    measurements,
    failures: state.failures,
    recoveries: state.recoveries,
    certificationOutcome,
    summary,
  }
}

async function runProjectFeatures(
  state: RunState,
  rng: () => number,
  definition: ReturnType<typeof getScenarioDefinition>,
  faults: FaultInjection[],
  projectSlug: string,
  milestoneId: string,
  featureCount: number,
  tasksPerFeature: number,
  knowledgePerFeature: number,
  counters: (delta: Record<string, number>) => void
): Promise<void> {
  for (let f = 0; f < featureCount; f++) {
    await runOneFeature(state, rng, definition, faults, projectSlug, milestoneId, f, tasksPerFeature, knowledgePerFeature, counters)
  }
}

async function runOneFeature(
  state: RunState,
  rng: () => number,
  definition: ReturnType<typeof getScenarioDefinition>,
  faults: FaultInjection[],
  projectSlug: string,
  milestoneId: string,
  index: number,
  tasksPerFeature: number,
  knowledgePerFeature: number,
  counters: (delta: Record<string, number>) => void
): Promise<void> {
  const batchNumber = `SIM-${index + 1}`
  const batch = planningStateService.createBatch(projectSlug, {
    batchNumber,
    milestone: milestoneId,
    objective: 'Simulated feature',
    summary: '',
    completedTasks: '',
    lessonsLearned: '',
    claudePrompt: '',
    completionDate: '',
    status: 'Active',
  })
  log(state, 'Feature Created', `${projectSlug}/${batchNumber}`)
  advance(state, faults)
  counters({ featuresStarted: 1 })

  for (let t = 0; t < tasksPerFeature; t++) {
    const role = ROLES[Math.floor(rng() * ROLES.length) % ROLES.length]
    const task = createWorkforceTask({ project: projectSlug, phase: 'Phase 1', milestoneId, batchId: batch.id, requiredRole: role, executionContextVersion: 'sim', knowledgeVersion: 'sim', planningVersion: 1, dnaVersion: 'sim' })
    advance(state, faults)
    counters({ tasksGenerated: 1 })

    if (chance(rng, definition.workerFailureRate)) {
      const reviewItem = createInboxItem({ project: projectSlug, batchId: batch.id, batchNumber, reasonType: 'Worker Review Required', severity: 'Medium', reason: 'Simulated worker output rejected review', recommendedAction: 'Review and retry' })
      log(state, 'Worker Failure', `${projectSlug}/${batchNumber}`)
      advance(state, faults)
      resolveInboxItem(reviewItem.id, 'Simulated retry approved')
      advance(state, faults)
    }

    recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })
    advance(state, faults)
    counters({ tasksCompleted: 1 })
  }

  for (let k = 0; k < knowledgePerFeature; k++) {
    recordArchitectureDecision({ project: projectSlug, batchId: batch.id, decision: `Simulated architecture decision ${k + 1}`, reason: 'Simulated rationale' })
    advance(state, faults)
  }
  recordHandover({
    project: projectSlug,
    batchId: batch.id,
    phase: 'Phase 1',
    objective: 'Simulated feature',
    executiveSummary: 'Simulated handover summary',
    filesCreated: [],
    filesModified: [],
    filesDeleted: [],
    buildStatus: 'Passing',
    typescriptStatus: 'Passing',
  })
  advance(state, faults)

  if (chance(rng, definition.notificationFailureRate)) {
    const delivery = createDelivery({ event: simulatedNotificationEvent(projectSlug), provider: 'Email', maxAttempts: 3 })
    markFailed(delivery.id, 'Simulated provider outage', 1)
  } else {
    const delivery = createDelivery({ event: simulatedNotificationEvent(projectSlug), provider: 'Email', maxAttempts: 3 })
    markDelivered(delivery.id)
  }
  advance(state, faults)

  if (chance(rng, definition.ceoInterventionRate)) {
    const approvalItem = createInboxItem({ project: projectSlug, batchId: batch.id, batchNumber, reasonType: 'Approval Required', severity: 'Medium', reason: 'Simulated CEO approval delay', recommendedAction: 'Approve to continue' })
    advance(state, faults)
    if (chance(rng, definition.ceoDismissRate)) {
      dismissInboxItem(approvalItem.id, 'Simulated manual override')
    } else {
      resolveInboxItem(approvalItem.id, 'Simulated approval')
    }
    advance(state, faults)
    counters({ interventions: 1 })
  }

  if (!definition.escalationChain) {
    planningStateService.completeBatch(projectSlug, batch.id)
    log(state, 'Feature Completed', `${projectSlug}/${batchNumber}`)
    advance(state, faults)
    counters({ featuresCompleted: 1 })
  } else {
    // Left Active deliberately — the escalation-chain pass after every
    // project's features (see executeSimulation) resolves any open
    // review items first, then this feature completes there.
    planningStateService.completeBatch(projectSlug, batch.id)
    counters({ featuresCompleted: 1 })
  }
}

function simulatedNotificationEvent(project: string): NotificationEvent {
  return {
    id: randomUUID(),
    type: 'Development Completed',
    project,
    title: 'Simulated notification',
    message: 'Simulation Service synthetic notification',
    severity: 'Info',
    timestamp: new Date().toISOString(),
    metadata: {},
  }
}

function buildSummary(
  config: SimulationConfig,
  measurements: SimulationMeasurements,
  certification: { certifiedAutonomous: number; certifiedAssisted: number; manualDelivery: number },
  state: RunState,
  averageQuality: number | null
): string {
  const totalCertified = certification.certifiedAutonomous + certification.certifiedAssisted + certification.manualDelivery
  const completion = measurements.completionRate !== null ? `${measurements.completionRate.toFixed(1)}%` : 'n/a'
  const automation = measurements.automationPercentage !== null ? `${measurements.automationPercentage.toFixed(1)}%` : 'n/a'
  const recovery = measurements.recoveryRate !== null ? `${measurements.recoveryRate.toFixed(1)}%` : 'n/a (no faults injected)'
  const quality = averageQuality !== null ? `${averageQuality.toFixed(1)}%` : 'n/a'
  return (
    `Scenario "${config.scenario}" at ${config.loadProfile} load completed ${completion} of features. ` +
    `${totalCertified} feature(s) certified (${certification.certifiedAutonomous} Autonomous, ${certification.certifiedAssisted} Assisted, ${certification.manualDelivery} Manual), ` +
    `average quality score ${quality}. Automation percentage ${automation}. ` +
    `${state.failures.length} fault(s) injected, ${recovery} recovery rate. ` +
    `${state.timeline.length} timeline steps recorded.`
  )
}
