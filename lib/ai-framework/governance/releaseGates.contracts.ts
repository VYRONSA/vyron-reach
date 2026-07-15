import type { IsoDateTime, RiskLevel, VersionString } from '@/lib/ai-framework/types/base'

export type SecurityGateName =
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

export interface ReleaseGateContract {
  gateName: string
  description: string
  required: boolean
  blocking: boolean
  owner: string
  riskIfBypassed: RiskLevel
}

export interface MandatorySecurityGateContract extends ReleaseGateContract {
  gateName: SecurityGateName
  required: true
  blocking: true
}

export interface AcceptanceThresholdContract {
  key: string
  description: string
  comparator: '>=' | '>' | '<=' | '<' | '=='
  targetValue: number
  unit: string
}

export interface ReleaseReadinessContract {
  releaseId: string
  version: VersionString
  evaluatedAt: IsoDateTime
  evaluatedBy: string
  requiredGates: string[]
  passedGates: string[]
  failedGates: string[]
  securityGatesPassed: boolean
  acceptanceThresholdsMet: boolean
  readyForRelease: boolean
  notes?: string
}

export interface GateExecutionRecord {
  gateName: string
  status: 'pass' | 'fail' | 'skipped'
  executedAt: IsoDateTime
  evidenceRefs?: string[]
  failureReason?: string
}
