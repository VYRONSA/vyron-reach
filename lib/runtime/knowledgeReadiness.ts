import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type KnowledgeReadinessContextInput,
  type KnowledgeReadinessRegistrationInput,
  type KnowledgeReadinessSessionInput,
  type PromptHandoffPackageInput,
  type ReadinessGovernanceInput,
  type ReadinessPolicyInput,
  type ReadinessReportInput,
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

export type ReadinessStatus = 'not-ready' | 'conditionally-ready' | 'ready' | 'blocked'
export type ReadinessDecision = 'approve' | 'hold' | 'revise' | 'reject'

export interface KnowledgeReadinessMetadata {
  readinessId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeReadinessDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeReadinessSession {
  sessionId: string
  readinessId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ReadinessOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface ReadinessProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ReadinessFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ReadinessGovernance {
  ownership: ReadinessOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: ReadinessProvenance
  freshness: ReadinessFreshness
}

export interface ReadinessCriteria {
  criteriaId: string
  name: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ReadinessScore {
  overall: number
  byCriteria: Record<string, number>
}

export interface ReadinessRecommendation {
  recommendationId: string
  action: string
  rationale: string
  metadata?: Metadata
}

export interface ReadinessSummary {
  totalCriteria: number
  satisfiedCriteria: number
  failedCriteria: number
  blockedCriteria: number
}

export interface ReadinessTraceability {
  enabled: boolean
  traceIds: string[]
}

export interface ReadinessReport {
  reportId: string
  readinessId: string
  status: ReadinessStatus
  score: ReadinessScore
  criteria: ReadinessCriteria[]
  decision: ReadinessDecision
  recommendations: ReadinessRecommendation[]
  summary: ReadinessSummary
  traceability: ReadinessTraceability
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface FinalContextPackage {
  contextId: string
  sections: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalKnowledgePackage {
  knowledgeIds: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalEvidencePackage {
  evidenceIds: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalConstraintPackage {
  constraints: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalObjectivePackage {
  objectives: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalReferencePackage {
  referenceIds: string[]
  summary: string
  metadata?: Metadata
}

export interface FinalValidationPackage {
  validationChecks: string[]
  summary: string
  metadata?: Metadata
}

export interface PromptHandoffPackage {
  handoffId: string
  readinessId: string
  finalContextPackage: FinalContextPackage
  finalKnowledgePackage: FinalKnowledgePackage
  finalEvidencePackage: FinalEvidencePackage
  finalConstraintPackage: FinalConstraintPackage
  finalObjectivePackage: FinalObjectivePackage
  finalReferencePackage: FinalReferencePackage
  finalValidationPackage: FinalValidationPackage
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface MinimumCompletenessPolicy {
  minimumCompletenessScore: number
  requiredSections: string[]
}

export interface MinimumConfidencePolicy {
  minimumConfidenceScore: number
  enforceConfidence: boolean
}

export interface MinimumTrustPolicy {
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  allowUntrustedSources: boolean
}

export interface ConflictTolerancePolicy {
  maximumCriticalConflicts: number
  maximumHighConflicts: number
}

export interface FreshnessPolicy {
  maxAgeMs: number
  requireFreshness: boolean
}

export interface EvidenceCoveragePolicy {
  minimumCoverageScore: number
  requiredEvidenceTypes: string[]
}

export interface PromptReadinessPolicy {
  requireValidationPackage: boolean
  requireObjectivePackage: boolean
  requireReferencePackage: boolean
}

export interface ReadinessPolicies {
  minimumCompletenessPolicy: MinimumCompletenessPolicy
  minimumConfidencePolicy: MinimumConfidencePolicy
  minimumTrustPolicy: MinimumTrustPolicy
  conflictTolerancePolicy: ConflictTolerancePolicy
  freshnessPolicy: FreshnessPolicy
  evidenceCoveragePolicy: EvidenceCoveragePolicy
  promptReadinessPolicy: PromptReadinessPolicy
}

export interface KnowledgeReadinessContext {
  contextId: string
  readinessId: string
  sessionId?: string
  governance: ReadinessGovernance
  policies: ReadinessPolicies
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeReadinessRegistration extends KnowledgeReadinessRegistrationInput {
  metadataModel: KnowledgeReadinessMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeReadinessRuntimeHealth {
  knowledgeReadinessHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredReadinessEntries: number
    sessionsTracked: number
    contextsTracked: number
    reportsTracked: number
    invalidReadinessEntries: number
    lastUpdatedAt: IsoDateTime
  }
  promptHandoffHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    handoffPackagesTracked: number
    invalidHandoffs: number
    lastHandedOffAt?: IsoDateTime
  }
  readinessValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class KnowledgeReadinessRegistry {
  private registrations: Map<string, KnowledgeReadinessRegistration> = new Map()
  private sessions: Map<string, KnowledgeReadinessSession> = new Map()
  private contexts: Map<string, KnowledgeReadinessContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidReadinessEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeReadinessRegistrationInput): KnowledgeReadinessRegistration {
    const validationResult = this.validation.validateKnowledgeReadiness(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.readinessId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeReadiness('Duplicate knowledge readiness ID detected', {
        readinessId: input.readinessId,
      })
    }

    if (!validationResult.valid) {
      this.invalidReadinessEntries += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeReadiness('Knowledge readiness registration validation failed', {
        readinessId: input.readinessId,
      })
    }

    const registration: KnowledgeReadinessRegistration = {
      ...input,
      metadataModel: {
        readinessId: input.readinessId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.readinessId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: KnowledgeReadinessSessionInput): KnowledgeReadinessSession {
    if (!this.registrations.has(input.readinessId)) {
      throw RuntimeError.knowledgeReadiness('Knowledge readiness registration not found', {
        readinessId: input.readinessId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeReadiness('Duplicate knowledge readiness session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: KnowledgeReadinessSession = {
      sessionId: input.sessionId,
      readinessId: input.readinessId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: KnowledgeReadinessContextInput): KnowledgeReadinessContext {
    if (!this.registrations.has(input.readinessId)) {
      throw RuntimeError.knowledgeReadiness('Knowledge readiness registration not found for context', {
        readinessId: input.readinessId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.knowledgeReadiness('Knowledge readiness session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeReadiness('Duplicate knowledge readiness context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateReadinessGovernance(input.governance)
    const policyValidation = this.validation.validateReadinessPolicy(input.policies)
    this.diagnostics.push(...governanceValidation.diagnostics, ...policyValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidReadinessEntries += 1
      this.validationRejected += 1
      throw RuntimeError.readinessGovernance('Knowledge readiness governance validation failed', {
        contextId: input.contextId,
        readinessId: input.readinessId,
      })
    }

    if (!policyValidation.valid) {
      this.invalidReadinessEntries += 1
      this.validationRejected += 1
      throw RuntimeError.readinessPolicy('Knowledge readiness policy validation failed', {
        contextId: input.contextId,
        readinessId: input.readinessId,
      })
    }

    const context: KnowledgeReadinessContext = {
      contextId: input.contextId,
      readinessId: input.readinessId,
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

  get(readinessId: string): KnowledgeReadinessRegistration | undefined {
    return this.registrations.get(readinessId)
  }

  getSession(sessionId: string): KnowledgeReadinessSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): KnowledgeReadinessContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): KnowledgeReadinessRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): KnowledgeReadinessSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): KnowledgeReadinessContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidReadinessCount(): number {
    return this.invalidReadinessEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-readiness-registry',
      'Knowledge Readiness Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeReadinessManager {
  private readinessReports: Map<string, ReadinessReport> = new Map()
  private handoffPackages: Map<string, PromptHandoffPackage> = new Map()
  private diagnostics: KnowledgeReadinessDiagnostics[] = []
  private invalidHandoffs = 0
  private lastHandedOffAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeReadinessRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerReadiness(input: KnowledgeReadinessRegistrationInput): KnowledgeReadinessRegistration {
    return this.registry.register(input)
  }

  startSession(input: KnowledgeReadinessSessionInput): KnowledgeReadinessSession {
    return this.registry.createSession(input)
  }

  createContext(input: KnowledgeReadinessContextInput): KnowledgeReadinessContext {
    return this.registry.createContext(input)
  }

  createPromptHandoff(
    reportInput: ReadinessReportInput,
    handoffInput: PromptHandoffPackageInput
  ): {
    readinessReport: ReadinessReport
    promptHandoffPackage: PromptHandoffPackage
  } {
    if (!this.registry.get(reportInput.readinessId)) {
      throw RuntimeError.knowledgeReadiness('Knowledge readiness registration not found for readiness report', {
        readinessId: reportInput.readinessId,
      })
    }

    const reportValidation = this.validation.validateReadinessReport(reportInput)
    const handoffValidation = this.validation.validatePromptHandoff(handoffInput)
    const diagnostics = [...reportValidation.diagnostics, ...handoffValidation.diagnostics]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-readiness-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!reportValidation.valid) {
      throw RuntimeError.readinessReport('Readiness report validation failed', {
        reportId: reportInput.reportId,
        readinessId: reportInput.readinessId,
      })
    }

    if (!handoffValidation.valid) {
      this.invalidHandoffs += 1
      throw RuntimeError.promptHandoff('Prompt handoff validation failed', {
        handoffId: handoffInput.handoffId,
        readinessId: handoffInput.readinessId,
      })
    }

    const readinessReport: ReadinessReport = {
      ...reportInput,
      createdAt: now(),
    }

    const promptHandoffPackage: PromptHandoffPackage = {
      ...handoffInput,
      createdAt: now(),
    }

    this.readinessReports.set(readinessReport.reportId, readinessReport)
    this.handoffPackages.set(promptHandoffPackage.handoffId, promptHandoffPackage)
    this.lastHandedOffAt = now()
    this.lastUpdatedAt = now()

    return {
      readinessReport,
      promptHandoffPackage,
    }
  }

  getHealth(): KnowledgeReadinessRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      knowledgeReadinessHealth: {
        status: this.registry.getInvalidReadinessCount() > 0 ? 'degraded' : 'healthy',
        registeredReadinessEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        reportsTracked: this.readinessReports.size,
        invalidReadinessEntries: this.registry.getInvalidReadinessCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      promptHandoffHealth: {
        status: this.invalidHandoffs > 0 ? 'degraded' : 'healthy',
        handoffPackagesTracked: this.handoffPackages.size,
        invalidHandoffs: this.invalidHandoffs,
        lastHandedOffAt: this.lastHandedOffAt,
      },
      readinessValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
