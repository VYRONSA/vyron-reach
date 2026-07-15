import type {
  IsoDateTime,
  LifecycleState,
  RiskLevel,
  TenantId,
  VersionString,
} from '@/lib/ai-framework/types/base'
import type { GovernanceDecisionCategory } from '@/lib/ai-framework/types/enums'

export type DecisionLifecycleState =
  | 'proposed'
  | 'under-review'
  | 'approved'
  | 'implemented'
  | 'superseded'
  | 'retired'

export interface DecisionOwnership {
  ownerId: string
  ownerName: string
  ownerType: 'team' | 'role' | 'individual'
}

export interface DecisionImpact {
  businessImpact: string
  technicalImpact: string
  productImpact: string
}

export interface DecisionTraceability {
  correlationId?: string
  traceId?: string
  linkedAdrIds?: string[]
  linkedBusinessBrainRecordIds?: string[]
  linkedDomainPackIds?: string[]
}

export interface DecisionLedgerEntry {
  decisionId: string
  tenantId?: TenantId
  category: GovernanceDecisionCategory
  ownership: DecisionOwnership
  description: string
  reason: string
  rationale: string
  alternativesConsidered: string[]
  alternativesRejectedReason: string[]
  impact: DecisionImpact
  riskRating: RiskLevel
  confidenceRating: number
  productsAffected: string[]
  dependencies: string[]
  approvedBy: string[]
  aiRecommendation?: string
  humanDecision: string
  implementationStatus: LifecycleState
  lifecycleState: DecisionLifecycleState
  traceability?: DecisionTraceability
  reviewSchedule?: DecisionReviewSchedule
  reviewDate?: IsoDateTime
  futureConsiderations?: string
  timestamp: IsoDateTime
  version: VersionString
}

export interface DecisionLedgerPolicy {
  requiredForCategories: GovernanceDecisionCategory[]
  reviewCycleDays: number
  immutableAfterApproval: boolean
}

export interface DecisionLifecycleTransitionRule {
  from: DecisionLifecycleState
  to: DecisionLifecycleState
  allowed: boolean
  requiresApprover: boolean
  requiresLinkedAdr: boolean
  requiresImpactAssessment: boolean
}

/**
 * Decision Review Schedule - Formalizes review cycles for decision records.
 * Ensures decisions are periodically reviewed and remain valid.
 */
export interface DecisionReviewSchedule {
  decisionId: string
  reviewFrequencyDays: number
  lastReviewedAt?: IsoDateTime
  nextScheduledReviewAt: IsoDateTime
  reviewerIds: string[]
  reviewRequiredIfChanged: boolean
}

/**
 * Decision Review Governance - Governance rules for decision reviews.
 * Defines approval, evidence, and escalation requirements.
 */
export interface DecisionReviewGovernance {
  minimumReviewers: number
  requiresEvidenceUpdate: boolean
  escalateIfUnresolvedDays: number
  escalationRecipients: string[]
  acceptableStateChanges: DecisionLifecycleState[]
  requireRationaleUpdate: boolean
}

export interface DecisionGovernanceContract {
  policy: DecisionLedgerPolicy
  lifecycleRules: DecisionLifecycleTransitionRule[]
  minimumConfidenceForApproval: number
  requiresTraceabilityLinks: boolean
  reviewGovernance: DecisionReviewGovernance
}

/**
 * Standard Decision Lifecycle Transition Rules
 * Defines valid state transitions and governance requirements for decision records.
 */
export const DECISION_LIFECYCLE_TRANSITIONS: DecisionLifecycleTransitionRule[] = [
  {
    from: 'proposed',
    to: 'under-review',
    allowed: true,
    requiresApprover: false,
    requiresLinkedAdr: false,
    requiresImpactAssessment: false,
  },
  {
    from: 'under-review',
    to: 'approved',
    allowed: true,
    requiresApprover: true,
    requiresLinkedAdr: true,
    requiresImpactAssessment: true,
  },
  {
    from: 'under-review',
    to: 'proposed',
    allowed: true,
    requiresApprover: false,
    requiresLinkedAdr: false,
    requiresImpactAssessment: false,
  },
  {
    from: 'approved',
    to: 'implemented',
    allowed: true,
    requiresApprover: false,
    requiresLinkedAdr: false,
    requiresImpactAssessment: false,
  },
  {
    from: 'implemented',
    to: 'superseded',
    allowed: true,
    requiresApprover: true,
    requiresLinkedAdr: false,
    requiresImpactAssessment: true,
  },
  {
    from: 'implemented',
    to: 'retired',
    allowed: true,
    requiresApprover: true,
    requiresLinkedAdr: false,
    requiresImpactAssessment: false,
  },
  {
    from: 'superseded',
    to: 'retired',
    allowed: true,
    requiresApprover: false,
    requiresLinkedAdr: false,
    requiresImpactAssessment: false,
  },
]
