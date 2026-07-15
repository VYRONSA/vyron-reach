import type {
  IsoDateTime,
  RiskLevel,
  VersionString,
} from '@/lib/ai-framework/types/base'

/**
 * Build Summary - Aggregated build execution summary
 */
export interface BuildSummary {
  summaryId: string
  executionId: string
  version: VersionString
  timestamp: IsoDateTime
  totalDurationSeconds: number
  status: 'pass' | 'fail' | 'aborted'
  stagesPassed: number
  stagesFailed: number
  stagesSkipped: number
}

/**
 * Stage Timing - Timing metrics for individual stage
 */
export interface StageTiming {
  stageId: string
  stageName: string
  queuedSeconds: number
  startedSeconds: number
  executionSeconds: number
  totalSeconds: number
  critical: boolean
}

/**
 * Artifact Inventory - Inventory of build artifacts
 */
export interface ArtifactInventory {
  inventoryId: string
  executionId: string
  totalArtifacts: number
  totalSizeBytes: number
  artifactsByType: {
    type: string
    count: number
    sizeBytes: number
  }[]
  estimatedRetentionDays: number
  estimatedStorageCost?: number
}

/**
 * Build Evidence - Individual piece of build evidence
 */
export interface BuildEvidence {
  evidenceId: string
  type:
    | 'build-output'
    | 'test-result'
    | 'security-scan'
    | 'coverage-report'
    | 'compliance-check'
    | 'approval'
    | 'diagnostic'
  description: string
  location: string
  hash: string
  verified: boolean
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Validation Evidence - Evidence from validation stage
 */
export interface ValidationEvidence {
  validationId: string
  type:
    | 'dependency'
    | 'build'
    | 'typescript'
    | 'contract'
    | 'security'
    | 'governance'
    | 'documentation'
    | 'architecture'
  passed: boolean
  findings: {
    severity: RiskLevel
    message: string
    location?: string
  }[]
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Failure Information - Detailed failure information
 */
export interface FailureInformation {
  failureId: string
  stageId: string
  stageName: string
  failureTime: IsoDateTime
  errorMessage: string
  errorCategory: 'compilation' | 'test' | 'security' | 'validation' | 'approval' | 'timeout' | 'infrastructure'
  stackTrace?: string
  rootCauseAnalysis?: string
  failureDetails?: string
  blockedDownstream: boolean
}

/**
 * Failure Summary - Aggregated failure information
 */
export interface FailureSummary {
  summaryId: string
  executionId: string
  overallFailureStatus: boolean
  totalFailures: number
  criticalFailures: number
  blockingFailures: number
  failures: FailureInformation[]
  requiresManualIntervention: boolean
}

/**
 * Release Recommendation - Build-based release recommendation
 */
export interface ReleaseRecommendation {
  recommendationId: string
  executionId: string
  version: VersionString
  timestamp: IsoDateTime
  recommendedBy: string
  buildQualityStatus: 'pass' | 'fail'
  buildQualityScore: number
  recommendedAction: 'proceed' | 'proceed-with-caution' | 'hold' | 'blocked'
  blockersSummary?: string
  warningsSummary?: string
  notableAchievements?: string
  additionalNotes?: string
}

/**
 * Build Report - Comprehensive build execution report
 */
export interface BuildReport {
  reportId: string
  executionId: string
  version: VersionString
  timestamp: IsoDateTime
  generatedBy: string
  buildSummary: BuildSummary
  stageSummaries: {
    stageId: string
    stageName: string
    status: 'pass' | 'fail' | 'skipped'
    message?: string
  }[]
  stageTiming: StageTiming[]
  artifacts: ArtifactInventory
  evidence: BuildEvidence[]
  validationEvidence: ValidationEvidence[]
  failureSummary?: FailureSummary
  releaseRecommendation: ReleaseRecommendation
  overallStatus: 'pass' | 'fail'
}
