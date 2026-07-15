import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type ContextCompositionInput,
  type ContextGovernanceInput,
  type KnowledgeResolutionRegistrationInput,
  type KnowledgeResolutionSessionInput,
  type RegistrationDiagnostic,
  type ResolutionContextReferenceInput,
  type ResolutionPolicyInput,
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

export type ContextCompositionSource =
  | 'business-brain'
  | 'memory-engine'
  | 'retrieval-strategy'
  | 'workflow-engine'
  | 'runtime-context'
  | 'reasoning-pipeline'
  | 'ai-team'
  | 'prompt-construction'
  | 'provider-runtime'
  | 'execution-gateway'
  | 'tenant-configuration'

export type ContextSectionType =
  | 'knowledge'
  | 'evidence'
  | 'policy'
  | 'constraint'
  | 'decision'
  | 'workflow'
  | 'runtime'
  | 'tenant'

export type ContextOrderingMode = 'fixed' | 'weighted' | 'adaptive'
export type ContextPrioritisationMode = 'priority-first' | 'source-first' | 'governance-first'
export type ContextCompletenessStatus = 'complete' | 'partial' | 'insufficient'
export type ContextGapSeverity = 'low' | 'medium' | 'high'

export interface KnowledgeResolutionMetadata {
  resolutionId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeResolutionDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeResolutionSession {
  sessionId: string
  resolutionId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeResolutionOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface KnowledgeResolutionProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ContextFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ContextGovernance {
  ownership: KnowledgeResolutionOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: KnowledgeResolutionProvenance
  freshness: ContextFreshness
}

export interface MergePolicy {
  strategy: 'append' | 'replace' | 'merge-by-priority' | 'merge-by-source'
  allowSectionOverwrite: boolean
}

export interface ConflictResolutionPolicy {
  strategy: 'highest-confidence' | 'highest-trust' | 'newest' | 'manual-review'
  preserveAlternatives: boolean
}

export interface SourcePriorityPolicy {
  orderedSources: ContextCompositionSource[]
  defaultWeight: number
  sourceWeights: Array<{
    source: ContextCompositionSource
    weight: number
  }>
}

export interface ContextSizePolicy {
  maxSections: number
  maxCharacters: number
  truncateStrategy: 'tail-trim' | 'low-priority-trim' | 'source-weighted-trim'
}

export interface ContextQualityPolicy {
  minimumConfidence: number
  minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  requireReferences: boolean
}

export interface MissingKnowledgePolicy {
  strategy: 'allow' | 'warn' | 'block-context-package'
  placeholderEnabled: boolean
  requiredSections: string[]
}

export interface ResolutionPolicies {
  mergePolicy: MergePolicy
  conflictResolutionPolicy: ConflictResolutionPolicy
  sourcePriorityPolicy: SourcePriorityPolicy
  contextSizePolicy: ContextSizePolicy
  contextQualityPolicy: ContextQualityPolicy
  missingKnowledgePolicy: MissingKnowledgePolicy
}

export interface ResolvedKnowledge {
  knowledgeId: string
  source: ContextCompositionSource
  title: string
  summary: string
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  references: ContextReference[]
  metadata?: Metadata
}

export interface ContextReference {
  referenceId: string
  sourceId: string
  targetId: string
  type: 'knowledge' | 'evidence' | 'decision' | 'constraint' | 'policy' | 'context'
  label: string
  metadata?: Metadata
}

export interface ContextDependency {
  dependencyId: string
  dependsOnSectionId: string
  requiredBySectionId: string
  rationale?: string
}

export interface ContextGap {
  gapId: string
  statement: string
  severity: ContextGapSeverity
  metadata?: Metadata
}

export interface ContextCompleteness {
  status: ContextCompletenessStatus
  score: number
  missingSections: string[]
}

export interface ContextSection {
  sectionId: string
  source: ContextCompositionSource
  type: ContextSectionType
  title: string
  content: Metadata
  order: number
  priority: number
  references: ContextReference[]
  dependencies: ContextDependency[]
  completeness?: ContextCompleteness
  gaps?: ContextGap[]
  metadata?: Metadata
}

export interface ContextOrdering {
  mode: ContextOrderingMode
  orderedSectionIds: string[]
}

export interface ContextPrioritisation {
  mode: ContextPrioritisationMode
  sectionWeights: Array<{
    sectionId: string
    weight: number
  }>
}

export interface ResolvedContext {
  contextId: string
  sections: ContextSection[]
  ordering: ContextOrdering
  prioritisation: ContextPrioritisation
  references: ContextReference[]
  dependencies: ContextDependency[]
  completeness: ContextCompleteness
  gaps: ContextGap[]
  metadata?: Metadata
}

export interface KnowledgeResolutionContext {
  contextId: string
  resolutionId: string
  sessionId?: string
  sources: ContextCompositionSource[]
  governance: ContextGovernance
  policies: ResolutionPolicies
  resolvedContext: ResolvedContext
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ContextPackage {
  packageId: string
  resolutionId: string
  sessionId?: string
  resolvedKnowledge: ResolvedKnowledge[]
  resolvedContext: ResolvedContext
  governance: ContextGovernance
  policies: ResolutionPolicies
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeResolutionRegistration extends KnowledgeResolutionRegistrationInput {
  metadataModel: KnowledgeResolutionMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeResolutionRuntimeHealth {
  knowledgeResolutionHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredResolutions: number
    sessionsTracked: number
    invalidResolutions: number
    lastUpdatedAt: IsoDateTime
  }
  contextCompositionHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    contextsComposed: number
    packagesComposed: number
    incompleteContexts: number
    lastComposedAt?: IsoDateTime
  }
  resolutionValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
  resolutionPolicyHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    invalidPolicies: number
    activePolicySets: number
    lastUpdatedAt: IsoDateTime
  }
}

export class KnowledgeResolutionRegistry {
  private registrations: Map<string, KnowledgeResolutionRegistration> = new Map()
  private sessions: Map<string, KnowledgeResolutionSession> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidResolutions = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeResolutionRegistrationInput): KnowledgeResolutionRegistration {
    const validationResult = this.validation.validateKnowledgeResolution(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.resolutionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeResolution('Duplicate knowledge resolution ID detected', {
        resolutionId: input.resolutionId,
      })
    }

    if (!validationResult.valid) {
      this.invalidResolutions += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeResolution('Knowledge resolution validation failed', {
        resolutionId: input.resolutionId,
        diagnosticsCount: validationResult.diagnostics.length,
      })
    }

    const registration: KnowledgeResolutionRegistration = {
      ...input,
      metadataModel: {
        resolutionId: input.resolutionId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.resolutionId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: KnowledgeResolutionSessionInput): KnowledgeResolutionSession {
    if (!this.registrations.has(input.resolutionId)) {
      throw RuntimeError.knowledgeResolution('Knowledge resolution registration not found', {
        resolutionId: input.resolutionId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeResolution('Duplicate knowledge resolution session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: KnowledgeResolutionSession = {
      sessionId: input.sessionId,
      resolutionId: input.resolutionId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  get(resolutionId: string): KnowledgeResolutionRegistration | undefined {
    return this.registrations.get(resolutionId)
  }

  getSession(sessionId: string): KnowledgeResolutionSession | undefined {
    return this.sessions.get(sessionId)
  }

  list(): KnowledgeResolutionRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): KnowledgeResolutionSession[] {
    return Array.from(this.sessions.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidResolutionCount(): number {
    return this.invalidResolutions
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-resolution-registry',
      'Knowledge Resolution Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeResolutionManager {
  private contexts: Map<string, KnowledgeResolutionContext> = new Map()
  private packages: Map<string, ContextPackage> = new Map()
  private diagnostics: KnowledgeResolutionDiagnostics[] = []
  private invalidCompositions = 0
  private invalidPolicies = 0
  private incompleteContexts = 0
  private lastComposedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeResolutionRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerResolution(input: KnowledgeResolutionRegistrationInput): KnowledgeResolutionRegistration {
    return this.registry.register(input)
  }

  startSession(input: KnowledgeResolutionSessionInput): KnowledgeResolutionSession {
    return this.registry.createSession(input)
  }

  composeContext(
    resolutionId: string,
    composition: ContextCompositionInput,
    governance: ContextGovernanceInput,
    policies: ResolutionPolicyInput,
    resolvedKnowledge: ResolvedKnowledge[],
    packageId: string,
    sessionId?: string,
    metadata?: Metadata
  ): ContextPackage {
    if (!this.registry.get(resolutionId)) {
      throw RuntimeError.knowledgeResolution('Knowledge resolution registration not found for composition', {
        resolutionId,
      })
    }

    if (sessionId && !this.registry.getSession(sessionId)) {
      throw RuntimeError.knowledgeResolution('Knowledge resolution session not found for composition', {
        resolutionId,
        sessionId,
      })
    }

    const compositionValidation = this.validation.validateContextComposition(composition)
    const governanceValidation = this.validation.validateContextGovernance(governance)
    const policyValidation = this.validation.validateResolutionPolicy(policies)
    const referenceValidations = composition.references.map((reference) =>
      this.validation.validateContextReference(reference)
    )

    const referenceDiagnostics = referenceValidations.flatMap((result) => result.diagnostics)
    const allDiagnostics = [
      ...compositionValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...policyValidation.diagnostics,
      ...referenceDiagnostics,
    ]

    this.diagnostics.push(
      ...allDiagnostics.map((diagnostic) => ({
        diagnosticId: `knowledge-resolution-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        entityId: diagnostic.entityId,
        createdAt: diagnostic.createdAt,
        metadata: diagnostic.details,
      }))
    )

    if (!policyValidation.valid) {
      this.invalidPolicies += 1
      throw RuntimeError.resolutionPolicy('Resolution policy validation failed', {
        resolutionId,
        diagnosticsCount: policyValidation.diagnostics.length,
      })
    }

    if (!compositionValidation.valid || !governanceValidation.valid || referenceValidations.some((result) => !result.valid)) {
      this.invalidCompositions += 1
      throw RuntimeError.contextComposition('Context composition validation failed', {
        resolutionId,
        diagnosticsCount: allDiagnostics.length,
      })
    }

    const contextSections: ContextSection[] = composition.sections.map((section) => ({
      sectionId: section.sectionId,
      source: section.source,
      type: section.type,
      title: section.title,
      content: section.content,
      order: section.order,
      priority: section.priority,
      references: section.references,
      dependencies: section.dependencies,
      metadata: section.metadata,
    }))

    const contextCompleteness: ContextCompleteness = {
      status: composition.completeness.status,
      score: composition.completeness.score,
      missingSections: composition.completeness.missingSections,
    }

    const contextGaps: ContextGap[] = composition.gaps.map((gap) => ({
      gapId: gap.gapId,
      statement: gap.statement,
      severity: gap.severity,
      metadata: gap.metadata,
    }))

    if (contextCompleteness.status !== 'complete') {
      this.incompleteContexts += 1
    }

    const resolvedContext: ResolvedContext = {
      contextId: composition.contextId,
      sections: contextSections,
      ordering: composition.ordering,
      prioritisation: composition.prioritisation,
      references: composition.references,
      dependencies: composition.dependencies,
      completeness: contextCompleteness,
      gaps: contextGaps,
      metadata: composition.metadata,
    }

    const governanceModel: ContextGovernance = {
      ownership: governance.ownership,
      confidence: governance.confidence,
      trust: governance.trust,
      version: governance.version,
      reviewStatus: governance.reviewStatus,
      approvalStatus: governance.approvalStatus,
      traceability: governance.traceability,
      provenance: governance.provenance,
      freshness: governance.freshness,
    }

    const policiesModel: ResolutionPolicies = {
      mergePolicy: policies.mergePolicy,
      conflictResolutionPolicy: policies.conflictResolutionPolicy,
      sourcePriorityPolicy: policies.sourcePriorityPolicy,
      contextSizePolicy: policies.contextSizePolicy,
      contextQualityPolicy: policies.contextQualityPolicy,
      missingKnowledgePolicy: policies.missingKnowledgePolicy,
    }

    const contextModel: KnowledgeResolutionContext = {
      contextId: composition.contextId,
      resolutionId,
      sessionId,
      sources: composition.sources,
      governance: governanceModel,
      policies: policiesModel,
      resolvedContext,
      createdAt: now(),
      metadata,
    }

    const contextPackage: ContextPackage = {
      packageId,
      resolutionId,
      sessionId,
      resolvedKnowledge,
      resolvedContext,
      governance: governanceModel,
      policies: policiesModel,
      createdAt: now(),
      metadata,
    }

    this.contexts.set(contextModel.contextId, contextModel)
    this.packages.set(contextPackage.packageId, contextPackage)
    this.lastComposedAt = now()
    this.lastUpdatedAt = now()

    return contextPackage
  }

  getContext(contextId: string): KnowledgeResolutionContext | undefined {
    return this.contexts.get(contextId)
  }

  listContexts(): KnowledgeResolutionContext[] {
    return Array.from(this.contexts.values())
  }

  getContextPackage(packageId: string): ContextPackage | undefined {
    return this.packages.get(packageId)
  }

  listContextPackages(): ContextPackage[] {
    return Array.from(this.packages.values())
  }

  getHealth(): KnowledgeResolutionRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]

    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      knowledgeResolutionHealth: {
        status: this.registry.getInvalidResolutionCount() > 0 ? 'degraded' : 'healthy',
        registeredResolutions: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        invalidResolutions: this.registry.getInvalidResolutionCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      contextCompositionHealth: {
        status: this.invalidCompositions > 0 ? 'degraded' : 'healthy',
        contextsComposed: this.contexts.size,
        packagesComposed: this.packages.size,
        incompleteContexts: this.incompleteContexts,
        lastComposedAt: this.lastComposedAt,
      },
      resolutionValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
      resolutionPolicyHealth: {
        status: this.invalidPolicies > 0 ? 'degraded' : 'healthy',
        invalidPolicies: this.invalidPolicies,
        activePolicySets: this.contexts.size,
        lastUpdatedAt: this.lastUpdatedAt,
      },
    }
  }
}
