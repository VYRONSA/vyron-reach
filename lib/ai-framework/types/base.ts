export type VaiosId = string
export type TenantId = string
export type ProductId = string
export type UserId = string
export type IsoDateTime = string

export type VersionString = string

export type Metadata = Record<string, string | number | boolean | null>

export type ConfidenceScore = number

export type Severity = 'info' | 'warning' | 'error' | 'critical'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type LifecycleState =
  | 'proposed'
  | 'registered'
  | 'certified'
  | 'active'
  | 'deprecated'
  | 'retired'

export interface ContractVersioned {
  version: VersionString
}

export interface TenantScoped {
  tenantId: TenantId
}

export interface Timestamped {
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface Provenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  confidence: ConfidenceScore
  capturedAt: IsoDateTime
}
