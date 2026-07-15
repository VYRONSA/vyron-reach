import type { IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type KnowledgeAssemblyRegistrationInput,
  type KnowledgePackageInput,
  type KnowledgePrioritisationInput,
  type RetrievalPlanInput,
  type RetrievalPriority,
  type RetrievalScope,
  type RetrievalSourceDescriptorInput,
  type RetrievalStrategy,
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

export interface RetrievalSource {
  sourceId: string
  sourceType:
    | 'business-brain'
    | 'memory-engine'
    | 'runtime-context'
    | 'workflow-engine'
    | 'reasoning-pipeline'
    | 'ai-team'
    | 'prompt-construction'
    | 'provider-runtime'
    | 'execution-gateway'
    | 'tenant-configuration'
  title: string
  scope: RetrievalScope
  priority: RetrievalPriority
  enabled: boolean
  trustLevel: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  freshness: {
    updatedAt: IsoDateTime
    staleAfterMs: number
  }
  weighting: {
    weight: number
    rationale: string
  }
  metadata?: Metadata
}

export interface RetrievalRequest {
  requestId: string
  assemblyId: string
  sessionId: string
  query: string
  scope: RetrievalScope
  priority: RetrievalPriority
  constraints: {
    maxSources: number
    maxReferences: number
    includeHistoricalDecisions: boolean
    includePolicies: boolean
    includeConstraints: boolean
    hardTimeoutMs: number
  }
  strategy: RetrievalStrategy
  metadata?: Metadata
}

export interface RetrievalPlan {
  planId: string
  assemblyId: string
  request: RetrievalRequest
  sources: RetrievalSource[]
  constraints: RetrievalRequest['constraints']
  strategy: RetrievalStrategy
  resultMetadata: {
    expectedReferenceCount: number
    expectedEvidenceCount: number
    expectedCompleteness: number
  }
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface RetrievalResultMetadata {
  planId: string
  expectedReferenceCount: number
  expectedEvidenceCount: number
  expectedCompleteness: number
}

export interface RetrievedKnowledge {
  entryId: string
  title: string
  sourceId: string
  summary: string
  metadata?: Metadata
}

export interface SupportingEvidence {
  evidenceId: string
  sourceId: string
  statement: string
  metadata?: Metadata
}

export interface KnowledgePolicy {
  policyId: string
  sourceId: string
  statement: string
  metadata?: Metadata
}

export interface KnowledgeConstraint {
  constraintId: string
  sourceId: string
  statement: string
  metadata?: Metadata
}

export interface HistoricalDecision {
  decisionId: string
  sourceId: string
  statement: string
  rationale?: string
  metadata?: Metadata
}

export interface KnowledgeReference {
  referenceId: string
  sourceId: string
  type: 'document' | 'asset' | 'record' | 'decision' | 'policy' | 'constraint' | 'external'
  label: string
  target: string
  relevance: number
  metadata?: Metadata
}

export interface ConfidenceSummary {
  overallConfidence: number
  confidenceBySource: Record<string, number>
}

export interface KnowledgeGap {
  gapId: string
  statement: string
  severity: 'low' | 'medium' | 'high'
  metadata?: Metadata
}

export interface KnowledgePackage {
  packageId: string
  assemblyId: string
  planId: string
  retrievedKnowledge: RetrievedKnowledge[]
  supportingEvidence: SupportingEvidence[]
  policies: KnowledgePolicy[]
  constraints: KnowledgeConstraint[]
  historicalDecisions: HistoricalDecision[]
  contextSummary: string
  confidenceSummary: ConfidenceSummary
  references: KnowledgeReference[]
  gaps: KnowledgeGap[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface PriorityRules {
  rules: string[]
}

export interface RankingMetadata {
  rankingVersion: string
  rationale: string
}

export interface FreshnessMetadata {
  freshnessWindowMs: number
  staleThresholdMs: number
}

export interface TrustMetadata {
  minimumTrustLevel: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  enforceTrust: boolean
}

export interface SourceWeighting {
  sourceId: string
  weight: number
}

export interface ConflictIndicator {
  statement: string
}

export interface CompletenessIndicator {
  statement: string
}

export interface KnowledgePrioritisation {
  prioritisationId: string
  assemblyId: string
  priorityRules: PriorityRules
  rankingMetadata: RankingMetadata
  freshnessMetadata: FreshnessMetadata
  trustMetadata: TrustMetadata
  sourceWeighting: SourceWeighting[]
  conflictIndicators: ConflictIndicator[]
  completenessIndicators: CompletenessIndicator[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeAssemblyMetadata {
  assemblyId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  sourceIds: string[]
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeAssemblyDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface KnowledgeAssemblyContext {
  contextId: string
  assemblyId: string
  retrievalScope: RetrievalScope
  sourceIds: string[]
  metadata?: Metadata
  createdAt: IsoDateTime
}

export interface KnowledgeAssemblySession {
  sessionId: string
  assemblyId: string
  contextId: string
  status: 'created' | 'planning' | 'assembling' | 'completed'
  startedAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface KnowledgeAssemblyRegistration extends KnowledgeAssemblyRegistrationInput {
  metadataModel: KnowledgeAssemblyMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeAssemblyHealth {
  knowledgeAssemblyHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAssemblies: number
    activeSessions: number
    contextsTracked: number
    lastUpdatedAt: IsoDateTime
  }
  retrievalPlanningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    invalidPlans: number
    lastPlannedAt?: IsoDateTime
  }
  knowledgePackageHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    packagesTracked: number
    invalidPackages: number
    lastAssembledAt?: IsoDateTime
  }
  sourceRegistryHealth: RegistryHealthSummary
}

export class KnowledgeAssemblyRegistry {
  private registrations: Map<string, KnowledgeAssemblyRegistration> = new Map()
  private sources: Map<string, RetrievalSource> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: KnowledgeAssemblyRegistrationInput): KnowledgeAssemblyRegistration {
    if (this.registrations.has(input.assemblyId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeAssembly('Duplicate knowledge assembly ID detected', {
        assemblyId: input.assemblyId,
      })
    }

    if (!input.assemblyId || !input.name || !input.version || !input.contractVersion) {
      this.validationRejected += 1
      throw RuntimeError.knowledgeAssembly('Knowledge assembly registration is incomplete', {
        assemblyId: input.assemblyId,
      })
    }

    const registration: KnowledgeAssemblyRegistration = {
      ...input,
      metadataModel: {
        assemblyId: input.assemblyId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        sourceIds: input.sourceIds,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.assemblyId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  registerSource(input: RetrievalSourceDescriptorInput): RetrievalSource {
    const sourceValidation = this.validation.validateKnowledgeSource(input)
    this.diagnostics.push(...sourceValidation.diagnostics)

    if (!sourceValidation.valid) {
      this.validationRejected += 1
      throw RuntimeError.knowledgeSource('Knowledge source validation failed', {
        sourceId: input.sourceId,
        diagnosticsCount: sourceValidation.diagnostics.length,
      })
    }

    const source: RetrievalSource = {
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      title: input.title,
      scope: input.scope,
      priority: input.priority,
      enabled: input.enabled,
      trustLevel: input.trustLevel,
      freshness: {
        updatedAt: input.freshness.updatedAt,
        staleAfterMs: input.freshness.staleAfterMs,
      },
      weighting: input.weighting,
      metadata: input.metadata,
    }

    this.sources.set(source.sourceId, source)
    this.lastUpdatedAt = now()
    return source
  }

  get(assemblyId: string): KnowledgeAssemblyRegistration | undefined {
    return this.registrations.get(assemblyId)
  }

  getSource(sourceId: string): RetrievalSource | undefined {
    return this.sources.get(sourceId)
  }

  list(): KnowledgeAssemblyRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSources(): RetrievalSource[] {
    return Array.from(this.sources.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'knowledge-assembly-registry',
      'Knowledge Assembly Registry',
      this.sources.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class KnowledgeAssemblyManager {
  private sessions: Map<string, KnowledgeAssemblySession> = new Map()
  private contexts: Map<string, KnowledgeAssemblyContext> = new Map()
  private plans: Map<string, RetrievalPlan> = new Map()
  private packages: Map<string, KnowledgePackage> = new Map()
  private prioritisation: Map<string, KnowledgePrioritisation> = new Map()
  private diagnostics: KnowledgeAssemblyDiagnostics[] = []
  private invalidPlans = 0
  private invalidPackages = 0
  private lastPlannedAt?: IsoDateTime
  private lastAssembledAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: KnowledgeAssemblyRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAssembly(input: KnowledgeAssemblyRegistrationInput): KnowledgeAssemblyRegistration {
    return this.registry.register(input)
  }

  registerSource(input: RetrievalSourceDescriptorInput): RetrievalSource {
    return this.registry.registerSource(input)
  }

  createContext(assemblyId: string, retrievalScope: RetrievalScope, sourceIds: string[], metadata?: Metadata): KnowledgeAssemblyContext {
    if (!this.registry.get(assemblyId)) {
      throw RuntimeError.knowledgeAssembly('Knowledge assembly is not registered', {
        assemblyId,
      })
    }

    const context: KnowledgeAssemblyContext = {
      contextId: `knowledge-assembly-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assemblyId,
      retrievalScope,
      sourceIds,
      metadata,
      createdAt: now(),
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  startSession(assemblyId: string, contextId: string): KnowledgeAssemblySession {
    const context = this.contexts.get(contextId)
    if (!context || context.assemblyId !== assemblyId) {
      throw RuntimeError.knowledgeAssembly('Knowledge assembly context is invalid for session start', {
        assemblyId,
        contextId,
      })
    }

    const session: KnowledgeAssemblySession = {
      sessionId: `knowledge-assembly-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assemblyId,
      contextId,
      status: 'created',
      startedAt: now(),
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  planRetrieval(input: RetrievalPlanInput): RetrievalPlan {
    const planValidation = this.validation.validateRetrievalPlan(input)
    if (!planValidation.valid) {
      this.invalidPlans += 1
      throw RuntimeError.retrievalPlanning('Retrieval planning validation failed', {
        planId: input.planId,
        diagnosticsCount: planValidation.diagnostics.length,
      })
    }

    const sources = input.sources.map((source) => {
      const registeredSource = this.registry.getSource(source.sourceId)
      return registeredSource ?? {
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        title: source.title,
        scope: source.scope,
        priority: source.priority,
        enabled: source.enabled,
        trustLevel: source.trustLevel,
        freshness: source.freshness,
        weighting: source.weighting,
        metadata: source.metadata,
      }
    })

    const plan: RetrievalPlan = {
      planId: input.planId,
      assemblyId: input.assemblyId,
      request: input.request,
      sources,
      constraints: input.constraints,
      strategy: input.strategy,
      resultMetadata: input.resultMetadata,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.plans.set(plan.planId, plan)
    this.lastPlannedAt = now()
    this.lastUpdatedAt = now()
    return plan
  }

  assembleKnowledgePackage(input: KnowledgePackageInput): KnowledgePackage {
    const packageValidation = this.validation.validateKnowledgePackage(input)
    if (!packageValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.knowledgePackage('Knowledge package validation failed', {
        packageId: input.packageId,
        diagnosticsCount: packageValidation.diagnostics.length,
      })
    }

    for (const reference of input.references) {
      const referenceValidation = this.validation.validateKnowledgeReferenceAssembly(reference)
      if (!referenceValidation.valid) {
        this.invalidPackages += 1
        throw RuntimeError.knowledgePackage('Knowledge reference validation failed', {
          packageId: input.packageId,
          referenceId: reference.referenceId,
          diagnosticsCount: referenceValidation.diagnostics.length,
        })
      }
    }

    const knowledgePackage: KnowledgePackage = {
      packageId: input.packageId,
      assemblyId: input.assemblyId,
      planId: input.planId,
      retrievedKnowledge: input.retrievedKnowledge.map((entry, index) => ({
        entryId: `retrieved-knowledge-${index + 1}`,
        title: entry,
        sourceId: input.references[index]?.sourceId ?? 'source-unassigned',
        summary: `placeholder-knowledge-summary:${entry}`,
      })),
      supportingEvidence: input.supportingEvidence.map((entry, index) => ({
        evidenceId: `supporting-evidence-${index + 1}`,
        sourceId: input.references[index]?.sourceId ?? 'source-unassigned',
        statement: entry,
      })),
      policies: input.policies.map((entry, index) => ({
        policyId: `policy-${index + 1}`,
        sourceId: input.references[index]?.sourceId ?? 'source-unassigned',
        statement: entry,
      })),
      constraints: input.constraints.map((entry, index) => ({
        constraintId: `constraint-${index + 1}`,
        sourceId: input.references[index]?.sourceId ?? 'source-unassigned',
        statement: entry,
      })),
      historicalDecisions: input.historicalDecisions.map((entry, index) => ({
        decisionId: `historical-decision-${index + 1}`,
        sourceId: input.references[index]?.sourceId ?? 'source-unassigned',
        statement: entry,
      })),
      contextSummary: input.contextSummary,
      confidenceSummary: input.confidenceSummary,
      references: input.references,
      gaps: input.gaps.map((entry, index) => ({
        gapId: `knowledge-gap-${index + 1}`,
        statement: entry,
        severity: 'medium',
      })),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.packages.set(knowledgePackage.packageId, knowledgePackage)
    this.lastAssembledAt = now()
    this.lastUpdatedAt = now()
    return knowledgePackage
  }

  applyPrioritisation(input: KnowledgePrioritisationInput): KnowledgePrioritisation {
    const prioritisationValidation = this.validation.validateKnowledgePrioritisation(input)
    if (!prioritisationValidation.valid) {
      throw RuntimeError.prioritisation('Knowledge prioritisation validation failed', {
        prioritisationId: input.prioritisationId,
        diagnosticsCount: prioritisationValidation.diagnostics.length,
      })
    }

    const prioritisation: KnowledgePrioritisation = {
      prioritisationId: input.prioritisationId,
      assemblyId: input.assemblyId,
      priorityRules: {
        rules: input.priorityRules,
      },
      rankingMetadata: input.rankingMetadata,
      freshnessMetadata: input.freshnessMetadata,
      trustMetadata: input.trustMetadata,
      sourceWeighting: input.sourceWeighting,
      conflictIndicators: input.conflictIndicators.map((statement) => ({ statement })),
      completenessIndicators: input.completenessIndicators.map((statement) => ({ statement })),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.prioritisation.set(prioritisation.prioritisationId, prioritisation)
    this.lastUpdatedAt = now()
    return prioritisation
  }

  getHealth(): KnowledgeAssemblyHealth {
    return {
      knowledgeAssemblyHealth: {
        status: this.invalidPlans > 0 || this.invalidPackages > 0 ? 'degraded' : 'healthy',
        registeredAssemblies: this.registry.list().length,
        activeSessions: Array.from(this.sessions.values()).filter((session) => session.status !== 'completed').length,
        contextsTracked: this.contexts.size,
        lastUpdatedAt: this.lastUpdatedAt,
      },
      retrievalPlanningHealth: {
        status: this.invalidPlans > 0 ? 'degraded' : 'healthy',
        plansTracked: this.plans.size,
        invalidPlans: this.invalidPlans,
        lastPlannedAt: this.lastPlannedAt,
      },
      knowledgePackageHealth: {
        status: this.invalidPackages > 0 ? 'degraded' : 'healthy',
        packagesTracked: this.packages.size,
        invalidPackages: this.invalidPackages,
        lastAssembledAt: this.lastAssembledAt,
      },
      sourceRegistryHealth: this.registry.getHealthSummary(),
    }
  }
}
