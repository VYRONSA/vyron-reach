import type { IsoDateTime, VersionString } from '@/lib/ai-framework/types/base'

export interface ArchitectureHealthMetrics {
  publicContracts: number
  stableContracts: number
  frozenContracts: number
  experimentalContracts: number
  deprecatedContracts: number
  circularDependencies: number
  couplingIndicators: number
  architectureDriftFindings: number
  adrCoveragePercent: number
  decisionCoveragePercent: number
  domainPackCompliancePercent: number
  testCoveragePercent: number
  contractConformancePercent: number
  securityGatesCoveredPercent: number
  governanceCompliancePercent: number
  releaseReadinessPercent: number
}

export interface ArchitectureHealthFinding {
  findingId: string
  category:
    | 'contracts'
    | 'dependencies'
    | 'governance'
    | 'domain-pack'
    | 'drift'
    | 'testing'
    | 'security'
    | 'compliance'
  severity: 'info' | 'warning' | 'error' | 'critical'
  summary: string
  details?: string
  owner?: string
}

export interface ArchitectureHealthReport {
  reportId: string
  generatedAt: IsoDateTime
  generatedBy: string
  version: VersionString
  metrics: ArchitectureHealthMetrics
  findings: ArchitectureHealthFinding[]
}
