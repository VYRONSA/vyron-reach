import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { createWorkforceTask, recordWorkforceTaskCompletion } from '../../../lib/dev/director/workforce/workforceTaskStore'
import { publish } from '../../../lib/dev/events/eventBus'
import { computeKpis, getCurrentKpis, getTopProjects, computePlanningAccuracyGauge, startMetricsSubscription, stopMetricsSubscription } from '../../../lib/dev/metrics/metricsService'
import { getMetricsState } from '../../../lib/dev/metrics/metricsStore'
import type { MetricsState } from '../../../lib/dev/metrics/metricsTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  stopMetricsSubscription()
  isolated.cleanup()
})

const EMPTY_STATE: MetricsState = { counters: {}, durations: {}, spans: {}, pendingRiskFlags: {}, lastEventSeq: 0 }

describe('Metrics Service — computeKpis', () => {
  it('renders null averages/percentages when there is no data yet, not NaN or zero', () => {
    const kpis = computeKpis(EMPTY_STATE, [], null)
    expect(kpis.automation.automationPercentage).toBeNull()
    expect(kpis.throughput.averageFeatureDurationMs).toBeNull()
    expect(kpis.testing.averageExecutionDurationMs).toBeNull()
  })

  it('computes automation percentage from autonomous vs manual counters', () => {
    const state: MetricsState = { ...EMPTY_STATE, counters: { 'automation.autonomousDecisions': 9, 'automation.manualOverrides': 1 } }
    const kpis = computeKpis(state, [], null)
    expect(kpis.automation.automationPercentage).toBe(90)
    expect(kpis.automation.ceoInterventionPercentage).toBe(10)
  })

  it('aggregates externally-reported test runs into Testing KPIs', () => {
    const kpis = computeKpis(EMPTY_STATE, [
      { id: '1', timestamp: 't', executed: 10, passed: 9, failed: 1, regressionFailures: 0, durationMs: 1000 },
      { id: '2', timestamp: 't', executed: 20, passed: 18, failed: 2, regressionFailures: 1, durationMs: 3000 },
    ], null)
    expect(kpis.testing.testsExecuted).toBe(30)
    expect(kpis.testing.testsPassed).toBe(27)
    expect(kpis.testing.testsFailed).toBe(3)
    expect(kpis.testing.regressionFailures).toBe(1)
    expect(kpis.testing.averageExecutionDurationMs).toBe(2000)
  })

  it('passes the planning accuracy gauge through unchanged', () => {
    expect(computeKpis(EMPTY_STATE, [], 87.5).quality.planningAccuracyPercentage).toBe(87.5)
  })
})

describe('Metrics Service — computePlanningAccuracyGauge', () => {
  it('is the ratio of completed to total non-archived batches', () => {
    const project = uniqueSlug()
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const b1 = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    planningStateService.createBatch(project, { batchNumber: 'B2', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    planningStateService.completeBatch(project, b1.id)

    expect(computePlanningAccuracyGauge()).toBe(50)
  })

  it('returns null when there are no batches anywhere', () => {
    expect(computePlanningAccuracyGauge()).toBeNull()
  })
})

describe('Metrics Service — getTopProjects', () => {
  it('ranks projects by completed batches + completed tasks', () => {
    const busy = uniqueSlug('busy')
    const quiet = uniqueSlug('quiet')
    planningStateService.createProject({ name: busy, slug: busy, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    planningStateService.createProject({ name: quiet, slug: quiet, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    const m = planningStateService.createMilestone(busy, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const b = planningStateService.createBatch(busy, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    planningStateService.completeBatch(busy, b.id)

    const ranked = getTopProjects(5)
    expect(ranked[0].project).toBe(busy)
    expect(ranked[0].completedBatches).toBe(1)
    expect(ranked.find(p => p.project === quiet)?.activityScore).toBe(0)
  })
})

describe('Metrics Service — live subscription', () => {
  it('startMetricsSubscription processes real events published through the Event Service', async () => {
    startMetricsSubscription()
    const project = uniqueSlug()
    const task = createWorkforceTask({ project, phase: 'Phase 1', milestoneId: null, batchId: 'b1', requiredRole: 'Backend Engineer', executionContextVersion: 'v1', knowledgeVersion: 'v1', planningVersion: 1, dnaVersion: 'v1' })
    recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })

    await waitFor(() => getMetricsState().counters['throughput.tasksCompleted'] === 1)
    expect(getCurrentKpis().throughput.tasksAssigned).toBe(1)
  })

  it('calling startMetricsSubscription twice does not double-subscribe (no duplicate metrics from a doubled listener)', async () => {
    startMetricsSubscription()
    startMetricsSubscription()
    const project = uniqueSlug()
    publish({ category: 'Worker Assignment', project, type: 'task-assigned', payload: { taskId: 'single' } })
    await waitFor(() => getMetricsState().counters['throughput.tasksAssigned'] === 1)
    // If subscribed twice, the single publish above would have been
    // counted twice — proving it stayed at 1 confirms the guard works.
    expect(getMetricsState().counters['throughput.tasksAssigned']).toBe(1)
  })
})
