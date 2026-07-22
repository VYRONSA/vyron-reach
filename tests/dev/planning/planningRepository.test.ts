import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { appendPlanningRecord, applyApprovalDecision, updatePlanningRecord, readPlanningHistory } from '../../../lib/dev/planning/planningRepository'
import { buildPlanningHistoryRecord } from '../../../lib/dev/planning/planningEngine'
import type { ApprovalStatus, EngineeringPlan, PlanningHistoryRecord } from '../../../lib/dev/planning/planningTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makePlan(approvalStatus: ApprovalStatus, overrides: Partial<EngineeringPlan> = {}): EngineeringPlan {
  return {
    id: `plan_${Math.random().toString(36).slice(2)}`,
    projectSlug: 'test-project',
    projectName: 'Test Project',
    generatedAt: new Date().toISOString(),
    objective: 'Ship payments integration.',
    reason: 'Customer commitment.',
    expectedOutcome: 'Payments go live.',
    complexity: 'Medium',
    confidence: 'High',
    estimatedDuration: '2 weeks',
    riskLevel: 'Low',
    dependencies: [],
    acceptanceCriteria: [{ text: 'Payments flow end-to-end in staging.' }],
    tasks: [],
    risk: {
      technical: { level: 'Low', reason: 'x' },
      business: { level: 'Low', reason: 'x' },
      architecture: { level: 'Low', reason: 'x' },
      delivery: { level: 'Low', reason: 'x' },
      overall: { level: 'Low', reason: 'x' },
    },
    effort: { hours: 4, complexity: 'Medium', confidence: 'High', assumptions: [] },
    validation: { valid: true, issues: [] },
    approvalStatus,
    directorReviewNote: null,
    ...overrides,
  }
}

function seedRecord(approvalStatus: ApprovalStatus): PlanningHistoryRecord {
  const plan = makePlan(approvalStatus)
  const record = buildPlanningHistoryRecord(plan)
  appendPlanningRecord(record)
  return record
}

describe('Planning Repository — PRA-P1-008 governance-bypass remediation', () => {
  it('records Approved when the stored plan is actually Director Reviewed', () => {
    const record = seedRecord('Director Reviewed')

    const result = applyApprovalDecision(record.id, 'Approved')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.record.plan.approvalStatus).toBe('Approved')
    expect(result.record.approvalResult).toBe('Approved')
    expect(result.record.plan.tasks.every(t => t.status === 'Approved')).toBe(true)

    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.plan.approvalStatus).toBe('Approved')
  })

  it('records who decided and when — PRA-P1-009', () => {
    const record = seedRecord('Director Reviewed')
    const before = Date.now()

    const result = applyApprovalDecision(record.id, 'Approved')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.record.decidedBy).toBeTruthy()
    expect(result.record.decidedAt).toBeTruthy()
    expect(new Date(result.record.decidedAt!).getTime()).toBeGreaterThanOrEqual(before)
    // decidedAt is distinct from timestamp (generation time), never conflated.
    expect(result.record.decidedAt).not.toBe(result.record.timestamp)

    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.decidedBy).toBe(result.record.decidedBy)
    expect(persisted.decidedAt).toBe(result.record.decidedAt)
  })

  it('leaves decidedBy/decidedAt null when a decision is rejected (never written)', () => {
    const record = seedRecord('Proposed')

    applyApprovalDecision(record.id, 'Approved')

    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.decidedBy).toBeNull()
    expect(persisted.decidedAt).toBeNull()
  })

  it('rejects an Approve/Reject decision against a Proposed plan instead of writing it — the exact bypass PRA-P1-008 found', () => {
    const record = seedRecord('Proposed')

    const result = applyApprovalDecision(record.id, 'Approved')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Proposed/)

    // Nothing was written — a caller that ignored the error can't be misled.
    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.plan.approvalStatus).toBe('Proposed')
    expect(persisted.approvalResult).toBeNull()
  })

  it('rejects a decision against a plan that is already Approved (no re-approval, no downgrade via Reject)', () => {
    const record = seedRecord('Approved')

    const rejected = applyApprovalDecision(record.id, 'Rejected')

    expect(rejected.ok).toBe(false)
    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.plan.approvalStatus).toBe('Approved')
  })

  it('returns ok:false for an unknown record id rather than throwing or creating one', () => {
    const result = applyApprovalDecision('does-not-exist', 'Approved')
    expect(result.ok).toBe(false)
  })

  it('updatePlanningRecord can no longer be used to set an approval outcome — only execution-outcome fields are accepted', () => {
    const record = seedRecord('Proposed')

    // Cast through unknown to simulate a raw HTTP body carrying a field the
    // TypeScript signature no longer exposes — the real attack surface this
    // finding described (a client is not bound by the server's types).
    const smuggled = { approvalResult: 'Approved', executionResult: 'Succeeded' } as unknown as Parameters<typeof updatePlanningRecord>[1]
    const updated = updatePlanningRecord(record.id, smuggled)

    expect(updated).not.toBeNull()
    expect(updated!.plan.approvalStatus).toBe('Proposed') // untouched — plan.approvalStatus was never in reach here
    expect(updated!.executionResult).toBe('Succeeded') // the legitimate field still applies

    const [persisted] = readPlanningHistory(record.projectSlug)
    expect(persisted.plan.approvalStatus).toBe('Proposed')
  })

  it('a partial execution-outcome patch never clobbers fields the caller did not send', () => {
    const record = seedRecord('Approved')
    updatePlanningRecord(record.id, { success: true })
    const afterFirst = updatePlanningRecord(record.id, { actualDurationHours: 6 })

    expect(afterFirst!.success).toBe(true) // still set from the earlier patch
    expect(afterFirst!.actualDurationHours).toBe(6)
  })
})
