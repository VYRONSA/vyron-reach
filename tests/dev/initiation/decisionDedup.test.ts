import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { insertInitiationRequest } from '../../../lib/dev/initiation/initiationStore'
import { computeProgrammeFingerprint } from '../../../lib/dev/initiation/initiationGenerationValidation'
import { listRiskGateDecisions } from '../../../lib/dev/initiation/riskGate'
import { listExecutiveControlDecisions } from '../../../lib/dev/initiation/executiveControl'
import { getDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { submitRiskGateDecision } from '../../../lib/dev/initiation/riskGateService'
import { submitExecutiveControlDecision } from '../../../lib/dev/initiation/executiveControlService'
import type { GeneratedPlanCandidate, InitiationRequest } from '../../../lib/dev/initiation/initiationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makeProgrammeWithHighRisk(): GeneratedPlanCandidate {
  const milestones = [1, 2, 3].map(n => ({ tempId: `m${n}`, title: `Milestone ${n}`, description: '', phase: 'Phase 1', sequence: n }))
  const batches = milestones.flatMap(m =>
    [1, 2].map(n => ({
      tempId: `${m.tempId}-b${n}`, milestoneRef: m.tempId, batchNumber: `${m.tempId}-B${n}`,
      objective: `Objective ${m.tempId}-${n}`, summary: '', claudePrompt: '', sequence: n,
    }))
  )
  return {
    assessment: {
      summary: 'Summary', scope: 'Scope', feasibilityNotes: '', assumptions: [], openQuestions: [],
      estimatedComplexity: 'Medium', recommendedCategory: 'General', knowledgeSourcesConsidered: [],
    },
    milestones,
    batches,
    risks: [{ tempId: 'r1', title: 'Vendor risk', description: 'x', relatedMilestoneRef: '', severity: 'High', probability: 'Medium', mitigation: '' }],
    dependencies: [],
  }
}

function seedProject(): string {
  const slug = uniqueSlug()
  planningStateService.createProject({ name: slug, slug, description: '', category: 'test', status: 'planning', progress: 0, color: '#000', icon: 'x' })
  return slug
}

/** For the Go-decision tests only: a real, already-Complete batch in the Planning Service (separate from the InitiationRequest's own reviewedProgramme, which attemptHandoff never reads) so the real Director loop it triggers reaches 'Completed' quickly instead of searching indefinitely for a batch to run. */
function seedProjectWithCompletedWork(): string {
  const slug = seedProject()
  const m = planningStateService.createMilestone(slug, {
    title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 100, status: 'Complete', sequence: 1,
  })
  planningStateService.createBatch(slug, {
    batchNumber: 'B1', milestone: m.id, objective: 'x', summary: '', completedTasks: '', lessonsLearned: '',
    claudePrompt: '', completionDate: '', status: 'Complete', sequence: 1,
  })
  return slug
}

function baseInitiation(project: string, programme: GeneratedPlanCandidate, status: InitiationRequest['status']): InitiationRequest {
  const now = new Date().toISOString()
  const fingerprint = computeProgrammeFingerprint(programme)
  const record: InitiationRequest = {
    id: `init_${Math.random().toString(36).slice(2)}`,
    project,
    directiveTitle: 'Ship the thing',
    directiveText: 'Ship the thing.',
    submittedBy: 'ceo',
    status,
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
    provisionResult: status === 'Provisioned' ? { milestoneIdByTempId: {}, batchIdByTempId: {}, riskIds: [], dependencyIds: [] } : null,
    provisioningError: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  }
  insertInitiationRequest(record)
  return record
}

describe('Risk Gate decision de-duplication — PRA-P1-014', () => {
  it('a double-click submitting the identical Accept Risk decision twice records it only once', () => {
    const project = seedProject()
    const programme = makeProgrammeWithHighRisk()
    const initiation = baseInitiation(project, programme, 'Approved')

    submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Accept Risk', reason: 'Acceptable for now.', riskTempIds: ['r1'] })
    submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Accept Risk', reason: 'Acceptable for now.', riskTempIds: ['r1'] })

    expect(listRiskGateDecisions(initiation.id)).toHaveLength(1)
  })

  it('a genuinely different decision (different reason) for the same risk is never deduped', () => {
    const project = seedProject()
    const programme = makeProgrammeWithHighRisk()
    const initiation = baseInitiation(project, programme, 'Approved')

    submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Accept Risk', reason: 'First reasoning.', riskTempIds: ['r1'] })
    // A genuinely later, distinct decision must still be recorded even though it targets the same risk.
    submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Accept Risk', reason: 'Updated reasoning after further review.', riskTempIds: ['r1'] })

    expect(listRiskGateDecisions(initiation.id)).toHaveLength(2)
  })
})

describe('Executive Go/Hold decision de-duplication — PRA-P1-014', () => {
  it('a double-click submitting the identical Hold decision twice records it only once', () => {
    const project = seedProject()
    const initiation = baseInitiation(project, makeProgrammeWithHighRisk(), 'Provisioned')

    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Hold', reason: 'Not ready.' })
    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Hold', reason: 'Not ready.' })

    expect(listExecutiveControlDecisions(initiation.id)).toHaveLength(1)
  })

  it('a double-click submitting the identical Go decision twice records it only once (handoff itself is separately idempotent)', async () => {
    const project = seedProjectWithCompletedWork()
    const initiation = baseInitiation(project, makeProgrammeWithHighRisk(), 'Provisioned')

    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Go', reason: 'Approved.' })
    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Go', reason: 'Approved.' })

    expect(listExecutiveControlDecisions(initiation.id)).toHaveLength(1)
    // Let the fire-and-forget handoff's loop settle before the test ends, so
    // no async work outlives this test's isolated data directory.
    await waitFor(() => getDirectorStatus(project).state === 'Completed')
  })

  it('a later Hold after an earlier Go is never deduped — they are genuinely different decisions', async () => {
    const project = seedProjectWithCompletedWork()
    const initiation = baseInitiation(project, makeProgrammeWithHighRisk(), 'Provisioned')

    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Go', reason: 'Approved.' })
    await waitFor(() => getDirectorStatus(project).state === 'Completed')
    submitExecutiveControlDecision(initiation.id, { executive: 'ceo', decision: 'Hold', reason: 'Actually, hold off.' })

    expect(listExecutiveControlDecisions(initiation.id)).toHaveLength(2)
  })
})
