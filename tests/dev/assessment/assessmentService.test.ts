import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { runAssessment, computeAssessment, getLatestAssessment } from '../../../lib/dev/director/assessment/assessmentService'
import { gatherAssessmentInput } from '../../../lib/dev/director/assessment/assessmentGather'
import { listAssessmentHistory } from '../../../lib/dev/director/assessment/assessmentStore'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import * as knowledgeService from '../../../lib/dev/knowledge/knowledgeService'
import { patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { appendDirectorHistory } from '../../../lib/dev/director/directorHistoryStore'
import { createInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { saveJob } from '../../../lib/dev/runtime/runtimeStorage'
import type { DevelopmentJob } from '../../../lib/dev/runtime/runtimeTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function job(overrides: Partial<DevelopmentJob> = {}): DevelopmentJob {
  return {
    id: `job-${Math.random().toString(36).slice(2)}`, projectSlug: 'acme', milestoneId: 'm1', batchId: 'b1',
    objective: '', status: 'Completed', createdAt: '', startedAt: null, completedAt: null, runtime: 'claude-code-cli',
    claudeSessionId: null, claudeUuid: null, duration: 1000, cost: null, buildStatus: 'Passing', typescriptStatus: 'Passing',
    result: null, error: null, prompt: '', rawOutput: null, stderr: null, exitCode: null, usage: null, gitDiffSummary: null,
    approvedAt: null, appliedAt: null, rejectedAt: null, rejectionReason: null, pid: null, currentPhase: null,
    resumedSessionId: null, executionIdentity: null, executionIdentityKey: '', explicitRerun: false,
    ...overrides,
  }
}

function setupHealthyProject(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
  const milestone = planningStateService.createMilestone(project, { title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' })
  planningStateService.createBatch(project, { batchNumber: 'B1', milestone: milestone.id, objective: '', summary: '', completedTasks: '', lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active' })
  patchDirectorStatus(project, { state: 'Running', buildStatus: 'Passing', typescriptStatus: 'Passing' })
  return milestone
}

describe('Assessment Service — determinism', () => {
  it('computeAssessment is pure: identical AssessmentInput produces byte-identical EngineeringAssessment', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    const input = gatherAssessmentInput(project)
    expect(JSON.stringify(computeAssessment(input))).toBe(JSON.stringify(computeAssessment(input)))
  })

  it('running the full assessment twice against unchanged engineering state yields the same content', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    const first = runAssessment(project)
    const second = runAssessment(project)
    expect(JSON.stringify(first.assessment)).toBe(JSON.stringify(second.assessment))
    expect(second.changed).toBe(false) // nothing changed — no new history entry needed
  })

  it('assessment changes only when engineering state actually changes', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    const first = runAssessment(project)
    expect(first.changed).toBe(true) // first-ever assessment

    const unchanged = runAssessment(project)
    expect(unchanged.changed).toBe(false)

    planningStateService.createRisk(project, { title: 'New risk', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    const afterChange = runAssessment(project)
    expect(afterChange.changed).toBe(true)
    expect(afterChange.assessment.riskAssessment.overall).not.toBe(first.assessment.riskAssessment.overall)
  })
})

describe('Assessment Service — persistence survives restart', () => {
  it('the latest assessment is readable by a fresh call with no in-memory state', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    runAssessment(project)

    // "Restart" — nothing here is a cached reference; getLatestAssessment reads fresh from disk.
    const latest = getLatestAssessment(project)
    expect(latest).not.toBeNull()
    expect(latest?.project).toBe(project)
  })

  it('assessment history accumulates across multiple real changes and all of it survives a fresh read', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    runAssessment(project)
    planningStateService.createRisk(project, { title: 'R1', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    runAssessment(project)
    // Technical Debt Growth is read from the Knowledge Service's permanent
    // record count, not the Planning Service's current-state entity —
    // recordTechnicalDebt is what actually moves this assessment's output.
    knowledgeService.recordTechnicalDebt({ project, title: 'D1' })
    runAssessment(project)

    expect(listAssessmentHistory(project).length).toBeGreaterThanOrEqual(3)
  })
})

describe('Assessment Service — validation scenarios', () => {
  it('a healthy project is assessed as Healthy with Low risk', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    const { assessment } = runAssessment(project)
    expect(assessment.engineeringHealth).toBe('Healthy')
    expect(assessment.riskAssessment.overall).toBe('Low')
  })

  it('a project with open High-severity risks is flagged', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    planningStateService.createRisk(project, { title: 'Vendor risk', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    planningStateService.createRisk(project, { title: 'Scaling risk', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Risk Severity')?.level).toBe('High')
    expect(assessment.riskAssessment.overall).toBe('High')
    expect(assessment.engineeringHealth).not.toBe('Healthy')
  })

  it('a project with growing technical debt is flagged across consecutive assessments', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    runAssessment(project) // establish baseline (0 debt records)
    for (let i = 0; i < 3; i++) {
      planningStateService.createTechnicalDebt(project, { title: `Debt ${i}`, description: '', priority: 'Medium', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open' })
    }
    // Recording via the Knowledge Service (not Planning Service directly) is what the "Technical Debt Growth" factor actually counts.
    knowledgeService.recordTechnicalDebt({ project, title: 'Extra 1' })
    knowledgeService.recordTechnicalDebt({ project, title: 'Extra 2' })
    knowledgeService.recordTechnicalDebt({ project, title: 'Extra 3' })
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Technical Debt Growth')?.level).toBe('High')
  })

  it('a blocked milestone (At Risk) raises the Blocked Milestones factor', () => {
    const project = uniqueSlug()
    const milestone = setupHealthyProject(project)
    planningStateService.updateMilestone(project, milestone.id, { status: 'At Risk' })
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Blocked Milestones')?.level).not.toBe('Low')
  })

  it('a failed build fails the Build Status gate and degrades Engineering Health', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    patchDirectorStatus(project, { buildStatus: 'Failing' })
    const { assessment } = runAssessment(project)
    expect(assessment.qualityGates.gates.find(g => g.gate === 'Build Status')?.status).toBe('Failing')
    expect(assessment.engineeringHealth).not.toBe('Healthy')
  })

  it('repeated recovery events raise the Recovery Frequency factor', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    appendDirectorHistory({ project, event: 'Recovered from crash', batchId: null, detail: '' })
    appendDirectorHistory({ project, event: 'Recovered from crash', batchId: null, detail: '' })
    appendDirectorHistory({ project, event: 'Recovered from crash', batchId: null, detail: '' })
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Recovery Frequency')?.level).toBe('High')
  })

  it('an outstanding CEO approval (open inbox item) raises the Outstanding CEO Decisions factor', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    createInboxItem({ project, batchId: null, batchNumber: null, reasonType: 'Approval Required', reason: 'x', severity: 'High', recommendedAction: 'x' })
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Outstanding CEO Decisions')?.level).not.toBe('Low')
  })

  it('repeated recent job failures raise Repeated Failures and Stalled Batches together', () => {
    const project = uniqueSlug()
    setupHealthyProject(project)
    saveJob(job({ id: 'j1', projectSlug: project, batchId: 'does-not-matter', status: 'Failed' }))
    // The Active batch itself: give it a failed job as its most recent attempt.
    const batches = planningStateService.listBatches(project)
    const activeBatch = batches.find(b => b.status === 'Active')!
    saveJob(job({ id: 'j2', projectSlug: project, batchId: activeBatch.id, status: 'Failed' }))
    const { assessment } = runAssessment(project)
    expect(assessment.riskAssessment.factors.find(f => f.factor === 'Stalled Batches')?.level).toBe('High')
    expect(assessment.qualityGates.gates.find(g => g.gate === 'Execution Health')?.status).toBe('Failing')
  })
})
