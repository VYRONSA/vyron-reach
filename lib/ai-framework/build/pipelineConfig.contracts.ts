import type { VersionString } from '@/lib/ai-framework/types/base'

/**
 * Retry Policy - Defines retry behavior for pipeline stages
 */
export interface RetryPolicy {
  maxAttempts: number
  backoffMultiplier: number
  initialDelaySeconds: number
  maxDelaySeconds: number
  retryableStatusCodes?: number[]
  retryableErrors?: string[]
}

/**
 * Timeout Policy - Defines timeout behavior
 */
export interface TimeoutPolicy {
  stageTimeoutSeconds: number
  pipelineTimeoutSeconds?: number
  abortOnTimeout: boolean
  allowGracefulShutdown: boolean
}

/**
 * Failure Policy - Defines failure handling behavior
 */
export interface FailurePolicy {
  continueOnStageFailure: boolean
  failureThreshold: number
  blockDownstreamOnFailure: boolean
  notifyOnFailure: boolean
  escalateOnFailure: boolean
  requiresManualReview: boolean
}

/**
 * Artifact Retention Policy - Defines artifact lifecycle
 */
export interface ArtifactRetentionPolicy {
  defaultRetentionDays: number
  minimumRetentionDays: number
  maximumRetentionDays: number
  retentionByType?: Record<string, number>
  archiveAfterDays?: number
  deleteAfterDays?: number
}

/**
 * Pipeline Notification - Notification configuration
 */
export interface PipelineNotification {
  notificationId: string
  event: 'on-start' | 'on-stage-failure' | 'on-pipeline-failure' | 'on-completion'
  notificationType: 'email' | 'webhook' | 'slack' | 'pagerduty'
  targets: string[]
  includeArtifacts: boolean
  includeLogs: boolean
}

/**
 * Stage Condition - Condition for stage execution
 */
export interface StageCondition {
  conditionId: string
  type: 'always' | 'on-success' | 'on-failure' | 'manual' | 'scheduled'
  expression?: string
  skipOnCondition: boolean
}

/**
 * Stage Dependency - Dependency between stages
 */
export interface StageDependency {
  dependentStageId: string
  requiredStageId: string
  requiresSuccess: boolean
  allowSkipped: boolean
}

/**
 * Stage Configuration - Individual stage configuration
 */
export interface StageConfiguration {
  stageId: string
  stageName: string
  order: number
  description: string
  stageType: string
  enabled: boolean
  required: boolean
  blocking: boolean
  approvalRequired?: boolean
  approvers?: string[]
  condition?: StageCondition
  dependencies: StageDependency[]
  retryPolicy: RetryPolicy
  timeoutPolicy: TimeoutPolicy
  failurePolicy: FailurePolicy
  notifications: PipelineNotification[]
  metadata?: Record<string, string | number | boolean>
}

/**
 * Pipeline Configuration - Complete pipeline configuration
 */
export interface PipelineConfiguration {
  configId: string
  pipelineId: string
  version: VersionString
  name: string
  description: string
  enabled: boolean
  stages: StageConfiguration[]
  globalRetryPolicy: RetryPolicy
  globalTimeoutPolicy: TimeoutPolicy
  globalFailurePolicy: FailurePolicy
  artifactRetention: ArtifactRetentionPolicy
  notifications: PipelineNotification[]
  approvalRequired: boolean
  approvers?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Quality Pipeline Stages - Standard quality validation pipeline
 */
export const QUALITY_PIPELINE_STAGES: StageConfiguration[] = [
  {
    stageId: 'dependency-validation',
    stageName: 'Dependency Validation',
    order: 1,
    description: 'Validate all dependencies are available',
    stageType: 'dependency-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 3, backoffMultiplier: 2, initialDelaySeconds: 5, maxDelaySeconds: 60 },
    timeoutPolicy: { stageTimeoutSeconds: 300, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 1, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: true, requiresManualReview: true },
    notifications: [],
    dependencies: [],
  },
  {
    stageId: 'build-validation',
    stageName: 'Build Validation',
    order: 2,
    description: 'Validate project build succeeds',
    stageType: 'build-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 2, backoffMultiplier: 2, initialDelaySeconds: 10, maxDelaySeconds: 120 },
    timeoutPolicy: { stageTimeoutSeconds: 600, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 1, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: true, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'build-validation', requiredStageId: 'dependency-validation', requiresSuccess: true, allowSkipped: false }],
  },
  {
    stageId: 'typescript-validation',
    stageName: 'TypeScript Validation',
    order: 3,
    description: 'Validate TypeScript compilation and type safety',
    stageType: 'typescript-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 900, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 1, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: false, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'typescript-validation', requiredStageId: 'build-validation', requiresSuccess: true, allowSkipped: false }],
  },
  {
    stageId: 'contract-validation',
    stageName: 'Contract Validation',
    order: 4,
    description: 'Validate public contracts conform to specifications',
    stageType: 'contract-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 600, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 1, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: false, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'contract-validation', requiredStageId: 'typescript-validation', requiresSuccess: true, allowSkipped: false }],
  },
  {
    stageId: 'security-validation',
    stageName: 'Security Validation',
    order: 5,
    description: 'Execute security gate tests',
    stageType: 'security-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 1200, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 0, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: true, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'security-validation', requiredStageId: 'contract-validation', requiresSuccess: true, allowSkipped: false }],
  },
  {
    stageId: 'governance-validation',
    stageName: 'Governance Validation',
    order: 6,
    description: 'Validate governance compliance and ADR coverage',
    stageType: 'governance-validation',
    enabled: true,
    required: true,
    blocking: false,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 300, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: true, failureThreshold: 1, blockDownstreamOnFailure: false, notifyOnFailure: true, escalateOnFailure: false, requiresManualReview: false },
    notifications: [],
    dependencies: [{ dependentStageId: 'governance-validation', requiredStageId: 'security-validation', requiresSuccess: false, allowSkipped: true }],
  },
  {
    stageId: 'documentation-validation',
    stageName: 'Documentation Validation',
    order: 7,
    description: 'Validate documentation is complete and accurate',
    stageType: 'documentation-validation',
    enabled: true,
    required: false,
    blocking: false,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 300, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: true, failureThreshold: 1, blockDownstreamOnFailure: false, notifyOnFailure: false, escalateOnFailure: false, requiresManualReview: false },
    notifications: [],
    dependencies: [{ dependentStageId: 'documentation-validation', requiredStageId: 'governance-validation', requiresSuccess: false, allowSkipped: true }],
  },
  {
    stageId: 'architecture-validation',
    stageName: 'Architecture Validation',
    order: 8,
    description: 'Validate architecture decisions and health',
    stageType: 'architecture-validation',
    enabled: true,
    required: true,
    blocking: true,
    retryPolicy: { maxAttempts: 1, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 600, abortOnTimeout: true, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 1, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: false, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'architecture-validation', requiredStageId: 'contract-validation', requiresSuccess: true, allowSkipped: false }],
  },
  {
    stageId: 'release-validation',
    stageName: 'Release Validation',
    order: 9,
    description: 'Final release readiness assessment',
    stageType: 'release-validation',
    enabled: true,
    required: true,
    blocking: true,
    approvalRequired: true,
    retryPolicy: { maxAttempts: 0, backoffMultiplier: 1, initialDelaySeconds: 0, maxDelaySeconds: 0 },
    timeoutPolicy: { stageTimeoutSeconds: 300, abortOnTimeout: false, allowGracefulShutdown: true },
    failurePolicy: { continueOnStageFailure: false, failureThreshold: 0, blockDownstreamOnFailure: true, notifyOnFailure: true, escalateOnFailure: true, requiresManualReview: true },
    notifications: [],
    dependencies: [{ dependentStageId: 'release-validation', requiredStageId: 'architecture-validation', requiresSuccess: true, allowSkipped: false }],
  },
]
