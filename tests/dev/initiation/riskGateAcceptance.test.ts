import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { insertInitiationRequest, getInitiationRequest } from '../../../lib/dev/initiation/initiationStore'
import { computeProgrammeFingerprint } from '../../../lib/dev/initiation/initiationGenerationValidation'
import { recordRiskGateAcceptance, cancelInitiation, InitiationConflictError } from '../../../lib/dev/initiation/initiationService'
import { submitRiskGateDecision } from '../../../lib/dev/initiation/riskGateService'
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

function makeApprovedInitiation(project: string, programme: GeneratedPlanCandidate): InitiationRequest {
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
  }
  insertInitiationRequest(record)
  return record
}

describe('Risk Gate Accept-Risk status CAS — PRA-P1-013', () => {
  it('records an Accept-Risk decision normally against a genuinely Approved initiation', () => {
    const project = seedProject()
    const initiation = makeApprovedInitiation(project, makeProgrammeWithHighRisk())

    const result = recordRiskGateAcceptance(initiation.id, 'Accept Risk by ceo: acceptable.', 'ceo')

    expect(result.status).toBe('Approved') // status itself never changes for Accept Risk
    expect(result.updatedAt).not.toBe(initiation.updatedAt)
  })

  it('refuses to record an Accept-Risk decision against an initiation cancelled moments earlier — the exact gap this finding described', () => {
    const project = seedProject()
    const initiation = makeApprovedInitiation(project, makeProgrammeWithHighRisk())

    cancelInitiation(initiation.id, 'ceo')
    expect(getInitiationRequest(initiation.id)?.status).toBe('Cancelled')

    expect(() => recordRiskGateAcceptance(initiation.id, 'Accept Risk by ceo: too late.', 'ceo')).toThrow(InitiationConflictError)
    // Never silently recorded against the cancelled record.
    expect(getInitiationRequest(initiation.id)?.status).toBe('Cancelled')
  })

  it('submitRiskGateDecision (the full API-facing path) still rejects a cancelled initiation via its own top-of-function check — this fix closes the narrower race that check alone cannot', () => {
    const project = seedProject()
    const programme = makeProgrammeWithHighRisk()
    const initiation = makeApprovedInitiation(project, programme)

    cancelInitiation(initiation.id, 'ceo')

    expect(() =>
      submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Accept Risk', reason: 'Acceptable.', riskTempIds: ['r1'] })
    ).toThrow(InitiationConflictError)
  })

  it('Mitigate Risk (the sibling path) already behaved this way — unchanged by this fix', () => {
    const project = seedProject()
    const programme = makeProgrammeWithHighRisk()
    const initiation = makeApprovedInitiation(project, programme)

    cancelInitiation(initiation.id, 'ceo')

    expect(() =>
      submitRiskGateDecision(initiation.id, { executive: 'ceo', decision: 'Mitigate Risk', reason: 'Needs rework.', riskTempIds: ['r1'] })
    ).toThrow(InitiationConflictError)
  })
})
