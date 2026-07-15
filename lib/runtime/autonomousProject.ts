import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AutonomousProjectContextInput,
  type AutonomousProjectGovernanceInput,
  type AutonomousProjectInput,
  type AutonomousProjectLifecycleStage,
  type AutonomousProjectLifecycleStateInput,
  type AutonomousProjectRegistrationInput,
  type AutonomousProjectSessionInput,
  type AutonomousProjectSummaryInput,
  type ProjectConstraintInput,
  type ProjectCoordinationInput,
  type ProjectDecisionInput,
  type ProjectDependencyInput,
  type ProjectMilestoneInput,
  type ProjectOutcomeInput,
  type ProjectPortfolioInput,
  type ProjectResourceInput,
  type ProjectRiskInput,
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

export interface AutonomousProjectMetadata {
  autonomousProjectId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousProjectDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousProjectSession {
  sessionId: string
  autonomousProjectId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ProjectOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface ProjectProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ProjectFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ProjectGovernance {
  ownership: ProjectOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: ProjectProvenance
  freshness: ProjectFreshness
}

export interface AutonomousProjectContext {
  contextId: string
  autonomousProjectId: string
  sessionId?: string
  governance: ProjectGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectPortfolio {
  portfolioId: string
  name: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface ProjectMilestone {
  milestoneId: string
  title: string
  description?: string
  dueAt?: IsoDateTime
  status: 'planned' | 'in-progress' | 'completed' | 'blocked' | 'cancelled'
  metadata?: Metadata
}

export interface ProjectDependency {
  dependencyId: string
  fromMilestoneId: string
  toMilestoneId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface ProjectConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ProjectResource {
  resourceId: string
  name: string
  category: 'budget' | 'capacity' | 'tooling' | 'infrastructure' | 'knowledge'
  allocation: number
  unit: string
  metadata?: Metadata
}

export interface ProjectRisk {
  riskId: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'low' | 'medium' | 'high'
  status: 'open' | 'monitoring' | 'mitigated' | 'accepted' | 'closed'
  metadata?: Metadata
}

export interface ProjectDecision {
  decisionId: string
  title: string
  rationale: string
  confidence: number
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface ProjectOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface ProjectSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ProjectCreatedState {
  state: 'project-created'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectPlannedState {
  state: 'project-planned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectCoordinatingState {
  state: 'project-coordinating'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectReadyState {
  state: 'project-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectRunningState {
  state: 'project-running'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectReviewingState {
  state: 'project-reviewing'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectCompletedState {
  state: 'project-completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectBlockedState {
  state: 'project-blocked'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectFailedState {
  state: 'project-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface ProjectCancelledState {
  state: 'project-cancelled'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type ProjectLifecycleStateModel =
  | ProjectCreatedState
  | ProjectPlannedState
  | ProjectCoordinatingState
  | ProjectReadyState
  | ProjectRunningState
  | ProjectReviewingState
  | ProjectCompletedState
  | ProjectBlockedState
  | ProjectFailedState
  | ProjectCancelledState

export interface AutonomousProjectLifecycleState {
  stage: AutonomousProjectLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ProjectCoordination {
  projectCoordinationId: string
  autonomousProjectId: string
  workflowReferences: {
    autonomousWorkflowId?: string
    workflowId?: string
    workflowPlanIds: string[]
  }
  taskReferences: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskIds: string[]
  }
  agentReferences: {
    autonomousAgentId?: string
    coordinationPlanId?: string
    agentIds: string[]
  }
  milestones: ProjectMilestone[]
  dependencies: ProjectDependency[]
  risks: ProjectRisk[]
  decisions: ProjectDecision[]
  outcomes: ProjectOutcome[]
  summary: ProjectSummary
  metadata?: Metadata
}

export interface AutonomousProjectPlan {
  projectPlanId: string
  autonomousProjectId: string
  workflowReferences: {
    autonomousWorkflowId?: string
    workflowId?: string
    workflowPlanIds: string[]
  }
  taskReferences: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskIds: string[]
  }
  agentReferences: {
    autonomousAgentId?: string
    coordinationPlanId?: string
    agentIds: string[]
  }
  portfolios: ProjectPortfolio[]
  milestones: ProjectMilestone[]
  dependencies: ProjectDependency[]
  constraints: ProjectConstraint[]
  resources: ProjectResource[]
  risks: ProjectRisk[]
  decisions: ProjectDecision[]
  outcomes: ProjectOutcome[]
  lifecycleStates: AutonomousProjectLifecycleState[]
  lifecycleStateModels: ProjectLifecycleStateModel[]
  summary: ProjectSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousProjectRegistration extends AutonomousProjectRegistrationInput {
  metadataModel: AutonomousProjectMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousProjectRuntimeHealth {
  autonomousProjectHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousProjectEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousProjectEntries: number
    lastUpdatedAt: IsoDateTime
  }
  projectCoordinationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    projectPlansTracked: number
    coordinationPlansTracked: number
    coordinatedMilestones: number
    openRisks: number
    lastCoordinatedAt?: IsoDateTime
  }
  projectValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousProjectRegistry {
  private registrations: Map<string, AutonomousProjectRegistration> = new Map()
  private sessions: Map<string, AutonomousProjectSession> = new Map()
  private contexts: Map<string, AutonomousProjectContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousProjectEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousProjectRegistrationInput): AutonomousProjectRegistration {
    const validationResult = this.validation.validateAutonomousProject(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousProjectId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousProject('Duplicate autonomous project ID detected', {
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousProjectEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousProject('Autonomous project registration validation failed', {
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    const registration: AutonomousProjectRegistration = {
      ...input,
      metadataModel: {
        autonomousProjectId: input.autonomousProjectId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousProjectId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousProjectSessionInput): AutonomousProjectSession {
    if (!this.registrations.has(input.autonomousProjectId)) {
      throw RuntimeError.autonomousProject('Autonomous project registration not found', {
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousProject('Duplicate autonomous project session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousProjectSession = {
      sessionId: input.sessionId,
      autonomousProjectId: input.autonomousProjectId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousProjectContextInput): AutonomousProjectContext {
    if (!this.registrations.has(input.autonomousProjectId)) {
      throw RuntimeError.autonomousProject('Autonomous project registration not found for context', {
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousProject('Autonomous project session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousProject('Duplicate autonomous project context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateProjectGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousProjectEntries += 1
      this.validationRejected += 1
      throw RuntimeError.projectGovernance('Project governance validation failed', {
        contextId: input.contextId,
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    const context: AutonomousProjectContext = {
      contextId: input.contextId,
      autonomousProjectId: input.autonomousProjectId,
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

  get(autonomousProjectId: string): AutonomousProjectRegistration | undefined {
    return this.registrations.get(autonomousProjectId)
  }

  getSession(sessionId: string): AutonomousProjectSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): AutonomousProjectContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): AutonomousProjectRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousProjectSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousProjectContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousProjectCount(): number {
    return this.invalidAutonomousProjectEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-project-registry',
      'Autonomous Project Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapPortfolios(input: ProjectPortfolioInput[]): ProjectPortfolio[] {
  return input.map((portfolio) => ({ ...portfolio }))
}

function mapMilestones(input: ProjectMilestoneInput[]): ProjectMilestone[] {
  return input.map((milestone) => ({ ...milestone }))
}

function mapDependencies(input: ProjectDependencyInput[]): ProjectDependency[] {
  return input.map((dependency) => ({ ...dependency }))
}

function mapConstraints(input: ProjectConstraintInput[]): ProjectConstraint[] {
  return input.map((constraint) => ({ ...constraint }))
}

function mapResources(input: ProjectResourceInput[]): ProjectResource[] {
  return input.map((resource) => ({ ...resource }))
}

function mapRisks(input: ProjectRiskInput[]): ProjectRisk[] {
  return input.map((risk) => ({ ...risk }))
}

function mapDecisions(input: ProjectDecisionInput[]): ProjectDecision[] {
  return input.map((decision) => ({ ...decision }))
}

function mapOutcomes(input: ProjectOutcomeInput[]): ProjectOutcome[] {
  return input.map((outcome) => ({ ...outcome }))
}

function mapSummary(input: AutonomousProjectSummaryInput): ProjectSummary {
  return {
    synopsis: input.synopsis,
    highlights: [...input.highlights],
    risks: [...input.risks],
    nextActions: [...input.nextActions],
  }
}

function mapLifecycleStates(input: AutonomousProjectLifecycleStateInput[]): AutonomousProjectLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapLifecycleStateModels(input: AutonomousProjectLifecycleStateInput[]): ProjectLifecycleStateModel[] {
  return input.map((state) => ({
    state: state.stage,
    enteredAt: state.enteredAt ?? now(),
    metadata: state.metadata,
  }))
}

function createCoordinationInput(projectPlan: AutonomousProjectInput): ProjectCoordinationInput {
  return {
    projectCoordinationId: `coord-${projectPlan.projectPlanId}`,
    autonomousProjectId: projectPlan.autonomousProjectId,
    workflowReferences: {
      ...projectPlan.workflowReferences,
      workflowPlanIds: [...projectPlan.workflowReferences.workflowPlanIds],
    },
    taskReferences: {
      ...projectPlan.taskReferences,
      taskIds: [...projectPlan.taskReferences.taskIds],
    },
    agentReferences: {
      ...projectPlan.agentReferences,
      agentIds: [...projectPlan.agentReferences.agentIds],
    },
    milestones: projectPlan.milestones,
    dependencies: projectPlan.dependencies,
    risks: projectPlan.risks,
    decisions: projectPlan.decisions,
    outcomes: projectPlan.outcomes,
    summary: projectPlan.summary,
    metadata: projectPlan.metadata,
  }
}

export class AutonomousProjectManager {
  private projectPlans: Map<string, AutonomousProjectPlan> = new Map()
  private projectCoordinationPlans: Map<string, ProjectCoordination> = new Map()
  private diagnostics: AutonomousProjectDiagnostics[] = []
  private openRisks = 0
  private lastCoordinatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousProjectRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousProject(input: AutonomousProjectRegistrationInput): AutonomousProjectRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousProjectSessionInput): AutonomousProjectSession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousProjectContextInput): AutonomousProjectContext {
    return this.registry.createContext(input)
  }

  createProjectPlan(input: AutonomousProjectInput): AutonomousProjectPlan {
    if (!this.registry.get(input.autonomousProjectId)) {
      throw RuntimeError.autonomousProject('Autonomous project registration not found for project plan', {
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    const planningValidation = this.validation.validateProjectPlanning(input)
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateProjectLifecycle(state.stage).diagnostics
    )
    const coordinationValidation = this.validation.validateProjectCoordination(createCoordinationInput(input))

    const diagnostics = [
      ...planningValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...coordinationValidation.diagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-project-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasLifecycleErrors = lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (hasLifecycleErrors) {
      throw RuntimeError.projectLifecycle('Project lifecycle validation failed', {
        projectPlanId: input.projectPlanId,
      })
    }

    if (!planningValidation.valid) {
      throw RuntimeError.projectPlanning('Project planning validation failed', {
        projectPlanId: input.projectPlanId,
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    if (!coordinationValidation.valid) {
      throw RuntimeError.projectCoordination('Project coordination validation failed', {
        projectPlanId: input.projectPlanId,
        autonomousProjectId: input.autonomousProjectId,
      })
    }

    const projectPlan: AutonomousProjectPlan = {
      projectPlanId: input.projectPlanId,
      autonomousProjectId: input.autonomousProjectId,
      workflowReferences: {
        ...input.workflowReferences,
        workflowPlanIds: [...input.workflowReferences.workflowPlanIds],
      },
      taskReferences: {
        ...input.taskReferences,
        taskIds: [...input.taskReferences.taskIds],
      },
      agentReferences: {
        ...input.agentReferences,
        agentIds: [...input.agentReferences.agentIds],
      },
      portfolios: mapPortfolios(input.portfolios),
      milestones: mapMilestones(input.milestones),
      dependencies: mapDependencies(input.dependencies),
      constraints: mapConstraints(input.constraints),
      resources: mapResources(input.resources),
      risks: mapRisks(input.risks),
      decisions: mapDecisions(input.decisions),
      outcomes: mapOutcomes(input.outcomes),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      lifecycleStateModels: mapLifecycleStateModels(input.lifecycleStates),
      summary: mapSummary(input.summary),
      createdAt: now(),
      metadata: input.metadata,
    }

    const projectCoordinationPlan: ProjectCoordination = {
      ...createCoordinationInput(input),
      milestones: mapMilestones(input.milestones),
      dependencies: mapDependencies(input.dependencies),
      risks: mapRisks(input.risks),
      decisions: mapDecisions(input.decisions),
      outcomes: mapOutcomes(input.outcomes),
      summary: mapSummary(input.summary),
    }

    this.openRisks += projectCoordinationPlan.risks.filter((risk) => risk.status !== 'closed').length
    this.projectPlans.set(projectPlan.projectPlanId, projectPlan)
    this.projectCoordinationPlans.set(projectCoordinationPlan.projectCoordinationId, projectCoordinationPlan)
    this.lastCoordinatedAt = now()
    this.lastUpdatedAt = now()
    return projectPlan
  }

  getProjectPlan(projectPlanId: string): AutonomousProjectPlan | undefined {
    return this.projectPlans.get(projectPlanId)
  }

  getProjectCoordinationPlan(projectCoordinationId: string): ProjectCoordination | undefined {
    return this.projectCoordinationPlans.get(projectCoordinationId)
  }

  listProjectPlans(): AutonomousProjectPlan[] {
    return Array.from(this.projectPlans.values())
  }

  listProjectCoordinationPlans(): ProjectCoordination[] {
    return Array.from(this.projectCoordinationPlans.values())
  }

  getHealth(): AutonomousProjectRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const coordinatedMilestones = this.listProjectPlans().reduce((count, projectPlan) => {
      return count + projectPlan.milestones.length
    }, 0)

    return {
      autonomousProjectHealth: {
        status: this.registry.getInvalidAutonomousProjectCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousProjectEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousProjectEntries: this.registry.getInvalidAutonomousProjectCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      projectCoordinationHealth: {
        status: this.openRisks > 0 ? 'degraded' : 'healthy',
        projectPlansTracked: this.projectPlans.size,
        coordinationPlansTracked: this.projectCoordinationPlans.size,
        coordinatedMilestones,
        openRisks: this.openRisks,
        lastCoordinatedAt: this.lastCoordinatedAt,
      },
      projectValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
