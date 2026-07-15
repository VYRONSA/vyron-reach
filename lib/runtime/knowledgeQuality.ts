import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type ConflictAnalysisInput,
  type ConflictReferenceInput,
  type GapAnalysisInput,
  type KnowledgeQualityContextInput,
  type KnowledgeQualityPolicyInput,
  type KnowledgeQualityRegistrationInput,
  type KnowledgeQualityReportInput,
  type KnowledgeQualitySessionInput,
  type QualityGovernanceInput,
  type RegistrationDiagnostic,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

function createRegistryHealth(
  registryId: string,
  name: string,
  registeredCount: number,
  duplicateRejected: number,
  validationRejected: number,
  diagnostics: RegistrationDiagnostic[],
  lastUpdatedAt: IsoDateTime
): RegistryHealthSummary {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

  return {
    registryId,
    name,
    status: errorCount > 0 ? 'degraded' : 'healthy',
    registeredCount,
    duplicateRejected,
    validationRejected,
    lastUpdatedAt,
    diagnostics: {
      total: diagnostics.length,
      errorCount,
      warningCount,
    },
  }
}

export type QualityAssessmentStatus = 'pass' | 'warn' | 'fail' | 'unknown'
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ConflictCategory =
  | 'semantic'
  | 'policy'
  | 'constraint'
  | 'decision'
  | 'factual'
  | 'temporal'
  | 'source-disagreement'
export type GapSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface KnowledgeQualityMetadata {
  qualityId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeQualityDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeQualitySession {
  sessionId: string
  qualityId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface QualityOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface QualityProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface QualityFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface QualityGovernance {
  ownership: QualityOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: QualityProvenance
  freshness: QualityFreshness
}

export interface CompletenessAssessment {
  status: QualityAssessmentStatus
  score: number
  missingItems: string[]
}

export interface FreshnessAssessment {
  status: QualityAssessmentStatus
  score: number
  staleItems: string[]
}

export interface TrustAssessment {
  status: QualityAssessmentStatus
  score: number
  trustIssues: string[]
}

export interface ConfidenceAssessment {
  status: QualityAssessmentStatus
  score: number
  lowConfidenceItems: string[]
}

export interface CoverageAssessment {
  status: QualityAssessmentStatus
  score: number
  coveredTopics: string[]
  missingTopics: string[]
}

export interface ConsistencyAssessment {
  status: QualityAssessmentStatus
  score: number
  inconsistencies: string[]
}

export interface RelevanceAssessment {
  status: QualityAssessmentStatus
  score: number
  irrelevantItems: string[]
}

export interface CompletenessPolicy {
  minimumCompletenessScore: number
  requiredSections: string[]
}

export interface ConsistencyPolicy {
  allowConflicts: boolean
  maximumCriticalConflicts: number
}

export interface TrustPolicy {
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  allowUntrustedSources: boolean
}

export interface FreshnessPolicy {
  maxAgeMs: number
  requireFreshness: boolean
}

export interface ConflictPolicy {
  strategy: 'highest-confidence' | 'highest-trust' | 'latest' | 'human-review' | 'retain-alternatives'
  preserveAlternatives: boolean
}

export interface CoveragePolicy {
  minimumCoverageScore: number
  requiredTopics: string[]
}

export interface RelevancePolicy {
  minimumRelevanceScore: number
  requireRelevanceForAll: boolean
}

export interface EvidenceQualityPolicy {
  minimumEvidenceConfidence: number
  requireTraceability: boolean
}

export interface KnowledgeQualityPolicies {
  completenessPolicy: CompletenessPolicy
  consistencyPolicy: ConsistencyPolicy
  trustPolicy: TrustPolicy
  freshnessPolicy: FreshnessPolicy
  conflictPolicy: ConflictPolicy
  coveragePolicy: CoveragePolicy
  relevancePolicy: RelevancePolicy
  evidenceQualityPolicy: EvidenceQualityPolicy
}

export interface KnowledgeQualityReport {
  reportId: string
  qualityId: string
  completenessAssessment: CompletenessAssessment
  freshnessAssessment: FreshnessAssessment
  trustAssessment: TrustAssessment
  confidenceAssessment: ConfidenceAssessment
  coverageAssessment: CoverageAssessment
  consistencyAssessment: ConsistencyAssessment
  relevanceAssessment: RelevanceAssessment
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ConflictSource {
  sourceId: string
  sourceType: 'knowledge' | 'evidence' | 'policy' | 'constraint' | 'decision' | 'external'
  statement: string
  metadata?: Metadata
}

export interface ConflictResolutionRecommendation {
  recommendationId: string
  strategy: 'highest-confidence' | 'highest-trust' | 'latest' | 'human-review' | 'retain-alternatives'
  rationale: string
}

export interface ConflictTraceability {
  enabled: boolean
  traceIds: string[]
}

export interface ConflictGroup {
  groupId: string
  category: ConflictCategory
  severity: ConflictSeverity
  sources: ConflictSource[]
  recommendations: ConflictResolutionRecommendation[]
  traceability: ConflictTraceability
  metadata?: Metadata
}

export interface ConflictDetectionResult {
  resultId: string
  qualityId: string
  conflictGroups: ConflictGroup[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ConflictSummary {
  totalConflicts: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  categories: ConflictCategory[]
}

export interface MissingContext {
  contextId: string
  statement: string
  severity: GapSeverity
}

export interface MissingEvidence {
  evidenceId: string
  statement: string
  severity: GapSeverity
}

export interface MissingDecision {
  decisionId: string
  statement: string
  severity: GapSeverity
}

export interface MissingReference {
  referenceId: string
  statement: string
  severity: GapSeverity
}

export interface GapRecommendation {
  recommendationId: string
  action: string
  rationale: string
}

export interface KnowledgeGap {
  gapId: string
  type: 'context' | 'evidence' | 'decision' | 'reference' | 'other'
  statement: string
  severity: GapSeverity
  recommendations: GapRecommendation[]
  metadata?: Metadata
}

export interface GapSummary {
  totalGaps: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface KnowledgeGapAnalysis {
  analysisId: string
  qualityId: string
  knowledgeGaps: KnowledgeGap[]
  missingContext: MissingContext[]
  missingEvidence: MissingEvidence[]
  missingDecisions: MissingDecision[]
  missingReferences: MissingReference[]
  summary: GapSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeQualityContext {
  contextId: string
  qualityId: string
  sessionId?: string
  governance: QualityGovernance
  policies: KnowledgeQualityPolicies
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeQualityRegistration extends KnowledgeQualityRegistrationInput {
  metadataModel: KnowledgeQualityMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeQualityRuntimeHealth {
  knowledgeQualityHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredQualities: number
    sessionsTracked: number
    contextsTracked: number
    reportsTracked: number
    invalidQualities: number
    lastUpdatedAt: IsoDateTime
  }
  conflictAnalysisHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    analysesTracked: number
    conflictGroupsTracked: number
    criticalConflicts: number
    lastAnalyzedAt?: IsoDateTime
  }
  gapAnalysisHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    analysesTracked: number
    gapsTracked: number
    criticalGaps: number
    lastAnalyzedAt?: IsoDateTime
  }
  qualityValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class KnowledgeQualityRegistry {
  private registrations: Map<string, KnowledgeQualityRegistration> = new Map()
  private sessions: Map<string, KnowledgeQualitySession> = new Map()
  private contexts: Map<string, KnowledgeQualityContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidQualities = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeQualityRegistrationInput): KnowledgeQualityRegistration {
    const validationResult = this.validation.validateKnowledgeQuality(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.qualityId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQuality('Duplicate knowledge quality ID detected', {
        qualityId: input.qualityId,
      })
    }

    if (!validationResult.valid) {
      this.invalidQualities += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQuality('Knowledge quality registration validation failed', {
        qualityId: input.qualityId,
      })
    }

    const registration: KnowledgeQualityRegistration = {
      ...input,
      metadataModel: {
        qualityId: input.qualityId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.qualityId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: KnowledgeQualitySessionInput): KnowledgeQualitySession {
    if (!this.registrations.has(input.qualityId)) {
      throw RuntimeError.knowledgeQuality('Knowledge quality registration not found', {
        qualityId: input.qualityId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQuality('Duplicate knowledge quality session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: KnowledgeQualitySession = {
      sessionId: input.sessionId,
      qualityId: input.qualityId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: KnowledgeQualityContextInput): KnowledgeQualityContext {
    if (!this.registrations.has(input.qualityId)) {
      throw RuntimeError.knowledgeQuality('Knowledge quality registration not found for context', {
        qualityId: input.qualityId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.knowledgeQuality('Knowledge quality session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQuality('Duplicate knowledge quality context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateQualityGovernance(input.governance)
    const policyValidation = this.validation.validateKnowledgeQualityPolicy(input.policies)
    this.diagnostics.push(...governanceValidation.diagnostics, ...policyValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidQualities += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQualityGovernance('Knowledge quality governance validation failed', {
        contextId: input.contextId,
        qualityId: input.qualityId,
      })
    }

    if (!policyValidation.valid) {
      this.invalidQualities += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeQualityPolicy('Knowledge quality policy validation failed', {
        contextId: input.contextId,
        qualityId: input.qualityId,
      })
    }

    const context: KnowledgeQualityContext = {
      contextId: input.contextId,
      qualityId: input.qualityId,
      sessionId: input.sessionId,
      governance: input.governance,
      policies: input.policies,
      scope: input.scope,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  get(qualityId: string): KnowledgeQualityRegistration | undefined {
    return this.registrations.get(qualityId)
  }

  getSession(sessionId: string): KnowledgeQualitySession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): KnowledgeQualityContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): KnowledgeQualityRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): KnowledgeQualitySession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): KnowledgeQualityContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidQualityCount(): number {
    return this.invalidQualities
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-quality-registry',
      'Knowledge Quality Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeQualityManager {
  private qualityReports: Map<string, KnowledgeQualityReport> = new Map()
  private conflictAnalyses: Map<string, ConflictDetectionResult> = new Map()
  private gapAnalyses: Map<string, KnowledgeGapAnalysis> = new Map()
  private diagnostics: KnowledgeQualityDiagnostics[] = []
  private lastConflictAnalyzedAt?: IsoDateTime
  private lastGapAnalyzedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeQualityRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerQuality(input: KnowledgeQualityRegistrationInput): KnowledgeQualityRegistration {
    return this.registry.register(input)
  }

  startSession(input: KnowledgeQualitySessionInput): KnowledgeQualitySession {
    return this.registry.createSession(input)
  }

  createContext(input: KnowledgeQualityContextInput): KnowledgeQualityContext {
    return this.registry.createContext(input)
  }

  createQualityReport(
    reportInput: KnowledgeQualityReportInput,
    conflictInput: ConflictAnalysisInput,
    gapInput: GapAnalysisInput
  ): {
    qualityReport: KnowledgeQualityReport
    conflictResult: ConflictDetectionResult
    gapAnalysis: KnowledgeGapAnalysis
  } {
    if (!this.registry.get(reportInput.qualityId)) {
      throw RuntimeError.knowledgeQuality('Knowledge quality registration not found for quality report', {
        qualityId: reportInput.qualityId,
      })
    }

    const reportValidation = this.validation.validateQualityReport(reportInput)
    const conflictValidation = this.validation.validateConflictAnalysis(conflictInput)
    const gapValidation = this.validation.validateGapAnalysis(gapInput)
    const conflictReferenceValidations = conflictInput.conflictGroups.flatMap((group) =>
      group.sources.map((source) => {
        const referenceInput: ConflictReferenceInput = {
          referenceId: `${group.groupId}:${source.sourceId}`,
          groupId: group.groupId,
          sourceId: source.sourceId,
          sourceType: source.sourceType,
          statement: source.statement,
          metadata: source.metadata,
        }
        return this.validation.validateConflictReference(referenceInput)
      })
    )

    const diagnostics = [
      ...reportValidation.diagnostics,
      ...conflictValidation.diagnostics,
      ...gapValidation.diagnostics,
      ...conflictReferenceValidations.flatMap((result) => result.diagnostics),
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-quality-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!reportValidation.valid) {
      throw RuntimeError.qualityReport('Knowledge quality report validation failed', {
        reportId: reportInput.reportId,
        qualityId: reportInput.qualityId,
      })
    }

    if (!conflictValidation.valid) {
      throw RuntimeError.conflictDetection('Conflict analysis validation failed', {
        resultId: conflictInput.resultId,
        qualityId: conflictInput.qualityId,
      })
    }

    if (conflictReferenceValidations.some((result) => !result.valid)) {
      throw RuntimeError.conflictReference('Conflict reference validation failed', {
        resultId: conflictInput.resultId,
        qualityId: conflictInput.qualityId,
      })
    }

    if (!gapValidation.valid) {
      throw RuntimeError.gapAnalysis('Gap analysis validation failed', {
        analysisId: gapInput.analysisId,
        qualityId: gapInput.qualityId,
      })
    }

    const qualityReport: KnowledgeQualityReport = {
      ...reportInput,
      createdAt: now(),
    }

    const conflictResult: ConflictDetectionResult = {
      ...conflictInput,
      createdAt: now(),
    }

    const gapAnalysis: KnowledgeGapAnalysis = {
      ...gapInput,
      createdAt: now(),
    }

    this.qualityReports.set(qualityReport.reportId, qualityReport)
    this.conflictAnalyses.set(conflictResult.resultId, conflictResult)
    this.gapAnalyses.set(gapAnalysis.analysisId, gapAnalysis)
    this.lastConflictAnalyzedAt = now()
    this.lastGapAnalyzedAt = now()
    this.lastUpdatedAt = now()

    return {
      qualityReport,
      conflictResult,
      gapAnalysis,
    }
  }

  getHealth(): KnowledgeQualityRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const conflictGroupsTracked = Array.from(this.conflictAnalyses.values()).reduce(
      (total, analysis) => total + analysis.conflictGroups.length,
      0
    )

    const criticalConflicts = Array.from(this.conflictAnalyses.values()).reduce(
      (total, analysis) =>
        total + analysis.conflictGroups.filter((group) => group.severity === 'critical').length,
      0
    )

    const gapsTracked = Array.from(this.gapAnalyses.values()).reduce(
      (total, analysis) => total + analysis.knowledgeGaps.length,
      0
    )

    const criticalGaps = Array.from(this.gapAnalyses.values()).reduce(
      (total, analysis) =>
        total + analysis.knowledgeGaps.filter((gap) => gap.severity === 'critical').length,
      0
    )

    return {
      knowledgeQualityHealth: {
        status: this.registry.getInvalidQualityCount() > 0 ? 'degraded' : 'healthy',
        registeredQualities: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        reportsTracked: this.qualityReports.size,
        invalidQualities: this.registry.getInvalidQualityCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      conflictAnalysisHealth: {
        status: criticalConflicts > 0 ? 'degraded' : 'healthy',
        analysesTracked: this.conflictAnalyses.size,
        conflictGroupsTracked,
        criticalConflicts,
        lastAnalyzedAt: this.lastConflictAnalyzedAt,
      },
      gapAnalysisHealth: {
        status: criticalGaps > 0 ? 'degraded' : 'healthy',
        analysesTracked: this.gapAnalyses.size,
        gapsTracked,
        criticalGaps,
        lastAnalyzedAt: this.lastGapAnalyzedAt,
      },
      qualityValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
