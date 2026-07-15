import type { TenantId } from '@/lib/ai-framework/types/base'

export interface SecurityPrincipal {
  principalId: string
  tenantId: TenantId
  role: string
  permissions: string[]
}

export interface AuthorizationRequest {
  principal: SecurityPrincipal
  action: string
  resource: string
  tenantId: TenantId
}

export interface AuthorizationDecision {
  allowed: boolean
  reason: string
  policyRef?: string
}

export interface TenantBoundaryAssertion {
  principalTenantId: TenantId
  resourceTenantId: TenantId
  isolated: boolean
}

export interface SecurityGateDefinition {
  gateName:
    | 'tenant-isolation'
    | 'prompt-injection'
    | 'asset-poisoning'
    | 'memory-isolation'
    | 'provider-isolation'
    | 'permission-escalation'
    | 'workflow-authorization'
    | 'audit-verification'
    | 'cost-protection'
    | 'compliance'
  required: boolean
  blocking: boolean
}
