import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { insertIncident, listRollbackControlDecisions, getIncident } from '../../../lib/dev/director/operations/operationsMonitoringStore'
import { submitRollbackControlDecision, IncidentConflictError } from '../../../lib/dev/director/operations/operationsMonitoringService'
import type { Incident } from '../../../lib/dev/director/operations/operationsMonitoringTypes'

/**
 * Wave 4 (Rollback Go/Hold Decision Race) — mirrors
 * tests/dev/director/releaseControlDecisionRace.test.ts exactly, proving
 * submitRollbackControlDecision now carries the identical guarantees
 * submitReleaseControlDecision already proved for Release Management
 * (PRA-P1-026/027): a losing concurrent decision is still permanently
 * recorded (never dropped) and tagged not-effective; a conflict throws
 * with the real current status, never a stale snapshot; disagreeing
 * decisions resolve deterministically with only one ever effective; the
 * normal, non-racing path is unchanged.
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makeRollbackPendingIncident(project: string, overrides: Partial<Incident> = {}): Incident {
  const now = new Date().toISOString()
  const record: Incident = {
    id: `incident_${Math.random().toString(36).slice(2)}`,
    project,
    status: 'RollbackPending',
    severity: 'Critical',
    detectedAt: now,
    resolvedAt: null,
    relatedReleaseId: `release_${Math.random().toString(36).slice(2)}`,
    rollbackTargetReleaseId: `release_${Math.random().toString(36).slice(2)}`,
    checks: [],
    postIncidentReview: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  insertIncident(record)
  return record
}

describe('Rollback Control Decision race (Wave 4)', () => {
  it('a losing concurrent decision is still permanently recorded, tagged as not effective', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    const first = submitRollbackControlDecision(project, incident.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Go first.' })
    expect(first.status).toBe('RollbackApproved')

    // The second submission races against an already-decided incident.
    let secondError: unknown = null
    try {
      submitRollbackControlDecision(project, incident.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Second, losing decision.' })
    } catch (err) {
      secondError = err
    }
    expect(secondError).toBeInstanceOf(IncidentConflictError)

    const decisions = listRollbackControlDecisions(incident.id)
    expect(decisions).toHaveLength(2)
    const winning = decisions.find(d => d.executive === 'ceo-a@test')!
    const losing = decisions.find(d => d.executive === 'ceo-b@test')!
    expect(winning.effective).toBe(true)
    expect(losing.effective).toBe(false)
    // Never silently dropped — the losing decision's content is still on the permanent record.
    expect(losing.reason).toBe('Second, losing decision.')
  })

  it('the conflict error carries the real current status, never a stale pre-mutation snapshot', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    submitRollbackControlDecision(project, incident.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Go first.' })

    try {
      submitRollbackControlDecision(project, incident.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Too late.' })
      expect.fail('expected an IncidentConflictError')
    } catch (err) {
      expect(err).toBeInstanceOf(IncidentConflictError)
      const conflict = err as IncidentConflictError
      // 'RollbackApproved' (the real current status right after the winning Go), never 'RollbackPending' (the stale snapshot).
      expect(conflict.actualStatus).toBe('RollbackApproved')
    }
  })

  it('disagreeing decisions (Go then Hold) still resolve deterministically — only one decision is ever effective', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    const goResult = submitRollbackControlDecision(project, incident.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Approving rollback.' })
    expect(goResult.status).toBe('RollbackApproved')

    expect(() =>
      submitRollbackControlDecision(project, incident.id, { executive: 'ceo-b@test', decision: 'Hold', reason: 'Objecting, too late.' })
    ).toThrow(IncidentConflictError)

    const decisions = listRollbackControlDecisions(incident.id)
    expect(decisions.filter(d => d.effective)).toHaveLength(1)
    expect(decisions.find(d => d.effective)?.decision).toBe('Go')
    expect(getIncident(incident.id)?.status).toBe('RollbackApproved')
  })

  it('a second Go against an already-RollbackApproved incident is rejected, never silently re-approved', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    submitRollbackControlDecision(project, incident.id, { executive: 'ceo-a@test', decision: 'Go', reason: 'Approving.' })

    expect(() =>
      submitRollbackControlDecision(project, incident.id, { executive: 'ceo-b@test', decision: 'Go', reason: 'Duplicate approval attempt.' })
    ).toThrow(IncidentConflictError)

    const decisions = listRollbackControlDecisions(incident.id)
    expect(decisions).toHaveLength(2)
    expect(decisions.filter(d => d.effective)).toHaveLength(1)
  })

  it('a normal, non-racing Hold decision on a RollbackPending incident still succeeds exactly as before', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    const result = submitRollbackControlDecision(project, incident.id, { executive: 'ceo@test', decision: 'Hold', reason: 'Not ready yet.' })

    expect(result.status).toBe('RollbackPending')
    const [decision] = listRollbackControlDecisions(incident.id)
    expect(decision.effective).toBe(true)
  })

  it('a normal, non-racing Go decision on a RollbackPending incident still succeeds exactly as before', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project)

    const result = submitRollbackControlDecision(project, incident.id, { executive: 'ceo@test', decision: 'Go', reason: 'Approved.' })

    expect(result.status).toBe('RollbackApproved')
    const [decision] = listRollbackControlDecisions(incident.id)
    expect(decision.effective).toBe(true)
  })

  it('a decision against an incident not in RollbackPending at all is rejected up front, tagged not effective', () => {
    const project = uniqueSlug()
    const incident = makeRollbackPendingIncident(project, { status: 'Open' })

    expect(() =>
      submitRollbackControlDecision(project, incident.id, { executive: 'ceo@test', decision: 'Go', reason: 'Premature.' })
    ).toThrow(IncidentConflictError)

    const decisions = listRollbackControlDecisions(incident.id)
    expect(decisions).toHaveLength(1)
    expect(decisions[0].effective).toBe(false)
  })
})
