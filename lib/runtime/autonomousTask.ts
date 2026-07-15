import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AutonomousTaskApprovalInput,
  type AutonomousTaskAssignmentInput,
  type AutonomousTaskCheckpointInput,
  type AutonomousTaskConstraintInput,
  type AutonomousTaskContextInput,
  type AutonomousTaskDependencyInput,
  type AutonomousTaskGovernanceInput,
  type AutonomousTaskInput,
  type AutonomousTaskLifecycleStage,
  type AutonomousTaskLifecycleStateInput,
  type AutonomousTaskObjectiveInput,
  type AutonomousTaskOutcomeInput,
  type AutonomousTaskReadinessInput,
  type AutonomousTaskRegistrationInput,
  type AutonomousTaskSessionInput,
  type AutonomousTaskSummaryInput,
  type AutonomousTaskTaskInput,
  type AutonomousTaskGroupInput,
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

export interface AutonomousTaskMetadata {
  autonomousTaskId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousTaskDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousTaskSession {
  sessionId: string
  autonomousTaskId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TaskOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface TaskProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface TaskFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface TaskGovernance {
  ownership: TaskOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: TaskProvenance
  freshness: TaskFreshness
}

export interface AutonomousTaskContext {
  contextId: string
  autonomousTaskId: string
  sessionId?: string
  governance: TaskGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskObjective {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TaskGroup {
  groupId: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousTask {
  taskId: string
  groupId?: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'assigned' | 'waiting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TaskDependency {
  dependencyId: string
  fromTaskId: string
  toTaskId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface TaskConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface TaskCheckpoint {
  checkpointId: string
  title: string
  description?: string
  dueAt?: IsoDateTime
  metadata?: Metadata
}

export interface TaskAssignment {
  assignmentId: string
  taskId: string
  assigneeType: 'system' | 'team' | 'user'
  assigneeId: string
  role?: string
  metadata?: Metadata
}

export interface TaskApproval {
  approvalId: string
  title: string
  status: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TaskOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface TaskSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface TaskCreatedState {
  state: 'task-created'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskPlannedState {
  state: 'task-planned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskReadyState {
  state: 'task-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskAssignedState {
  state: 'task-assigned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskWaitingState {
  state: 'task-waiting'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskRunningState {
  state: 'task-running'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskPausedState {
  state: 'task-paused'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskCompletedState {
  state: 'task-completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskFailedState {
  state: 'task-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TaskCancelledState {
  state: 'task-cancelled'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type TaskLifecycleStateModel =
  | TaskCreatedState
  | TaskPlannedState
  | TaskReadyState
  | TaskAssignedState
  | TaskWaitingState
  | TaskRunningState
  | TaskPausedState
  | TaskCompletedState
  | TaskFailedState
  | TaskCancelledState

export interface AutonomousTaskLifecycleState {
  stage: AutonomousTaskLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousTaskPlan {
  taskPlanId: string
  autonomousTaskId: string
  workflowReferences: {
    autonomousWorkflowId?: string
    workflowId?: string
    workflowStepIds: string[]
  }
  objectives: TaskObjective[]
  groups: TaskGroup[]
  tasks: AutonomousTask[]
  dependencies: TaskDependency[]
  constraints: TaskConstraint[]
  checkpoints: TaskCheckpoint[]
  assignments: TaskAssignment[]
  approvals: TaskApproval[]
  outcomes: TaskOutcome[]
  lifecycleStates: AutonomousTaskLifecycleState[]
  lifecycleStateModels: TaskLifecycleStateModel[]
  summary: TaskSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousTaskRegistration extends AutonomousTaskRegistrationInput {
  metadataModel: AutonomousTaskMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousTaskRuntimeHealth {
  autonomousTaskHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousTaskEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousTaskEntries: number
    lastUpdatedAt: IsoDateTime
  }
  taskLifecycleHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    taskPlansTracked: number
    lifecycleStatesTracked: number
    invalidTaskLifecycles: number
    lastLifecycleUpdatedAt?: IsoDateTime
  }
  taskValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousTaskRegistry {
  private registrations: Map<string, AutonomousTaskRegistration> = new Map()
  private sessions: Map<string, AutonomousTaskSession> = new Map()
  private contexts: Map<string, AutonomousTaskContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousTaskEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousTaskRegistrationInput): AutonomousTaskRegistration {
    const validationResult = this.validation.validateAutonomousTask(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousTaskId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousTask('Duplicate autonomous task ID detected', {
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousTaskEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousTask('Autonomous task registration validation failed', {
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    const registration: AutonomousTaskRegistration = {
      ...input,
      metadataModel: {
        autonomousTaskId: input.autonomousTaskId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousTaskId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousTaskSessionInput): AutonomousTaskSession {
    if (!this.registrations.has(input.autonomousTaskId)) {
      throw RuntimeError.autonomousTask('Autonomous task registration not found', {
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousTask('Duplicate autonomous task session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousTaskSession = {
      sessionId: input.sessionId,
      autonomousTaskId: input.autonomousTaskId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousTaskContextInput): AutonomousTaskContext {
    if (!this.registrations.has(input.autonomousTaskId)) {
      throw RuntimeError.autonomousTask('Autonomous task registration not found for context', {
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousTask('Autonomous task session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousTask('Duplicate autonomous task context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateAutonomousTaskGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousTaskEntries += 1
      this.validationRejected += 1
      throw RuntimeError.taskGovernance('Task governance validation failed', {
        contextId: input.contextId,
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    const context: AutonomousTaskContext = {
      contextId: input.contextId,
      autonomousTaskId: input.autonomousTaskId,
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

  get(autonomousTaskId: string): AutonomousTaskRegistration | undefined {
    return this.registrations.get(autonomousTaskId)
  }

  getSession(sessionId: string): AutonomousTaskSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): AutonomousTaskContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): AutonomousTaskRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousTaskSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousTaskContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousTaskCount(): number {
    return this.invalidAutonomousTaskEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-task-registry',
      'Autonomous Task Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapObjectives(input: AutonomousTaskObjectiveInput[]): TaskObjective[] {
  return input.map((objective) => ({ ...objective }))
}

function mapGroups(input: AutonomousTaskGroupInput[]): TaskGroup[] {
  return input.map((group) => ({ ...group }))
}

function mapTasks(input: AutonomousTaskTaskInput[]): AutonomousTask[] {
  return input.map((task) => ({ ...task }))
}

function mapDependencies(input: AutonomousTaskDependencyInput[]): TaskDependency[] {
  return input.map((dependency) => ({ ...dependency }))
}

function mapConstraints(input: AutonomousTaskConstraintInput[]): TaskConstraint[] {
  return input.map((constraint) => ({ ...constraint }))
}

function mapCheckpoints(input: AutonomousTaskCheckpointInput[]): TaskCheckpoint[] {
  return input.map((checkpoint) => ({ ...checkpoint }))
}

function mapAssignments(input: AutonomousTaskAssignmentInput[]): TaskAssignment[] {
  return input.map((assignment) => ({ ...assignment }))
}

function mapApprovals(input: AutonomousTaskApprovalInput[]): TaskApproval[] {
  return input.map((approval) => ({ ...approval }))
}

function mapOutcomes(input: AutonomousTaskOutcomeInput[]): TaskOutcome[] {
  return input.map((outcome) => ({ ...outcome }))
}

function mapSummary(input: AutonomousTaskSummaryInput): TaskSummary {
  return {
    synopsis: input.synopsis,
    highlights: [...input.highlights],
    risks: [...input.risks],
    nextActions: [...input.nextActions],
  }
}

function mapLifecycleStates(input: AutonomousTaskLifecycleStateInput[]): AutonomousTaskLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapLifecycleStateModels(input: AutonomousTaskLifecycleStateInput[]): TaskLifecycleStateModel[] {
  return input.map((state) => ({
    state: state.stage,
    enteredAt: state.enteredAt ?? now(),
    metadata: state.metadata,
  }))
}

function createReadinessInput(taskPlan: AutonomousTaskInput): AutonomousTaskReadinessInput {
  return {
    taskPlanId: taskPlan.taskPlanId,
    lifecycleStates: taskPlan.lifecycleStates,
    dependencies: taskPlan.dependencies,
    assignments: taskPlan.assignments,
    metadata: taskPlan.metadata,
  }
}

export class AutonomousTaskManager {
  private taskPlans: Map<string, AutonomousTaskPlan> = new Map()
  private diagnostics: AutonomousTaskDiagnostics[] = []
  private invalidTaskLifecycles = 0
  private lastLifecycleUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousTaskRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousTask(input: AutonomousTaskRegistrationInput): AutonomousTaskRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousTaskSessionInput): AutonomousTaskSession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousTaskContextInput): AutonomousTaskContext {
    return this.registry.createContext(input)
  }

  createTaskPlan(input: AutonomousTaskInput): AutonomousTaskPlan {
    if (!this.registry.get(input.autonomousTaskId)) {
      throw RuntimeError.autonomousTask('Autonomous task registration not found for task plan', {
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    const planValidation = this.validation.validateAutonomousTaskPlan(input)
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateAutonomousTaskLifecycle(state.stage).diagnostics
    )
    const readinessDiagnostics = this.validation.validateAutonomousTaskReadiness(createReadinessInput(input)).diagnostics

    const diagnostics = [
      ...planValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...readinessDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-task-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
      this.invalidTaskLifecycles += 1
      throw RuntimeError.taskLifecycle('Task lifecycle validation failed', {
        taskPlanId: input.taskPlanId,
      })
    }

    if (!planValidation.valid) {
      this.invalidTaskLifecycles += 1
      throw RuntimeError.taskPlan('Task plan validation failed', {
        taskPlanId: input.taskPlanId,
        autonomousTaskId: input.autonomousTaskId,
      })
    }

    if (hasReadinessErrors) {
      this.invalidTaskLifecycles += 1
      throw RuntimeError.taskReadiness('Task readiness validation failed', {
        taskPlanId: input.taskPlanId,
      })
    }

    const taskPlan: AutonomousTaskPlan = {
      taskPlanId: input.taskPlanId,
      autonomousTaskId: input.autonomousTaskId,
      workflowReferences: input.workflowReferences,
      objectives: mapObjectives(input.objectives),
      groups: mapGroups(input.groups),
      tasks: mapTasks(input.tasks),
      dependencies: mapDependencies(input.dependencies),
      constraints: mapConstraints(input.constraints),
      checkpoints: mapCheckpoints(input.checkpoints),
      assignments: mapAssignments(input.assignments),
      approvals: mapApprovals(input.approvals),
      outcomes: mapOutcomes(input.outcomes),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      lifecycleStateModels: mapLifecycleStateModels(input.lifecycleStates),
      summary: mapSummary(input.summary),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.taskPlans.set(taskPlan.taskPlanId, taskPlan)
    this.lastLifecycleUpdatedAt = now()
    this.lastUpdatedAt = now()
    return taskPlan
  }

  getTaskPlan(taskPlanId: string): AutonomousTaskPlan | undefined {
    return this.taskPlans.get(taskPlanId)
  }

  listTaskPlans(): AutonomousTaskPlan[] {
    return Array.from(this.taskPlans.values())
  }

  getHealth(): AutonomousTaskRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const lifecycleStatesTracked = this.listTaskPlans().reduce((count, taskPlan) => {
      return count + taskPlan.lifecycleStates.length
    }, 0)

    return {
      autonomousTaskHealth: {
        status: this.registry.getInvalidAutonomousTaskCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousTaskEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousTaskEntries: this.registry.getInvalidAutonomousTaskCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      taskLifecycleHealth: {
        status: this.invalidTaskLifecycles > 0 ? 'degraded' : 'healthy',
        taskPlansTracked: this.taskPlans.size,
        lifecycleStatesTracked,
        invalidTaskLifecycles: this.invalidTaskLifecycles,
        lastLifecycleUpdatedAt: this.lastLifecycleUpdatedAt,
      },
      taskValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
