import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type ActionGovernanceInput,
  type ActionIntelligenceContextInput,
  type ActionIntelligenceRegistrationInput,
  type ActionIntelligenceSessionInput,
  type ActionLifecycleStage,
  type ActionPlanInput,
  type ActionReadinessInput,
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

export interface ActionIntelligenceMetadata {
  actionIntelligenceId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ActionIntelligenceDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface ActionIntelligenceSession {
  sessionId: string
  actionIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ActionOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface ActionProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ActionFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ActionGovernance {
  ownership: ActionOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: ActionProvenance
  freshness: ActionFreshness
}

export interface ActionIntelligenceContext {
  contextId: string
  actionIntelligenceId: string
  sessionId?: string
  governance: ActionGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ActionGroup {
  groupId: string
  title: string
  description?: string
  priority: ActionPriority
  metadata?: Metadata
}

export interface ActionItem {
  actionItemId: string
  groupId?: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'blocked' | 'deferred'
  priority: ActionPriority
  metadata?: Metadata
}

export interface ActionDependency {
  dependencyId: string
  fromActionItemId: string
  toActionItemId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface ActionConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ActionAssignment {
  assignmentId: string
  actionItemId: string
  assigneeType: 'system' | 'team' | 'user'
  assigneeId: string
  role?: string
  metadata?: Metadata
}

export interface ActionMilestone {
  milestoneId: string
  title: string
  description?: string
  targetDate?: IsoDateTime
  metadata?: Metadata
}

export interface ActionOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface ActionSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ActionLifecycleState {
  stage: ActionLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ActionPlan {
  actionPlanId: string
  actionIntelligenceId: string
  decisionReferences: {
    decisionIntelligenceId?: string
    decisionPackageId?: string
    decisionRecommendationIds: string[]
  }
  groups: ActionGroup[]
  actionItems: ActionItem[]
  dependencies: ActionDependency[]
  constraints: ActionConstraint[]
  assignments: ActionAssignment[]
  milestones: ActionMilestone[]
  outcomes: ActionOutcome[]
  lifecycleStates: ActionLifecycleState[]
  summary: ActionSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ActionIntelligenceRegistration extends ActionIntelligenceRegistrationInput {
  metadataModel: ActionIntelligenceMetadata
  registeredAt: IsoDateTime
}

export interface ActionIntelligenceRuntimeHealth {
  actionIntelligenceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredActionIntelligenceEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidActionIntelligenceEntries: number
    lastUpdatedAt: IsoDateTime
  }
  actionPlanHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    assignmentsTracked: number
    invalidPlans: number
    lastPlannedAt?: IsoDateTime
  }
  actionValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class ActionIntelligenceRegistry {
  private registrations: Map<string, ActionIntelligenceRegistration> = new Map()
  private sessions: Map<string, ActionIntelligenceSession> = new Map()
  private contexts: Map<string, ActionIntelligenceContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidActionIntelligenceEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ActionIntelligenceRegistrationInput): ActionIntelligenceRegistration {
    const validationResult = this.validation.validateActionIntelligence(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.actionIntelligenceId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.actionIntelligence('Duplicate action intelligence ID detected', {
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    if (!validationResult.valid) {
      this.invalidActionIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.actionIntelligence('Action intelligence registration validation failed', {
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    const registration: ActionIntelligenceRegistration = {
      ...input,
      metadataModel: {
        actionIntelligenceId: input.actionIntelligenceId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.actionIntelligenceId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: ActionIntelligenceSessionInput): ActionIntelligenceSession {
    if (!this.registrations.has(input.actionIntelligenceId)) {
      throw RuntimeError.actionIntelligence('Action intelligence registration not found', {
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.actionIntelligence('Duplicate action intelligence session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: ActionIntelligenceSession = {
      sessionId: input.sessionId,
      actionIntelligenceId: input.actionIntelligenceId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: ActionIntelligenceContextInput): ActionIntelligenceContext {
    if (!this.registrations.has(input.actionIntelligenceId)) {
      throw RuntimeError.actionIntelligence('Action intelligence registration not found for context', {
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.actionIntelligence('Action intelligence session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.actionIntelligence('Duplicate action intelligence context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateActionGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidActionIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.actionGovernance('Action governance validation failed', {
        contextId: input.contextId,
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    const context: ActionIntelligenceContext = {
      contextId: input.contextId,
      actionIntelligenceId: input.actionIntelligenceId,
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

  get(actionIntelligenceId: string): ActionIntelligenceRegistration | undefined {
    return this.registrations.get(actionIntelligenceId)
  }

  getSession(sessionId: string): ActionIntelligenceSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): ActionIntelligenceContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): ActionIntelligenceRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): ActionIntelligenceSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): ActionIntelligenceContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidActionIntelligenceCount(): number {
    return this.invalidActionIntelligenceEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'action-intelligence-registry',
      'Action Intelligence Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class ActionIntelligenceManager {
  private plans: Map<string, ActionPlan> = new Map()
  private diagnostics: ActionIntelligenceDiagnostics[] = []
  private invalidPlans = 0
  private lastPlannedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: ActionIntelligenceRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerActionIntelligence(input: ActionIntelligenceRegistrationInput): ActionIntelligenceRegistration {
    return this.registry.register(input)
  }

  startSession(input: ActionIntelligenceSessionInput): ActionIntelligenceSession {
    return this.registry.createSession(input)
  }

  createContext(input: ActionIntelligenceContextInput): ActionIntelligenceContext {
    return this.registry.createContext(input)
  }

  createActionPlan(input: ActionPlanInput): ActionPlan {
    if (!this.registry.get(input.actionIntelligenceId)) {
      throw RuntimeError.actionIntelligence('Action intelligence registration not found for action plan', {
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    const planValidation = this.validation.validateActionPlan(input)
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateActionLifecycle(state.stage).diagnostics
    )
    const readinessDiagnostics = this.validation.validateActionReadiness(input).diagnostics

    const diagnostics = [
      ...planValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...readinessDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `action-intelligence-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasLifecycleErrors = lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')
    const hasReadinessErrors = readinessDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (hasLifecycleErrors) {
      this.invalidPlans += 1
      throw RuntimeError.actionLifecycle('Action lifecycle validation failed', {
        actionPlanId: input.actionPlanId,
      })
    }

    if (!planValidation.valid) {
      this.invalidPlans += 1
      throw RuntimeError.actionPlan('Action plan validation failed', {
        actionPlanId: input.actionPlanId,
        actionIntelligenceId: input.actionIntelligenceId,
      })
    }

    if (hasReadinessErrors) {
      this.invalidPlans += 1
      throw RuntimeError.actionReadiness('Action readiness validation failed', {
        actionPlanId: input.actionPlanId,
      })
    }

    const actionPlan: ActionPlan = {
      ...input,
      createdAt: now(),
    }

    this.plans.set(actionPlan.actionPlanId, actionPlan)
    this.lastPlannedAt = now()
    this.lastUpdatedAt = now()
    return actionPlan
  }

  getActionPlan(actionPlanId: string): ActionPlan | undefined {
    return this.plans.get(actionPlanId)
  }

  listActionPlans(): ActionPlan[] {
    return Array.from(this.plans.values())
  }

  getHealth(): ActionIntelligenceRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const assignmentsTracked = this.listActionPlans().reduce((count, actionPlan) => {
      return count + actionPlan.assignments.length
    }, 0)

    return {
      actionIntelligenceHealth: {
        status: this.registry.getInvalidActionIntelligenceCount() > 0 ? 'degraded' : 'healthy',
        registeredActionIntelligenceEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidActionIntelligenceEntries: this.registry.getInvalidActionIntelligenceCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      actionPlanHealth: {
        status: this.invalidPlans > 0 ? 'degraded' : 'healthy',
        plansTracked: this.plans.size,
        assignmentsTracked,
        invalidPlans: this.invalidPlans,
        lastPlannedAt: this.lastPlannedAt,
      },
      actionValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
