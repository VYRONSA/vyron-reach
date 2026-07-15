import type { ContractVersioned, Metadata, TenantId } from '@/lib/ai-framework/types/base'

export type VaiosEnvironment = 'local' | 'dev' | 'staging' | 'production'

export interface VaiosCoreConfig extends ContractVersioned {
  environment: VaiosEnvironment
  serviceName: string
  enableStrictSecurityGates: boolean
  defaultEventVersion: string
  defaultDecisionLedgerVersion: string
}

export interface TenantPolicyConfig extends ContractVersioned {
  tenantId: TenantId
  monthlyCostLimitUsd: number
  hardStopOnCostLimit: boolean
  allowedProviders: string[]
  requiredSecurityGates: string[]
  metadata?: Metadata
}

export interface FeatureFlagConfig extends ContractVersioned {
  key: string
  defaultEnabled: boolean
  owner: string
  description: string
  expiresAt?: string
}
