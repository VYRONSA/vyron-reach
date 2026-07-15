import type { IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type QueryPlanInput,
  type QueryPlanningRegistrationInput,
  type RetrievalPackageInput,
  type RetrievalStrategyDefinitionInput,
  type SourcePlanningInput,
  type StrategyGovernanceInput,
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

export type QueryIntent =
  | 'knowledge-discovery'
  | 'policy-discovery'
  | 'constraint-discovery'
  | 'decision-trace'
  | 'context-summary'

export type QueryScope = 'session' | 'request' | 'workflow' | 'tenant' | 'global'
export type QueryPriority = 'low' | 'medium' | 'high' | 'critical'

export interface RetrievalQuery {
  queryId: string
  queryText: string
  intent: QueryIntent
  scope: QueryScope
  priority: QueryPriority
  constraints: QueryConstraints
  expansion: QueryExpansion
  reduction: QueryReduction
  optimisation: QueryOptimisation
  metadata: QueryMetadata
}

export interface QueryConstraints {
  maxSources: number
  maxResults: number
  hardTimeoutMs: number
  includeHistoricalDecisions: boolean
  includePolicies: boolean
  includeConstraints: boolean
}

export interface QueryExpansion {
  enabled: boolean
  terms: string[]
  rationale?: string
}

export interface QueryReduction {
  enabled: boolean
  includeTerms: string[]
  excludeTerms: string[]
  rationale?: string
}

export interface QueryOptimisation {
  mode: 'none' | 'latency-first' | 'coverage-first' | 'precision-first'
  hints: string[]
}

export interface QueryMetadata {
  queryVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface StrategyOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface StrategyProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface StrategyGovernance {
  ownership: StrategyOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: StrategyProvenance
}

export interface SequentialRetrievalStrategy {
  strategyId: string
  kind: 'sequential'
  order: string[]
  governance: StrategyGovernance
  metadata?: Metadata
}

export interface ParallelRetrievalStrategy {
  strategyId: string
  kind: 'parallel'
  sourceGroups: string[][]
  governance: StrategyGovernance
  metadata?: Metadata
}

export interface ConditionalRetrievalStrategy {
  strategyId: string
  kind: 'conditional'
  conditions: Array<{ conditionId: string; expression: string; onTrueSourceIds: string[]; onFalseSourceIds: string[] }>
  governance: StrategyGovernance
  metadata?: Metadata
}

export interface IncrementalRetrievalStrategy {
  strategyId: string
  kind: 'incremental'
  phases: Array<{ phaseId: string; sourceIds: string[]; expectedKnowledge: string[] }>
  governance: StrategyGovernance
  metadata?: Metadata
}

export interface CachedRetrievalStrategy {
  strategyId: string
  kind: 'cached'
  cacheScope: QueryScope
  cacheTtlMs: number
  fallbackSourceIds: string[]
  governance: StrategyGovernance
  metadata?: Metadata
}

export interface DeferredRetrievalStrategy {
  strategyId: string
  kind: 'deferred'
  deferredUntil: IsoDateTime
  deferredSourceIds: string[]
  governance: StrategyGovernance
  metadata?: Metadata
}

export type RetrievalStrategyModel =
  | SequentialRetrievalStrategy
  | ParallelRetrievalStrategy
  | ConditionalRetrievalStrategy
  | IncrementalRetrievalStrategy
  | CachedRetrievalStrategy
  | DeferredRetrievalStrategy

export interface SourcePlanningDescriptor {
  sourceId: string
  target:
    | 'business-brain'
    | 'memory-engine'
    | 'workflow-engine'
    | 'runtime-context'
    | 'ai-team'
    | 'prompt-construction'
    | 'execution-gateway'
    | 'provider-runtime'
    | 'tenant-configuration'
    | 'future-domain-packs'
  queryScope: QueryScope
  enabled: boolean
  metadata?: Metadata
}

export interface PlannedSource {
  sourceId: string
  order: number
  strategyHint: string
  metadata?: Metadata
}

export interface PlannedQuery {
  queryId: string
  sourceId: string
  intent: QueryIntent
  queryText: string
  metadata?: Metadata
}

export interface RetrievalDependency {
  dependencyId: string
  dependsOnSourceId: string
  requiredBySourceId: string
  rationale?: string
}

export interface RetrievalOrdering {
  orderedSourceIds: string[]
  mode: 'sequential' | 'parallel' | 'hybrid'
}

export interface ExpectedEvidence {
  statement: string
}

export interface ExpectedKnowledge {
  statement: string
}

export interface ExpectedContext {
  statement: string
}

export interface RetrievalGap {
  statement: string
  severity: 'low' | 'medium' | 'high'
}

export interface RetrievalRisk {
  statement: string
  severity: 'low' | 'medium' | 'high'
}

export interface RetrievalPackage {
  packageId: string
  planningId: string
  plannedSources: PlannedSource[]
  plannedQueries: PlannedQuery[]
  retrievalDependencies: RetrievalDependency[]
  retrievalOrdering: RetrievalOrdering
  expectedEvidence: ExpectedEvidence[]
  expectedKnowledge: ExpectedKnowledge[]
  expectedContext: ExpectedContext[]
  retrievalGaps: RetrievalGap[]
  retrievalRisks: RetrievalRisk[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface QueryPlanningMetadata {
  planningId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface QueryPlanningDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface QueryPlanningContext {
  contextId: string
  planningId: string
  queryScope: QueryScope
  queryIntent: QueryIntent
  sourceIds: string[]
  metadata?: Metadata
  createdAt: IsoDateTime
}

export interface QueryPlanningRegistration extends QueryPlanningRegistrationInput {
  metadataModel: QueryPlanningMetadata
  registeredAt: IsoDateTime
}

export interface RetrievalStrategyRegistration extends RetrievalStrategyDefinitionInput {
  registeredAt: IsoDateTime
}

export interface RetrievalStrategyRuntimeHealth {
  retrievalStrategyHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredStrategies: number
    invalidStrategies: number
    lastUpdatedAt: IsoDateTime
  }
  queryPlanningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    contextsTracked: number
    invalidPlans: number
    lastPlannedAt?: IsoDateTime
  }
  retrievalPackageHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    packagesTracked: number
    invalidPackages: number
    lastPackagedAt?: IsoDateTime
  }
  strategyValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class QueryPlanningRegistry {
  private registrations: Map<string, QueryPlanningRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: QueryPlanningRegistrationInput): QueryPlanningRegistration {
    if (this.registrations.has(input.planningId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.queryPlanning('Duplicate query planning ID detected', {
        planningId: input.planningId,
      })
    }

    const registration: QueryPlanningRegistration = {
      ...input,
      metadataModel: {
        planningId: input.planningId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.planningId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(planningId: string): QueryPlanningRegistration | undefined {
    return this.registrations.get(planningId)
  }

  list(): QueryPlanningRegistration[] {
    return Array.from(this.registrations.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'query-planning-registry',
      'Query Planning Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class RetrievalStrategyRegistry {
  private strategies: Map<string, RetrievalStrategyRegistration> = new Map()
  private sourcePlanning: Map<string, SourcePlanningDescriptor> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerStrategy(input: RetrievalStrategyDefinitionInput): RetrievalStrategyRegistration {
    const strategyValidation = this.validation.validateRetrievalStrategy(input)
    this.diagnostics.push(...strategyValidation.diagnostics)

    if (this.strategies.has(input.strategyId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.retrievalStrategy('Duplicate retrieval strategy ID detected', {
        strategyId: input.strategyId,
      })
    }

    if (!strategyValidation.valid) {
      this.validationRejected += 1
      throw RuntimeError.retrievalStrategy('Retrieval strategy validation failed', {
        strategyId: input.strategyId,
        diagnosticsCount: strategyValidation.diagnostics.length,
      })
    }

    const registration: RetrievalStrategyRegistration = {
      ...input,
      registeredAt: now(),
    }

    this.strategies.set(input.strategyId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  registerSourcePlanning(input: SourcePlanningInput): SourcePlanningDescriptor {
    const sourceValidation = this.validation.validateSourcePlanning(input)
    this.diagnostics.push(...sourceValidation.diagnostics)

    if (!sourceValidation.valid) {
      this.validationRejected += 1
      throw RuntimeError.sourcePlanning('Source planning validation failed', {
        sourceId: input.sourceId,
        diagnosticsCount: sourceValidation.diagnostics.length,
      })
    }

    const descriptor: SourcePlanningDescriptor = {
      sourceId: input.sourceId,
      target: input.target,
      queryScope: input.queryScope,
      enabled: input.enabled,
      metadata: input.metadata,
    }

    this.sourcePlanning.set(input.sourceId, descriptor)
    this.lastUpdatedAt = now()
    return descriptor
  }

  getStrategy(strategyId: string): RetrievalStrategyRegistration | undefined {
    return this.strategies.get(strategyId)
  }

  listStrategies(): RetrievalStrategyRegistration[] {
    return Array.from(this.strategies.values())
  }

  getSourcePlanning(sourceId: string): SourcePlanningDescriptor | undefined {
    return this.sourcePlanning.get(sourceId)
  }

  listSourcePlanning(): SourcePlanningDescriptor[] {
    return Array.from(this.sourcePlanning.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'retrieval-strategy-registry',
      'Retrieval Strategy Registry',
      this.strategies.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class QueryPlanningManager {
  private contexts: Map<string, QueryPlanningContext> = new Map()
  private plans: Map<string, RetrievalQuery[]> = new Map()
  private diagnostics: QueryPlanningDiagnostics[] = []
  private invalidPlans = 0
  private lastPlannedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: QueryPlanningRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerPlanning(input: QueryPlanningRegistrationInput): QueryPlanningRegistration {
    return this.registry.register(input)
  }

  createContext(
    planningId: string,
    queryScope: QueryScope,
    queryIntent: QueryIntent,
    sourceIds: string[],
    metadata?: Metadata
  ): QueryPlanningContext {
    if (!this.registry.get(planningId)) {
      throw RuntimeError.queryPlanning('Query planning registration not found', { planningId })
    }

    const context: QueryPlanningContext = {
      contextId: `query-planning-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      planningId,
      queryScope,
      queryIntent,
      sourceIds,
      metadata,
      createdAt: now(),
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  planQueries(planningId: string, queries: QueryPlanInput[]): RetrievalQuery[] {
    if (!this.registry.get(planningId)) {
      throw RuntimeError.queryPlanning('Query planning registration not found for plan', { planningId })
    }

    const models: RetrievalQuery[] = []
    for (const input of queries) {
      const validation = this.validation.validateQueryPlan(input)
      if (!validation.valid) {
        this.invalidPlans += 1
        throw RuntimeError.queryPlanning('Query plan validation failed', {
          queryId: input.queryId,
          diagnosticsCount: validation.diagnostics.length,
        })
      }

      models.push({
        queryId: input.queryId,
        queryText: input.queryText,
        intent: input.intent,
        scope: input.scope,
        priority: input.priority,
        constraints: input.constraints,
        expansion: input.expansion,
        reduction: input.reduction,
        optimisation: input.optimisation,
        metadata: {
          queryVersion: input.metadata.queryVersion,
          createdAt: input.metadata.createdAt,
          updatedAt: input.metadata.updatedAt,
          metadata: input.metadata.metadata,
        },
      })
    }

    this.plans.set(planningId, models)
    this.lastPlannedAt = now()
    this.lastUpdatedAt = now()
    return models
  }

  listPlans(planningId: string): RetrievalQuery[] {
    return [...(this.plans.get(planningId) ?? [])]
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    contextsTracked: number
    invalidPlans: number
    lastPlannedAt?: IsoDateTime
    lastUpdatedAt: IsoDateTime
  } {
    return {
      status: this.invalidPlans > 0 ? 'degraded' : 'healthy',
      plansTracked: this.plans.size,
      contextsTracked: this.contexts.size,
      invalidPlans: this.invalidPlans,
      lastPlannedAt: this.lastPlannedAt,
      lastUpdatedAt: this.lastUpdatedAt,
    }
  }
}

export class RetrievalStrategyManager {
  private retrievalPackages: Map<string, RetrievalPackage> = new Map()
  private invalidStrategies = 0
  private invalidPackages = 0
  private lastPackagedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: RetrievalStrategyRegistry,
    private queryPlanningManager: QueryPlanningManager,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerStrategy(input: RetrievalStrategyDefinitionInput): RetrievalStrategyRegistration {
    const governanceValidation = this.validation.validateStrategyGovernance(input.governance)
    if (!governanceValidation.valid) {
      this.invalidStrategies += 1
      throw RuntimeError.strategyGovernance('Retrieval strategy governance validation failed', {
        strategyId: input.strategyId,
        diagnosticsCount: governanceValidation.diagnostics.length,
      })
    }

    return this.registry.registerStrategy(input)
  }

  registerSourcePlanning(input: SourcePlanningInput): SourcePlanningDescriptor {
    return this.registry.registerSourcePlanning(input)
  }

  createRetrievalPackage(input: RetrievalPackageInput): RetrievalPackage {
    const packageValidation = this.validation.validateRetrievalPackage(input)
    if (!packageValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.retrievalPackage('Retrieval package validation failed', {
        packageId: input.packageId,
        diagnosticsCount: packageValidation.diagnostics.length,
      })
    }

    const plannedQueries = input.plannedQueries.map((query) => ({
      queryId: query.queryId,
      sourceId: query.sourceId,
      intent: query.intent,
      queryText: query.queryText,
      metadata: query.metadata,
    }))

    const retrievalPackage: RetrievalPackage = {
      packageId: input.packageId,
      planningId: input.planningId,
      plannedSources: input.plannedSources,
      plannedQueries,
      retrievalDependencies: input.retrievalDependencies,
      retrievalOrdering: input.retrievalOrdering,
      expectedEvidence: input.expectedEvidence.map((statement) => ({ statement })),
      expectedKnowledge: input.expectedKnowledge.map((statement) => ({ statement })),
      expectedContext: input.expectedContext.map((statement) => ({ statement })),
      retrievalGaps: input.retrievalGaps.map((gap) => ({ statement: gap.statement, severity: gap.severity })),
      retrievalRisks: input.retrievalRisks.map((risk) => ({ statement: risk.statement, severity: risk.severity })),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.retrievalPackages.set(retrievalPackage.packageId, retrievalPackage)
    this.lastPackagedAt = now()
    this.lastUpdatedAt = now()
    return retrievalPackage
  }

  getHealth(): RetrievalStrategyRuntimeHealth {
    const diagnostics = this.registry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const planningHealth = this.queryPlanningManager.getHealth()

    return {
      retrievalStrategyHealth: {
        status: this.invalidStrategies > 0 ? 'degraded' : 'healthy',
        registeredStrategies: this.registry.listStrategies().length,
        invalidStrategies: this.invalidStrategies,
        lastUpdatedAt: this.lastUpdatedAt,
      },
      queryPlanningHealth: {
        status: planningHealth.status,
        plansTracked: planningHealth.plansTracked,
        contextsTracked: planningHealth.contextsTracked,
        invalidPlans: planningHealth.invalidPlans,
        lastPlannedAt: planningHealth.lastPlannedAt,
      },
      retrievalPackageHealth: {
        status: this.invalidPackages > 0 ? 'degraded' : 'healthy',
        packagesTracked: this.retrievalPackages.size,
        invalidPackages: this.invalidPackages,
        lastPackagedAt: this.lastPackagedAt,
      },
      strategyValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
    }
  }
}
