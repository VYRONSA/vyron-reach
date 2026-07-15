import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type CertificationGovernanceInput,
  type CertificationPolicyInput,
  type KnowledgeCertificationContextInput,
  type KnowledgeCertificationRegistrationInput,
  type KnowledgeCertificationReportInput,
  type KnowledgeCertificationSessionInput,
  type PromptDeliveryPackageInput,
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

export type CertificationStatus = 'not-certified' | 'conditionally-certified' | 'certified' | 'rejected'
export type CertificationDecision = 'certify' | 'conditional-certify' | 'hold' | 'reject'

export interface KnowledgeCertificationMetadata {
  certificationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeCertificationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeCertificationSession {
  sessionId: string
  certificationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface CertificationOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface CertificationProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface CertificationFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface CertificationGovernance {
  ownership: CertificationOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: CertificationProvenance
  freshness: CertificationFreshness
}

export interface CertificationCriteria {
  criteriaId: string
  name: string
  description: string
  required: boolean
  passed: boolean
  score?: number
  metadata?: Metadata
}

export interface CertificationRecommendation {
  recommendationId: string
  action: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface CertificationEvidence {
  evidenceId: string
  label: string
  sourceType: 'knowledge' | 'evidence' | 'policy' | 'constraint' | 'decision' | 'validation' | 'external'
  sourceId: string
  confidence: number
  summary?: string
  metadata?: Metadata
}

export interface CertificationTraceability {
  enabled: boolean
  traceIds: string[]
  references: string[]
}

export interface CertificationSummary {
  totalCriteria: number
  passedCriteria: number
  failedCriteria: number
  requiredCriteria: number
  requiredPassedCriteria: number
}

export interface KnowledgeCertificationReport {
  reportId: string
  certificationId: string
  status: CertificationStatus
  decision: CertificationDecision
  criteria: CertificationCriteria[]
  recommendations: CertificationRecommendation[]
  evidence: CertificationEvidence[]
  traceability: CertificationTraceability
  summary: CertificationSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface CertifiedKnowledgePackage {
  packageId: string
  knowledgeIds: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedEvidencePackage {
  packageId: string
  evidenceIds: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedContextPackage {
  packageId: string
  contextIds: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedConstraintPackage {
  packageId: string
  constraints: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedObjectivePackage {
  packageId: string
  objectives: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedReferencePackage {
  packageId: string
  referenceIds: string[]
  summary: string
  metadata?: Metadata
}

export interface CertifiedValidationPackage {
  packageId: string
  validationChecks: string[]
  summary: string
  metadata?: Metadata
}

export interface PromptDeliveryPackage {
  deliveryId: string
  certificationId: string
  reportId: string
  certifiedKnowledgePackage: CertifiedKnowledgePackage
  certifiedEvidencePackage: CertifiedEvidencePackage
  certifiedContextPackage: CertifiedContextPackage
  certifiedConstraintPackage: CertifiedConstraintPackage
  certifiedObjectivePackage: CertifiedObjectivePackage
  certifiedReferencePackage: CertifiedReferencePackage
  certifiedValidationPackage: CertifiedValidationPackage
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface CompletenessCertificationPolicy {
  minimumCompletenessScore: number
  requiredSections: string[]
}

export interface ConfidenceCertificationPolicy {
  minimumConfidenceScore: number
  enforceConfidence: boolean
}

export interface TrustCertificationPolicy {
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  allowUntrustedSources: boolean
}

export interface ConflictCertificationPolicy {
  maximumCriticalConflicts: number
  maximumHighConflicts: number
}

export interface FreshnessCertificationPolicy {
  maxAgeMs: number
  requireFreshness: boolean
}

export interface EvidenceCertificationPolicy {
  minimumCoverageScore: number
  requiredEvidenceTypes: string[]
}

export interface PromptDeliveryPolicy {
  requireCertifiedKnowledgePackage: boolean
  requireCertifiedEvidencePackage: boolean
  requireCertifiedContextPackage: boolean
  requireCertifiedValidationPackage: boolean
}

export interface CertificationPolicies {
  completenessCertificationPolicy: CompletenessCertificationPolicy
  confidenceCertificationPolicy: ConfidenceCertificationPolicy
  trustCertificationPolicy: TrustCertificationPolicy
  conflictCertificationPolicy: ConflictCertificationPolicy
  freshnessCertificationPolicy: FreshnessCertificationPolicy
  evidenceCertificationPolicy: EvidenceCertificationPolicy
  promptDeliveryPolicy: PromptDeliveryPolicy
}

export interface KnowledgeCertificationContext {
  contextId: string
  certificationId: string
  sessionId?: string
  governance: CertificationGovernance
  policies: CertificationPolicies
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeCertificationRegistration extends KnowledgeCertificationRegistrationInput {
  metadataModel: KnowledgeCertificationMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeCertificationRuntimeHealth {
  knowledgeCertificationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredCertifications: number
    sessionsTracked: number
    contextsTracked: number
    reportsTracked: number
    invalidCertifications: number
    lastUpdatedAt: IsoDateTime
  }
  promptDeliveryHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    deliveryPackagesTracked: number
    invalidDeliveryPackages: number
    lastDeliveredAt?: IsoDateTime
  }
  certificationValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class KnowledgeCertificationRegistry {
  private registrations: Map<string, KnowledgeCertificationRegistration> = new Map()
  private sessions: Map<string, KnowledgeCertificationSession> = new Map()
  private contexts: Map<string, KnowledgeCertificationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidCertifications = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeCertificationRegistrationInput): KnowledgeCertificationRegistration {
    const validationResult = this.validation.validateKnowledgeCertification(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.certificationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeCertification('Duplicate knowledge certification ID detected', {
        certificationId: input.certificationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidCertifications += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeCertification('Knowledge certification validation failed', {
        certificationId: input.certificationId,
      })
    }

    const registration: KnowledgeCertificationRegistration = {
      ...input,
      metadataModel: {
        certificationId: input.certificationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.certificationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: KnowledgeCertificationSessionInput): KnowledgeCertificationSession {
    if (!this.registrations.has(input.certificationId)) {
      throw RuntimeError.knowledgeCertification('Knowledge certification registration not found', {
        certificationId: input.certificationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeCertification('Duplicate knowledge certification session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: KnowledgeCertificationSession = {
      sessionId: input.sessionId,
      certificationId: input.certificationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: KnowledgeCertificationContextInput): KnowledgeCertificationContext {
    if (!this.registrations.has(input.certificationId)) {
      throw RuntimeError.knowledgeCertification('Knowledge certification registration not found for context', {
        certificationId: input.certificationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.knowledgeCertification('Knowledge certification session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeCertification('Duplicate knowledge certification context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateCertificationGovernance(input.governance)
    const policyValidation = this.validation.validateCertificationPolicy(input.policies)
    this.diagnostics.push(...governanceValidation.diagnostics, ...policyValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidCertifications += 1
      this.validationRejected += 1
      throw RuntimeError.certificationGovernance('Knowledge certification governance validation failed', {
        certificationId: input.certificationId,
        contextId: input.contextId,
      })
    }

    if (!policyValidation.valid) {
      this.invalidCertifications += 1
      this.validationRejected += 1
      throw RuntimeError.certificationPolicy('Knowledge certification policy validation failed', {
        certificationId: input.certificationId,
        contextId: input.contextId,
      })
    }

    const context: KnowledgeCertificationContext = {
      contextId: input.contextId,
      certificationId: input.certificationId,
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

  get(certificationId: string): KnowledgeCertificationRegistration | undefined {
    return this.registrations.get(certificationId)
  }

  getSession(sessionId: string): KnowledgeCertificationSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): KnowledgeCertificationContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): KnowledgeCertificationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): KnowledgeCertificationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): KnowledgeCertificationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidCertificationCount(): number {
    return this.invalidCertifications
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-certification-registry',
      'Knowledge Certification Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeCertificationManager {
  private certificationReports: Map<string, KnowledgeCertificationReport> = new Map()
  private promptDeliveryPackages: Map<string, PromptDeliveryPackage> = new Map()
  private diagnostics: KnowledgeCertificationDiagnostics[] = []
  private invalidDeliveryPackages = 0
  private lastDeliveredAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeCertificationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerCertification(input: KnowledgeCertificationRegistrationInput): KnowledgeCertificationRegistration {
    return this.registry.register(input)
  }

  startSession(input: KnowledgeCertificationSessionInput): KnowledgeCertificationSession {
    return this.registry.createSession(input)
  }

  createContext(input: KnowledgeCertificationContextInput): KnowledgeCertificationContext {
    return this.registry.createContext(input)
  }

  createCertification(
    reportInput: KnowledgeCertificationReportInput,
    promptDeliveryInput: PromptDeliveryPackageInput
  ): {
    certificationReport: KnowledgeCertificationReport
    promptDeliveryPackage: PromptDeliveryPackage
  } {
    if (!this.registry.get(reportInput.certificationId)) {
      throw RuntimeError.knowledgeCertification('Knowledge certification registration not found for certification report', {
        certificationId: reportInput.certificationId,
      })
    }

    const reportValidation = this.validation.validateCertificationReport(reportInput)
    const deliveryValidation = this.validation.validatePromptDeliveryPackage(promptDeliveryInput)
    const diagnostics = [...reportValidation.diagnostics, ...deliveryValidation.diagnostics]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-certification-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!reportValidation.valid) {
      throw RuntimeError.certificationReport('Knowledge certification report validation failed', {
        certificationId: reportInput.certificationId,
        reportId: reportInput.reportId,
      })
    }

    if (!deliveryValidation.valid) {
      this.invalidDeliveryPackages += 1
      throw RuntimeError.promptDelivery('Prompt delivery package validation failed', {
        certificationId: promptDeliveryInput.certificationId,
        deliveryId: promptDeliveryInput.deliveryId,
      })
    }

    const certificationReport: KnowledgeCertificationReport = {
      ...reportInput,
      createdAt: now(),
    }

    const promptDeliveryPackage: PromptDeliveryPackage = {
      ...promptDeliveryInput,
      createdAt: now(),
    }

    this.certificationReports.set(certificationReport.reportId, certificationReport)
    this.promptDeliveryPackages.set(promptDeliveryPackage.deliveryId, promptDeliveryPackage)
    this.lastDeliveredAt = now()
    this.lastUpdatedAt = now()

    return {
      certificationReport,
      promptDeliveryPackage,
    }
  }

  getHealth(): KnowledgeCertificationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      knowledgeCertificationHealth: {
        status: this.registry.getInvalidCertificationCount() > 0 ? 'degraded' : 'healthy',
        registeredCertifications: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        reportsTracked: this.certificationReports.size,
        invalidCertifications: this.registry.getInvalidCertificationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      promptDeliveryHealth: {
        status: this.invalidDeliveryPackages > 0 ? 'degraded' : 'healthy',
        deliveryPackagesTracked: this.promptDeliveryPackages.size,
        invalidDeliveryPackages: this.invalidDeliveryPackages,
        lastDeliveredAt: this.lastDeliveredAt,
      },
      certificationValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
