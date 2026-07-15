import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type IDEConfigurationInput,
  type IDEIntegrationContextInput,
  type IDEIntegrationGovernanceInput,
  type IDEIntegrationLifecycleStage,
  type IDEIntegrationRegistrationInput,
  type IDEIntegrationSessionInput,
  type IDEResourceInput,
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

export interface IDEIntegrationMetadata {
  ideIntegrationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface IDEIntegrationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface IDEIntegrationSession {
  sessionId: string
  ideIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface IDEOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface IDEProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface IDEFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface IDEGovernance {
  ownership: IDEOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: IDEProvenance
  freshness: IDEFreshness
}

export interface IDEIntegrationContext {
  contextId: string
  ideIntegrationId: string
  sessionId?: string
  governance: IDEGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEProfile {
  profileId: string
  name: string
  description?: string
  ideType: 'vscode' | 'cursor' | 'visual-studio' | 'jetbrains' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface IDEWorkspace {
  workspaceId: string
  name: string
  rootPaths: string[]
  state: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface IDEProject {
  projectId: string
  name: string
  workspaceId: string
  projectType: 'application' | 'library' | 'service' | 'tooling' | 'other'
  metadata?: Metadata
}

export interface IDEWindow {
  windowId: string
  workspaceId?: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface IDEEditor {
  editorId: string
  windowId: string
  language?: string
  state: 'active' | 'inactive' | 'split' | 'preview' | 'closed'
  metadata?: Metadata
}

export interface IDETerminal {
  ideTerminalId: string
  windowId?: string
  shell: string
  state: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  metadata?: Metadata
}

export interface IDEExtension {
  extensionId: string
  name: string
  publisher?: string
  version?: string
  state: 'registered' | 'enabled' | 'disabled' | 'error'
  metadata?: Metadata
}

export interface IDECapability {
  capabilityId: string
  name: string
  category: 'editing' | 'terminal' | 'debugging' | 'automation' | 'workspace' | 'extension' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface IDESummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WorkspaceFolder {
  folderId: string
  workspaceId: string
  path: string
  name: string
  metadata?: Metadata
}

export interface OpenFile {
  fileId: string
  workspaceId: string
  path: string
  language?: string
  isDirty: boolean
  metadata?: Metadata
}

export interface EditorGroup {
  editorGroupId: string
  windowId: string
  position: 'left' | 'center' | 'right' | 'top' | 'bottom'
  fileIds: string[]
  metadata?: Metadata
}

export interface CursorPosition {
  cursorId: string
  fileId: string
  line: number
  column: number
  selectionStart?: {
    line: number
    column: number
  }
  selectionEnd?: {
    line: number
    column: number
  }
  metadata?: Metadata
}

export interface Breakpoint {
  breakpointId: string
  fileId: string
  line: number
  column?: number
  condition?: string
  enabled: boolean
  metadata?: Metadata
}

export interface TerminalSession {
  terminalSessionId: string
  ideTerminalId: string
  state: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DebugSession {
  debugSessionId: string
  workspaceId: string
  state: 'created' | 'running' | 'paused' | 'stopped' | 'failed'
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface TaskRunner {
  taskRunnerId: string
  workspaceId: string
  name: string
  state: 'registered' | 'ready' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface IDEProcess {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface IDECheckpoint {
  checkpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEResource {
  ideResourceId: string
  ideIntegrationId: string
  workspaceFolders: WorkspaceFolder[]
  openFiles: OpenFile[]
  editorGroups: EditorGroup[]
  cursorPositions: CursorPosition[]
  breakpoints: Breakpoint[]
  terminalSessions: TerminalSession[]
  debugSessions: DebugSession[]
  taskRunners: TaskRunner[]
  ideProcesses: IDEProcess[]
  ideCheckpoints: IDECheckpoint[]
  metadata?: Metadata
}

export interface IDEConfiguration {
  ideConfigurationId: string
  ideIntegrationId: string
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
  profile: IDEProfile
  workspaces: IDEWorkspace[]
  projects: IDEProject[]
  windows: IDEWindow[]
  editors: IDEEditor[]
  terminals: IDETerminal[]
  extensions: IDEExtension[]
  capabilities: IDECapability[]
  governance: IDEGovernance
  resourceModel: IDEResource
  summary: IDESummary
  metadata?: Metadata
}

export interface IDERegisteredState {
  state: 'ide-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEAvailableState {
  state: 'ide-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEPreparedState {
  state: 'ide-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEReadyState {
  state: 'ide-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEConnectedState {
  state: 'ide-connected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDESuspendedState {
  state: 'ide-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEDisconnectedState {
  state: 'ide-disconnected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDERecoveredState {
  state: 'ide-recovered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEFailedState {
  state: 'ide-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface IDEArchivedState {
  state: 'ide-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type IDELifecycleStateModel =
  | IDERegisteredState
  | IDEAvailableState
  | IDEPreparedState
  | IDEReadyState
  | IDEConnectedState
  | IDESuspendedState
  | IDEDisconnectedState
  | IDERecoveredState
  | IDEFailedState
  | IDEArchivedState

export type IDEIntegrationState =
  | 'ide-registered'
  | 'ide-available'
  | 'ide-prepared'
  | 'ide-ready'
  | 'ide-connected'
  | 'ide-suspended'
  | 'ide-disconnected'
  | 'ide-recovered'
  | 'ide-failed'
  | 'ide-archived'

export interface IDEIntegrationLifecycleState {
  stage: IDEIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface IDEIntegrationRegistration extends IDEIntegrationRegistrationInput {
  metadataModel: IDEIntegrationMetadata
  registeredAt: IsoDateTime
}

export interface IDEIntegrationRuntimeHealth {
  ideIntegrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredIDEIntegrationEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidIDEIntegrationEntries: number
    lastUpdatedAt: IsoDateTime
  }
  ideResourceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    ideConfigurationsTracked: number
    ideResourcesTracked: number
    openFilesTracked: number
    terminalSessionsTracked: number
    lastResourceUpdatedAt?: IsoDateTime
  }
  ideValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class IDEIntegrationRegistry {
  private registrations: Map<string, IDEIntegrationRegistration> = new Map()
  private sessions: Map<string, IDEIntegrationSession> = new Map()
  private contexts: Map<string, IDEIntegrationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidIDEIntegrationEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: IDEIntegrationRegistrationInput): IDEIntegrationRegistration {
    const validationResult = this.validation.validateIDEIntegration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.ideIntegrationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.ideIntegration('Duplicate IDE integration ID detected', {
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidIDEIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.ideIntegration('IDE integration registration validation failed', {
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    const registration: IDEIntegrationRegistration = {
      ...input,
      metadataModel: {
        ideIntegrationId: input.ideIntegrationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.ideIntegrationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: IDEIntegrationSessionInput): IDEIntegrationSession {
    if (!this.registrations.has(input.ideIntegrationId)) {
      throw RuntimeError.ideIntegration('IDE integration registration not found', {
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.ideIntegration('Duplicate IDE integration session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: IDEIntegrationSession = {
      sessionId: input.sessionId,
      ideIntegrationId: input.ideIntegrationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: IDEIntegrationContextInput): IDEIntegrationContext {
    if (!this.registrations.has(input.ideIntegrationId)) {
      throw RuntimeError.ideIntegration('IDE integration registration not found for context', {
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.ideIntegration('IDE integration session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.ideIntegration('Duplicate IDE integration context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateIDEGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidIDEIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.ideGovernance('IDE governance validation failed', {
        contextId: input.contextId,
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    const context: IDEIntegrationContext = {
      contextId: input.contextId,
      ideIntegrationId: input.ideIntegrationId,
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

  get(ideIntegrationId: string): IDEIntegrationRegistration | undefined {
    return this.registrations.get(ideIntegrationId)
  }

  list(): IDEIntegrationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): IDEIntegrationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): IDEIntegrationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidIDEIntegrationCount(): number {
    return this.invalidIDEIntegrationEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'ide-integration-registry',
      'IDE Integration Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: IDEResourceInput): IDEResource {
  return {
    ideResourceId: input.ideResourceId,
    ideIntegrationId: input.ideIntegrationId,
    workspaceFolders: input.workspaceFolders.map((folder) => ({ ...folder })),
    openFiles: input.openFiles.map((file) => ({ ...file })),
    editorGroups: input.editorGroups.map((group) => ({ ...group, fileIds: [...group.fileIds] })),
    cursorPositions: input.cursorPositions.map((cursor) => ({
      ...cursor,
      selectionStart: cursor.selectionStart ? { ...cursor.selectionStart } : undefined,
      selectionEnd: cursor.selectionEnd ? { ...cursor.selectionEnd } : undefined,
    })),
    breakpoints: input.breakpoints.map((breakpoint) => ({ ...breakpoint })),
    terminalSessions: input.terminalSessions.map((session) => ({ ...session })),
    debugSessions: input.debugSessions.map((session) => ({ ...session })),
    taskRunners: input.taskRunners.map((runner) => ({ ...runner })),
    ideProcesses: input.ideProcesses.map((process) => ({ ...process })),
    ideCheckpoints: input.ideCheckpoints.map((checkpoint) => ({ ...checkpoint })),
    metadata: input.metadata,
  }
}

export class IDEIntegrationManager {
  private ideConfigurations: Map<string, IDEConfiguration> = new Map()
  private diagnostics: IDEIntegrationDiagnostics[] = []
  private lastResourceUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: IDEIntegrationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerIDEIntegration(input: IDEIntegrationRegistrationInput): IDEIntegrationRegistration {
    return this.registry.register(input)
  }

  startSession(input: IDEIntegrationSessionInput): IDEIntegrationSession {
    return this.registry.createSession(input)
  }

  createContext(input: IDEIntegrationContextInput): IDEIntegrationContext {
    return this.registry.createContext(input)
  }

  createIDEConfiguration(input: IDEConfigurationInput): IDEConfiguration {
    if (!this.registry.get(input.ideIntegrationId)) {
      throw RuntimeError.ideIntegration('IDE integration registration not found for IDE configuration', {
        ideIntegrationId: input.ideIntegrationId,
      })
    }

    const integrationValidation = this.validation.validateIDEConfiguration(input)
    const governanceValidation = this.validation.validateIDEGovernance(input.governance)
    const resourceValidation = this.validation.validateIDEResource(input.resourceModel)
    const lifecycleDiagnostics = this.validation.validateIDELifecycle('ide-registered').diagnostics

    const diagnostics = [
      ...integrationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `ide-integration-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!integrationValidation.valid) {
      throw RuntimeError.ideConfiguration('IDE configuration validation failed', {
        ideConfigurationId: input.ideConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.ideGovernance('IDE governance validation failed', {
        ideConfigurationId: input.ideConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.ideResource('IDE resource validation failed', {
        ideResourceId: input.resourceModel.ideResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.ideLifecycle('IDE lifecycle validation failed', {
        ideConfigurationId: input.ideConfigurationId,
      })
    }

    const config: IDEConfiguration = {
      ideConfigurationId: input.ideConfigurationId,
      ideIntegrationId: input.ideIntegrationId,
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
      workspaces: input.workspaces.map((workspace) => ({ ...workspace, rootPaths: [...workspace.rootPaths] })),
      projects: input.projects.map((project) => ({ ...project })),
      windows: input.windows.map((window) => ({ ...window })),
      editors: input.editors.map((editor) => ({ ...editor })),
      terminals: input.terminals.map((terminal) => ({ ...terminal })),
      extensions: input.extensions.map((extension) => ({ ...extension })),
      capabilities: input.capabilities.map((capability) => ({ ...capability })),
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

    this.ideConfigurations.set(config.ideConfigurationId, config)
    this.lastResourceUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getIDEConfiguration(ideConfigurationId: string): IDEConfiguration | undefined {
    return this.ideConfigurations.get(ideConfigurationId)
  }

  listIDEConfigurations(): IDEConfiguration[] {
    return Array.from(this.ideConfigurations.values())
  }

  getHealth(): IDEIntegrationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listIDEConfigurations()
    const ideResourcesTracked = configurations.reduce((count, config) => {
      return count + (config.resourceModel.ideResourceId ? 1 : 0)
    }, 0)

    const openFilesTracked = configurations.reduce((count, config) => {
      return count + config.resourceModel.openFiles.length
    }, 0)

    const terminalSessionsTracked = configurations.reduce((count, config) => {
      return count + config.resourceModel.terminalSessions.length
    }, 0)

    return {
      ideIntegrationHealth: {
        status: this.registry.getInvalidIDEIntegrationCount() > 0 ? 'degraded' : 'healthy',
        registeredIDEIntegrationEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidIDEIntegrationEntries: this.registry.getInvalidIDEIntegrationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      ideResourceHealth: {
        status: ideResourcesTracked > 0 ? 'healthy' : 'degraded',
        ideConfigurationsTracked: configurations.length,
        ideResourcesTracked,
        openFilesTracked,
        terminalSessionsTracked,
        lastResourceUpdatedAt: this.lastResourceUpdatedAt,
      },
      ideValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
