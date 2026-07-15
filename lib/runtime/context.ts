import type { IsoDateTime, Metadata, TenantId, UserId } from '@/lib/ai-framework/types/base'

/**
 * Runtime Context - Execution context for all runtime operations
 * Holds tenant ID, request tracing, user info, and execution metadata
 */
export interface RuntimeContext {
  // Identifiers
  contextId: string
  tenantId: TenantId
  userId?: UserId
  correlationId: string
  traceId: string

  // Timing
  createdAt: IsoDateTime
  deadline?: IsoDateTime

  // Environment
  environment: 'local' | 'dev' | 'staging' | 'production'

  // Metadata
  metadata?: Metadata

  // Scoped values (for storing request-scoped data)
  scopedValues: Map<string, any>
}

/**
 * Runtime Context Factory - Creates and manages runtime contexts
 */
export class RuntimeContextFactory {
  /**
   * Create a new runtime context
   */
  static create(
    tenantId: TenantId,
    options?: {
      userId?: UserId
      correlationId?: string
      traceId?: string
      environment?: 'local' | 'dev' | 'staging' | 'production'
      metadata?: Metadata
      deadline?: IsoDateTime
    }
  ): RuntimeContext {
    const now = new Date().toISOString()
    return {
      contextId: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      userId: options?.userId,
      correlationId: options?.correlationId || `corr-${Date.now()}`,
      traceId: options?.traceId || `trace-${Date.now()}`,
      createdAt: now,
      deadline: options?.deadline,
      environment: options?.environment || 'local',
      metadata: options?.metadata,
      scopedValues: new Map(),
    }
  }

  /**
   * Create a child context (inherits tenant, correlation, and trace from parent)
   */
  static createChild(parent: RuntimeContext, options?: { metadata?: Metadata }): RuntimeContext {
    return {
      contextId: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: parent.tenantId,
      userId: parent.userId,
      correlationId: parent.correlationId,
      traceId: `${parent.traceId}.${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      deadline: parent.deadline,
      environment: parent.environment,
      metadata: options?.metadata,
      scopedValues: new Map(),
    }
  }

  /**
   * Set a scoped value in the context
   */
  static setValue(context: RuntimeContext, key: string, value: any): void {
    context.scopedValues.set(key, value)
  }

  /**
   * Get a scoped value from the context
   */
  static getValue<T>(context: RuntimeContext, key: string): T | undefined {
    return context.scopedValues.get(key)
  }

  /**
   * Check if a deadline has been exceeded
   */
  static isDeadlineExceeded(context: RuntimeContext): boolean {
    if (!context.deadline) return false
    return new Date() > new Date(context.deadline)
  }
}
