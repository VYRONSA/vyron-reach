import type {
  IsoDateTime,
  RiskLevel,
  VersionString,
} from '@/lib/ai-framework/types/base'

/**
 * Test Execution Summary - Aggregated test execution metrics
 */
export interface TestExecutionSummary {
  summaryId: string
  version: VersionString
  milestone: string
  timestamp: IsoDateTime
  totalDurationSeconds: number
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  flakyTests: number
  overallStatus: 'pass' | 'fail'
}

/**
 * Coverage Summary - Test coverage metrics
 */
export interface CoverageSummary {
  summaryId: string
  version: VersionString
  timestamp: IsoDateTime
  codeLinesCovered: number
  codeLinesTotal: number
  codeLineCoveragePercent: number
  functionsCovered: number
  functionsTotal: number
  functionCoveragePercent: number
  branchCovered: number
  branchTotal: number
  branchCoveragePercent: number
  minimumRequiredPercent: number
  passedRequirement: boolean
}

/**
 * Contract Coverage - Contract testing coverage metrics
 */
export interface ContractCoverage {
  coverageId: string
  version: VersionString
  timestamp: IsoDateTime
  totalPublicContracts: number
  testedContracts: number
  contractCoveragePercent: number
  conformanceTestsPassed: number
  conformanceTestsFailed: number
  backwardCompatibilityTestsPassed: number
  backwardCompatibilityTestsFailed: number
  breakingChangeTestsRun: number
}

/**
 * Security Coverage - Security testing coverage
 */
export interface SecurityCoverage {
  coverageId: string
  version: VersionString
  timestamp: IsoDateTime
  totalSecurityGates: number
  securityGatesPass: number
  securityGatesFail: number
  vulnerabilitiesDetected: number
  criticalVulnerabilities: number
  highRiskVulnerabilities: number
  mediumRiskVulnerabilities: number
  lowRiskVulnerabilities: number
}

/**
 * Governance Coverage - Governance testing coverage
 */
export interface GovernanceCoverage {
  coverageId: string
  version: VersionString
  timestamp: IsoDateTime
  totalPolicies: number
  policiesValidated: number
  governanceCompliancePercent: number
  adrsReviewed: number
  adrsApproved: number
  decisionLedgerEntriesReviewed: number
}

/**
 * Domain Pack Coverage - Domain pack testing coverage
 */
export interface DomainPackCoverage {
  coverageId: string
  version: VersionString
  timestamp: IsoDateTime
  totalDomainPacks: number
  certifiedDomainPacks: number
  compatibilityValidated: number
  dependencyHealthy: number
  governanceCompliant: number
}

/**
 * Test Failure - Individual test failure record
 */
export interface TestFailure {
  failureId: string
  testCaseId: string
  failureCategory: 'assertion' | 'timeout' | 'error' | 'setup' | 'teardown'
  failureMessage: string
  stackTrace?: string
  flaky: boolean
  reproducible: boolean
  rootCauseAnalysis?: string
  requiredFix: boolean
  targetFixDate?: IsoDateTime
  status: 'open' | 'investigating' | 'blocked' | 'fixed' | 'acknowledged'
}

/**
 * Release Readiness - Aggregated release readiness status
 */
export interface ReleaseReadiness {
  releaseId: string
  version: VersionString
  targetReleaseDate: IsoDateTime
  testingComplete: boolean
  qualityGatePassed: boolean
  securityCleared: boolean
  performanceValidated: boolean
  documentationComplete: boolean
  governanceApproved: boolean
  allBlockersResolved: boolean
  readyForRelease: boolean
}

/**
 * Outstanding Failure - Outstanding test failure tracking
 */
export interface OutstandingFailure {
  failureId: string
  description: string
  severity: RiskLevel
  testCaseId: string
  firstDetected: IsoDateTime
  lastOccurrence: IsoDateTime
  occurrenceCount: number
  reproducibility: 'always' | 'sometimes' | 'rarely'
  blocker: boolean
  assignedTo?: string
  targetResolutionDate?: IsoDateTime
  notes?: string
}

/**
 * Risk Assessment - Risk assessment for release
 */
export interface RiskAssessment {
  assessmentId: string
  version: VersionString
  timestamp: IsoDateTime
  assessedBy: string
  overallRiskLevel: RiskLevel
  testCoverageRisk: RiskLevel
  contractComplianceRisk: RiskLevel
  securityRisk: RiskLevel
  performanceRisk: RiskLevel
  governanceRisk: RiskLevel
  domainPackRisk: RiskLevel
  identifiedRisks: {
    description: string
    severity: RiskLevel
    mitigationStrategy: string
  }[]
  recommendedActions: string[]
  releaseRecommendation:
    | 'proceed'
    | 'proceed-with-caution'
    | 'hold'
    | 'blocked'
}

/**
 * Test Report - Comprehensive test report for milestone
 */
export interface TestReport {
  reportId: string
  version: VersionString
  milestone: string
  timestamp: IsoDateTime
  generatedBy: string
  executionSummary: TestExecutionSummary
  coverageSummary: CoverageSummary
  contractCoverage: ContractCoverage
  securityCoverage: SecurityCoverage
  governanceCoverage: GovernanceCoverage
  domainPackCoverage: DomainPackCoverage
  outstandingFailures: OutstandingFailure[]
  releaseReadiness: ReleaseReadiness
  riskAssessment: RiskAssessment
  overallStatus: 'pass' | 'fail'
}
