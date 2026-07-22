import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { computeRiskFingerprint } from './initiationGenerationValidation'
import type { GeneratedRiskCandidate, RiskGateDecision } from './initiationTypes'

/**
 * Executive Risk Gate — storage plus pure coverage policy, deliberately
 * free of any dependency on initiationService.ts. beginProvisioning
 * (initiationService.ts) imports this module directly to enforce the
 * gate; the mutating orchestration that also needs to move an
 * InitiationRequest between statuses lives in riskGateService.ts instead
 * (which does depend on initiationService.ts) — this split is what keeps
 * "initiationService -> riskGate -> (nothing)" acyclic while still
 * letting riskGateService -> initiationService for the Mitigate/Reject
 * transition back to Review.
 *
 * Decisions are append-only and never mutated or deleted — this is the
 * permanent governance history the requirement asks for. High severity is
 * the gated tier: see initiationTypes.ts's RiskGateDecisionType doc
 * comment for why "Critical" isn't a separate level here.
 */

const FILE = 'initiation-risk-gate-decisions.json'
const GATED_SEVERITY = 'High'

export function appendRiskGateDecision(decision: RiskGateDecision): RiskGateDecision {
  updateJsonStore<RiskGateDecision[]>(FILE, [], current => [decision, ...current])
  return decision
}

export function listRiskGateDecisions(initiationId: string): RiskGateDecision[] {
  return readJsonStore<RiskGateDecision[]>(FILE, []).filter(d => d.initiationId === initiationId)
}

/** The most recent 'Accept Risk' decision whose recorded risk entry for `risk.tempId` still matches `risk`'s CURRENT content — null if none (never decided, decided some other way, or decided against since-edited content). */
export function findAcceptanceFor(risk: GeneratedRiskCandidate, decisions: RiskGateDecision[]): RiskGateDecision | null {
  const fingerprint = computeRiskFingerprint(risk)
  const accepted = decisions
    .filter(d => d.decision === 'Accept Risk')
    .filter(d => d.risks.some(r => r.tempId === risk.tempId && r.fingerprint === fingerprint))
  if (accepted.length === 0) return null
  return [...accepted].sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))[0]
}

/**
 * Every High-severity risk in `risks` that does NOT have a covering
 * 'Accept Risk' decision against its current content — this is exactly
 * what beginProvisioning refuses to proceed past, and exactly what the
 * Risk Gate UI shows as "needs a decision." 'Mitigate Risk' and 'Reject
 * Programme' deliberately never count as coverage: both instead route the
 * whole InitiationRequest back to Review (see riskGateService.ts), which
 * is what actually blocks Provisioning for those two paths — a stale
 * Mitigate/Reject decision sitting in history must never be mistaken for
 * "this risk is now fine to provision."
 */
export function findUnresolvedHighRisks(risks: GeneratedRiskCandidate[], decisions: RiskGateDecision[]): GeneratedRiskCandidate[] {
  return risks.filter(r => r.severity === GATED_SEVERITY).filter(r => !findAcceptanceFor(r, decisions))
}
