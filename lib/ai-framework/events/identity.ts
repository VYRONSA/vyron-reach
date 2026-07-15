export interface TraceIdentity {
  traceId: string
  correlationId: string
  causationId?: string
  idempotencyKey?: string
}

export interface ActorIdentity {
  actorId: string
  actorType: 'human' | 'service' | 'system'
  actorRole?: string
}
