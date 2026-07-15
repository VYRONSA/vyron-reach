import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AgentAssignmentInput,
  type AutonomousAgentCapabilityInput,
  type AutonomousAgentCommunicationInput,
  type AutonomousAgentContextInput,
  type AutonomousAgentDecisionInput,
  type AutonomousAgentDependencyInput,
  type AutonomousAgentGovernanceInput,
  type AutonomousAgentInput,
  type AutonomousAgentLifecycleStage,
  type AutonomousAgentLifecycleStateInput,
  type AutonomousAgentOutcomeInput,
  type AutonomousAgentRegistrationInput,
  type AutonomousAgentResponsibilityInput,
  type AutonomousAgentRoleInput,
  type AutonomousAgentSessionInput,
  type AutonomousAgentSummaryInput,
  type CoordinationPlanInput,
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

export interface AutonomousAgentMetadata {
  autonomousAgentId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousAgentDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousAgentSession {
  sessionId: string
  autonomousAgentId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AgentOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface AgentProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface AgentFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface AgentGovernance {
  ownership: AgentOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: AgentProvenance
  freshness: AgentFreshness
}

export interface AutonomousAgentContext {
  contextId: string
  autonomousAgentId: string
  sessionId?: string
  governance: AgentGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentRole {
  roleId: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AgentCapability {
  capabilityId: string
  name: string
  description: string
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  metadata?: Metadata
}

export interface AgentAssignment {
  assignmentId: string
  agentId: string
  taskReference: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskId?: string
  }
  role: string
  status: 'pending' | 'assigned' | 'active' | 'completed' | 'blocked'
  metadata?: Metadata
}

export interface AgentResponsibility {
  responsibilityId: string
  title: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface AgentDependency {
  dependencyId: string
  fromAgentId: string
  toAgentId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface AgentCommunication {
  communicationId: string
  fromAgentId: string
  toAgentId: string
  channel: 'system' | 'event' | 'message' | 'review'
  subject: string
  status: 'queued' | 'sent' | 'acknowledged' | 'failed'
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentDecision {
  decisionId: string
  title: string
  rationale: string
  confidence: number
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface AgentOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface AgentSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface AutonomousAgent {
  agentId: string
  autonomousAgentId: string
  name: string
  roleIds: string[]
  capabilityIds: string[]
  assignmentIds: string[]
  responsibilityIds: string[]
  status: 'registered' | 'available' | 'assigned' | 'working' | 'waiting' | 'reviewing' | 'completed' | 'suspended' | 'failed' | 'retired'
  metadata?: Metadata
}

export interface AgentRegisteredState {
  state: 'agent-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentAvailableState {
  state: 'agent-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentAssignedState {
  state: 'agent-assigned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentWorkingState {
  state: 'agent-working'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentWaitingState {
  state: 'agent-waiting'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentReviewingState {
  state: 'agent-reviewing'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentCompletedState {
  state: 'agent-completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentSuspendedState {
  state: 'agent-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentFailedState {
  state: 'agent-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface AgentRetiredState {
  state: 'agent-retired'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type AgentLifecycleStateModel =
  | AgentRegisteredState
  | AgentAvailableState
  | AgentAssignedState
  | AgentWorkingState
  | AgentWaitingState
  | AgentReviewingState
  | AgentCompletedState
  | AgentSuspendedState
  | AgentFailedState
  | AgentRetiredState

export interface AutonomousAgentLifecycleState {
  stage: AutonomousAgentLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface CoordinationGroup {
  groupId: string
  name: string
  description?: string
  agentIds: string[]
  metadata?: Metadata
}

export interface CoordinationQueue {
  queueId: string
  name: string
  assignmentIds: string[]
  policy: 'fifo' | 'priority' | 'dependency-aware'
  metadata?: Metadata
}

export interface CoordinationCheckpoint {
  checkpointId: string
  title: string
  description?: string
  dueAt?: IsoDateTime
  metadata?: Metadata
}

export interface CoordinationDependency {
  dependencyId: string
  fromAssignmentId: string
  toAssignmentId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface CoordinationConflict {
  conflictId: string
  type: 'ownership' | 'assignment' | 'dependency' | 'priority' | 'capacity'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-review' | 'resolved'
  metadata?: Metadata
}

export interface CoordinationResolution {
  resolutionId: string
  conflictId: string
  action: string
  rationale: string
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface CoordinationAudit {
  auditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: IsoDateTime
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface CoordinationPlan {
  coordinationPlanId: string
  autonomousAgentId: string
  taskReferences: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskIds: string[]
  }
  agents: AutonomousAgent[]
  roles: AgentRole[]
  capabilities: AgentCapability[]
  assignments: AgentAssignment[]
  responsibilities: AgentResponsibility[]
  dependencies: AgentDependency[]
  communications: AgentCommunication[]
  decisions: AgentDecision[]
  outcomes: AgentOutcome[]
  lifecycleStates: AutonomousAgentLifecycleState[]
  lifecycleStateModels: AgentLifecycleStateModel[]
  coordinationGroups: CoordinationGroup[]
  coordinationQueues: CoordinationQueue[]
  coordinationCheckpoints: CoordinationCheckpoint[]
  coordinationDependencies: CoordinationDependency[]
  coordinationConflicts: CoordinationConflict[]
  coordinationResolutions: CoordinationResolution[]
  coordinationAudit: CoordinationAudit
  summary: AgentSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousAgentRegistration extends AutonomousAgentRegistrationInput {
  metadataModel: AutonomousAgentMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousAgentRuntimeHealth {
  autonomousAgentHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousAgentEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousAgentEntries: number
    lastUpdatedAt: IsoDateTime
  }
  coordinationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    coordinationPlansTracked: number
    assignmentsTracked: number
    openConflicts: number
    lastCoordinatedAt?: IsoDateTime
  }
  agentValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousAgentRegistry {
  private registrations: Map<string, AutonomousAgentRegistration> = new Map()
  private sessions: Map<string, AutonomousAgentSession> = new Map()
  private contexts: Map<string, AutonomousAgentContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousAgentEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousAgentRegistrationInput): AutonomousAgentRegistration {
    const validationResult = this.validation.validateAutonomousAgent(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousAgentId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousAgent('Duplicate autonomous agent ID detected', {
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousAgentEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousAgent('Autonomous agent registration validation failed', {
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    const registration: AutonomousAgentRegistration = {
      ...input,
      metadataModel: {
        autonomousAgentId: input.autonomousAgentId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousAgentId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousAgentSessionInput): AutonomousAgentSession {
    if (!this.registrations.has(input.autonomousAgentId)) {
      throw RuntimeError.autonomousAgent('Autonomous agent registration not found', {
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousAgent('Duplicate autonomous agent session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousAgentSession = {
      sessionId: input.sessionId,
      autonomousAgentId: input.autonomousAgentId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousAgentContextInput): AutonomousAgentContext {
    if (!this.registrations.has(input.autonomousAgentId)) {
      throw RuntimeError.autonomousAgent('Autonomous agent registration not found for context', {
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousAgent('Autonomous agent session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousAgent('Duplicate autonomous agent context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateAutonomousAgentGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousAgentEntries += 1
      this.validationRejected += 1
      throw RuntimeError.agentGovernance('Agent governance validation failed', {
        contextId: input.contextId,
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    const context: AutonomousAgentContext = {
      contextId: input.contextId,
      autonomousAgentId: input.autonomousAgentId,
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

  get(autonomousAgentId: string): AutonomousAgentRegistration | undefined {
    return this.registrations.get(autonomousAgentId)
  }

  getSession(sessionId: string): AutonomousAgentSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): AutonomousAgentContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): AutonomousAgentRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousAgentSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousAgentContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousAgentCount(): number {
    return this.invalidAutonomousAgentEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-agent-registry',
      'Autonomous Agent Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapAgents(input: AutonomousAgentInput[]): AutonomousAgent[] {
  return input.map((agent) => ({ ...agent }))
}

function mapRoles(input: AutonomousAgentRoleInput[]): AgentRole[] {
  return input.map((role) => ({ ...role }))
}

function mapCapabilities(input: AutonomousAgentCapabilityInput[]): AgentCapability[] {
  return input.map((capability) => ({ ...capability }))
}

function mapAssignments(input: AgentAssignmentInput[]): AgentAssignment[] {
  return input.map((assignment) => ({ ...assignment }))
}

function mapResponsibilities(input: AutonomousAgentResponsibilityInput[]): AgentResponsibility[] {
  return input.map((responsibility) => ({ ...responsibility }))
}

function mapDependencies(input: AutonomousAgentDependencyInput[]): AgentDependency[] {
  return input.map((dependency) => ({ ...dependency }))
}

function mapCommunications(input: AutonomousAgentCommunicationInput[]): AgentCommunication[] {
  return input.map((communication) => ({ ...communication }))
}

function mapDecisions(input: AutonomousAgentDecisionInput[]): AgentDecision[] {
  return input.map((decision) => ({ ...decision }))
}

function mapOutcomes(input: AutonomousAgentOutcomeInput[]): AgentOutcome[] {
  return input.map((outcome) => ({ ...outcome }))
}

function mapSummary(input: AutonomousAgentSummaryInput): AgentSummary {
  return {
    synopsis: input.synopsis,
    highlights: [...input.highlights],
    risks: [...input.risks],
    nextActions: [...input.nextActions],
  }
}

function mapLifecycleStates(input: AutonomousAgentLifecycleStateInput[]): AutonomousAgentLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapLifecycleStateModels(input: AutonomousAgentLifecycleStateInput[]): AgentLifecycleStateModel[] {
  return input.map((state) => ({
    state: state.stage,
    enteredAt: state.enteredAt ?? now(),
    metadata: state.metadata,
  }))
}

function createCoordinationReadinessInput(plan: CoordinationPlanInput): CoordinationPlanInput {
  return {
    ...plan,
    taskReferences: {
      ...plan.taskReferences,
      taskIds: [...plan.taskReferences.taskIds],
    },
  }
}

export class AutonomousAgentManager {
  private coordinationPlans: Map<string, CoordinationPlan> = new Map()
  private diagnostics: AutonomousAgentDiagnostics[] = []
  private openConflicts = 0
  private lastCoordinatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousAgentRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousAgent(input: AutonomousAgentRegistrationInput): AutonomousAgentRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousAgentSessionInput): AutonomousAgentSession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousAgentContextInput): AutonomousAgentContext {
    return this.registry.createContext(input)
  }

  createCoordinationPlan(input: CoordinationPlanInput): CoordinationPlan {
    if (!this.registry.get(input.autonomousAgentId)) {
      throw RuntimeError.autonomousAgent('Autonomous agent registration not found for coordination plan', {
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    const coordinationValidation = this.validation.validateAutonomousAgentCoordination(createCoordinationReadinessInput(input))
    const assignmentDiagnostics = input.assignments.flatMap((assignment) =>
      this.validation.validateAutonomousAgentAssignment(assignment).diagnostics
    )
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateAutonomousAgentLifecycle(state.stage).diagnostics
    )

    const diagnostics = [
      ...coordinationValidation.diagnostics,
      ...assignmentDiagnostics,
      ...lifecycleDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-agent-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasAssignmentErrors = assignmentDiagnostics.some((diagnostic) => diagnostic.severity === 'error')
    const hasLifecycleErrors = lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (hasAssignmentErrors) {
      throw RuntimeError.agentAssignment('Agent assignment validation failed', {
        coordinationPlanId: input.coordinationPlanId,
      })
    }

    if (hasLifecycleErrors) {
      throw RuntimeError.agentLifecycle('Agent lifecycle validation failed', {
        coordinationPlanId: input.coordinationPlanId,
      })
    }

    if (!coordinationValidation.valid) {
      throw RuntimeError.coordination('Coordination validation failed', {
        coordinationPlanId: input.coordinationPlanId,
        autonomousAgentId: input.autonomousAgentId,
      })
    }

    const coordinationPlan: CoordinationPlan = {
      coordinationPlanId: input.coordinationPlanId,
      autonomousAgentId: input.autonomousAgentId,
      taskReferences: {
        ...input.taskReferences,
        taskIds: [...input.taskReferences.taskIds],
      },
      agents: mapAgents(input.agents),
      roles: mapRoles(input.roles),
      capabilities: mapCapabilities(input.capabilities),
      assignments: mapAssignments(input.assignments),
      responsibilities: mapResponsibilities(input.responsibilities),
      dependencies: mapDependencies(input.dependencies),
      communications: mapCommunications(input.communications),
      decisions: mapDecisions(input.decisions),
      outcomes: mapOutcomes(input.outcomes),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      lifecycleStateModels: mapLifecycleStateModels(input.lifecycleStates),
      coordinationGroups: input.coordinationGroups,
      coordinationQueues: input.coordinationQueues,
      coordinationCheckpoints: input.coordinationCheckpoints,
      coordinationDependencies: input.coordinationDependencies,
      coordinationConflicts: input.coordinationConflicts,
      coordinationResolutions: input.coordinationResolutions,
      coordinationAudit: input.coordinationAudit,
      summary: mapSummary(input.summary),
      createdAt: now(),
      metadata: input.metadata,
    }

    this.openConflicts = this.openConflicts + coordinationPlan.coordinationConflicts.filter((conflict) => conflict.status !== 'resolved').length
    this.coordinationPlans.set(coordinationPlan.coordinationPlanId, coordinationPlan)
    this.lastCoordinatedAt = now()
    this.lastUpdatedAt = now()
    return coordinationPlan
  }

  getCoordinationPlan(coordinationPlanId: string): CoordinationPlan | undefined {
    return this.coordinationPlans.get(coordinationPlanId)
  }

  listCoordinationPlans(): CoordinationPlan[] {
    return Array.from(this.coordinationPlans.values())
  }

  getHealth(): AutonomousAgentRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const assignmentsTracked = this.listCoordinationPlans().reduce((count, coordinationPlan) => {
      return count + coordinationPlan.assignments.length
    }, 0)

    return {
      autonomousAgentHealth: {
        status: this.registry.getInvalidAutonomousAgentCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousAgentEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousAgentEntries: this.registry.getInvalidAutonomousAgentCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      coordinationHealth: {
        status: this.openConflicts > 0 ? 'degraded' : 'healthy',
        coordinationPlansTracked: this.coordinationPlans.size,
        assignmentsTracked,
        openConflicts: this.openConflicts,
        lastCoordinatedAt: this.lastCoordinatedAt,
      },
      agentValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
