import type {
  IsoDateTime,
  LifecycleState,
  Metadata,
  RiskLevel,
  TenantId,
  VersionString,
} from '@/lib/ai-framework/types/base'

export const BUSINESS_BRAIN_KNOWLEDGE_DOMAINS = [
  'business-identity',
  'strategy',
  'mission',
  'vision',
  'values',
  'products',
  'services',
  'pricing',
  'margins',
  'customers',
  'personas',
  'competitors',
  'regulations',
  'geography',
  'brand',
  'sales',
  'marketing',
  'operations',
  'finance',
  'leadership-priorities',
  'kpis',
  'policies',
  'constraints',
  'decision-history',
  'website-intelligence',
  'asset-intelligence',
  'document-intelligence',
] as const

export type BusinessBrainKnowledgeDomain =
  (typeof BUSINESS_BRAIN_KNOWLEDGE_DOMAINS)[number]

export const KNOWLEDGE_TRUST_LEVELS = [
  'untrusted',
  'candidate',
  'trusted',
  'authoritative',
] as const

export type KnowledgeTrustLevel = (typeof KNOWLEDGE_TRUST_LEVELS)[number]

export type KnowledgeLifecycleState =
  | 'draft'
  | 'review'
  | 'approved'
  | 'active'
  | 'superseded'
  | 'archived'
  | 'retired'

export interface KnowledgeOwner {
  ownerId: string
  ownerName: string
  ownerType: 'team' | 'role' | 'individual'
}

export interface KnowledgeSteward {
  stewardId: string
  stewardName: string
  reviewFrequencyDays: number
}

export interface KnowledgeProvenance {
  sourceRef: string
  sourceType: 'human' | 'system' | 'external'
  ingestedAt: IsoDateTime
  confidence: number
}

export interface KnowledgeGovernance {
  owner: KnowledgeOwner
  steward: KnowledgeSteward
  trustLevel: KnowledgeTrustLevel
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: IsoDateTime
  reviewCycleDays: number
  nextReviewAt?: IsoDateTime
  retiredReason?: string
}

export interface KnowledgeLineageLink {
  recordId: string
  relationship:
    | 'derived-from'
    | 'supports'
    | 'supersedes'
    | 'contradicts'
    | 'depends-on'
}

export interface KnowledgeContradiction {
  contradictionId: string
  recordAId: string
  recordBId: string
  detectedAt: IsoDateTime
  severity: RiskLevel
  status: 'open' | 'resolved' | 'accepted-risk'
  resolutionNote?: string
}

export interface KnowledgeFreeze {
  freezeId: string
  tenantId: TenantId
  scope:
    | 'global'
    | 'planning-gate'
    | 'strategic-planning'
    | 'strategic-reasoning'
    | 'tactical-planning'
    | 'validation'
    | 'learning'
  reason: string
  frozenBy: string
  frozenAt: IsoDateTime
  releasedAt?: IsoDateTime
}

export interface KnowledgeLifecycleTransitionRule {
  from: KnowledgeLifecycleState
  to: KnowledgeLifecycleState
  allowed: boolean
  requiresApproval: boolean
  requiresReviewEvidence: boolean
  notes?: string
}

/**
 * Standard Knowledge Lifecycle Transition Rules
 * Defines valid state transitions and governance requirements for knowledge records.
 */
export const KNOWLEDGE_LIFECYCLE_TRANSITIONS: KnowledgeLifecycleTransitionRule[] = [
  {
    from: 'draft',
    to: 'review',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Knowledge moves to review for approval',
  },
  {
    from: 'review',
    to: 'approved',
    allowed: true,
    requiresApproval: true,
    requiresReviewEvidence: true,
    notes: 'Requires approver signature and review evidence',
  },
  {
    from: 'review',
    to: 'draft',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Return to draft for revisions',
  },
  {
    from: 'approved',
    to: 'active',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Approved knowledge becomes active',
  },
  {
    from: 'active',
    to: 'superseded',
    allowed: true,
    requiresApproval: true,
    requiresReviewEvidence: true,
    notes: 'Requires approval to mark as superseded',
  },
  {
    from: 'active',
    to: 'archived',
    allowed: true,
    requiresApproval: true,
    requiresReviewEvidence: false,
    notes: 'Requires approval to archive active knowledge',
  },
  {
    from: 'superseded',
    to: 'archived',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Superseded knowledge can be archived',
  },
  {
    from: 'superseded',
    to: 'retired',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Superseded knowledge can be retired',
  },
  {
    from: 'archived',
    to: 'retired',
    allowed: true,
    requiresApproval: false,
    requiresReviewEvidence: false,
    notes: 'Archived knowledge can be retired',
  },
]

export interface BusinessBrainRecord {
  id: string
  tenantId: TenantId
  domain: BusinessBrainKnowledgeDomain
  key: string
  value: string
  state: KnowledgeLifecycleState
  governance: KnowledgeGovernance
  provenance: KnowledgeProvenance
  lineage?: KnowledgeLineageLink[]
  metadata?: Metadata
  capturedAt: IsoDateTime
  version: VersionString
}

export interface BusinessBrainSnapshot {
  snapshotId: string
  tenantId: TenantId
  purpose:
    | 'planning-gate'
    | 'strategic-planning'
    | 'strategic-reasoning'
    | 'tactical-planning'
    | 'validation'
    | 'learning'
  recordIds: string[]
  frozen: boolean
  freezeRef?: string
  createdAt: IsoDateTime
  version: VersionString
}

export interface BusinessBrainPolicy {
  allowedDomains: BusinessBrainKnowledgeDomain[]
  trustThresholdForStrategicUse: KnowledgeTrustLevel
  enforceContradictionResolutionBeforeApproval: boolean
  lifecycleRules: KnowledgeLifecycleTransitionRule[]
}

