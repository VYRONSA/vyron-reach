import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type TacticalGovernanceInput,
  type TacticalPlanInput,
  type TacticalPlanningContextInput,
  type TacticalPlanningRegistrationInput,
  type TacticalPlanningSessionInput,
  type TacticalPlanningStage,
  type TacticalRecommendationInput,
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

export interface TacticalPlanningMetadata {
  tacticalPlanningId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TacticalPlanningDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface TacticalPlanningSession {
  sessionId: string
  tacticalPlanningId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TacticalOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface TacticalProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface TacticalFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface TacticalGovernance {
  ownership: TacticalOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: TacticalProvenance
  freshness: TacticalFreshness
}

export interface TacticalPlanningContext {
  contextId: string
  tacticalPlanningId: string
  sessionId?: string
  governance: TacticalGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface TacticalObjective {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TacticalTask {
  taskId: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'blocked' | 'deferred'
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TacticalMilestone {
  milestoneId: string
  title: string
  description?: string
  targetDate?: IsoDateTime
  metadata?: Metadata
}

export interface TacticalDependency {
  dependencyId: string
  fromTaskId: string
  toTaskId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface TacticalConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface TacticalResource {
  resourceId: string
  resourceType: 'human' | 'budget' | 'tooling' | 'data' | 'time' | 'other'
  name: string
  quantity?: number
  unit?: string
  metadata?: Metadata
}

export interface TacticalSchedule {
  scheduleId: string
  startAt?: IsoDateTime
  endAt?: IsoDateTime
  checkpoints: Array<{
    checkpointId: string
    name: string
    dueAt?: IsoDateTime
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface TacticalOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface TacticalRecommendation {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface TacticalPlan {
  planId: string
  tacticalPlanningId: string
  stage: TacticalPlanningStage
  strategicReferences: {
    strategicReasoningId?: string
    strategicPlanningId?: string
    strategicRecommendationIds: string[]
  }
  objectives: TacticalObjective[]
  tasks: TacticalTask[]
  milestones: TacticalMilestone[]
  dependencies: TacticalDependency[]
  constraints: TacticalConstraint[]
  resources: TacticalResource[]
  schedule: TacticalSchedule
  outcomes: TacticalOutcome[]
  recommendations: TacticalRecommendation[]
  summary: {
    synopsis: string
    highlights: string[]
    risks: string[]
    nextActions: string[]
  }
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface TacticalPlanningStageState {
  stage: TacticalPlanningStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TacticalPlanningRegistration extends TacticalPlanningRegistrationInput {
  metadataModel: TacticalPlanningMetadata
  registeredAt: IsoDateTime
}

export interface TacticalPlanningRuntimeHealth {
  tacticalPlanningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredTacticalPlanningEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidTacticalPlanningEntries: number
    lastUpdatedAt: IsoDateTime
  }
  tacticalPlanHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    recommendationsTracked: number
    invalidPlans: number
    lastPlannedAt?: IsoDateTime
  }
  tacticalValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class TacticalPlanningRegistry {
  private registrations: Map<string, TacticalPlanningRegistration> = new Map()
  private sessions: Map<string, TacticalPlanningSession> = new Map()
  private contexts: Map<string, TacticalPlanningContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidTacticalPlanningEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: TacticalPlanningRegistrationInput): TacticalPlanningRegistration {
    const validationResult = this.validation.validateTacticalPlanning(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.tacticalPlanningId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.tacticalPlanning('Duplicate tactical planning ID detected', {
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    if (!validationResult.valid) {
      this.invalidTacticalPlanningEntries += 1
      this.validationRejected += 1
      throw RuntimeError.tacticalPlanning('Tactical planning registration validation failed', {
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    const registration: TacticalPlanningRegistration = {
      ...input,
      metadataModel: {
        tacticalPlanningId: input.tacticalPlanningId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.tacticalPlanningId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: TacticalPlanningSessionInput): TacticalPlanningSession {
    if (!this.registrations.has(input.tacticalPlanningId)) {
      throw RuntimeError.tacticalPlanning('Tactical planning registration not found', {
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.tacticalPlanning('Duplicate tactical planning session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: TacticalPlanningSession = {
      sessionId: input.sessionId,
      tacticalPlanningId: input.tacticalPlanningId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: TacticalPlanningContextInput): TacticalPlanningContext {
    if (!this.registrations.has(input.tacticalPlanningId)) {
      throw RuntimeError.tacticalPlanning('Tactical planning registration not found for context', {
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.tacticalPlanning('Tactical planning session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.tacticalPlanning('Duplicate tactical planning context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateTacticalGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidTacticalPlanningEntries += 1
      this.validationRejected += 1
      throw RuntimeError.tacticalGovernance('Tactical governance validation failed', {
        contextId: input.contextId,
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    const context: TacticalPlanningContext = {
      contextId: input.contextId,
      tacticalPlanningId: input.tacticalPlanningId,
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

  get(tacticalPlanningId: string): TacticalPlanningRegistration | undefined {
    return this.registrations.get(tacticalPlanningId)
  }

  getSession(sessionId: string): TacticalPlanningSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): TacticalPlanningContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): TacticalPlanningRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): TacticalPlanningSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): TacticalPlanningContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidTacticalPlanningCount(): number {
    return this.invalidTacticalPlanningEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'tactical-planning-registry',
      'Tactical Planning Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class TacticalPlanningManager {
  private plans: Map<string, TacticalPlan> = new Map()
  private diagnostics: TacticalPlanningDiagnostics[] = []
  private invalidPlans = 0
  private lastPlannedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: TacticalPlanningRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerTacticalPlanning(input: TacticalPlanningRegistrationInput): TacticalPlanningRegistration {
    return this.registry.register(input)
  }

  startSession(input: TacticalPlanningSessionInput): TacticalPlanningSession {
    return this.registry.createSession(input)
  }

  createContext(input: TacticalPlanningContextInput): TacticalPlanningContext {
    return this.registry.createContext(input)
  }

  createPlan(input: TacticalPlanInput): TacticalPlan {
    if (!this.registry.get(input.tacticalPlanningId)) {
      throw RuntimeError.tacticalPlanning('Tactical planning registration not found for tactical plan', {
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    const planValidation = this.validation.validateTacticalPlan(input)
    const stageValidation = this.validation.validateTacticalStage(input.stage)
    const recommendationDiagnostics = input.recommendations.flatMap((recommendation) =>
      this.validation.validateTacticalRecommendation(recommendation).diagnostics
    )

    const diagnostics = [
      ...planValidation.diagnostics,
      ...stageValidation.diagnostics,
      ...recommendationDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `tactical-planning-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
      this.invalidPlans += 1
      throw RuntimeError.tacticalStage('Tactical plan stage validation failed', {
        planId: input.planId,
        stage: input.stage,
      })
    }

    if (!planValidation.valid) {
      this.invalidPlans += 1
      throw RuntimeError.tacticalPlan('Tactical plan validation failed', {
        planId: input.planId,
        tacticalPlanningId: input.tacticalPlanningId,
      })
    }

    if (hasRecommendationErrors) {
      this.invalidPlans += 1
      throw RuntimeError.tacticalRecommendation('Tactical recommendation validation failed', {
        planId: input.planId,
      })
    }

    const plan: TacticalPlan = {
      ...input,
      createdAt: now(),
    }

    this.plans.set(plan.planId, plan)
    this.lastPlannedAt = now()
    this.lastUpdatedAt = now()
    return plan
  }

  getPlan(planId: string): TacticalPlan | undefined {
    return this.plans.get(planId)
  }

  listPlans(): TacticalPlan[] {
    return Array.from(this.plans.values())
  }

  getHealth(): TacticalPlanningRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const recommendationsTracked = this.listPlans().reduce((count, plan) => {
      return count + plan.recommendations.length
    }, 0)

    return {
      tacticalPlanningHealth: {
        status: this.registry.getInvalidTacticalPlanningCount() > 0 ? 'degraded' : 'healthy',
        registeredTacticalPlanningEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidTacticalPlanningEntries: this.registry.getInvalidTacticalPlanningCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      tacticalPlanHealth: {
        status: this.invalidPlans > 0 ? 'degraded' : 'healthy',
        plansTracked: this.plans.size,
        recommendationsTracked,
        invalidPlans: this.invalidPlans,
        lastPlannedAt: this.lastPlannedAt,
      },
      tacticalValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
