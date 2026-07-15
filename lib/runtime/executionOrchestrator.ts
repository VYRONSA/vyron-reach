import type { ConfidenceScore, IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type ExecutionContextInput,
  type ExecutionGovernanceInput,
  type ExecutionPlanInput,
  type ExecutionRegistrationInput,
  type ExecutionStageInput,
  type ExecutionWorkPackageInput,
  type RegistrationDiagnostic,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export type ExecutionPipelineState =
  | 'request-accepted'
  | 'context-prepared'
  | 'memory-ready'
  | 'business-brain-ready'
  | 'prompt-ready'
  | 'provider-selected'
  | 'awaiting-execution'
  | 'executing'
  | 'awaiting-validation'
  | 'validated'
  | 'awaiting-approval'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ExecutionGovernance {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: ConfidenceScore
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
  version: VersionString
  audit: {
    createdBy: string
    createdAt: IsoDateTime
    updatedAt?: IsoDateTime
  }
}

export interface ExecutionStage {
  stageId: string
  state: ExecutionPipelineState
  order: number
  dependencies: ExecutionPipelineState[]
  description?: string
  metadata?: Metadata
}

export interface ExecutionWorkPackage {
  workPackageId: string
  assignedAITeamId: string
  assignedSpecialistId: string
  promptPackageId: string
  contextPackageId: string
  providerSelection: {
    providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
    providerId?: string
    model?: string
  }
  expectedOutput: string[]
  validationRequirements: string[]
  reviewRequirements: string[]
  approvalRequirements: string[]
  metadata?: Metadata
}

export interface ExecutionContext {
  contextId: string
  executionId: string
  runtimeContext: Metadata
  memoryContext: Metadata
  businessBrainContext: Metadata
  workflowContext: Metadata
  reasoningContext: Metadata
  aiTeamContext: Metadata
  providerContext: Metadata
  userContext: Metadata
  tenantContext: Metadata
  preparedAt: IsoDateTime
}

export interface ExecutionPlan {
  planId: string
  executionId: string
  workPackage: ExecutionWorkPackage
  stages: ExecutionStage[]
  currentState: ExecutionPipelineState
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionSession {
  sessionId: string
  executionId: string
  state: ExecutionPipelineState
  startedAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface ExecutionMetadata {
  executionId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  governance: ExecutionGovernance
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface ExecutionRegistration extends ExecutionRegistrationInput {
  metadataModel: ExecutionMetadata
  registeredAt: IsoDateTime
}

export interface RuntimeCoordinationContract {
  executionId: string
  coordination: {
    aiTeam: {
      teamId: string
      specialistId: string
      responsibilities: string[]
    }
    promptConstruction: {
      promptId: string
      templateId?: string
      packageId?: string
    }
    providerRuntime: {
      providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
      providerId?: string
    }
    memoryEngine: {
      memoryIds: string[]
      readiness: 'pending' | 'ready'
    }
    businessBrain: {
      knowledgeRefs: string[]
      readiness: 'pending' | 'ready'
    }
    workflowEngine: {
      workflowId?: string
      instanceId?: string
    }
    reasoningPipeline: {
      pipelineId?: string
      stage?: string
    }
  }
  createdAt: IsoDateTime
}

export interface ExecutionOrchestratorHealth {
  executionRegistryHealth: RegistryHealthSummary
  executionPipelineHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    activeSessions: number
    byState: Record<ExecutionPipelineState, number>
    invalidTransitions: number
    lastTransitionAt?: IsoDateTime
  }
  executionValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
  executionOrchestratorHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredExecutions: number
    plansTracked: number
    contextsPrepared: number
    lastUpdatedAt: IsoDateTime
  }
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

export class ExecutionRegistry {
  private executions: Map<string, ExecutionRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ExecutionRegistrationInput): ExecutionRegistration {
    const registrationValidation = this.validation.validateExecutionRegistration(
      input,
      new Set(this.executions.keys())
    )
    const governanceValidation = this.validation.validateExecutionGovernance(input.executionId, input.governance)

    const diagnostics = [...registrationValidation.diagnostics, ...governanceValidation.diagnostics]
    this.diagnostics.push(...diagnostics)

    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.executionRegistration('Execution registration validation failed', {
        executionId: input.executionId,
        diagnosticsCount: diagnostics.length,
      })
    }

    const registration: ExecutionRegistration = {
      ...input,
      metadataModel: {
        executionId: input.executionId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        governance: input.governance,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.executions.set(registration.executionId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(executionId: string): ExecutionRegistration | undefined {
    return this.executions.get(executionId)
  }

  list(): ExecutionRegistration[] {
    return Array.from(this.executions.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'execution-registry',
      'Execution Registry',
      this.executions.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class ExecutionOrchestrator {
  private sessions: Map<string, ExecutionSession> = new Map()
  private contexts: Map<string, ExecutionContext> = new Map()
  private plans: Map<string, ExecutionPlan> = new Map()
  private coordination: Map<string, RuntimeCoordinationContract> = new Map()
  private diagnostics: ExecutionDiagnostics[] = []
  private invalidTransitions = 0
  private lastTransitionAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private executionRegistry: ExecutionRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerExecution(input: ExecutionRegistrationInput): ExecutionRegistration {
    const registration = this.executionRegistry.register(input)
    this.recordDiagnostic('EXECUTION_REGISTERED', `Execution registered: ${registration.executionId}`, 'info', registration.executionId)
    this.lastUpdatedAt = now()
    return registration
  }

  prepareContext(input: ExecutionContextInput): ExecutionContext {
    const validation = this.validation.validateExecutionContext(input)
    if (!validation.valid) {
      throw RuntimeError.executionContext('Execution context validation failed', {
        executionId: input.executionId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const registration = this.executionRegistry.get(input.executionId)
    if (!registration) {
      throw RuntimeError.executionContext('Execution is not registered', {
        executionId: input.executionId,
      })
    }

    const context: ExecutionContext = {
      contextId: `execution-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionId: input.executionId,
      runtimeContext: input.runtimeContext,
      memoryContext: input.memoryContext,
      businessBrainContext: input.businessBrainContext,
      workflowContext: input.workflowContext,
      reasoningContext: input.reasoningContext,
      aiTeamContext: input.aiTeamContext,
      providerContext: input.providerContext,
      userContext: input.userContext,
      tenantContext: input.tenantContext,
      preparedAt: now(),
    }

    this.contexts.set(context.contextId, context)
    this.lastUpdatedAt = now()
    return context
  }

  createPlan(input: ExecutionPlanInput): ExecutionPlan {
    const planValidation = this.validation.validateExecutionPlan(input)
    if (!planValidation.valid) {
      throw RuntimeError.executionPlanning('Execution plan validation failed', {
        executionId: input.executionId,
        diagnosticsCount: planValidation.diagnostics.length,
      })
    }

    const stageModels: ExecutionStage[] = []
    const seenStates = new Set<ExecutionPipelineState>()

    for (const stage of input.stages) {
      const stageValidation = this.validation.validateExecutionStage(stage, seenStates)
      if (!stageValidation.valid) {
        throw RuntimeError.executionStage('Execution stage validation failed', {
          stageId: stage.stageId,
          diagnosticsCount: stageValidation.diagnostics.length,
        })
      }

      seenStates.add(stage.state)
      stageModels.push({
        stageId: stage.stageId,
        state: stage.state,
        order: stage.order,
        dependencies: stage.dependencies,
        description: stage.description,
        metadata: stage.metadata,
      })
    }

    const workPackage: ExecutionWorkPackage = {
      workPackageId: input.workPackage.workPackageId,
      assignedAITeamId: input.workPackage.assignedAITeamId,
      assignedSpecialistId: input.workPackage.assignedSpecialistId,
      promptPackageId: input.workPackage.promptPackageId,
      contextPackageId: input.workPackage.contextPackageId,
      providerSelection: input.workPackage.providerSelection,
      expectedOutput: input.workPackage.expectedOutput,
      validationRequirements: input.workPackage.validationRequirements,
      reviewRequirements: input.workPackage.reviewRequirements,
      approvalRequirements: input.workPackage.approvalRequirements,
      metadata: input.workPackage.metadata,
    }

    const plan: ExecutionPlan = {
      planId: input.planId,
      executionId: input.executionId,
      workPackage,
      stages: stageModels.sort((a, b) => a.order - b.order),
      currentState: 'request-accepted',
      createdAt: now(),
      metadata: input.metadata,
    }

    this.plans.set(plan.planId, plan)
    this.lastUpdatedAt = now()
    this.recordDiagnostic('EXECUTION_PLAN_CREATED', `Execution plan created: ${plan.planId}`, 'info', plan.planId)
    return plan
  }

  createSession(executionId: string): ExecutionSession {
    const registration = this.executionRegistry.get(executionId)
    if (!registration) {
      throw RuntimeError.executionRegistration('Execution not registered for session', { executionId })
    }

    const session: ExecutionSession = {
      sessionId: `execution-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionId,
      state: 'request-accepted',
      startedAt: now(),
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  setSessionState(sessionId: string, nextState: ExecutionPipelineState): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw RuntimeError.executionStage('Execution session not found for state transition', { sessionId })
    }

    const allowedTransitions: Record<ExecutionPipelineState, ExecutionPipelineState[]> = {
      'request-accepted': ['context-prepared', 'cancelled', 'failed'],
      'context-prepared': ['memory-ready', 'cancelled', 'failed'],
      'memory-ready': ['business-brain-ready', 'cancelled', 'failed'],
      'business-brain-ready': ['prompt-ready', 'cancelled', 'failed'],
      'prompt-ready': ['provider-selected', 'cancelled', 'failed'],
      'provider-selected': ['awaiting-execution', 'cancelled', 'failed'],
      'awaiting-execution': ['executing', 'cancelled', 'failed'],
      executing: ['awaiting-validation', 'failed', 'cancelled'],
      'awaiting-validation': ['validated', 'failed', 'cancelled'],
      validated: ['awaiting-approval', 'completed', 'failed', 'cancelled'],
      'awaiting-approval': ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: [],
      cancelled: [],
    }

    if (!allowedTransitions[session.state].includes(nextState)) {
      this.invalidTransitions += 1
      throw RuntimeError.executionStage('Invalid execution session transition', {
        currentState: session.state,
        nextState,
      })
    }

    session.state = nextState
    session.updatedAt = now()
    this.sessions.set(sessionId, session)
    this.lastTransitionAt = now()
    this.lastUpdatedAt = now()
  }

  registerCoordinationContract(executionId: string, contract: RuntimeCoordinationContract['coordination']): RuntimeCoordinationContract {
    const registration = this.executionRegistry.get(executionId)
    if (!registration) {
      throw RuntimeError.executionRegistration('Execution not registered for coordination contract', { executionId })
    }

    const model: RuntimeCoordinationContract = {
      executionId,
      coordination: contract,
      createdAt: now(),
    }

    this.coordination.set(executionId, model)
    this.lastUpdatedAt = now()
    return model
  }

  getHealth(): ExecutionOrchestratorHealth {
    const diagnostics = this.executionRegistry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const byState: Record<ExecutionPipelineState, number> = {
      'request-accepted': 0,
      'context-prepared': 0,
      'memory-ready': 0,
      'business-brain-ready': 0,
      'prompt-ready': 0,
      'provider-selected': 0,
      'awaiting-execution': 0,
      executing: 0,
      'awaiting-validation': 0,
      validated: 0,
      'awaiting-approval': 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }

    for (const session of this.sessions.values()) {
      byState[session.state] += 1
    }

    return {
      executionRegistryHealth: this.executionRegistry.getHealthSummary(),
      executionPipelineHealth: {
        status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
        activeSessions: this.sessions.size,
        byState,
        invalidTransitions: this.invalidTransitions,
        lastTransitionAt: this.lastTransitionAt,
      },
      executionValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
      executionOrchestratorHealth: {
        status: this.executionRegistry.list().length > 0 ? 'healthy' : 'degraded',
        registeredExecutions: this.executionRegistry.list().length,
        plansTracked: this.plans.size,
        contextsPrepared: this.contexts.size,
        lastUpdatedAt: this.lastUpdatedAt,
      },
    }
  }

  private recordDiagnostic(
    code: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    entityId?: string
  ): void {
    this.diagnostics.push({
      diagnosticId: `execution-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      message,
      severity,
      entityId,
      createdAt: now(),
    })
  }
}
