import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AutonomousWorkspaceContextInput,
  type AutonomousWorkspaceGovernanceInput,
  type AutonomousWorkspaceLifecycleStage,
  type AutonomousWorkspaceLifecycleStateInput,
  type AutonomousWorkspaceRegistrationInput,
  type AutonomousWorkspaceSessionInput,
  type WorkspaceConfigurationInput,
  type WorkspaceResourceInput,
  type WorkspaceSessionInput,
  type WorkspaceSnapshotInput,
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

export interface AutonomousWorkspaceMetadata {
  autonomousWorkspaceId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousWorkspaceDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousWorkspaceSession {
  sessionId: string
  autonomousWorkspaceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface WorkspaceProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface WorkspaceFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface WorkspaceGovernance {
  ownership: WorkspaceOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: WorkspaceProvenance
  freshness: WorkspaceFreshness
}

export interface AutonomousWorkspaceContext {
  contextId: string
  autonomousWorkspaceId: string
  sessionId?: string
  governance: WorkspaceGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceProfile {
  profileId: string
  name: string
  description?: string
  type: 'local' | 'remote' | 'container' | 'hybrid'
  metadata?: Metadata
}

export interface WorkspaceEnvironment {
  environmentId: string
  name: string
  osFamily: 'windows' | 'linux' | 'macos' | 'unknown'
  variables: Array<{
    key: string
    value: string
    masked?: boolean
  }>
  metadata?: Metadata
}

export interface WorkspaceLayout {
  layoutId: string
  name: string
  windowIds: string[]
  terminalIds: string[]
  browserIds: string[]
  metadata?: Metadata
}

export interface IDEInstance {
  ideId: string
  type: 'vscode' | 'visual-studio' | 'jetbrains' | 'other'
  status: 'starting' | 'ready' | 'busy' | 'inactive' | 'failed'
  workspaceRoots: string[]
  metadata?: Metadata
}

export interface TerminalInstance {
  terminalId: string
  shell: string
  status: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  cwd?: string
  metadata?: Metadata
}

export interface BrowserInstance {
  browserId: string
  type: 'chromium' | 'firefox' | 'webkit' | 'other'
  status: 'starting' | 'ready' | 'busy' | 'closed' | 'failed'
  tabCount: number
  metadata?: Metadata
}

export interface ApplicationInstance {
  applicationId: string
  name: string
  category: 'ide' | 'terminal' | 'browser' | 'tool' | 'service' | 'other'
  status: 'installed' | 'available' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface WindowInstance {
  windowId: string
  title: string
  applicationId: string
  status: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface WorkspaceProcess {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'starting' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface WorkspaceService {
  serviceId: string
  name: string
  type: 'runtime' | 'tooling' | 'integration' | 'monitoring' | 'other'
  status: 'registered' | 'available' | 'degraded' | 'unavailable'
  metadata?: Metadata
}

export interface WorkspaceConnection {
  connectionId: string
  fromResourceId: string
  toResourceId: string
  type: 'dependency' | 'integration' | 'communication' | 'data'
  status: 'active' | 'inactive' | 'degraded' | 'failed'
  metadata?: Metadata
}

export interface WorkspaceDependency {
  dependencyId: string
  fromResourceId: string
  toResourceId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface WorkspaceCheckpoint {
  checkpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceResource {
  resourceId: string
  name: string
  category: 'ide' | 'terminal' | 'browser' | 'application' | 'process' | 'service' | 'connection' | 'dependency' | 'checkpoint'
  status: 'registered' | 'available' | 'active' | 'inactive' | 'failed'
  metadata?: Metadata
}

export interface WorkspaceConfiguration {
  workspaceConfigurationId: string
  autonomousWorkspaceId: string
  projectReferences: {
    autonomousProjectId?: string
    projectPlanId?: string
  }
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
  profile: WorkspaceProfile
  environment: WorkspaceEnvironment
  layout: WorkspaceLayout
  resources: WorkspaceResource[]
  resourceSnapshot: WorkspaceResourceSnapshot
  summary: WorkspaceSummary
  metadata?: Metadata
}

export interface WorkspaceResourceSnapshot {
  workspaceResourceId: string
  autonomousWorkspaceId: string
  ideInstances: IDEInstance[]
  terminalInstances: TerminalInstance[]
  browserInstances: BrowserInstance[]
  applicationInstances: ApplicationInstance[]
  windowInstances: WindowInstance[]
  workspaceProcesses: WorkspaceProcess[]
  workspaceServices: WorkspaceService[]
  workspaceConnections: WorkspaceConnection[]
  workspaceDependencies: WorkspaceDependency[]
  workspaceCheckpoints: WorkspaceCheckpoint[]
  metadata?: Metadata
}

export interface WorkspaceSession {
  workspaceSessionId: string
  autonomousWorkspaceId: string
  state: WorkspaceState
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface WorkspaceSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WorkspaceSnapshot {
  workspaceSnapshotId: string
  autonomousWorkspaceId: string
  workspaceConfigurationId: string
  workspaceSessionId?: string
  state: WorkspaceState
  lifecycleStates: AutonomousWorkspaceLifecycleState[]
  outcomes: WorkspaceOutcome[]
  summary: WorkspaceSummary
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceCreatedState {
  state: 'workspace-created'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceConfiguredState {
  state: 'workspace-configured'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceReadyState {
  state: 'workspace-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceActiveState {
  state: 'workspace-active'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceSuspendedState {
  state: 'workspace-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceRestoredState {
  state: 'workspace-restored'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceArchivedState {
  state: 'workspace-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceClosedState {
  state: 'workspace-closed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceFailedState {
  state: 'workspace-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkspaceRecoveredState {
  state: 'workspace-recovered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type WorkspaceLifecycleStateModel =
  | WorkspaceCreatedState
  | WorkspaceConfiguredState
  | WorkspaceReadyState
  | WorkspaceActiveState
  | WorkspaceSuspendedState
  | WorkspaceRestoredState
  | WorkspaceArchivedState
  | WorkspaceClosedState
  | WorkspaceFailedState
  | WorkspaceRecoveredState

export type WorkspaceState =
  | 'workspace-created'
  | 'workspace-configured'
  | 'workspace-ready'
  | 'workspace-active'
  | 'workspace-suspended'
  | 'workspace-restored'
  | 'workspace-archived'
  | 'workspace-closed'
  | 'workspace-failed'
  | 'workspace-recovered'

export interface AutonomousWorkspaceLifecycleState {
  stage: AutonomousWorkspaceLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousWorkspaceRegistration extends AutonomousWorkspaceRegistrationInput {
  metadataModel: AutonomousWorkspaceMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousWorkspaceRuntimeHealth {
  autonomousWorkspaceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousWorkspaceEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousWorkspaceEntries: number
    lastUpdatedAt: IsoDateTime
  }
  workspaceResourceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    workspaceConfigurationsTracked: number
    workspaceSnapshotsTracked: number
    totalResourceInstances: number
    lastResourceUpdateAt?: IsoDateTime
  }
  workspaceValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousWorkspaceRegistry {
  private registrations: Map<string, AutonomousWorkspaceRegistration> = new Map()
  private sessions: Map<string, AutonomousWorkspaceSession> = new Map()
  private contexts: Map<string, AutonomousWorkspaceContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousWorkspaceEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousWorkspaceRegistrationInput): AutonomousWorkspaceRegistration {
    const validationResult = this.validation.validateAutonomousWorkspace(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousWorkspaceId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkspace('Duplicate autonomous workspace ID detected', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousWorkspaceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkspace('Autonomous workspace registration validation failed', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    const registration: AutonomousWorkspaceRegistration = {
      ...input,
      metadataModel: {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousWorkspaceId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousWorkspaceSessionInput): AutonomousWorkspaceSession {
    if (!this.registrations.has(input.autonomousWorkspaceId)) {
      throw RuntimeError.autonomousWorkspace('Autonomous workspace registration not found', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkspace('Duplicate autonomous workspace session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousWorkspaceSession = {
      sessionId: input.sessionId,
      autonomousWorkspaceId: input.autonomousWorkspaceId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousWorkspaceContextInput): AutonomousWorkspaceContext {
    if (!this.registrations.has(input.autonomousWorkspaceId)) {
      throw RuntimeError.autonomousWorkspace('Autonomous workspace registration not found for context', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousWorkspace('Autonomous workspace session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousWorkspace('Duplicate autonomous workspace context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateWorkspaceGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousWorkspaceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.workspaceGovernance('Workspace governance validation failed', {
        contextId: input.contextId,
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    const context: AutonomousWorkspaceContext = {
      contextId: input.contextId,
      autonomousWorkspaceId: input.autonomousWorkspaceId,
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

  get(autonomousWorkspaceId: string): AutonomousWorkspaceRegistration | undefined {
    return this.registrations.get(autonomousWorkspaceId)
  }

  getSession(sessionId: string): AutonomousWorkspaceSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): AutonomousWorkspaceContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): AutonomousWorkspaceRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousWorkspaceSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousWorkspaceContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousWorkspaceCount(): number {
    return this.invalidAutonomousWorkspaceEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-workspace-registry',
      'Autonomous Workspace Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapLifecycleStates(input: AutonomousWorkspaceLifecycleStateInput[]): AutonomousWorkspaceLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapLifecycleStateModels(input: AutonomousWorkspaceLifecycleStateInput[]): WorkspaceLifecycleStateModel[] {
  return input.map((state) => ({
    state: state.stage,
    enteredAt: state.enteredAt ?? now(),
    metadata: state.metadata,
  }))
}

function mapResources(input: WorkspaceResourceInput): WorkspaceResourceSnapshot {
  return {
    workspaceResourceId: input.workspaceResourceId,
    autonomousWorkspaceId: input.autonomousWorkspaceId,
    ideInstances: input.ideInstances.map((instance) => ({ ...instance })),
    terminalInstances: input.terminalInstances.map((instance) => ({ ...instance })),
    browserInstances: input.browserInstances.map((instance) => ({ ...instance })),
    applicationInstances: input.applicationInstances.map((instance) => ({ ...instance })),
    windowInstances: input.windowInstances.map((instance) => ({ ...instance })),
    workspaceProcesses: input.workspaceProcesses.map((instance) => ({ ...instance })),
    workspaceServices: input.workspaceServices.map((instance) => ({ ...instance })),
    workspaceConnections: input.workspaceConnections.map((instance) => ({ ...instance })),
    workspaceDependencies: input.workspaceDependencies.map((instance) => ({ ...instance })),
    workspaceCheckpoints: input.workspaceCheckpoints.map((instance) => ({ ...instance })),
    metadata: input.metadata,
  }
}

function mapSummary(summary: WorkspaceConfigurationInput['summary']): WorkspaceSummary {
  return {
    synopsis: summary.synopsis,
    highlights: [...summary.highlights],
    risks: [...summary.risks],
    nextActions: [...summary.nextActions],
  }
}

function mapWorkspaceSession(input: WorkspaceSessionInput): WorkspaceSession {
  return {
    workspaceSessionId: input.workspaceSessionId,
    autonomousWorkspaceId: input.autonomousWorkspaceId,
    state: input.state,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    metadata: input.metadata,
  }
}

function createWorkspaceResourcesFromSnapshot(snapshot: WorkspaceResourceSnapshot): WorkspaceResource[] {
  return [
    ...snapshot.ideInstances.map((instance) => ({
      resourceId: instance.ideId,
      name: instance.type,
      category: 'ide' as const,
      status: instance.status === 'failed' ? 'failed' as const : 'active' as const,
      metadata: instance.metadata,
    })),
    ...snapshot.terminalInstances.map((instance) => ({
      resourceId: instance.terminalId,
      name: instance.shell,
      category: 'terminal' as const,
      status: instance.status === 'failed' ? 'failed' as const : 'active' as const,
      metadata: instance.metadata,
    })),
    ...snapshot.browserInstances.map((instance) => ({
      resourceId: instance.browserId,
      name: instance.type,
      category: 'browser' as const,
      status: instance.status === 'failed' ? 'failed' as const : 'active' as const,
      metadata: instance.metadata,
    })),
  ]
}

function mapStateFromLifecycle(input: AutonomousWorkspaceLifecycleStateInput[]): WorkspaceState {
  const mostRecent = input[input.length - 1]
  return mostRecent?.stage ?? 'workspace-created'
}

export class AutonomousWorkspaceManager {
  private workspaceConfigurations: Map<string, WorkspaceConfiguration> = new Map()
  private workspaceSessions: Map<string, WorkspaceSession> = new Map()
  private workspaceSnapshots: Map<string, WorkspaceSnapshot> = new Map()
  private diagnostics: AutonomousWorkspaceDiagnostics[] = []
  private lastResourceUpdateAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousWorkspaceRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousWorkspace(input: AutonomousWorkspaceRegistrationInput): AutonomousWorkspaceRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousWorkspaceSessionInput): AutonomousWorkspaceSession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousWorkspaceContextInput): AutonomousWorkspaceContext {
    return this.registry.createContext(input)
  }

  createWorkspaceConfiguration(input: WorkspaceConfigurationInput): WorkspaceConfiguration {
    if (!this.registry.get(input.autonomousWorkspaceId)) {
      throw RuntimeError.autonomousWorkspace('Autonomous workspace registration not found for workspace configuration', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    const configurationValidation = this.validation.validateWorkspaceConfiguration(input)
    const governanceValidation = this.validation.validateWorkspaceGovernance(input.governance)
    const resourceValidation = this.validation.validateWorkspaceResource(input.resourceSnapshot)

    const diagnostics = [
      ...configurationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-workspace-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!configurationValidation.valid) {
      throw RuntimeError.workspaceConfiguration('Workspace configuration validation failed', {
        workspaceConfigurationId: input.workspaceConfigurationId,
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.workspaceGovernance('Workspace governance validation failed', {
        workspaceConfigurationId: input.workspaceConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.workspaceResource('Workspace resource validation failed', {
        workspaceResourceId: input.resourceSnapshot.workspaceResourceId,
      })
    }

    const resourceSnapshot = mapResources(input.resourceSnapshot)

    const configuration: WorkspaceConfiguration = {
      workspaceConfigurationId: input.workspaceConfigurationId,
      autonomousWorkspaceId: input.autonomousWorkspaceId,
      projectReferences: { ...input.projectReferences },
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
      profile: { ...input.profile },
      environment: {
        ...input.environment,
        variables: input.environment.variables.map((variable) => ({ ...variable })),
      },
      layout: {
        ...input.layout,
        windowIds: [...input.layout.windowIds],
        terminalIds: [...input.layout.terminalIds],
        browserIds: [...input.layout.browserIds],
      },
      resources: createWorkspaceResourcesFromSnapshot(resourceSnapshot),
      resourceSnapshot,
      summary: mapSummary(input.summary),
      metadata: input.metadata,
    }

    this.workspaceConfigurations.set(configuration.workspaceConfigurationId, configuration)
    this.lastResourceUpdateAt = now()
    this.lastUpdatedAt = now()
    return configuration
  }

  createWorkspaceSession(input: WorkspaceSessionInput): WorkspaceSession {
    if (!this.registry.get(input.autonomousWorkspaceId)) {
      throw RuntimeError.autonomousWorkspace('Autonomous workspace registration not found for workspace session', {
        autonomousWorkspaceId: input.autonomousWorkspaceId,
      })
    }

    if (this.workspaceSessions.has(input.workspaceSessionId)) {
      throw RuntimeError.autonomousWorkspace('Duplicate workspace session ID detected', {
        workspaceSessionId: input.workspaceSessionId,
      })
    }

    const workspaceSession = mapWorkspaceSession(input)
    this.workspaceSessions.set(workspaceSession.workspaceSessionId, workspaceSession)
    this.lastUpdatedAt = now()
    return workspaceSession
  }

  createWorkspaceSnapshot(input: WorkspaceSnapshotInput): WorkspaceSnapshot {
    const configuration = this.workspaceConfigurations.get(input.workspaceConfigurationId)
    if (!configuration) {
      throw RuntimeError.workspaceConfiguration('Workspace configuration not found for snapshot', {
        workspaceConfigurationId: input.workspaceConfigurationId,
      })
    }

    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateWorkspaceLifecycle(state.stage).diagnostics
    )

    this.diagnostics.push(
      ...lifecycleDiagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-workspace-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
      throw RuntimeError.workspaceLifecycle('Workspace lifecycle validation failed', {
        workspaceSnapshotId: input.workspaceSnapshotId,
      })
    }

    const snapshot: WorkspaceSnapshot = {
      workspaceSnapshotId: input.workspaceSnapshotId,
      autonomousWorkspaceId: input.autonomousWorkspaceId,
      workspaceConfigurationId: input.workspaceConfigurationId,
      workspaceSessionId: input.workspaceSessionId,
      state: input.state ?? mapStateFromLifecycle(input.lifecycleStates),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      outcomes: input.outcomes.map((outcome) => ({ ...outcome })),
      summary: mapSummary(input.summary),
      capturedAt: input.capturedAt,
      metadata: input.metadata,
    }

    const lifecycleStateModels = mapLifecycleStateModels(input.lifecycleStates)
    if (lifecycleStateModels.length === 0) {
      throw RuntimeError.workspaceLifecycle('Workspace snapshot requires at least one lifecycle state', {
        workspaceSnapshotId: input.workspaceSnapshotId,
      })
    }

    this.workspaceSnapshots.set(snapshot.workspaceSnapshotId, snapshot)
    this.lastUpdatedAt = now()
    return snapshot
  }

  getWorkspaceConfiguration(workspaceConfigurationId: string): WorkspaceConfiguration | undefined {
    return this.workspaceConfigurations.get(workspaceConfigurationId)
  }

  getWorkspaceSession(workspaceSessionId: string): WorkspaceSession | undefined {
    return this.workspaceSessions.get(workspaceSessionId)
  }

  getWorkspaceSnapshot(workspaceSnapshotId: string): WorkspaceSnapshot | undefined {
    return this.workspaceSnapshots.get(workspaceSnapshotId)
  }

  listWorkspaceConfigurations(): WorkspaceConfiguration[] {
    return Array.from(this.workspaceConfigurations.values())
  }

  listWorkspaceSessions(): WorkspaceSession[] {
    return Array.from(this.workspaceSessions.values())
  }

  listWorkspaceSnapshots(): WorkspaceSnapshot[] {
    return Array.from(this.workspaceSnapshots.values())
  }

  getHealth(): AutonomousWorkspaceRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const totalResourceInstances = this.listWorkspaceConfigurations().reduce((count, configuration) => {
      return count +
        configuration.resourceSnapshot.ideInstances.length +
        configuration.resourceSnapshot.terminalInstances.length +
        configuration.resourceSnapshot.browserInstances.length +
        configuration.resourceSnapshot.applicationInstances.length +
        configuration.resourceSnapshot.windowInstances.length +
        configuration.resourceSnapshot.workspaceProcesses.length +
        configuration.resourceSnapshot.workspaceServices.length +
        configuration.resourceSnapshot.workspaceConnections.length +
        configuration.resourceSnapshot.workspaceDependencies.length +
        configuration.resourceSnapshot.workspaceCheckpoints.length
    }, 0)

    return {
      autonomousWorkspaceHealth: {
        status: this.registry.getInvalidAutonomousWorkspaceCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousWorkspaceEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousWorkspaceEntries: this.registry.getInvalidAutonomousWorkspaceCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      workspaceResourceHealth: {
        status: totalResourceInstances > 0 ? 'healthy' : 'degraded',
        workspaceConfigurationsTracked: this.workspaceConfigurations.size,
        workspaceSnapshotsTracked: this.workspaceSnapshots.size,
        totalResourceInstances,
        lastResourceUpdateAt: this.lastResourceUpdateAt,
      },
      workspaceValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
