import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { createWorkforceTask, recordWorkforceTaskCompletion } from '../../../lib/dev/director/workforce/workforceTaskStore'
import { recordArchitectureDecision, recordHandover } from '../../../lib/dev/knowledge/knowledgeService'
import { createInboxItem, resolveInboxItem, dismissInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { recordTestRun } from '../../../lib/dev/metrics/metricsStore'
import { startCertificationSubscription, stopCertificationSubscription, getProjectCertification, getPlatformCertification, generateEvidencePack } from '../../../lib/dev/certification/certificationService'
import { getFeatureCertificationForBatch, getEvidencePackForFeature } from '../../../lib/dev/certification/certificationStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
  startCertificationSubscription()
})

afterEach(() => {
  stopCertificationSubscription()
  isolated.cleanup()
})

function seedProject(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
}

describe('Certification Service — end-to-end feature certification via real producers', () => {
  it('a fully autonomous batch (no CEO intervention) certifies Autonomous through real events', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })

    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)

    const task = createWorkforceTask({ project, phase: 'Phase 1', milestoneId: m.id, batchId: batch.id, requiredRole: 'Backend Engineer', executionContextVersion: 'v1', knowledgeVersion: 'v1', planningVersion: 1, dnaVersion: 'v1' })
    recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })
    recordArchitectureDecision({ project, batchId: batch.id, decision: 'Use approach X', reason: 'because' })
    recordHandover({
      project,
      batchId: batch.id,
      phase: 'Phase 1',
      objective: 'x',
      executiveSummary: 'x',
      filesCreated: [],
      filesModified: [],
      filesDeleted: [],
      buildStatus: 'Passing',
      typescriptStatus: 'Passing',
    })

    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.tasksCompleted === 1)

    planningStateService.completeBatch(project, batch.id)

    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')
    const record = getFeatureCertificationForBatch(batch.id)!
    expect(record.result).toBe('Certified Autonomous')
    expect(record.architectureCompleted).toBe(true)
    expect(record.documentationGenerated).toBe(1)

    // "Generate a permanent certification package" — automatic on certification.
    await waitFor(() => getEvidencePackForFeature(record.id) !== null)
  })

  it('a batch with a Dismissed CEO intervention certifies Assisted, not Autonomous', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)

    const task = createWorkforceTask({ project, phase: 'Phase 1', milestoneId: m.id, batchId: batch.id, requiredRole: 'Backend Engineer', executionContextVersion: 'v1', knowledgeVersion: 'v1', planningVersion: 1, dnaVersion: 'v1' })
    recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })

    const item = createInboxItem({ project, batchId: batch.id, batchNumber: 'B1', reasonType: 'Worker Review Required', severity: 'Medium', reason: 'needs review', recommendedAction: 'review' })
    dismissInboxItem(item.id, 'Rejected')

    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.manualOverrides === 1)

    planningStateService.completeBatch(project, batch.id)
    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')
    expect(getFeatureCertificationForBatch(batch.id)?.result).toBe('Certified Assisted')
  })
})

describe('Certification Service — project and platform aggregation', () => {
  it('getProjectCertification aggregates only Certified features for that project', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })

    for (let i = 0; i < 3; i++) {
      const batch = planningStateService.createBatch(project, { batchNumber: `B${i}`, milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
      await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)
      const task = createWorkforceTask({ project, phase: 'Phase 1', milestoneId: m.id, batchId: batch.id, requiredRole: 'Backend Engineer', executionContextVersion: 'v1', knowledgeVersion: 'v1', planningVersion: 1, dnaVersion: 'v1' })
      recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })
      await waitFor(() => getFeatureCertificationForBatch(batch.id)?.tasksCompleted === 1)
      planningStateService.completeBatch(project, batch.id)
      await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')
    }

    const summary = getProjectCertification(project)
    expect(summary.totalFeatures).toBe(3)
    expect(summary.certifiedAutonomous).toBe(3)
    expect(summary.automationPercentage).toBe(100)
    expect(summary.averageDeliveryDurationMs).not.toBeNull()
  })

  it('getPlatformCertification only counts features completed within the requested rolling window', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)
    const task = createWorkforceTask({ project, phase: 'Phase 1', milestoneId: m.id, batchId: batch.id, requiredRole: 'Backend Engineer', executionContextVersion: 'v1', knowledgeVersion: 'v1', planningVersion: 1, dnaVersion: 'v1' })
    recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })
    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.tasksCompleted === 1)
    planningStateService.completeBatch(project, batch.id)
    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')

    const now = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days from "now" (real completedAt)
    const within90 = getPlatformCertification('90d', now)
    const within30 = getPlatformCertification('30d', now)
    expect(within90.totalFeatures).toBe(1)
    expect(within30.totalFeatures).toBe(0) // 40 days ago is outside the 30-day window
  })
})

describe('Certification Service — evidence pack generation', () => {
  it('is idempotent — calling it twice for the same feature returns the same saved pack, not a new one', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)
    planningStateService.completeBatch(project, batch.id)
    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')

    const record = getFeatureCertificationForBatch(batch.id)!
    const first = generateEvidencePack(record.id)
    const second = generateEvidencePack(record.id)
    expect(first?.id).toBe(second?.id)
  })

  it('returns null for a feature that is not yet Certified', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)
    const record = getFeatureCertificationForBatch(batch.id)!
    expect(generateEvidencePack(record.id)).toBeNull()
  })

  it('includes real testing summary data from recorded test runs within the feature window', async () => {
    const project = uniqueSlug()
    seedProject(project)
    const m = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
    const batch = planningStateService.createBatch(project, { batchNumber: 'B1', milestone: m.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
    await waitFor(() => getFeatureCertificationForBatch(batch.id) !== null)
    recordTestRun({ executed: 50, passed: 48, failed: 2, regressionFailures: 0, durationMs: 5000 })
    planningStateService.completeBatch(project, batch.id)
    await waitFor(() => getFeatureCertificationForBatch(batch.id)?.status === 'Certified')

    const record = getFeatureCertificationForBatch(batch.id)!
    await waitFor(() => getEvidencePackForFeature(record.id) !== null)
    const pack = getEvidencePackForFeature(record.id)!
    expect(pack.testingSummary.executed).toBe(50)
  })
})
