import type {
  IsoDateTime,
  RiskLevel,
  VersionString,
} from '@/lib/ai-framework/types/base'

/**
 * Milestone Metrics Summary - Aggregated metrics for milestone
 */
export interface MilestoneMetricsSummary {
  codeLineCoveragePercent: number
  contractConformancePercent: number
  securityGatesCoveredPercent: number
  testCoveragePercent: number
  governanceCompliancePercent: number
  domainPackCompliancePercent: number
  releaseReadinessPercent: number
  architectureHealthPercent: number
  overallQualityScore: number
}

/**
 * Milestone Status Summary - Status across all dimensions
 */
export interface MilestoneStatusSummary {
  buildSucceeded: boolean
  allTestsPassed: boolean
  securityGatesCleared: boolean
  contractsConforming: boolean
  governanceCompliant: boolean
  architectureHealthy: boolean
  readyForRelease: boolean
}

/**
 * Milestone Findings - Critical findings across all dimensions
 */
export interface MilestoneFindings {
  criticalIssues: {
    description: string
    severity: RiskLevel
    source: 'architecture' | 'testing' | 'security' | 'governance' | 'build' | 'domain-pack'
  }[]
  recommendedActions: string[]
  blockersSummary: string[]
  achievementsSummary: string[]
}

/**
 * Milestone Quality Integration Report - Comprehensive unified quality report
 *
 * Integrates:
 * - Architecture Health (ArchitectureHealthReport)
 * - Test Reporting (TestReport)
 * - Security Testing (SecurityTestReport)
 * - Governance Compliance (decision ledger, ADR coverage)
 * - Domain Pack Health (DomainPackHealth)
 * - Build Health (BuildReport)
 *
 * Produces: Single unified quality assessment for release decision
 *
 * This is distinct from MilestoneQualityReport in testing/contracts.ts,
 * which focuses on test gate results. This contract integrates ALL quality dimensions.
 */
export interface MilestoneQualityIntegrationReport {
  reportId: string
  milestone: string
  version: VersionString
  timestamp: IsoDateTime
  generatedBy: string

  // Aggregated Metrics
  metrics: MilestoneMetricsSummary

  // Status Summary
  status: MilestoneStatusSummary

  // Dimensional Reports (References to detailed reports)
  architectureHealthReportId?: string
  testReportId?: string
  securityReportId?: string
  buildReportId?: string
  domainPackHealthSummary?: {
    totalDomainPacks: number
    certifiedDomainPacks: number
    healthyDomainPacks: number
    domainPackCompliancePercent: number
  }

  // Governance
  governanceStatus: {
    adrCoveragePercent: number
    decisionLedgerEntriesReviewed: number
    policyCompliancePercent: number
    auditFindingsResolved: number
  }

  // Release Assessment
  findings: MilestoneFindings
  riskLevel: RiskLevel
  confidenceScore: number
  overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'

  // Recommendations
  releaseRecommendation: 'proceed' | 'proceed-with-caution' | 'hold' | 'blocked'
  requiredApprovals: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected'

  // Traceability
  linkedDecisions: string[]
  linkedADRs: string[]
  linkedDomainPacks: string[]

  // Executive Summary
  executiveSummary: string
  notes?: string
}
