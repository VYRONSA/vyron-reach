import type {
  IsoDateTime,
  Metadata,
  TenantId,
  VersionString,
} from '@/lib/ai-framework/types/base'
import type { EventSecurityClassification } from '@/lib/ai-framework/types/enums'
import type { ActorIdentity, TraceIdentity } from '@/lib/ai-framework/events/identity'

export interface EventEnvelope<TPayload extends object = Record<string, never>> {
  eventId: string
  eventName: string
  eventVersion: VersionString
  emittedAt: IsoDateTime
  tenantId: TenantId
  productId: string
  domainPackId?: string
  domainPackVersion?: VersionString
  trace: TraceIdentity
  actor: ActorIdentity
  securityClassification: EventSecurityClassification
  schemaRef: string
  integrityHash?: string
  metadata?: Metadata
  payload: TPayload
}

export interface DeadLetterEnvelope {
  envelope: EventEnvelope<object>
  failedAt: IsoDateTime
  failureReason: string
  retryCount: number
  replayAllowed: boolean
}
