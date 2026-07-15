import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type EvidencePackageInput,
  type EvidenceReferenceInput,
  type KnowledgeSelectionContextInput,
  type KnowledgeSelectionInput,
  type KnowledgeSelectionRegistrationInput,
  type KnowledgeSelectionSessionInput,
  type RegistrationDiagnostic,
  type SelectionGovernanceInput,
  type SelectionPolicyInput,
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

export type CandidateKnowledgeSource =
  | 'knowledge-resolution'
  | 'business-brain'
  | 'memory-engine'
  | 'retrieval-strategy'
  | 'workflow-engine'
  | 'runtime-context'
  | 'reasoning-pipeline'
  | 'ai-team'
  | 'provider-runtime'
  | 'execution-gateway'
  | 'tenant-configuration'

export type SelectionPriority = 'low' | 'medium' | 'high' | 'critical'
export type SelectionDecisionType = 'selected' | 'excluded' | 'deferred'

export interface KnowledgeSelectionMetadata {
  selectionId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeSelectionDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeSelectionSession {
  sessionId: string
  selectionId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface SelectionOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface SelectionProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface SelectionFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface SelectionGovernance {
  ownership: SelectionOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: SelectionProvenance
  freshness: SelectionFreshness
}

export interface RelevancePolicy {
  strategy: 'strict-threshold' | 'rank-only' | 'balanced'
  minimumRelevance: number
}

export interface ConfidencePolicy {
  minimumConfidence: number
  preferHigherConfidence: boolean
}

export interface TrustPolicy {
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  allowUntrusted: boolean
}

export interface FreshnessPolicy {
  maxAgeMs: number
  requireFreshness: boolean
}

export interface DiversityPolicy {
  enabled: boolean
  maxPerSource: number
  minSourceDiversity: number
}

export interface CompletenessPolicy {
  minimumCoverageScore: number
  requiredTopics: string[]
}

export interface ConflictPolicy {
  strategy: 'highest-confidence' | 'highest-trust' | 'freshest' | 'retain-conflicts'
  preserveAlternatives: boolean
}

export interface EvidenceSufficiencyPolicy {
  minimumEvidenceCount: number
  minimumCoverageScore: number
  requireTraceability: boolean
}

export interface SelectionPolicies {
  relevancePolicy: RelevancePolicy
  confidencePolicy: ConfidencePolicy
  trustPolicy: TrustPolicy
  freshnessPolicy: FreshnessPolicy
  diversityPolicy: DiversityPolicy
  completenessPolicy: CompletenessPolicy
  conflictPolicy: ConflictPolicy
  evidenceSufficiencyPolicy: EvidenceSufficiencyPolicy
}

export interface CandidateKnowledge {
  candidateId: string
  knowledgeId: string
  source: CandidateKnowledgeSource
  title: string
  summary: string
  relevance: number
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  freshness?: SelectionFreshness
  metadata?: Metadata
}

export interface SelectedKnowledge {
  selectedId: string
  candidateId: string
  knowledgeId: string
  rationale: string
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  evidenceReferenceIds: string[]
  metadata?: Metadata
}

export interface SelectionCriteria {
  intent: string
  requiredDomains: string[]
  preferredSources: CandidateKnowledgeSource[]
  minimumConfidence: number
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
}

export interface SelectionConstraints {
  maxSelections: number
  maxEvidenceItems: number
  maxContextCharacters: number
  requireEvidence: boolean
}

export interface SelectionDecision {
  decisionId: string
  candidateId: string
  decision: SelectionDecisionType
  rationale: string
  evidenceReferenceIds: string[]
  metadata?: Metadata
}

export interface SelectionExclusion {
  exclusionId: string
  candidateId: string
  reason: string
  policyReference?: string
  metadata?: Metadata
}

export interface SelectionSummary {
  totalCandidates: number
  selectedCount: number
  excludedCount: number
  deferredCount: number
  relevanceScore: number
  evidenceScore: number
  coverageScore: number
}

export interface EvidenceSource {
  sourceId: string
  sourceType: 'knowledge' | 'document' | 'record' | 'policy' | 'constraint' | 'decision' | 'external'
  label: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface EvidenceReference {
  referenceId: string
  sourceId: string
  targetId: string
  kind: 'knowledge' | 'evidence' | 'decision' | 'constraint' | 'policy' | 'context'
  label: string
  confidence: number
  metadata?: Metadata
}

export interface EvidenceChainStep {
  stepId: string
  fromReferenceId: string
  toReferenceId: string
  relation: string
}

export interface EvidenceChain {
  chainId: string
  steps: EvidenceChainStep[]
  metadata?: Metadata
}

export interface EvidenceSummary {
  summaryId: string
  highlights: string[]
  gaps: string[]
  risks: string[]
}

export interface EvidenceConfidence {
  overall: number
  byEvidenceId: Record<string, number>
}

export interface EvidenceTraceability {
  enabled: boolean
  traceIds: string[]
}

export interface EvidenceCoverage {
  requiredTopics: string[]
  coveredTopics: string[]
  coverageScore: number
}

export interface EvidencePackage {
  packageId: string
  selectionId: string
  evidenceSources: EvidenceSource[]
  evidenceReferences: EvidenceReference[]
  evidenceChains: EvidenceChain[]
  evidenceSummary: EvidenceSummary
  evidenceConfidence: EvidenceConfidence
  evidenceTraceability: EvidenceTraceability
  evidenceCoverage: EvidenceCoverage
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeSelectionContext {
  contextId: string
  selectionId: string
  sessionId?: string
  priority: SelectionPriority
  criteria: SelectionCriteria
  constraints: SelectionConstraints
  policies: SelectionPolicies
  governance: SelectionGovernance
  candidateKnowledge: CandidateKnowledge[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface SelectionRecord {
  recordId: string
  selectionId: string
  contextId: string
  selectedKnowledge: SelectedKnowledge[]
  decisions: SelectionDecision[]
  exclusions: SelectionExclusion[]
  summary: SelectionSummary
  evidencePackageId?: string
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeSelectionRegistration extends KnowledgeSelectionRegistrationInput {
  metadataModel: KnowledgeSelectionMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeSelectionRuntimeHealth {
  knowledgeSelectionHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredSelections: number
    sessionsTracked: number
    contextsTracked: number
    invalidSelections: number
    lastUpdatedAt: IsoDateTime
  }
  evidenceAssemblyHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    packagesTracked: number
    referencesTracked: number
    invalidEvidencePackages: number
    lastAssembledAt?: IsoDateTime
  }
  selectionValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
  evidenceQualityHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    lowCoveragePackages: number
    lowConfidencePackages: number
    lastEvaluatedAt?: IsoDateTime
  }
}

export class KnowledgeSelectionRegistry {
  private registrations: Map<string, KnowledgeSelectionRegistration> = new Map()
  private sessions: Map<string, KnowledgeSelectionSession> = new Map()
  private contexts: Map<string, KnowledgeSelectionContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidSelections = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeSelectionRegistrationInput): KnowledgeSelectionRegistration {
    const validationResult = this.validation.validateKnowledgeSelectionRegistration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.selectionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeSelection('Duplicate knowledge selection ID detected', {
        selectionId: input.selectionId,
      })
    }

    if (!validationResult.valid) {
      this.invalidSelections += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeSelection('Knowledge selection validation failed', {
        selectionId: input.selectionId,
        diagnosticsCount: validationResult.diagnostics.length,
      })
    }

    const registration: KnowledgeSelectionRegistration = {
      ...input,
      metadataModel: {
        selectionId: input.selectionId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.selectionId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: KnowledgeSelectionSessionInput): KnowledgeSelectionSession {
    if (!this.registrations.has(input.selectionId)) {
      throw RuntimeError.knowledgeSelection('Knowledge selection registration not found', {
        selectionId: input.selectionId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeSelection('Duplicate knowledge selection session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: KnowledgeSelectionSession = {
      sessionId: input.sessionId,
      selectionId: input.selectionId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: KnowledgeSelectionContextInput): KnowledgeSelectionContext {
    if (!this.registrations.has(input.selectionId)) {
      throw RuntimeError.knowledgeSelection('Knowledge selection registration not found for context', {
        selectionId: input.selectionId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.knowledgeSelection('Knowledge selection session not found for context', {
        selectionId: input.selectionId,
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeSelection('Duplicate knowledge selection context ID detected', {
        contextId: input.contextId,
      })
    }

    const selectionValidation = this.validation.validateKnowledgeSelection(input.selection)
    const governanceValidation = this.validation.validateSelectionGovernance(input.governance)
    const policyValidation = this.validation.validateSelectionPolicy(input.policies)

    this.diagnostics.push(
      ...selectionValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...policyValidation.diagnostics
    )

    if (!selectionValidation.valid || !governanceValidation.valid || !policyValidation.valid) {
      this.invalidSelections += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeSelection('Knowledge selection context validation failed', {
        contextId: input.contextId,
        selectionId: input.selectionId,
      })
    }

    const context: KnowledgeSelectionContext = {
      contextId: input.contextId,
      selectionId: input.selectionId,
      sessionId: input.sessionId,
      priority: input.selection.priority,
      criteria: input.selection.criteria,
      constraints: input.selection.constraints,
      policies: input.policies,
      governance: input.governance,
      candidateKnowledge: input.selection.candidateKnowledge,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  get(selectionId: string): KnowledgeSelectionRegistration | undefined {
    return this.registrations.get(selectionId)
  }

  getSession(sessionId: string): KnowledgeSelectionSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): KnowledgeSelectionContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): KnowledgeSelectionRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): KnowledgeSelectionSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): KnowledgeSelectionContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidSelectionCount(): number {
    return this.invalidSelections
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-selection-registry',
      'Knowledge Selection Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeSelectionManager {
  private evidencePackages: Map<string, EvidencePackage> = new Map()
  private selectionRecords: Map<string, SelectionRecord> = new Map()
  private diagnostics: KnowledgeSelectionDiagnostics[] = []
  private invalidEvidencePackages = 0
  private lowCoveragePackages = 0
  private lowConfidencePackages = 0
  private lastAssembledAt?: IsoDateTime
  private lastEvaluatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeSelectionRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerSelection(input: KnowledgeSelectionRegistrationInput): KnowledgeSelectionRegistration {
    return this.registry.register(input)
  }

  startSession(input: KnowledgeSelectionSessionInput): KnowledgeSelectionSession {
    return this.registry.createSession(input)
  }

  createContext(input: KnowledgeSelectionContextInput): KnowledgeSelectionContext {
    return this.registry.createContext(input)
  }

  assembleEvidence(input: EvidencePackageInput): EvidencePackage {
    const packageValidation = this.validation.validateEvidencePackage(input)
    const referenceDiagnostics: RegistrationDiagnostic[] = []

    for (const reference of input.evidenceReferences) {
      const referenceValidation = this.validation.validateEvidenceReference(reference)
      referenceDiagnostics.push(...referenceValidation.diagnostics)
    }

    const diagnostics = [...packageValidation.diagnostics, ...referenceDiagnostics]
    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-selection-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!packageValidation.valid || diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      this.invalidEvidencePackages += 1
      throw RuntimeError.evidenceAssembly('Evidence package validation failed', {
        packageId: input.packageId,
        selectionId: input.selectionId,
      })
    }

    const evidencePackage: EvidencePackage = {
      packageId: input.packageId,
      selectionId: input.selectionId,
      evidenceSources: input.evidenceSources,
      evidenceReferences: input.evidenceReferences,
      evidenceChains: input.evidenceChains,
      evidenceSummary: input.evidenceSummary,
      evidenceConfidence: input.evidenceConfidence,
      evidenceTraceability: input.evidenceTraceability,
      evidenceCoverage: input.evidenceCoverage,
      createdAt: now(),
      metadata: input.metadata,
    }

    if (evidencePackage.evidenceCoverage.coverageScore < 0.5) {
      this.lowCoveragePackages += 1
    }

    if (evidencePackage.evidenceConfidence.overall < 0.5) {
      this.lowConfidencePackages += 1
    }

    this.evidencePackages.set(evidencePackage.packageId, evidencePackage)
    this.lastAssembledAt = now()
    this.lastEvaluatedAt = now()
    this.lastUpdatedAt = now()
    return evidencePackage
  }

  recordSelection(
    contextId: string,
    selection: KnowledgeSelectionInput,
    evidencePackageId?: string,
    metadata?: Metadata
  ): SelectionRecord {
    const context = this.registry.getContext(contextId)
    if (!context) {
      throw RuntimeError.knowledgeSelection('Knowledge selection context not found for selection record', {
        contextId,
        selectionId: selection.selectionId,
      })
    }

    if (context.selectionId !== selection.selectionId) {
      throw RuntimeError.knowledgeSelection('Selection record context does not match selectionId', {
        contextId,
        selectionId: selection.selectionId,
      })
    }

    if (evidencePackageId && !this.evidencePackages.has(evidencePackageId)) {
      throw RuntimeError.evidenceReference('Evidence package not found for selection record', {
        contextId,
        evidencePackageId,
      })
    }

    const selectionValidation = this.validation.validateKnowledgeSelection(selection)
    this.diagnostics.push(
      ...selectionValidation.diagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-selection-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!selectionValidation.valid) {
      throw RuntimeError.knowledgeSelection('Selection record validation failed', {
        selectionId: selection.selectionId,
        contextId,
      })
    }

    const record: SelectionRecord = {
      recordId: `selection-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      selectionId: selection.selectionId,
      contextId,
      selectedKnowledge: selection.selectedKnowledge,
      decisions: selection.decisions,
      exclusions: selection.exclusions,
      summary: selection.summary,
      evidencePackageId,
      createdAt: now(),
      metadata,
    }

    this.selectionRecords.set(record.recordId, record)
    this.lastUpdatedAt = now()
    return record
  }

  getEvidencePackage(packageId: string): EvidencePackage | undefined {
    return this.evidencePackages.get(packageId)
  }

  listEvidencePackages(): EvidencePackage[] {
    return Array.from(this.evidencePackages.values())
  }

  getSelectionRecord(recordId: string): SelectionRecord | undefined {
    return this.selectionRecords.get(recordId)
  }

  listSelectionRecords(): SelectionRecord[] {
    return Array.from(this.selectionRecords.values())
  }

  getHealth(): KnowledgeSelectionRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]

    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const referenceCount = Array.from(this.evidencePackages.values()).reduce(
      (total, current) => total + current.evidenceReferences.length,
      0
    )

    return {
      knowledgeSelectionHealth: {
        status: this.registry.getInvalidSelectionCount() > 0 ? 'degraded' : 'healthy',
        registeredSelections: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidSelections: this.registry.getInvalidSelectionCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      evidenceAssemblyHealth: {
        status: this.invalidEvidencePackages > 0 ? 'degraded' : 'healthy',
        packagesTracked: this.evidencePackages.size,
        referencesTracked: referenceCount,
        invalidEvidencePackages: this.invalidEvidencePackages,
        lastAssembledAt: this.lastAssembledAt,
      },
      selectionValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
      evidenceQualityHealth: {
        status: this.lowCoveragePackages > 0 || this.lowConfidencePackages > 0 ? 'degraded' : 'healthy',
        lowCoveragePackages: this.lowCoveragePackages,
        lowConfidencePackages: this.lowConfidencePackages,
        lastEvaluatedAt: this.lastEvaluatedAt,
      },
    }
  }
}
