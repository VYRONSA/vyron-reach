import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type StrategicGovernanceInput,
  type StrategicPlanningInput,
  type StrategicReasoningContextInput,
  type StrategicReasoningRegistrationInput,
  type StrategicReasoningSessionInput,
  type StrategicRecommendationInput,
  type StrategicThinkingStage,
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

export interface StrategicReasoningMetadata {
  strategicReasoningId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface StrategicReasoningDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface StrategicReasoningSession {
  sessionId: string
  strategicReasoningId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface StrategicOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface StrategicProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface StrategicFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface StrategicGovernance {
  ownership: StrategicOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: StrategicProvenance
  freshness: StrategicFreshness
}

export interface StrategicReasoningContext {
  contextId: string
  strategicReasoningId: string
  sessionId?: string
  governance: StrategicGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface StrategicObjective {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicProblem {
  problemId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface StrategicAssumption {
  assumptionId: string
  statement: string
  confidence: number
  metadata?: Metadata
}

export interface StrategicOpportunity {
  opportunityId: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicRisk {
  riskId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation?: string
  metadata?: Metadata
}

export interface StrategicScenario {
  scenarioId: string
  name: string
  description: string
  likelihood: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface StrategicRecommendation {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface StrategicPlanningModel {
  planningId: string
  strategicReasoningId: string
  stage: StrategicThinkingStage
  objectives: StrategicObjective[]
  problems: StrategicProblem[]
  constraints: StrategicConstraint[]
  assumptions: StrategicAssumption[]
  opportunities: StrategicOpportunity[]
  risks: StrategicRisk[]
  scenarios: StrategicScenario[]
  outcomes: StrategicOutcome[]
  recommendations: StrategicRecommendation[]
  summary: {
    synopsis: string
    highlights: string[]
    risks: string[]
    nextActions: string[]
  }
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface StrategicThinkingStageState {
  stage: StrategicThinkingStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface StrategicReasoningRegistration extends StrategicReasoningRegistrationInput {
  metadataModel: StrategicReasoningMetadata
  registeredAt: IsoDateTime
}

export interface StrategicReasoningRuntimeHealth {
  strategicReasoningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredStrategicReasoningEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidStrategicReasoningEntries: number
    lastUpdatedAt: IsoDateTime
  }
  strategicPlanningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    planningModelsTracked: number
    recommendationsTracked: number
    invalidPlanningModels: number
    lastPlanningAt?: IsoDateTime
  }
  strategicValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class StrategicReasoningRegistry {
  private registrations: Map<string, StrategicReasoningRegistration> = new Map()
  private sessions: Map<string, StrategicReasoningSession> = new Map()
  private contexts: Map<string, StrategicReasoningContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidStrategicReasoningEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: StrategicReasoningRegistrationInput): StrategicReasoningRegistration {
    const validationResult = this.validation.validateStrategicReasoning(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.strategicReasoningId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.strategicReasoning('Duplicate strategic reasoning ID detected', {
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    if (!validationResult.valid) {
      this.invalidStrategicReasoningEntries += 1
      this.validationRejected += 1
      throw RuntimeError.strategicReasoning('Strategic reasoning registration validation failed', {
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    const registration: StrategicReasoningRegistration = {
      ...input,
      metadataModel: {
        strategicReasoningId: input.strategicReasoningId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.strategicReasoningId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: StrategicReasoningSessionInput): StrategicReasoningSession {
    if (!this.registrations.has(input.strategicReasoningId)) {
      throw RuntimeError.strategicReasoning('Strategic reasoning registration not found', {
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.strategicReasoning('Duplicate strategic reasoning session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: StrategicReasoningSession = {
      sessionId: input.sessionId,
      strategicReasoningId: input.strategicReasoningId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: StrategicReasoningContextInput): StrategicReasoningContext {
    if (!this.registrations.has(input.strategicReasoningId)) {
      throw RuntimeError.strategicReasoning('Strategic reasoning registration not found for context', {
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.strategicReasoning('Strategic reasoning session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.strategicReasoning('Duplicate strategic reasoning context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateStrategicGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidStrategicReasoningEntries += 1
      this.validationRejected += 1
      throw RuntimeError.strategicGovernance('Strategic governance validation failed', {
        contextId: input.contextId,
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    const context: StrategicReasoningContext = {
      contextId: input.contextId,
      strategicReasoningId: input.strategicReasoningId,
      sessionId: input.sessionId,
      governance: input.governance,
      scope: input.scope,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  get(strategicReasoningId: string): StrategicReasoningRegistration | undefined {
    return this.registrations.get(strategicReasoningId)
  }

  getSession(sessionId: string): StrategicReasoningSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): StrategicReasoningContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): StrategicReasoningRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): StrategicReasoningSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): StrategicReasoningContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidStrategicReasoningCount(): number {
    return this.invalidStrategicReasoningEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'strategic-reasoning-registry',
      'Strategic Reasoning Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class StrategicReasoningManager {
  private planningModels: Map<string, StrategicPlanningModel> = new Map()
  private diagnostics: StrategicReasoningDiagnostics[] = []
  private invalidPlanningModels = 0
  private lastPlanningAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: StrategicReasoningRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerStrategicReasoning(input: StrategicReasoningRegistrationInput): StrategicReasoningRegistration {
    return this.registry.register(input)
  }

  startSession(input: StrategicReasoningSessionInput): StrategicReasoningSession {
    return this.registry.createSession(input)
  }

  createContext(input: StrategicReasoningContextInput): StrategicReasoningContext {
    return this.registry.createContext(input)
  }

  createPlanningModel(input: StrategicPlanningInput): StrategicPlanningModel {
    if (!this.registry.get(input.strategicReasoningId)) {
      throw RuntimeError.strategicReasoning('Strategic reasoning registration not found for strategic planning', {
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    const planningValidation = this.validation.validateStrategicPlanning(input)
    const stageValidation = this.validation.validateStrategicStage(input.stage)
    const recommendationDiagnostics = input.recommendations.flatMap((recommendation) =>
      this.validation.validateStrategicRecommendation(recommendation).diagnostics
    )

    const diagnostics = [
      ...planningValidation.diagnostics,
      ...stageValidation.diagnostics,
      ...recommendationDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `strategic-reasoning-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasRecommendationErrors = recommendationDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (!stageValidation.valid) {
      this.invalidPlanningModels += 1
      throw RuntimeError.strategicStage('Strategic planning stage validation failed', {
        planningId: input.planningId,
        stage: input.stage,
      })
    }

    if (!planningValidation.valid) {
      this.invalidPlanningModels += 1
      throw RuntimeError.strategicPlanning('Strategic planning validation failed', {
        planningId: input.planningId,
        strategicReasoningId: input.strategicReasoningId,
      })
    }

    if (hasRecommendationErrors) {
      this.invalidPlanningModels += 1
      throw RuntimeError.strategicRecommendation('Strategic recommendation validation failed', {
        planningId: input.planningId,
      })
    }

    const planningModel: StrategicPlanningModel = {
      ...input,
      createdAt: now(),
    }

    this.planningModels.set(planningModel.planningId, planningModel)
    this.lastPlanningAt = now()
    this.lastUpdatedAt = now()
    return planningModel
  }

  getPlanningModel(planningId: string): StrategicPlanningModel | undefined {
    return this.planningModels.get(planningId)
  }

  listPlanningModels(): StrategicPlanningModel[] {
    return Array.from(this.planningModels.values())
  }

  getHealth(): StrategicReasoningRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const recommendationsTracked = this.listPlanningModels().reduce((count, planning) => {
      return count + planning.recommendations.length
    }, 0)

    return {
      strategicReasoningHealth: {
        status: this.registry.getInvalidStrategicReasoningCount() > 0 ? 'degraded' : 'healthy',
        registeredStrategicReasoningEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidStrategicReasoningEntries: this.registry.getInvalidStrategicReasoningCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      strategicPlanningHealth: {
        status: this.invalidPlanningModels > 0 ? 'degraded' : 'healthy',
        planningModelsTracked: this.planningModels.size,
        recommendationsTracked,
        invalidPlanningModels: this.invalidPlanningModels,
        lastPlanningAt: this.lastPlanningAt,
      },
      strategicValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
