import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AutonomousWorkflowConstraintInput,
  type AutonomousWorkflowContextInput,
  type AutonomousWorkflowDependencyInput,
  type AutonomousWorkflowGovernanceInput,
  type AutonomousWorkflowInput,
  type AutonomousWorkflowLifecycleStage,
  type AutonomousWorkflowObjectiveInput,
  type AutonomousWorkflowOutcomeInput,
  type AutonomousWorkflowPhaseInput,
  type AutonomousWorkflowRegistrationInput,
  type AutonomousWorkflowSessionInput,
  type AutonomousWorkflowStepInput,
  type AutonomousWorkflowSummaryInput,
  type AutonomousWorkflowReadinessInput,
  type AutonomousWorkflowLifecycleStateInput,
  type AutonomousWorkflowCheckpointInput,
  type AutonomousWorkflowApprovalInput,
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

export interface AutonomousWorkflowMetadata {
  autonomousWorkflowId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousWorkflowDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowSession {
  sessionId: string
  autonomousWorkflowId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface WorkflowProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface WorkflowFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface WorkflowGovernance {
  ownership: WorkflowOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: WorkflowProvenance
  freshness: WorkflowFreshness
}

export interface AutonomousWorkflowContext {
  contextId: string
  autonomousWorkflowId: string
  sessionId?: string
  governance: WorkflowGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowObjective {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface WorkflowPhase {
  phaseId: string
  title: string
  description?: string
  order: number
  stepIds: string[]
  metadata?: Metadata
}

export interface WorkflowStep {
  stepId: string
  title: string
  description: string
  phaseId?: string
  order: number
  status: 'planned' | 'ready' | 'blocked' | 'in-progress' | 'completed'
  metadata?: Metadata
}

export interface WorkflowDependency {
  dependencyId: string
  fromStepId: string
  toStepId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface WorkflowConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface WorkflowCheckpoint {
  checkpointId: string
  title: string
  description?: string
  dueAt?: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowApproval {
  approvalId: string
  title: string
  status: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface WorkflowSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WorkflowCreatedState {
  state: 'workflow-created'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowPlannedState {
  state: 'workflow-planned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowReadyState {
  state: 'workflow-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowRunningState {
  state: 'workflow-running'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowWaitingState {
  state: 'workflow-waiting'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowPausedState {
  state: 'workflow-paused'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowResumedState {
  state: 'workflow-resumed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowCompletedState {
  state: 'workflow-completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowCancelledState {
  state: 'workflow-cancelled'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowFailedState {
  state: 'workflow-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type WorkflowLifecycleStateModel =
  | WorkflowCreatedState
  | WorkflowPlannedState
  | WorkflowReadyState
  | WorkflowRunningState
  | WorkflowWaitingState
  | WorkflowPausedState
  | WorkflowResumedState
  | WorkflowCompletedState
  | WorkflowCancelledState
  | WorkflowFailedState

export interface AutonomousWorkflowLifecycleState {
  stage: AutonomousWorkflowLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousWorkflow {
  workflowId: string
  autonomousWorkflowId: string
  objectives: WorkflowObjective[]
  phases: WorkflowPhase[]
  steps: WorkflowStep[]
  dependencies: WorkflowDependency[]
  constraints: WorkflowConstraint[]
  checkpoints: WorkflowCheckpoint[]
  approvals: WorkflowApproval[]
  outcomes: WorkflowOutcome[]
  lifecycleStates: AutonomousWorkflowLifecycleState[]
  lifecycleStateModels: WorkflowLifecycleStateModel[]
  summary: WorkflowSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousWorkflowRegistration extends AutonomousWorkflowRegistrationInput {
  metadataModel: AutonomousWorkflowMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousWorkflowRuntimeHealth {
  autonomousWorkflowHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousWorkflowEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousWorkflowEntries: number
    lastUpdatedAt: IsoDateTime
  }
  workflowLifecycleHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    workflowsTracked: number
    lifecycleStatesTracked: number
    invalidLifecycles: number
    lastLifecycleUpdatedAt?: IsoDateTime
  }
  workflowValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousWorkflowRegistry {
  private registrations: Map<string, AutonomousWorkflowRegistration> = new Map()
  private sessions: Map<string, AutonomousWorkflowSession> = new Map()
  private contexts: Map<string, AutonomousWorkflowContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousWorkflowEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousWorkflowRegistrationInput): AutonomousWorkflowRegistration {
    const validationResult = this.validation.validateAutonomousWorkflow(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousWorkflowId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkflow('Duplicate autonomous workflow ID detected', {
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousWorkflowEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkflow('Autonomous workflow registration validation failed', {
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    const registration: AutonomousWorkflowRegistration = {
      ...input,
      metadataModel: {
        autonomousWorkflowId: input.autonomousWorkflowId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousWorkflowId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousWorkflowSessionInput): AutonomousWorkflowSession {
    if (!this.registrations.has(input.autonomousWorkflowId)) {
      throw RuntimeError.autonomousWorkflow('Autonomous workflow registration not found', {
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkflow('Duplicate autonomous workflow session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousWorkflowSession = {
      sessionId: input.sessionId,
      autonomousWorkflowId: input.autonomousWorkflowId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousWorkflowContextInput): AutonomousWorkflowContext {
    if (!this.registrations.has(input.autonomousWorkflowId)) {
      throw RuntimeError.autonomousWorkflow('Autonomous workflow registration not found for context', {
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousWorkflow('Autonomous workflow session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkflow('Duplicate autonomous workflow context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateAutonomousWorkflowGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousWorkflowEntries += 1
      this.validationRejected += 1
      throw RuntimeError.workflowGovernance('Workflow governance validation failed', {
        contextId: input.contextId,
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    const context: AutonomousWorkflowContext = {
      contextId: input.contextId,
      autonomousWorkflowId: input.autonomousWorkflowId,
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

  get(autonomousWorkflowId: string): AutonomousWorkflowRegistration | undefined {
    return this.registrations.get(autonomousWorkflowId)
  }

  getSession(sessionId: string): AutonomousWorkflowSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): AutonomousWorkflowContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): AutonomousWorkflowRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousWorkflowSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousWorkflowContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousWorkflowCount(): number {
    return this.invalidAutonomousWorkflowEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-workflow-registry',
      'Autonomous Workflow Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapObjectives(input: AutonomousWorkflowObjectiveInput[]): WorkflowObjective[] {
  return input.map((objective) => ({ ...objective }))
}

function mapPhases(input: AutonomousWorkflowPhaseInput[]): WorkflowPhase[] {
  return input.map((phase) => ({ ...phase }))
}

function mapSteps(input: AutonomousWorkflowStepInput[]): WorkflowStep[] {
  return input.map((step) => ({ ...step }))
}

function mapDependencies(input: AutonomousWorkflowDependencyInput[]): WorkflowDependency[] {
  return input.map((dependency) => ({ ...dependency }))
}

function mapConstraints(input: AutonomousWorkflowConstraintInput[]): WorkflowConstraint[] {
  return input.map((constraint) => ({ ...constraint }))
}

function mapCheckpoints(input: AutonomousWorkflowCheckpointInput[]): WorkflowCheckpoint[] {
  return input.map((checkpoint) => ({ ...checkpoint }))
}

function mapApprovals(input: AutonomousWorkflowApprovalInput[]): WorkflowApproval[] {
  return input.map((approval) => ({ ...approval }))
}

function mapOutcomes(input: AutonomousWorkflowOutcomeInput[]): WorkflowOutcome[] {
  return input.map((outcome) => ({ ...outcome }))
}

function mapSummary(input: AutonomousWorkflowSummaryInput): WorkflowSummary {
  return {
    synopsis: input.synopsis,
    highlights: [...input.highlights],
    risks: [...input.risks],
    nextActions: [...input.nextActions],
  }
}

function mapLifecycleStates(input: AutonomousWorkflowLifecycleStateInput[]): AutonomousWorkflowLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapLifecycleStateModels(input: AutonomousWorkflowLifecycleStateInput[]): WorkflowLifecycleStateModel[] {
  return input.map((state) => ({
    state: state.stage,
    enteredAt: state.enteredAt ?? now(),
    metadata: state.metadata,
  }))
}

function createReadinessInput(workflow: AutonomousWorkflowInput): AutonomousWorkflowReadinessInput {
  return {
    workflowId: workflow.workflowId,
    lifecycleStates: workflow.lifecycleStates,
    dependencies: workflow.dependencies,
    approvals: workflow.approvals,
    metadata: workflow.metadata,
  }
}

export class AutonomousWorkflowManager {
  private workflows: Map<string, AutonomousWorkflow> = new Map()
  private diagnostics: AutonomousWorkflowDiagnostics[] = []
  private invalidLifecycles = 0
  private lastLifecycleUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousWorkflowRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousWorkflow(input: AutonomousWorkflowRegistrationInput): AutonomousWorkflowRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousWorkflowSessionInput): AutonomousWorkflowSession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousWorkflowContextInput): AutonomousWorkflowContext {
    return this.registry.createContext(input)
  }

  createWorkflow(input: AutonomousWorkflowInput): AutonomousWorkflow {
    if (!this.registry.get(input.autonomousWorkflowId)) {
      throw RuntimeError.autonomousWorkflow('Autonomous workflow registration not found for workflow plan', {
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    const planValidation = this.validation.validateAutonomousWorkflowPlan(input)
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateAutonomousWorkflowLifecycle(state.stage).diagnostics
    )
    const readinessDiagnostics = this.validation.validateAutonomousWorkflowReadiness(createReadinessInput(input)).diagnostics

    const diagnostics = [
      ...planValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...readinessDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-workflow-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
      this.invalidLifecycles += 1
      throw RuntimeError.workflowLifecycle('Workflow lifecycle validation failed', {
        workflowId: input.workflowId,
      })
    }

    if (!planValidation.valid) {
      this.invalidLifecycles += 1
      throw RuntimeError.workflowPlan('Workflow plan validation failed', {
        workflowId: input.workflowId,
        autonomousWorkflowId: input.autonomousWorkflowId,
      })
    }

    if (hasReadinessErrors) {
      this.invalidLifecycles += 1
      throw RuntimeError.workflowReadiness('Workflow readiness validation failed', {
        workflowId: input.workflowId,
      })
    }

    const workflow: AutonomousWorkflow = {
      workflowId: input.workflowId,
      autonomousWorkflowId: input.autonomousWorkflowId,
      objectives: mapObjectives(input.objectives),
      phases: mapPhases(input.phases),
      steps: mapSteps(input.steps),
      dependencies: mapDependencies(input.dependencies),
      constraints: mapConstraints(input.constraints),
      checkpoints: mapCheckpoints(input.checkpoints),
      approvals: mapApprovals(input.approvals),
      outcomes: mapOutcomes(input.outcomes),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      lifecycleStateModels: mapLifecycleStateModels(input.lifecycleStates),
      summary: mapSummary(input.summary),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.workflows.set(workflow.workflowId, workflow)
    this.lastLifecycleUpdatedAt = now()
    this.lastUpdatedAt = now()
    return workflow
  }

  getWorkflow(workflowId: string): AutonomousWorkflow | undefined {
    return this.workflows.get(workflowId)
  }

  listWorkflows(): AutonomousWorkflow[] {
    return Array.from(this.workflows.values())
  }

  getHealth(): AutonomousWorkflowRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const lifecycleStatesTracked = this.listWorkflows().reduce((count, workflow) => {
      return count + workflow.lifecycleStates.length
    }, 0)

    return {
      autonomousWorkflowHealth: {
        status: this.registry.getInvalidAutonomousWorkflowCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousWorkflowEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousWorkflowEntries: this.registry.getInvalidAutonomousWorkflowCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      workflowLifecycleHealth: {
        status: this.invalidLifecycles > 0 ? 'degraded' : 'healthy',
        workflowsTracked: this.workflows.size,
        lifecycleStatesTracked,
        invalidLifecycles: this.invalidLifecycles,
        lastLifecycleUpdatedAt: this.lastLifecycleUpdatedAt,
      },
      workflowValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
