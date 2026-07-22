import type { RiskLevel } from '../planningState/planningStateTypes'
import type { KnowledgeSourceType, KnowledgeItem, KnowledgeGap } from '../knowledge/organisationalKnowledgeTypes'

export type { RiskLevel }
/**
 * Relocated to lib/dev/knowledge/organisationalKnowledgeTypes.ts so the
 * Director's Engineering Intelligence pipeline
 * (lib/dev/director/engineeringIntelligence/) can share the exact same
 * item/gap shape as Initiation's own Knowledge Discovery, instead of a
 * second, incompatible one. Re-exported here so every existing import
 * of these three types from this file keeps working unchanged.
 */
export type { KnowledgeSourceType, KnowledgeItem, KnowledgeGap }

/**
 * Project Initiation & Autonomous Delivery Orchestration — the mandatory
 * entry point that turns a single free-text Executive Directive into a
 * reviewed, approved engineering programme (milestones, delivery batches,
 * risks, dependencies) before handing off into the existing autonomous
 * execution loop (serverExecutionLoop.ts). See
 * lib/dev/initiation/initiationService.ts for the state machine this type
 * supports.
 */
export type InitiationStatus =
  | 'Draft'
  | 'Generating'
  | 'GenerationFailed'
  | 'Review'
  | 'Approved'
  | 'Provisioning'
  | 'Provisioned'
  | 'ProvisioningFailed'
  | 'Cancelled'

/** tempId -> real Planning Service id, recorded as each record is actually created — lets a retried provisioning run skip anything it already committed instead of duplicating it. */
export type ProvisionResult = {
  milestoneIdByTempId: Record<string, string>
  batchIdByTempId: Record<string, string>
  riskIds: string[]
  dependencyIds: string[]
}

export type InitiationAssessment = {
  summary: string
  scope: string
  feasibilityNotes: string
  assumptions: string[]
  openQuestions: string[]
  estimatedComplexity: 'Low' | 'Medium' | 'High' | 'Very High'
  recommendedCategory: string
  /**
   * Source labels (KnowledgeItem.sourceRef / a short human-readable tag)
   * the model says it actually drew on — required (may be an empty array
   * when Knowledge Discovery found nothing usable), so every generated
   * assessment carries an explicit, structurally-present answer to "what
   * organisational knowledge informed this?" rather than leaving
   * attribution as something only this process's own logs can answer.
   */
  knowledgeSourcesConsidered: string[]
}

export type GeneratedMilestoneCandidate = {
  /** Stable only within one GeneratedPlanCandidate — never a real Milestone id. */
  tempId: string
  title: string
  description: string
  phase: string
  sequence: number
  /** Optional — which retrieved knowledge (if any) specifically informed this milestone. Absent/empty is legitimate for genuinely greenfield work. */
  sourceRefs?: string[]
}

export type GeneratedBatchCandidate = {
  tempId: string
  /** A GeneratedMilestoneCandidate.tempId within the same candidate. */
  milestoneRef: string
  batchNumber: string
  /** Load-bearing: this is what serverContextBuilder.ts's buildServerAutonomousPrompt actually feeds the autonomous worker — not claudePrompt below. */
  objective: string
  summary: string
  /** Kept only for schema parity with the existing manually-authored Batch type; the autonomous loop does not read this field. */
  claudePrompt: string
  sequence: number
  /** Optional — which retrieved knowledge (if any) specifically informed this batch. */
  sourceRefs?: string[]
}

export type GeneratedRiskCandidate = {
  /** Stable only within one GeneratedPlanCandidate — never a real Risk id. Required so an Executive Risk Gate decision (riskGate.ts) can reference a specific risk unambiguously, the same way batches reference milestones. */
  tempId: string
  title: string
  description: string
  /** A GeneratedMilestoneCandidate.tempId, or '' if not tied to a specific milestone. */
  relatedMilestoneRef: string
  severity: RiskLevel
  probability: RiskLevel
  mitigation: string
  /** Optional — which retrieved knowledge (if any) specifically informed this risk. */
  sourceRefs?: string[]
}

export type GeneratedDependencyCandidate = {
  fromType: 'milestone' | 'batch'
  fromRef: string
  toType: 'milestone' | 'batch'
  toRef: string
  note: string
}

export type GeneratedPlanCandidate = {
  assessment: InitiationAssessment
  milestones: GeneratedMilestoneCandidate[]
  batches: GeneratedBatchCandidate[]
  risks: GeneratedRiskCandidate[]
  dependencies: GeneratedDependencyCandidate[]
}

/**
 * The result of the most recent validator run against `reviewedProgramme`.
 * `fingerprint` identifies exactly which version of the programme was
 * checked (see initiationGenerationValidation.ts's
 * computeProgrammeFingerprint) — this is what lets Approval/Provisioning
 * detect a stale result instead of trusting a `valid: true` that was
 * actually computed against a since-edited programme. Any edit to
 * `reviewedProgramme` resets this to null (see initiationService.ts's
 * updateReview): the previous result no longer describes the current
 * content, so it cannot be trusted as evidence of anything.
 */
export type ReviewValidationResult = {
  fingerprint: string
  validatedAt: string
  valid: boolean
  reason: string | null
}

/**
 * Knowledge Discovery — the pipeline (lib/dev/initiation/knowledgeDiscovery.ts)
 * that runs automatically before every generation attempt and retrieves
 * relevant organisational knowledge so the generator is never grounded on
 * the Executive Directive alone. New retrieval sources are added by
 * writing one more retriever function and registering it — nothing in
 * initiationGenerationService.ts's prompt-building code is source-type
 * aware, it only ever iterates this generic KnowledgeItem[] shape.
 * KnowledgeSourceType/KnowledgeItem/KnowledgeGap themselves now live in
 * lib/dev/knowledge/organisationalKnowledgeTypes.ts (re-exported above).
 */

/** The durable record of one Knowledge Discovery run, stored on the InitiationRequest itself (see initiationService.ts's recordKnowledgeDiscovery) so "what did we actually know when this was generated" survives after the fact, not just as an ephemeral prompt-building detail. */
export type KnowledgeDiscoverySummary = {
  retrievedAt: string
  sourcesConsulted: number
  itemsFound: number
  topItems: { sourceType: KnowledgeSourceType; sourceRef: string; title: string; relevanceScore: number }[]
  gaps: KnowledgeGap[]
}

export type InitiationRequest = {
  /** Own identity, independent of the reserved project slug. */
  id: string
  /** The reserved Planning Project slug — the project already exists (status 'planning') from the moment this record is created. */
  project: string
  directiveTitle: string
  /** The free-text Executive Directive as submitted, verbatim. */
  directiveText: string
  submittedBy: string
  status: InitiationStatus
  generationModel: string | null
  generationAttempts: number
  lastGenerationError: string | null
  /** What Knowledge Discovery found (or didn't) for the most recent generation attempt — null before generation has ever run. */
  knowledgeDiscovery: KnowledgeDiscoverySummary | null
  /** Raw LLM output. Written once by a successful generation, never mutated afterward. */
  generatedProgramme: GeneratedPlanCandidate | null
  /** The human-edited working copy — what actually gets committed at Provisioning. Starts as a deep copy of generatedProgramme. */
  reviewedProgramme: GeneratedPlanCandidate | null
  reviewNotes: string
  /** Null whenever reviewedProgramme has been modified since the last validator run (see ReviewValidationResult's doc comment) — this is the field that makes "must pass the validator again" enforceable rather than advisory. */
  reviewValidation: ReviewValidationResult | null
  approvedBy: string | null
  approvedAt: string | null
  /** The fingerprint of reviewedProgramme at the exact moment it was Approved — what Provisioning compares the then-current programme against before it's allowed to write anything. */
  approvedProgrammeFingerprint: string | null
  provisionResult: ProvisionResult | null
  provisioningError: string | null
  cancelledBy: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export type InitiationEventType =
  | 'Submitted'
  | 'KnowledgeDiscoveryCompleted'
  | 'GenerationStarted'
  | 'GenerationSucceeded'
  | 'GenerationFailed'
  | 'ReviewEdited'
  | 'ReviewValidated'
  | 'ReviewValidationFailed'
  | 'Approved'
  | 'RiskGateDecisionRecorded'
  | 'ReturnedToReview'
  | 'ExecutiveControlDecisionRecorded'
  | 'ProvisioningStarted'
  | 'Provisioned'
  | 'ProvisioningFailed'
  | 'Cancelled'

/**
 * Executive Risk Governance (requirement: "Executive approval must not
 * permit progression into Provisioning while unresolved High or Critical
 * risks remain"). This codebase's Risk model (planningState/knowledge)
 * only has a Low/Medium/High severity scale — there is no separate
 * "Critical" tier anywhere in VYRON DEV today, so the gate treats "High"
 * as the topmost/gated severity rather than introducing a fourth,
 * cross-cutting severity level used nowhere else in the platform.
 */
export type RiskGateDecisionType = 'Accept Risk' | 'Mitigate Risk' | 'Reject Programme'

/** Which specific risk (by its GeneratedRiskCandidate.tempId) a decision covers, plus a content fingerprint — editing just that risk later invalidates just this reference, without forcing every other already-decided risk to be re-decided too. */
export type RiskGateRiskRef = {
  tempId: string
  title: string
  fingerprint: string
}

/**
 * One permanent Executive Risk Gate decision (lib/dev/initiation/riskGate.ts)
 * — append-only, never mutated or deleted, the governance history
 * requirement 3/8 ask for. `programmeFingerprint` is historical context
 * (which version of the whole programme this was decided against); risk
 * coverage itself is matched per-risk via `risks[].fingerprint`, not this
 * whole-programme value.
 */
export type RiskGateDecision = {
  id: string
  initiationId: string
  project: string
  executive: string
  decidedAt: string
  decision: RiskGateDecisionType
  reason: string
  risks: RiskGateRiskRef[]
  programmeFingerprint: string
}

/**
 * Executive Go / Hold Control — Provisioning no longer auto-starts
 * autonomous execution (see lib/dev/initiation/initiationHandoff.ts for
 * where the actual handoff call now lives, and executiveControlService.ts
 * for the decision orchestration). Multiple decisions can exist for one
 * initiation over time — a project can be held, then later receive Go
 * without reprovisioning (requirement 7) — so this is an append-only
 * history, same permanent-governance shape as RiskGateDecision, not a
 * single mutable field.
 */
export type ExecutiveControlDecisionType = 'Go' | 'Hold'

export type ExecutiveControlDecision = {
  id: string
  initiationId: string
  project: string
  executive: string
  decidedAt: string
  decision: ExecutiveControlDecisionType
  reason: string
}

/** Append-only audit trail for one InitiationRequest — never mutated or deleted, mirroring the Knowledge Service's dual-write shape (permanent record + current-state mirror on InitiationRequest itself). */
export type InitiationEvent = {
  id: string
  initiationId: string
  project: string
  type: InitiationEventType
  detail: string
  actor: string
  timestamp: string
}
