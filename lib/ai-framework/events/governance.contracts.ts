import type { IsoDateTime, RiskLevel, VersionString } from '@/lib/ai-framework/types/base'
import type { EventSecurityClassification } from '@/lib/ai-framework/types/enums'
import type { EventNameParts, VaiosEventDomain } from '@/lib/ai-framework/events/taxonomy'

export interface EventTaxonomyContract {
  domain: VaiosEventDomain
  description: string
  owners: string[]
  allowedEntities: string[]
  allowedActions: string[]
}

export interface EventNamingStandard {
  pattern: '<domain>.<entity>.<action>.<version>'
  lowercaseOnly: true
  separator: '.'
  reservedSegments: string[]
}

export interface EventVersioningPolicy {
  semanticVersioning: true
  defaultVersion: VersionString
  breakingChangeRequiresMajor: true
  backwardCompatibleWindowDays: number
}

export interface EventEnvelopeRule {
  requiredFields: Array<
    | 'eventId'
    | 'eventName'
    | 'eventVersion'
    | 'emittedAt'
    | 'tenantId'
    | 'productId'
    | 'trace'
    | 'actor'
    | 'securityClassification'
    | 'schemaRef'
    | 'payload'
  >
  integrityHashRecommended: boolean
  securityClassificationRequired: true
}

export interface IdentityStrategy {
  traceIdFormat: 'uuid-v4'
  correlationIdFormat: 'uuid-v4'
  causationIdFormat: 'uuid-v4'
  idempotencyKeyFormat: 'opaque-string'
  mustPropagateAcrossStages: true
}

export interface EventOrderingContract {
  scope: 'workflow-instance' | 'tenant' | 'global'
  guaranteedInScope: boolean
  outOfOrderHandling: 'buffer' | 'reject' | 'mark-anomaly'
}

export interface EventReplayContract {
  replayAllowed: boolean
  requiresReplayReason: boolean
  requiresReplayRequester: boolean
  requiresReplayApprovalForRestricted: boolean
  replayFromTimestamp?: IsoDateTime
}

export interface EventIdempotencyContract {
  idempotencyRequired: boolean
  idempotencyWindowSeconds: number
  duplicateHandling: 'ignore' | 'merge' | 'error'
}

export interface DeadLetterQueueContract {
  enabled: true
  maxRetryAttempts: number
  retryBackoff: 'fixed' | 'exponential'
  quarantineAfterMaxRetries: true
  replayFromDlqAllowed: boolean
  replayRequiresAuditEntry: true
}

export interface EventRetentionPolicy {
  eventClass:
    | 'lifecycle'
    | 'reasoning'
    | 'generation'
    | 'validation'
    | 'workflow'
    | 'security'
    | 'audit'
    | 'cost'
    | 'learning'
    | 'domain-pack'
    | 'control-plane'
  retentionDays: number
  archiveAfterDays?: number
  deleteAfterArchiveDays?: number
}

export interface EventGovernancePolicy {
  naming: EventNamingStandard
  versioning: EventVersioningPolicy
  envelopeRule: EventEnvelopeRule
  identity: IdentityStrategy
  ordering: EventOrderingContract[]
  replay: EventReplayContract
  idempotency: EventIdempotencyContract
  dlq: DeadLetterQueueContract
  retention: EventRetentionPolicy[]
}

export interface EventContractRegistration {
  eventName: string
  parts: EventNameParts
  schemaRef: string
  securityClassification: EventSecurityClassification
  risk: RiskLevel
  owner: string
}
