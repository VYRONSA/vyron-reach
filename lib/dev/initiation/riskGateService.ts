import { randomUUID } from 'node:crypto'
import * as initiationService from './initiationService'
import { appendRiskGateDecision, findAcceptanceFor, listRiskGateDecisions } from './riskGate'
import { computeProgrammeFingerprint, computeRiskFingerprint } from './initiationGenerationValidation'
import { isDuplicateDecision } from './decisionDebounce'
import { recordTimelineEvent } from '../knowledge/knowledgeService'
import type { GeneratedRiskCandidate, InitiationRequest, RiskGateDecision, RiskGateDecisionType, RiskGateRiskRef } from './initiationTypes'

/**
 * Executive Risk Gate — the mutating orchestrator. Unlike riskGate.ts
 * (pure storage + coverage policy, safe for initiationService.ts to
 * import), this module depends on initiationService.ts for the actual
 * InitiationRequest reads/transitions a decision submission needs, so it
 * is only ever imported by API routes, never by initiationService.ts
 * itself (that would be circular).
 */

const DECISION_TYPES: RiskGateDecisionType[] = ['Accept Risk', 'Mitigate Risk', 'Reject Programme']
const GATED_SEVERITY = 'High'

export type SubmitRiskGateDecisionInput = {
  executive: string
  decision: RiskGateDecisionType
  reason: string
  /** Required (non-empty) for Accept Risk / Mitigate Risk — the risks that decision applies to. Optional for Reject Programme, which applies to the whole programme. */
  riskTempIds: string[]
}

function resolveRisks(
  initiationId: string,
  risks: GeneratedRiskCandidate[],
  tempIds: string[],
  requireHighSeverity: boolean
): RiskGateRiskRef[] {
  const byId = new Map(risks.map(r => [r.tempId, r]))
  return tempIds.map(tempId => {
    const risk = byId.get(tempId)
    if (!risk) throw new initiationService.InitiationRiskGateInputError(initiationId, `riskTempId "${tempId}" does not resolve to any risk in the current reviewed programme.`)
    if (requireHighSeverity && risk.severity !== GATED_SEVERITY) {
      throw new initiationService.InitiationRiskGateInputError(initiationId, `risk "${risk.title}" is severity "${risk.severity}", not "${GATED_SEVERITY}" — the Executive Risk Gate only applies to High-severity risks.`)
    }
    return { tempId: risk.tempId, title: risk.title, fingerprint: computeRiskFingerprint(risk) }
  })
}

/**
 * Submits one Executive Risk Gate decision — the mandatory checkpoint
 * requirement 1 asks for, immediately before Provisioning. Only callable
 * while the InitiationRequest is 'Approved' (the same state
 * beginProvisioning itself requires), so a decision always refers to an
 * unambiguous, already-approved reviewedProgramme.
 *
 * - Accept Risk: recorded permanently; no status change. The next
 *   beginProvisioning call will see this decision cover the targeted
 *   risk(s) (see riskGate.ts's findAcceptanceFor) and let Provisioning
 *   proceed once every High-severity risk is covered.
 * - Mitigate Risk / Reject Programme: recorded permanently, AND the
 *   whole InitiationRequest returns to Review (requirement: "Rejected
 *   programmes return to Review" — Mitigate follows the same path since
 *   the actual mitigation work happens by editing the programme back in
 *   Review, which is exactly what forces the mandatory re-validation
 *   requirement 6 asks for, via Version 1.0's existing "any edit
 *   invalidates the prior validation result" rule).
 */
export function submitRiskGateDecision(id: string, input: SubmitRiskGateDecisionInput): InitiationRequest {
  const current = initiationService.getInitiation(id)
  if (!current) throw new initiationService.InitiationNotFoundError(id)
  if (current.status !== 'Approved') {
    throw new initiationService.InitiationConflictError(id, current.status, ['Approved'])
  }
  if (!DECISION_TYPES.includes(input.decision)) {
    throw new initiationService.InitiationRiskGateInputError(id, `decision must be one of: ${DECISION_TYPES.join(', ')}.`)
  }
  if (!input.reason?.trim()) {
    throw new initiationService.InitiationRiskGateInputError(id, 'reason is required.')
  }
  const programme = current.reviewedProgramme
  if (!programme) throw new initiationService.InitiationRiskGateInputError(id, 'No reviewed programme exists.')

  const isRiskTargeted = input.decision === 'Accept Risk' || input.decision === 'Mitigate Risk'
  if (isRiskTargeted && (!input.riskTempIds || input.riskTempIds.length === 0)) {
    throw new initiationService.InitiationRiskGateInputError(id, `"${input.decision}" requires at least one riskTempId.`)
  }

  const risks = resolveRisks(id, programme.risks, input.riskTempIds ?? [], isRiskTargeted)

  // PRA-P1-014: a double-click or a retried request submitting the exact
  // same decision (type + reason + risk set) within a few seconds is
  // treated as the same decision, not a second one — returns the
  // already-recorded outcome instead of appending a duplicate permanent
  // record. A genuinely different decision (different reason, different
  // risks, or simply later) is never affected by this.
  const riskIdSet = new Set(risks.map(r => r.tempId))
  const sameRiskSet = (other: RiskGateRiskRef[]) => other.length === riskIdSet.size && other.every(r => riskIdSet.has(r.tempId))
  const [mostRecent] = listRiskGateDecisions(id)
  if (
    isDuplicateDecision(mostRecent, d => d.decision === input.decision && d.reason === input.reason.trim() && sameRiskSet(d.risks))
  ) {
    return initiationService.getInitiation(id) ?? current
  }

  const record: RiskGateDecision = {
    id: randomUUID(),
    initiationId: id,
    project: current.project,
    executive: input.executive,
    decidedAt: new Date().toISOString(),
    decision: input.decision,
    reason: input.reason.trim(),
    risks,
    programmeFingerprint: computeProgrammeFingerprint(programme),
  }
  appendRiskGateDecision(record)

  recordTimelineEvent({
    project: current.project,
    source: 'Manual',
    category: 'Risk',
    title: `Executive Risk Gate: ${input.decision}`,
    detail: `${input.executive}: ${record.reason}${risks.length ? ` (risks: ${risks.map(r => r.title).join(', ')})` : ''}`,
  })

  const detail = `${input.decision} by ${input.executive}: ${record.reason}${risks.length ? ` — risk(s): ${risks.map(r => r.title).join(', ')}` : ''}`

  if (input.decision === 'Accept Risk') {
    // PRA-P1-013: recordRiskGateAcceptance now throws (via applyTransition's
    // CAS) rather than returning null on a lost race, so there is no stale
    // `current` fallback to fall back to here — matching returnApprovedToReview
    // just below, which has never had one.
    return initiationService.recordRiskGateAcceptance(id, detail, input.executive)
  }
  return initiationService.returnApprovedToReview(id, input.executive, detail)
}

/** Everything the Risk Gate UI needs in one call: the current unresolved High-severity risks (if any) and the full permanent decision history for this initiation. */
export function getRiskGateStatus(id: string): { unresolvedHighRisks: GeneratedRiskCandidate[]; decisions: RiskGateDecision[] } {
  const current = initiationService.getInitiation(id)
  if (!current) throw new initiationService.InitiationNotFoundError(id)
  const decisions = listRiskGateDecisions(id)
  const programme = current.reviewedProgramme
  const unresolvedHighRisks = programme ? programme.risks.filter(r => r.severity === GATED_SEVERITY).filter(r => !findAcceptanceFor(r, decisions)) : []
  return { unresolvedHighRisks, decisions }
}
