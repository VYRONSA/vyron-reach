import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningValidator from '../../../lib/dev/planning/planningValidator'
import { prioritizeTasks } from '../../../lib/dev/planning/planningPrioritizer'
import { applyApprovalDecision, appendPlanningRecord, readPlanningHistory } from '../../../lib/dev/planning/planningRepository'
import { buildPlanningHistoryRecord } from '../../../lib/dev/planning/planningEngine'
import type { ApprovalStatus, EngineeringPlan, EngineeringTask } from '../../../lib/dev/planning/planningTypes'
import { insertInitiationRequest } from '../../../lib/dev/initiation/initiationStore'
import { submitRiskGateDecision } from '../../../lib/dev/initiation/riskGateService'
import { computeProgrammeFingerprint } from '../../../lib/dev/initiation/initiationGenerationValidation'
import type { GeneratedPlanCandidate, InitiationRequest } from '../../../lib/dev/initiation/initiationTypes'
import { insertReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementStore'
import { submitReleaseControlDecision } from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import type { ReleaseRequest, ExecImpl } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'
import { insertIncident } from '../../../lib/dev/director/operations/operationsMonitoringStore'
import { submitRollbackControlDecision } from '../../../lib/dev/director/operations/operationsMonitoringService'
import type { Incident } from '../../../lib/dev/director/operations/operationsMonitoringTypes'

/**
 * PRAT-1 DEF-001 investigation — reported symptom: an Executive submitting
 * a valid Risk Gate decision was rejected with "Invalid Engineering
 * Order...". That exact message is produced by exactly one function in
 * this codebase: planningValidator.ts's validatePlan (via
 * checkInvalidEngineeringOrder), called from exactly one place —
 * planningEngine.ts's plan-generation step, part of the older Planning
 * Engine ("/dev/planning", PlanningCentrePanel.tsx) — never from any of
 * the four executive governance actions.
 *
 * A full trace (UI -> route -> service -> persistence) of all four
 * governance actions named in this investigation — Risk Gate, Release
 * Go/Hold, Rollback Go/Hold, and Planning Approval — found no code path
 * connecting any of them to validatePlan. This suite makes that finding a
 * permanent, enforced invariant rather than a one-time read of the code:
 * every governance action is spied on to prove it never calls
 * validatePlan, and a separate suite proves validatePlan/prioritizeTasks
 * themselves are completely unweakened for genuine Engineering execution.
 *
 * Root cause: NOT REPRODUCIBLE in the current codebase — see the
 * investigation notes above. No production code was changed; this file is
 * the requested regression coverage proving the invariant the report
 * assumed was broken actually already holds, permanently guarded against
 * regressing.
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
  vi.spyOn(planningValidator, 'validatePlan')
})

afterEach(() => {
  vi.restoreAllMocks()
  isolated.cleanup()
})

// ---- Fixtures ----

function makeProgramme(): GeneratedPlanCandidate {
  const milestones = [1, 2, 3].map(n => ({ tempId: `m${n}`, title: `Milestone ${n}`, description: '', phase: 'Phase 1', sequence: n }))
  const batches = milestones.flatMap(m =>
    [1, 2].map(n => ({
      tempId: `${m.tempId}-b${n}`, milestoneRef: m.tempId, batchNumber: `${m.tempId}-B${n}`,
      objective: `Objective ${m.tempId}-${n}`, summary: '', claudePrompt: '', sequence: n,
    }))
  )
  return {
    assessment: {
      summary: 'x', scope: 'x', feasibilityNotes: '', assumptions: [], openQuestions: [],
      estimatedComplexity: 'Medium', recommendedCategory: 'General', knowledgeSourcesConsidered: [],
    },
    milestones, batches,
    risks: [{
      tempId: 'risk-1', title: 'Vendor risk', description: 'x', relatedMilestoneRef: 'm1',
      severity: 'High', probability: 'Medium', mitigation: 'x',
    }],
    dependencies: [],
  }
}

function makeApprovedInitiation(overrides: Partial<InitiationRequest> = {}): InitiationRequest {
  const project = uniqueSlug()
  const programme = makeProgramme()
  const now = new Date().toISOString()
  const fingerprint = computeProgrammeFingerprint(programme)
  const record: InitiationRequest = {
    id: `init_${Math.random().toString(36).slice(2)}`,
    project, directiveTitle: 'x', directiveText: 'x', submittedBy: 'ceo',
    status: 'Approved', generationModel: 'test', generationAttempts: 1, lastGenerationError: null,
    knowledgeDiscovery: null, generatedProgramme: programme, reviewedProgramme: programme, reviewNotes: '',
    reviewValidation: { fingerprint, validatedAt: now, valid: true, reason: null },
    approvedBy: 'ceo', approvedAt: now, approvedProgrammeFingerprint: fingerprint,
    provisionResult: null, provisioningError: null, cancelledBy: null, cancelledAt: null,
    createdAt: now, updatedAt: now, ...overrides,
  }
  insertInitiationRequest(record)
  return record
}

function makePreparedRelease(overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  const project = uniqueSlug()
  const now = new Date().toISOString()
  const record: ReleaseRequest = {
    id: `release_${Math.random().toString(36).slice(2)}`, project, status: 'Prepared', version: '1.0.1', notes: '',
    branchName: `autonomous-release/${project}/v1.0.1`, commitSha: null, prUrl: null, deploymentUrl: null,
    preparationReport: { activities: [], passed: true, runAt: now, durationMs: 0 }, executionReport: null,
    createdAt: now, updatedAt: now, ...overrides,
  }
  insertReleaseRequest(record)
  return record
}

function makeRollbackPendingIncident(overrides: Partial<Incident> = {}): Incident {
  const project = uniqueSlug()
  const now = new Date().toISOString()
  const record: Incident = {
    id: `incident_${Math.random().toString(36).slice(2)}`, project, status: 'RollbackPending', severity: 'Critical',
    detectedAt: now, resolvedAt: null, relatedReleaseId: `release_${Math.random().toString(36).slice(2)}`,
    rollbackTargetReleaseId: `release_${Math.random().toString(36).slice(2)}`, checks: [], postIncidentReview: null,
    createdAt: now, updatedAt: now, ...overrides,
  }
  insertIncident(record)
  return record
}

function makePlan(approvalStatus: ApprovalStatus, overrides: Partial<EngineeringPlan> = {}): EngineeringPlan {
  return {
    id: `plan_${Math.random().toString(36).slice(2)}`, projectSlug: 'test-project', projectName: 'Test Project',
    generatedAt: new Date().toISOString(), objective: 'Ship it.', reason: 'x', expectedOutcome: 'x',
    complexity: 'Medium', confidence: 'High', estimatedDuration: '2 weeks', riskLevel: 'Low',
    dependencies: [], acceptanceCriteria: [{ text: 'x' }], tasks: [],
    risk: {
      technical: { level: 'Low', reason: 'x' }, business: { level: 'Low', reason: 'x' },
      architecture: { level: 'Low', reason: 'x' }, delivery: { level: 'Low', reason: 'x' }, overall: { level: 'Low', reason: 'x' },
    },
    effort: { hours: 4, complexity: 'Medium', confidence: 'High', assumptions: [] },
    validation: { valid: true, issues: [] },
    approvalStatus, directorReviewNote: null, ...overrides,
  }
}

const noopExec: ExecImpl = async () => ({ code: 0, stdout: '', stderr: '' })

// ---- The actual investigation: does any governance action call validatePlan? ----

describe('DEF-001 — governance actions never invoke Engineering Sequence validation', () => {
  it('Risk Gate: Accept Risk succeeds and never calls validatePlan', () => {
    const initiation = makeApprovedInitiation()
    const result = submitRiskGateDecision(initiation.id, {
      executive: 'ceo', decision: 'Accept Risk', reason: 'Acceptable given mitigation.', riskTempIds: ['risk-1'],
    })
    expect(result.status).toBe('Approved')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Risk Gate: Mitigate Risk succeeds and never calls validatePlan', () => {
    const initiation = makeApprovedInitiation()
    const result = submitRiskGateDecision(initiation.id, {
      executive: 'ceo', decision: 'Mitigate Risk', reason: 'Needs rework.', riskTempIds: ['risk-1'],
    })
    expect(result.status).toBe('Review')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Risk Gate: Reject Programme succeeds and never calls validatePlan', () => {
    const initiation = makeApprovedInitiation()
    const result = submitRiskGateDecision(initiation.id, {
      executive: 'ceo', decision: 'Reject Programme', reason: 'Not viable.', riskTempIds: [],
    })
    expect(result.status).toBe('Review')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Release Go/Hold: a Go decision succeeds and never calls validatePlan', () => {
    const release = makePreparedRelease()
    const result = submitReleaseControlDecision(release.project, release.id, { executive: 'ceo', decision: 'Go', reason: 'Ship it.' }, isolated.dir, noopExec)
    expect(result.status).toBe('Releasing')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Release Go/Hold: a Hold decision succeeds and never calls validatePlan', () => {
    const release = makePreparedRelease()
    const result = submitReleaseControlDecision(release.project, release.id, { executive: 'ceo', decision: 'Hold', reason: 'Not yet.' })
    expect(result.status).toBe('Held')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Rollback Go/Hold: a Go decision succeeds and never calls validatePlan', () => {
    const incident = makeRollbackPendingIncident()
    const result = submitRollbackControlDecision(incident.project, incident.id, { executive: 'ceo', decision: 'Go', reason: 'Approved.' })
    expect(result.status).toBe('RollbackApproved')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Rollback Go/Hold: a Hold decision succeeds and never calls validatePlan', () => {
    const incident = makeRollbackPendingIncident()
    const result = submitRollbackControlDecision(incident.project, incident.id, { executive: 'ceo', decision: 'Hold', reason: 'Waiting.' })
    expect(result.status).toBe('RollbackPending')
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Planning Approval: an Approved decision succeeds and never re-calls validatePlan at decision time', () => {
    const plan = makePlan('Director Reviewed')
    const record = buildPlanningHistoryRecord(plan)
    appendPlanningRecord(record)

    const result = applyApprovalDecision(record.id, 'Approved')

    expect(result.ok).toBe(true)
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()
  })

  it('Planning Approval: a Rejected decision succeeds and never re-calls validatePlan at decision time', () => {
    const plan = makePlan('Director Reviewed')
    const record = buildPlanningHistoryRecord(plan)
    appendPlanningRecord(record)

    const result = applyApprovalDecision(record.id, 'Rejected')

    expect(result.ok).toBe(true)
    expect(planningValidator.validatePlan).not.toHaveBeenCalled()

    const [persisted] = readPlanningHistory(plan.projectSlug)
    expect(persisted.plan.approvalStatus).toBe('Rejected')
  })
})

// ---- The other half of the requirement: prove the validator is NOT weakened for real Engineering execution ----

describe('DEF-001 — Engineering Sequence validation remains fully enforced for genuine Engineering execution', () => {
  function makeTask(overrides: Partial<EngineeringTask> = {}): EngineeringTask {
    return {
      id: 't1', title: 'Add rate limiting', description: '', reason: '', estimatedHours: 4, complexity: 'Medium',
      dependencies: [], priority: 'Medium', priorityReason: '', status: 'Proposed',
      acceptanceCriteria: [{ text: 'x' }], engineeringSequence: null, source: 'Manual', ...overrides,
    }
  }

  const facts = {
    readmeExists: true, agentsFileExists: true, authFileExists: false, nextConfigExists: true, envLocalExists: false,
    packageManager: 'npm', frameworks: [] as string[], languages: [] as string[], filesScanned: 0, totalLines: 0,
    moduleCount: 0, componentCount: 0, apiCount: 0, cachingUsageCount: 0, supabaseConfigured: false, openaiDependency: false,
    hasLintScript: true, testFileCount: 0,
  }

  it('prioritizeTasks still demotes a task scheduled far ahead of the current Engineering Sequence position, with a real "Sequence violation" reason', () => {
    // Security (position 8) proposed while the project is still at Foundation (position 1) — a genuine, large gap.
    const attrs = prioritizeTasks(
      [{ id: 't1', title: 'Add rate limiting', description: '', reason: '', status: 'Proposed', acceptanceCriteria: [{ text: 'x' }], engineeringSequence: 8, source: 'Manual', sourceSeverity: null }],
      1
    )
    const result = attrs.get('t1')!
    expect(result.priority).toBe('Low')
    expect(result.priorityReason).toMatch(/^Sequence violation:/)
  })

  it('validatePlan still reports "Invalid Engineering Order" for a task carrying a real sequence-violation reason — the validator itself is unweakened', () => {
    vi.mocked(planningValidator.validatePlan).mockRestore() // this describe block tests the REAL function, not the spy from the outer beforeEach

    const task = makeTask({ engineeringSequence: 8, priorityReason: 'Sequence violation: "Security" is position 8 in the Engineering Sequence, but the project is currently at position 1.' })
    const plan = makePlan('Proposed', { tasks: [task] })

    const result = planningValidator.validatePlan(plan, [], facts)

    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.type === 'Invalid Engineering Order' && i.taskId === 't1')).toBe(true)
  })

  it('validatePlan reports no Invalid Engineering Order issue for a task genuinely at (or before) the current position', () => {
    vi.mocked(planningValidator.validatePlan).mockRestore()

    const task = makeTask({ engineeringSequence: 1, priorityReason: 'Matches the project\'s current Engineering Sequence position (1).' })
    const plan = makePlan('Proposed', { tasks: [task] })

    const result = planningValidator.validatePlan(plan, [], facts)

    expect(result.issues.some(i => i.type === 'Invalid Engineering Order')).toBe(false)
  })
})
