import type {
  IsoDateTime,
  Metadata,
  RiskLevel,
  VersionString,
  TenantId,
} from '@/lib/ai-framework/types/base'

/**
 * Build Pipeline Manifest - Complete pipeline specification
 */
export interface BuildPipelineManifest {
  pipelineId: string
  name: string
  version: VersionString
  description: string
  owner: string
  maintainer?: string
  stages: string[]
  dependencies: string[]
  estimatedDurationMinutes: number
}

/**
 * Build Pipeline Metadata - Governance aligned with Batch 3 patterns
 */
export interface BuildPipelineMetadata {
  pipelineId: string
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
 * Pipeline Stage - Individual stage in build pipeline
 */
export interface PipelineStage {
  stageId: string
  name: string
  order: number
  description: string
  stageType:
    | 'dependency-validation'
    | 'build-validation'
    | 'typescript-validation'
    | 'contract-validation'
    | 'security-validation'
    | 'governance-validation'
    | 'documentation-validation'
    | 'architecture-validation'
    | 'release-validation'
  required: boolean
  blocking: boolean
  timeoutSeconds: number
  retryAttempts: number
}

/**
 * Pipeline Execution Context - Execution environment and scope
 */
export interface PipelineExecutionContext {
  executionId: string
  pipelineId: string
  pipelineVersion: VersionString
  environment: 'development' | 'staging' | 'production'
  tenantIds?: TenantId[]
  branch?: string
  commitId?: string
  executedBy: string
  triggeredAt: IsoDateTime
  completedAt?: IsoDateTime
  durationSeconds: number
  status: 'running' | 'passed' | 'failed' | 'aborted'
  metadata?: Metadata
}

/**
 * Pipeline Artifact - Output artifact from build pipeline
 */
export interface PipelineArtifact {
  artifactId: string
  name: string
  type:
    | 'compiled-output'
    | 'test-results'
    | 'coverage-report'
    | 'security-report'
    | 'build-log'
    | 'diagnostic'
  location: string
  contentHash: string
  sizeBytes: number
  createdAt: IsoDateTime
  expiresAt?: IsoDateTime
  retentionDays: number
}

/**
 * Pipeline Stage Result - Result of individual stage execution
 */
export interface PipelineStageResult {
  resultId: string
  executionId: string
  stageId: string
  stageName: string
  status: 'pass' | 'fail' | 'skipped' | 'timeout'
  message: string
  durationSeconds: number
  startedAt: IsoDateTime
  completedAt: IsoDateTime
  artifacts: PipelineArtifact[]
  failureReason?: string
  errorDetails?: string
  blockedDownstream: boolean
}

/**
 * Pipeline Result - Complete pipeline execution result
 */
export interface PipelineResult {
  resultId: string
  executionId: string
  pipelineVersion: VersionString
  overallStatus: 'pass' | 'fail' | 'aborted'
  totalDurationSeconds: number
  stageResults: PipelineStageResult[]
  passedStages: number
  failedStages: number
  skippedStages: number
  artifacts: PipelineArtifact[]
  blockedFromPromotion: boolean
  executedAt: IsoDateTime
}

/**
 * Pipeline Evidence - Audit trail and evidence chain
 */
export interface PipelineEvidence {
  evidenceId: string
  executionId: string
  type: 'build-log' | 'test-result' | 'security-scan' | 'compliance-check' | 'approval'
  description: string
  location: string
  hash: string
  recordedAt: IsoDateTime
  recordedBy: string
  verified: boolean
}

/**
 * Pipeline Audit Record - Audit trail for compliance
 */
export interface PipelineAuditRecord {
  auditId: string
  executionId: string
  pipelineVersion: VersionString
  startedAt: IsoDateTime
  completedAt: IsoDateTime
  initiatedBy: string
  triggeredBy: string
  status: 'pass' | 'fail' | 'aborted'
  evidence: PipelineEvidence[]
  changesSummary?: string
  approvedBy?: string
  approvedAt?: IsoDateTime
  notes?: string
}
