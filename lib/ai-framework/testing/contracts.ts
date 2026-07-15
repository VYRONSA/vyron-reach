import type {
  IsoDateTime,
  Metadata,
  RiskLevel,
  VersionString,
  TenantId,
} from '@/lib/ai-framework/types/base'

export type TestGateStatus = 'pass' | 'fail' | 'skipped'

export type TestCategory =
  | 'unit'
  | 'integration'
  | 'contract'
  | 'security'
  | 'performance'
  | 'compliance'
  | 'e2e'
  | 'acceptance'

/**
 * Test Suite Manifest - Complete test suite identification and specification
 */
export interface TestSuiteManifest {
  suiteId: string
  name: string
  version: VersionString
  category: TestCategory
  description: string
  owner: string
  maintainer?: string
  requiredFor: string[]
  dependencies: string[]
  estimatedDurationMinutes: number
}

/**
 * Test Suite Metadata - Governance and tracking (consistent with Batch 3 patterns)
 */
export interface TestSuiteMetadata {
  suiteId: string
  owner: string
  responsibility: string
  primaryConsumers: string[]
  dependencies: string[]
  stabilityLevel: 'experimental' | 'internal' | 'stable' | 'frozen' | 'deprecated'
  version: VersionString
  reviewFrequencyDays: number
  lastReviewedAt?: IsoDateTime
}

/**
 * Test Execution Scope - Defines what is being tested and where
 */
export interface TestExecutionScope {
  scopeId: string
  suiteId: string
  environment: 'development' | 'staging' | 'production'
  tenantIds?: TenantId[]
  executedBy: string
  executedAt: IsoDateTime
  completedAt?: IsoDateTime
  durationSeconds: number
}

/**
 * Test Evidence - Individual test execution result and proof
 */
export interface TestEvidence {
  evidenceId: string
  testCaseId: string
  status: TestGateStatus
  message: string
  artifacts?: {
    logs?: string
    screenshots?: string[]
    traces?: string
    metrics?: Record<string, number | string>
  }
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Test Result - Aggregated result for single test case
 */
export interface TestResult {
  testCaseId: string
  status: TestGateStatus
  evidence: TestEvidence[]
  failureReason?: string
  failureCategory?: 'assertion' | 'timeout' | 'error' | 'setup' | 'teardown'
  retryCount: number
  executionTimeMs: number
  flaky: boolean
}

/**
 * Test Gate Result - Individual quality gate execution
 */
export interface TestGateResult {
  gateId: string
  gateName: string
  status: TestGateStatus
  passed: number
  failed: number
  skipped: number
  executedAt: IsoDateTime
  details?: string
  blockingOnFailure: boolean
}

/**
 * Quality Gate Contract - Defines gate requirements and pass/fail criteria
 */
export interface QualityGateContract {
  gateId: string
  gateName:
    | 'build'
    | 'typescript'
    | 'security'
    | 'contract'
    | 'documentation'
    | 'architecture'
    | 'governance'
    | 'release'
  description: string
  owner: string
  passCriteria: {
    minimumPassPercentage: number
    allowedFailureCount?: number
    allowedSkipCount?: number
    timeoutSeconds?: number
  }
  failureCriteria: {
    criticalFailures: number
    blockingIssues: number
  }
  blockingSeverity: RiskLevel
  requiredEvidence: string[]
  approvalRequired: boolean
  approvers?: string[]
}

/**
 * Quality Gate Execution - Record of gate execution and result
 */
export interface QualityGateExecution {
  executionId: string
  gateContract: QualityGateContract
  testResults: TestResult[]
  overallStatus: TestGateStatus
  blockedRelease: boolean
  approvedBy?: string
  approvedAt?: IsoDateTime
  executedAt: IsoDateTime
  notes?: string
}

/**
 * Milestone Quality Report - Complete quality report for a milestone
 */
export interface MilestoneQualityReport {
  reportId: string
  milestone: string
  version: VersionString
  gates: TestGateResult[]
  qualityGateExecutions: QualityGateExecution[]
  blockingFailures: string[]
  overallStatus: TestGateStatus
  readyForRelease: boolean
  generatedAt: IsoDateTime
  generatedBy: string
}
