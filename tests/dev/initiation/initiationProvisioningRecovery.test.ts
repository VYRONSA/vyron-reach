import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { insertInitiationRequest, getInitiationRequest } from '../../../lib/dev/initiation/initiationStore'
import { computeProgrammeFingerprint } from '../../../lib/dev/initiation/initiationGenerationValidation'
import { runProvisioning, resumeStuckProvisioning, startProvisioning } from '../../../lib/dev/initiation/initiationProvisioningService'
import type { GeneratedPlanCandidate, InitiationRequest } from '../../../lib/dev/initiation/initiationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

/** A minimal but structurally valid programme: 3 milestones, 2 batches each — satisfies initiationGenerationValidation.ts's 3-8 milestone / 2-6 batch-per-milestone rules with no risks/dependencies. */
function makeProgramme(): GeneratedPlanCandidate {
  const milestones = [1, 2, 3].map(n => ({
    tempId: `m${n}`,
    title: `Milestone ${n}`,
    description: '',
    phase: 'Phase 1',
    sequence: n,
  }))
  const batches = milestones.flatMap(m =>
    [1, 2].map(n => ({
      tempId: `${m.tempId}-b${n}`,
      milestoneRef: m.tempId,
      batchNumber: `${m.tempId}-B${n}`,
      objective: `Objective for ${m.tempId} batch ${n}`,
      summary: '',
      claudePrompt: '',
      sequence: n,
    }))
  )
  return {
    assessment: {
      summary: 'Summary',
      scope: 'Scope',
      feasibilityNotes: '',
      assumptions: [],
      openQuestions: [],
      estimatedComplexity: 'Medium',
      recommendedCategory: 'General',
      knowledgeSourcesConsidered: [],
    },
    milestones,
    batches,
    risks: [],
    dependencies: [],
  }
}

function seedProject(): string {
  const slug = uniqueSlug()
  planningStateService.createProject({
    name: slug, slug, description: '', category: 'test', status: 'planning', progress: 0, color: '#000', icon: 'x',
  })
  return slug
}

/** Builds an InitiationRequest already Approved, ready for beginProvisioning to accept it. */
function makeApprovedInitiation(project: string, programme: GeneratedPlanCandidate, overrides: Partial<InitiationRequest> = {}): InitiationRequest {
  const now = new Date().toISOString()
  const fingerprint = computeProgrammeFingerprint(programme)
  const record: InitiationRequest = {
    id: `init_${Math.random().toString(36).slice(2)}`,
    project,
    directiveTitle: 'Ship the thing',
    directiveText: 'Ship the thing.',
    submittedBy: 'ceo',
    status: 'Approved',
    generationModel: 'test-model',
    generationAttempts: 1,
    lastGenerationError: null,
    knowledgeDiscovery: null,
    generatedProgramme: programme,
    reviewedProgramme: programme,
    reviewNotes: '',
    reviewValidation: { fingerprint, validatedAt: now, valid: true, reason: null },
    approvedBy: 'ceo',
    approvedAt: now,
    approvedProgrammeFingerprint: fingerprint,
    provisionResult: null,
    provisioningError: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  insertInitiationRequest(record)
  return record
}

describe('Provisioning crash recovery — PRA-P1-015', () => {
  it('runProvisioning resumes cleanly from Approved through to Provisioned (the normal path still works)', async () => {
    const project = seedProject()
    const programme = makeProgramme()
    const initiation = makeApprovedInitiation(project, programme)

    const result = await runProvisioning(initiation.id)

    expect(result.status).toBe('Provisioned')
    expect(planningStateService.listMilestones(project)).toHaveLength(3)
    expect(planningStateService.listBatches(project)).toHaveLength(6)
  })

  it('a record left stuck in Provisioning by a simulated crash is resumable via runProvisioning, without duplicating already-committed milestones/batches', async () => {
    const project = seedProject()
    const programme = makeProgramme()

    // Simulate "the crash happened after milestone m1 and its first batch were
    // already committed to the Planning Service, but before the rest" — this
    // is exactly the durable state provisionProgramme's own
    // recordProvisionProgress calls would have left behind.
    const m1 = planningStateService.createMilestone(project, {
      title: 'Milestone 1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming', sequence: 1,
    })
    const b1 = planningStateService.createBatch(project, {
      batchNumber: 'm1-B1', milestone: m1.id, objective: 'x', summary: '', completedTasks: '', lessonsLearned: '',
      claudePrompt: '', completionDate: '', status: 'Queued', sequence: 1,
    })

    const initiation = makeApprovedInitiation(project, programme, {
      status: 'Provisioning', // the crash left it here — beginProvisioning previously could never accept this
      provisionResult: {
        milestoneIdByTempId: { m1: m1.id },
        batchIdByTempId: { 'm1-b1': b1.id },
        riskIds: [],
        dependencyIds: [],
      },
    })

    // Before the fix, this would throw InitiationConflictError('Provisioning' not in allowedFrom) forever.
    const result = await runProvisioning(initiation.id)

    expect(result.status).toBe('Provisioned')
    // Exactly 3 milestones and 6 batches total — the pre-existing m1/b1 were
    // reused (matched by tempId), never recreated as duplicates.
    expect(planningStateService.listMilestones(project)).toHaveLength(3)
    expect(planningStateService.listBatches(project)).toHaveLength(6)
    expect(planningStateService.listMilestones(project).filter(m => m.title === 'Milestone 1')).toHaveLength(1)
  })

  it('resumeStuckProvisioning finds and completes every record stuck in Provisioning, and leaves non-stuck records untouched', async () => {
    const stuckProject = seedProject()
    const programme = makeProgramme()
    const stuck = makeApprovedInitiation(stuckProject, programme, { status: 'Provisioning', provisionResult: null })

    const approvedProject = seedProject()
    const notStuck = makeApprovedInitiation(approvedProject, makeProgramme(), { status: 'Approved' })

    const { resumed, failed } = await resumeStuckProvisioning()

    expect(resumed).toEqual([stuck.id])
    expect(failed).toEqual([])
    expect(getInitiationRequest(stuck.id)?.status).toBe('Provisioned')
    // Untouched — resumeStuckProvisioning only ever acts on 'Provisioning' records.
    expect(getInitiationRequest(notStuck.id)?.status).toBe('Approved')
  })

  it('resumeStuckProvisioning is a no-op when nothing is stuck', async () => {
    const { resumed, failed } = await resumeStuckProvisioning()
    expect(resumed).toEqual([])
    expect(failed).toEqual([])
  })
})

describe('Provisioning is non-blocking — PRA-P1-016', () => {
  it('startProvisioning returns immediately with the in-progress record, and the work completes asynchronously afterward', async () => {
    const project = seedProject()
    const programme = makeProgramme()
    const initiation = makeApprovedInitiation(project, programme)

    const started = startProvisioning(initiation.id)

    // Returned synchronously — the 'Provisioning' transition, not the terminal outcome.
    expect(started.status).toBe('Provisioning')
    // Nothing committed to the Planning Service yet at the instant the call returns.
    expect(planningStateService.listMilestones(project)).toHaveLength(0)

    await waitFor(() => getInitiationRequest(initiation.id)?.status === 'Provisioned', {
      message: 'startProvisioning never completed its background work',
    })

    expect(planningStateService.listMilestones(project)).toHaveLength(3)
    expect(planningStateService.listBatches(project)).toHaveLength(6)
  })

  it('startProvisioning still enforces every beginProvisioning precondition synchronously (e.g. rejects a stale approved-programme fingerprint)', () => {
    const project = seedProject()
    const programme = makeProgramme()
    const initiation = makeApprovedInitiation(project, programme, { approvedProgrammeFingerprint: 'stale-fingerprint' })

    expect(() => startProvisioning(initiation.id)).toThrow()
    // Never entered 'Provisioning' — the precondition failure happened before any state change.
    expect(getInitiationRequest(initiation.id)?.status).toBe('Approved')
  })
})
