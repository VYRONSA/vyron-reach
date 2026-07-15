import type { TenantId, VersionString } from '@/lib/ai-framework/types/base'

export interface FeatureFlagDefinition {
  key: string
  description: string
  owner: string
  version: VersionString
  defaultEnabled: boolean
  expiresAt?: string
}

export interface FeatureFlagOverride {
  key: string
  tenantId?: TenantId
  enabled: boolean
  reason: string
  changedBy: string
  changedAt: string
}

export interface FeatureFlagEvaluation {
  key: string
  tenantId?: TenantId
  enabled: boolean
  source: 'default' | 'tenant-override' | 'environment-override'
}
