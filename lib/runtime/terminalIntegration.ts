import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type TerminalConfigurationInput,
  type TerminalIntegrationContextInput,
  type TerminalIntegrationGovernanceInput,
  type TerminalIntegrationLifecycleStage,
  type TerminalIntegrationRegistrationInput,
  type TerminalIntegrationSessionInput,
  type TerminalResourceInput,
  type TerminalStateInput,
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

export interface TerminalIntegrationMetadata {
  terminalIntegrationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TerminalIntegrationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface TerminalIntegrationSession {
  sessionId: string
  terminalIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TerminalOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface TerminalProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface TerminalFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface TerminalGovernance {
  ownership: TerminalOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: TerminalProvenance
  freshness: TerminalFreshness
}

export interface TerminalIntegrationContext {
  contextId: string
  terminalIntegrationId: string
  sessionId?: string
  governance: TerminalGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalProfile {
  profileId: string
  name: string
  description?: string
  terminalType: 'integrated' | 'external' | 'remote' | 'virtual' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface TerminalEnvironment {
  environmentId: string
  name: string
  shellFamily: 'powershell' | 'cmd' | 'bash' | 'zsh' | 'fish' | 'wsl' | 'other'
  platform: 'windows' | 'linux' | 'macos' | 'unknown'
  metadata?: Metadata
}

export interface TerminalWorkspace {
  workspaceId: string
  name: string
  rootPaths: string[]
  state: TerminalStateInput
  metadata?: Metadata
}

export interface TerminalWindow {
  windowId: string
  workspaceId?: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface TerminalInstance {
  terminalInstanceId: string
  windowId?: string
  shell: string
  state: TerminalStateInput
  metadata?: Metadata
}

export interface TerminalCapability {
  capabilityId: string
  name: string
  category: 'shell' | 'session' | 'queue' | 'history' | 'buffer' | 'snapshot' | 'integration' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface TerminalShell {
  shellId: string
  name: string
  family: 'powershell' | 'cmd' | 'bash' | 'zsh' | 'fish' | 'wsl' | 'other'
  executable?: string
  metadata?: Metadata
}

export interface TerminalCommand {
  commandId: string
  commandText: string
  source: 'manual' | 'automation' | 'system'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  metadata?: Metadata
}

export interface TerminalSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ShellSession {
  shellSessionId: string
  terminalInstanceId: string
  shellId: string
  state: 'created' | 'active' | 'idle' | 'closed' | 'failed'
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ShellProfile {
  shellProfileId: string
  shellId: string
  profileName: string
  initScriptPath?: string
  metadata?: Metadata
}

export interface CommandQueue {
  queueId: string
  terminalInstanceId: string
  pendingCommandIds: string[]
  blocked: boolean
  metadata?: Metadata
}

export interface CommandHistory {
  historyId: string
  terminalInstanceId: string
  commandIds: string[]
  retainedEntries: number
  metadata?: Metadata
}

export interface WorkingDirectory {
  workingDirectoryId: string
  terminalInstanceId: string
  path: string
  exists: boolean
  metadata?: Metadata
}

export interface EnvironmentVariable {
  variableId: string
  key: string
  value: string
  masked?: boolean
  source?: 'system' | 'profile' | 'session' | 'runtime'
  metadata?: Metadata
}

export interface ProcessHandle {
  processHandleId: string
  processId: string
  name: string
  state: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface ConsoleBuffer {
  bufferId: string
  terminalInstanceId: string
  lineCount: number
  truncated: boolean
  metadata?: Metadata
}

export interface TerminalCheckpoint {
  checkpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalSnapshot {
  terminalSnapshotId: string
  terminalIntegrationId: string
  terminalConfigurationId?: string
  state?: TerminalStateInput
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalResource {
  terminalResourceId: string
  terminalIntegrationId: string
  shellSessions: ShellSession[]
  shellProfiles: ShellProfile[]
  commandQueues: CommandQueue[]
  commandHistories: CommandHistory[]
  workingDirectories: WorkingDirectory[]
  environmentVariables: EnvironmentVariable[]
  processHandles: ProcessHandle[]
  consoleBuffers: ConsoleBuffer[]
  terminalCheckpoints: TerminalCheckpoint[]
  terminalSnapshots: TerminalSnapshot[]
  metadata?: Metadata
}

export interface TerminalConfiguration {
  terminalConfigurationId: string
  terminalIntegrationId: string
  ideReferences: {
    ideIntegrationId?: string
    ideConfigurationId?: string
  }
  desktopReferences: {
    desktopIntegrationId?: string
    desktopConfigurationId?: string
  }
  recoveryReferences: {
    autonomousRecoveryId?: string
    recoveryPlanId?: string
    continuityPlanId?: string
  }
  workspaceReferences: {
    autonomousWorkspaceId?: string
    workspaceConfigurationId?: string
    workspaceSnapshotId?: string
  }
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
  profile: TerminalProfile
  environment: TerminalEnvironment
  workspaces: TerminalWorkspace[]
  windows: TerminalWindow[]
  terminalInstances: TerminalInstance[]
  capabilities: TerminalCapability[]
  shells: TerminalShell[]
  commands: TerminalCommand[]
  governance: TerminalGovernance
  resourceModel: TerminalResource
  summary: TerminalSummary
  metadata?: Metadata
}

export interface TerminalRegisteredState {
  state: 'terminal-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalAvailableState {
  state: 'terminal-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalPreparedState {
  state: 'terminal-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalReadyState {
  state: 'terminal-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalConnectedState {
  state: 'terminal-connected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalBusyState {
  state: 'terminal-busy'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalWaitingState {
  state: 'terminal-waiting'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalSuspendedState {
  state: 'terminal-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalFailedState {
  state: 'terminal-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface TerminalArchivedState {
  state: 'terminal-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type TerminalLifecycleStateModel =
  | TerminalRegisteredState
  | TerminalAvailableState
  | TerminalPreparedState
  | TerminalReadyState
  | TerminalConnectedState
  | TerminalBusyState
  | TerminalWaitingState
  | TerminalSuspendedState
  | TerminalFailedState
  | TerminalArchivedState

export type TerminalIntegrationState = TerminalStateInput

export interface TerminalIntegrationLifecycleState {
  stage: TerminalIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TerminalIntegrationRegistration extends TerminalIntegrationRegistrationInput {
  metadataModel: TerminalIntegrationMetadata
  registeredAt: IsoDateTime
}

export interface TerminalIntegrationRuntimeHealth {
  terminalIntegrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredTerminalIntegrationEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidTerminalIntegrationEntries: number
    lastUpdatedAt: IsoDateTime
  }
  terminalResourceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    terminalConfigurationsTracked: number
    terminalResourcesTracked: number
    commandQueuesTracked: number
    commandHistoryEntriesTracked: number
    lastResourceUpdatedAt?: IsoDateTime
  }
  terminalValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class TerminalIntegrationRegistry {
  private registrations: Map<string, TerminalIntegrationRegistration> = new Map()
  private sessions: Map<string, TerminalIntegrationSession> = new Map()
  private contexts: Map<string, TerminalIntegrationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidTerminalIntegrationEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: TerminalIntegrationRegistrationInput): TerminalIntegrationRegistration {
    const validationResult = this.validation.validateTerminalIntegration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.terminalIntegrationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.terminalIntegration('Duplicate terminal integration ID detected', {
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidTerminalIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.terminalIntegration('Terminal integration registration validation failed', {
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    const registration: TerminalIntegrationRegistration = {
      ...input,
      metadataModel: {
        terminalIntegrationId: input.terminalIntegrationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.terminalIntegrationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: TerminalIntegrationSessionInput): TerminalIntegrationSession {
    if (!this.registrations.has(input.terminalIntegrationId)) {
      throw RuntimeError.terminalIntegration('Terminal integration registration not found', {
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.terminalIntegration('Duplicate terminal integration session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: TerminalIntegrationSession = {
      sessionId: input.sessionId,
      terminalIntegrationId: input.terminalIntegrationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: TerminalIntegrationContextInput): TerminalIntegrationContext {
    if (!this.registrations.has(input.terminalIntegrationId)) {
      throw RuntimeError.terminalIntegration('Terminal integration registration not found for context', {
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.terminalIntegration('Terminal integration session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.terminalIntegration('Duplicate terminal integration context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateTerminalGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidTerminalIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.terminalGovernance('Terminal governance validation failed', {
        contextId: input.contextId,
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    const context: TerminalIntegrationContext = {
      contextId: input.contextId,
      terminalIntegrationId: input.terminalIntegrationId,
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

  get(terminalIntegrationId: string): TerminalIntegrationRegistration | undefined {
    return this.registrations.get(terminalIntegrationId)
  }

  list(): TerminalIntegrationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): TerminalIntegrationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): TerminalIntegrationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidTerminalIntegrationCount(): number {
    return this.invalidTerminalIntegrationEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'terminal-integration-registry',
      'Terminal Integration Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: TerminalResourceInput): TerminalResource {
  return {
    terminalResourceId: input.terminalResourceId,
    terminalIntegrationId: input.terminalIntegrationId,
    shellSessions: input.shellSessions.map((session) => ({ ...session })),
    shellProfiles: input.shellProfiles.map((profile) => ({ ...profile })),
    commandQueues: input.commandQueues.map((queue) => ({ ...queue, pendingCommandIds: [...queue.pendingCommandIds] })),
    commandHistories: input.commandHistories.map((history) => ({ ...history, commandIds: [...history.commandIds] })),
    workingDirectories: input.workingDirectories.map((dir) => ({ ...dir })),
    environmentVariables: input.environmentVariables.map((variable) => ({ ...variable })),
    processHandles: input.processHandles.map((handle) => ({ ...handle })),
    consoleBuffers: input.consoleBuffers.map((buffer) => ({ ...buffer })),
    terminalCheckpoints: input.terminalCheckpoints.map((checkpoint) => ({ ...checkpoint })),
    terminalSnapshots: input.terminalSnapshots.map((snapshot) => ({ ...snapshot })),
    metadata: input.metadata,
  }
}

export class TerminalIntegrationManager {
  private terminalConfigurations: Map<string, TerminalConfiguration> = new Map()
  private diagnostics: TerminalIntegrationDiagnostics[] = []
  private lastResourceUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: TerminalIntegrationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerTerminalIntegration(input: TerminalIntegrationRegistrationInput): TerminalIntegrationRegistration {
    return this.registry.register(input)
  }

  startSession(input: TerminalIntegrationSessionInput): TerminalIntegrationSession {
    return this.registry.createSession(input)
  }

  createContext(input: TerminalIntegrationContextInput): TerminalIntegrationContext {
    return this.registry.createContext(input)
  }

  createTerminalConfiguration(input: TerminalConfigurationInput): TerminalConfiguration {
    if (!this.registry.get(input.terminalIntegrationId)) {
      throw RuntimeError.terminalIntegration('Terminal integration registration not found for terminal configuration', {
        terminalIntegrationId: input.terminalIntegrationId,
      })
    }

    const integrationValidation = this.validation.validateTerminalConfiguration(input)
    const governanceValidation = this.validation.validateTerminalGovernance(input.governance)
    const resourceValidation = this.validation.validateTerminalResource(input.resourceModel)
    const lifecycleDiagnostics = input.terminalInstances.flatMap((instance) =>
      this.validation.validateTerminalLifecycle(instance.state).diagnostics
    )

    const diagnostics = [
      ...integrationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `terminal-integration-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!integrationValidation.valid) {
      throw RuntimeError.terminalConfiguration('Terminal configuration validation failed', {
        terminalConfigurationId: input.terminalConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.terminalGovernance('Terminal governance validation failed', {
        terminalConfigurationId: input.terminalConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.terminalResource('Terminal resource validation failed', {
        terminalResourceId: input.resourceModel.terminalResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.terminalLifecycle('Terminal lifecycle validation failed', {
        terminalConfigurationId: input.terminalConfigurationId,
      })
    }

    const config: TerminalConfiguration = {
      terminalConfigurationId: input.terminalConfigurationId,
      terminalIntegrationId: input.terminalIntegrationId,
      ideReferences: { ...input.ideReferences },
      desktopReferences: { ...input.desktopReferences },
      recoveryReferences: { ...input.recoveryReferences },
      workspaceReferences: { ...input.workspaceReferences },
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
      environment: { ...input.environment },
      workspaces: input.workspaces.map((workspace) => ({ ...workspace, rootPaths: [...workspace.rootPaths] })),
      windows: input.windows.map((window) => ({ ...window })),
      terminalInstances: input.terminalInstances.map((instance) => ({ ...instance })),
      capabilities: input.capabilities.map((capability) => ({ ...capability })),
      shells: input.shells.map((shell) => ({ ...shell })),
      commands: input.commands.map((command) => ({ ...command })),
      governance: { ...input.governance },
      resourceModel: mapResource(input.resourceModel),
      summary: {
        synopsis: input.summary.synopsis,
        highlights: [...input.summary.highlights],
        risks: [...input.summary.risks],
        nextActions: [...input.summary.nextActions],
      },
      metadata: input.metadata,
    }

    this.terminalConfigurations.set(config.terminalConfigurationId, config)
    this.lastResourceUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getTerminalConfiguration(terminalConfigurationId: string): TerminalConfiguration | undefined {
    return this.terminalConfigurations.get(terminalConfigurationId)
  }

  listTerminalConfigurations(): TerminalConfiguration[] {
    return Array.from(this.terminalConfigurations.values())
  }

  getHealth(): TerminalIntegrationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listTerminalConfigurations()
    const terminalResourcesTracked = configurations.reduce((count, config) => {
      return count + (config.resourceModel.terminalResourceId ? 1 : 0)
    }, 0)

    const commandQueuesTracked = configurations.reduce((count, config) => {
      return count + config.resourceModel.commandQueues.length
    }, 0)

    const commandHistoryEntriesTracked = configurations.reduce((count, config) => {
      return (
        count +
        config.resourceModel.commandHistories.reduce((historyCount, history) => {
          return historyCount + history.commandIds.length
        }, 0)
      )
    }, 0)

    return {
      terminalIntegrationHealth: {
        status: this.registry.getInvalidTerminalIntegrationCount() > 0 ? 'degraded' : 'healthy',
        registeredTerminalIntegrationEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidTerminalIntegrationEntries: this.registry.getInvalidTerminalIntegrationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      terminalResourceHealth: {
        status: terminalResourcesTracked > 0 ? 'healthy' : 'degraded',
        terminalConfigurationsTracked: configurations.length,
        terminalResourcesTracked,
        commandQueuesTracked,
        commandHistoryEntriesTracked,
        lastResourceUpdatedAt: this.lastResourceUpdatedAt,
      },
      terminalValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
