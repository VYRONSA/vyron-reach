import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type DesktopConfigurationInput,
  type DesktopIntegrationContextInput,
  type DesktopIntegrationGovernanceInput,
  type DesktopIntegrationLifecycleStage,
  type DesktopIntegrationLifecycleStateInput,
  type DesktopIntegrationRegistrationInput,
  type DesktopIntegrationSessionInput,
  type IntegrationTargetInput,
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

export interface DesktopIntegrationMetadata {
  desktopIntegrationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DesktopIntegrationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface DesktopIntegrationSession {
  sessionId: string
  desktopIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DesktopOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface DesktopProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface DesktopFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface DesktopGovernance {
  ownership: DesktopOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: DesktopProvenance
  freshness: DesktopFreshness
}

export interface DesktopIntegrationContext {
  contextId: string
  desktopIntegrationId: string
  sessionId?: string
  governance: DesktopGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopProfile {
  profileId: string
  name: string
  description?: string
  type: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface DesktopEnvironment {
  environmentId: string
  name: string
  platform: 'windows' | 'linux' | 'macos' | 'unknown'
  variables: Array<{
    key: string
    value: string
    masked?: boolean
  }>
  metadata?: Metadata
}

export interface DesktopApplication {
  applicationId: string
  name: string
  kind: 'ide' | 'browser' | 'terminal' | 'scm' | 'container' | 'database' | 'tool' | 'other'
  version?: string
  status: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface DesktopWorkspace {
  workspaceId: string
  name: string
  rootPaths: string[]
  status: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface DesktopWindow {
  windowId: string
  title: string
  applicationId: string
  status: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface DesktopProcess {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface DesktopSession {
  desktopSessionId: string
  desktopIntegrationId: string
  state: DesktopIntegrationState
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DesktopCapability {
  capabilityId: string
  name: string
  targetType: 'ide' | 'browser' | 'terminal' | 'application' | 'service' | 'process' | 'workspace' | 'window' | 'automation'
  supported: boolean
  metadata?: Metadata
}

export interface DesktopSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface IDETarget {
  targetId: string
  ideType: 'vscode' | 'visual-studio' | 'jetbrains' | 'other'
  workspaceIds: string[]
  metadata?: Metadata
}

export interface BrowserTarget {
  targetId: string
  browserType: 'chromium' | 'firefox' | 'webkit' | 'other'
  profileId?: string
  metadata?: Metadata
}

export interface TerminalTarget {
  targetId: string
  shell: string
  sessionIds: string[]
  metadata?: Metadata
}

export interface ApplicationTarget {
  targetId: string
  applicationId: string
  kind: 'ide' | 'browser' | 'terminal' | 'scm' | 'container' | 'database' | 'tool' | 'other'
  metadata?: Metadata
}

export interface ServiceTarget {
  targetId: string
  serviceId: string
  type: 'runtime' | 'integration' | 'tooling' | 'monitoring' | 'other'
  metadata?: Metadata
}

export interface ProcessTarget {
  targetId: string
  processId: string
  processName: string
  metadata?: Metadata
}

export interface WorkspaceTarget {
  targetId: string
  workspaceId: string
  roots: string[]
  metadata?: Metadata
}

export interface WindowTarget {
  targetId: string
  windowId: string
  applicationId: string
  metadata?: Metadata
}

export interface AutomationTarget {
  targetId: string
  targetCategory: 'ide' | 'browser' | 'terminal' | 'application' | 'service' | 'process' | 'workspace' | 'window'
  references: {
    autonomousRecoveryId?: string
    autonomousWorkspaceId?: string
    autonomousProjectId?: string
    autonomousWorkflowId?: string
    autonomousTaskId?: string
    autonomousAgentId?: string
  }
  metadata?: Metadata
}

export interface IntegrationDependency {
  dependencyId: string
  fromTargetId: string
  toTargetId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface IntegrationTarget {
  integrationTargetId: string
  desktopIntegrationId: string
  ideTargets: IDETarget[]
  browserTargets: BrowserTarget[]
  terminalTargets: TerminalTarget[]
  applicationTargets: ApplicationTarget[]
  serviceTargets: ServiceTarget[]
  processTargets: ProcessTarget[]
  workspaceTargets: WorkspaceTarget[]
  windowTargets: WindowTarget[]
  automationTargets: AutomationTarget[]
  dependencies: IntegrationDependency[]
  metadata?: Metadata
}

export interface DesktopConfiguration {
  desktopConfigurationId: string
  desktopIntegrationId: string
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
  profile: DesktopProfile
  environment: DesktopEnvironment
  applications: DesktopApplication[]
  workspaces: DesktopWorkspace[]
  windows: DesktopWindow[]
  processes: DesktopProcess[]
  sessions: DesktopSession[]
  capabilities: DesktopCapability[]
  targets: IntegrationTarget
  summary: DesktopSummary
  metadata?: Metadata
}

export interface DesktopRegisteredState {
  state: 'desktop-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopAvailableState {
  state: 'desktop-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopPreparedState {
  state: 'desktop-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopReadyState {
  state: 'desktop-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopConnectedState {
  state: 'desktop-connected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopSuspendedState {
  state: 'desktop-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopDisconnectedState {
  state: 'desktop-disconnected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopRecoveredState {
  state: 'desktop-recovered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopFailedState {
  state: 'desktop-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface DesktopArchivedState {
  state: 'desktop-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type DesktopLifecycleStateModel =
  | DesktopRegisteredState
  | DesktopAvailableState
  | DesktopPreparedState
  | DesktopReadyState
  | DesktopConnectedState
  | DesktopSuspendedState
  | DesktopDisconnectedState
  | DesktopRecoveredState
  | DesktopFailedState
  | DesktopArchivedState

export type DesktopIntegrationState =
  | 'desktop-registered'
  | 'desktop-available'
  | 'desktop-prepared'
  | 'desktop-ready'
  | 'desktop-connected'
  | 'desktop-suspended'
  | 'desktop-disconnected'
  | 'desktop-recovered'
  | 'desktop-failed'
  | 'desktop-archived'

export interface DesktopIntegrationLifecycleState {
  stage: DesktopIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DesktopIntegrationRegistration extends DesktopIntegrationRegistrationInput {
  metadataModel: DesktopIntegrationMetadata
  registeredAt: IsoDateTime
}

export interface DesktopIntegrationRuntimeHealth {
  desktopIntegrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredDesktopIntegrationEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidDesktopIntegrationEntries: number
    lastUpdatedAt: IsoDateTime
  }
  desktopTargetHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    desktopConfigurationsTracked: number
    integrationTargetsTracked: number
    targetDependenciesTracked: number
    lastTargetUpdatedAt?: IsoDateTime
  }
  desktopValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class DesktopIntegrationRegistry {
  private registrations: Map<string, DesktopIntegrationRegistration> = new Map()
  private sessions: Map<string, DesktopIntegrationSession> = new Map()
  private contexts: Map<string, DesktopIntegrationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidDesktopIntegrationEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: DesktopIntegrationRegistrationInput): DesktopIntegrationRegistration {
    const validationResult = this.validation.validateDesktopIntegration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.desktopIntegrationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.desktopIntegration('Duplicate desktop integration ID detected', {
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidDesktopIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.desktopIntegration('Desktop integration registration validation failed', {
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    const registration: DesktopIntegrationRegistration = {
      ...input,
      metadataModel: {
        desktopIntegrationId: input.desktopIntegrationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.desktopIntegrationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: DesktopIntegrationSessionInput): DesktopIntegrationSession {
    if (!this.registrations.has(input.desktopIntegrationId)) {
      throw RuntimeError.desktopIntegration('Desktop integration registration not found', {
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.desktopIntegration('Duplicate desktop integration session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: DesktopIntegrationSession = {
      sessionId: input.sessionId,
      desktopIntegrationId: input.desktopIntegrationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: DesktopIntegrationContextInput): DesktopIntegrationContext {
    if (!this.registrations.has(input.desktopIntegrationId)) {
      throw RuntimeError.desktopIntegration('Desktop integration registration not found for context', {
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.desktopIntegration('Desktop integration session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.desktopIntegration('Duplicate desktop integration context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateDesktopGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidDesktopIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.desktopGovernance('Desktop governance validation failed', {
        contextId: input.contextId,
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    const context: DesktopIntegrationContext = {
      contextId: input.contextId,
      desktopIntegrationId: input.desktopIntegrationId,
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

  get(desktopIntegrationId: string): DesktopIntegrationRegistration | undefined {
    return this.registrations.get(desktopIntegrationId)
  }

  list(): DesktopIntegrationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): DesktopIntegrationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): DesktopIntegrationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidDesktopIntegrationCount(): number {
    return this.invalidDesktopIntegrationEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'desktop-integration-registry',
      'Desktop Integration Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapSummary(summary: DesktopConfigurationInput['summary']): DesktopSummary {
  return {
    synopsis: summary.synopsis,
    highlights: [...summary.highlights],
    risks: [...summary.risks],
    nextActions: [...summary.nextActions],
  }
}

function mapTargets(input: IntegrationTargetInput): IntegrationTarget {
  return {
    integrationTargetId: input.integrationTargetId,
    desktopIntegrationId: input.desktopIntegrationId,
    ideTargets: input.ideTargets.map((target) => ({ ...target, workspaceIds: [...target.workspaceIds] })),
    browserTargets: input.browserTargets.map((target) => ({ ...target })),
    terminalTargets: input.terminalTargets.map((target) => ({ ...target, sessionIds: [...target.sessionIds] })),
    applicationTargets: input.applicationTargets.map((target) => ({ ...target })),
    serviceTargets: input.serviceTargets.map((target) => ({ ...target })),
    processTargets: input.processTargets.map((target) => ({ ...target })),
    workspaceTargets: input.workspaceTargets.map((target) => ({ ...target, roots: [...target.roots] })),
    windowTargets: input.windowTargets.map((target) => ({ ...target })),
    automationTargets: input.automationTargets.map((target) => ({
      ...target,
      references: { ...target.references },
    })),
    dependencies: input.dependencies.map((dependency) => ({ ...dependency })),
    metadata: input.metadata,
  }
}

export class DesktopIntegrationManager {
  private desktopConfigurations: Map<string, DesktopConfiguration> = new Map()
  private diagnostics: DesktopIntegrationDiagnostics[] = []
  private lastTargetUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: DesktopIntegrationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerDesktopIntegration(input: DesktopIntegrationRegistrationInput): DesktopIntegrationRegistration {
    return this.registry.register(input)
  }

  startSession(input: DesktopIntegrationSessionInput): DesktopIntegrationSession {
    return this.registry.createSession(input)
  }

  createContext(input: DesktopIntegrationContextInput): DesktopIntegrationContext {
    return this.registry.createContext(input)
  }

  createDesktopConfiguration(input: DesktopConfigurationInput): DesktopConfiguration {
    if (!this.registry.get(input.desktopIntegrationId)) {
      throw RuntimeError.desktopIntegration('Desktop integration registration not found for desktop configuration', {
        desktopIntegrationId: input.desktopIntegrationId,
      })
    }

    const configurationValidation = this.validation.validateDesktopConfiguration(input)
    const governanceValidation = this.validation.validateDesktopGovernance(input.governance)
    const targetValidation = this.validation.validateIntegrationTarget(input.targets)

    const lifecycleDiagnostics = input.sessions.flatMap((session) =>
      this.validation.validateDesktopLifecycle(session.state).diagnostics
    )

    const diagnostics = [
      ...configurationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...targetValidation.diagnostics,
      ...lifecycleDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `desktop-integration-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!configurationValidation.valid) {
      throw RuntimeError.desktopConfiguration('Desktop configuration validation failed', {
        desktopConfigurationId: input.desktopConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.desktopGovernance('Desktop governance validation failed', {
        desktopConfigurationId: input.desktopConfigurationId,
      })
    }

    if (!targetValidation.valid) {
      throw RuntimeError.integrationTarget('Integration target validation failed', {
        integrationTargetId: input.targets.integrationTargetId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.desktopLifecycle('Desktop lifecycle validation failed', {
        desktopConfigurationId: input.desktopConfigurationId,
      })
    }

    const configuration: DesktopConfiguration = {
      desktopConfigurationId: input.desktopConfigurationId,
      desktopIntegrationId: input.desktopIntegrationId,
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
      environment: {
        ...input.environment,
        variables: input.environment.variables.map((variable) => ({ ...variable })),
      },
      applications: input.applications.map((application) => ({ ...application })),
      workspaces: input.workspaces.map((workspace) => ({ ...workspace, rootPaths: [...workspace.rootPaths] })),
      windows: input.windows.map((window) => ({ ...window })),
      processes: input.processes.map((process) => ({ ...process })),
      sessions: input.sessions.map((session) => ({ ...session })),
      capabilities: input.capabilities.map((capability) => ({ ...capability })),
      targets: mapTargets(input.targets),
      summary: mapSummary(input.summary),
      metadata: input.metadata,
    }

    this.desktopConfigurations.set(configuration.desktopConfigurationId, configuration)
    this.lastTargetUpdatedAt = now()
    this.lastUpdatedAt = now()
    return configuration
  }

  getDesktopConfiguration(desktopConfigurationId: string): DesktopConfiguration | undefined {
    return this.desktopConfigurations.get(desktopConfigurationId)
  }

  listDesktopConfigurations(): DesktopConfiguration[] {
    return Array.from(this.desktopConfigurations.values())
  }

  getHealth(): DesktopIntegrationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const integrationTargetsTracked = this.listDesktopConfigurations().reduce((count, configuration) => {
      return count + (configuration.targets.integrationTargetId ? 1 : 0)
    }, 0)

    const targetDependenciesTracked = this.listDesktopConfigurations().reduce((count, configuration) => {
      return count + configuration.targets.dependencies.length
    }, 0)

    return {
      desktopIntegrationHealth: {
        status: this.registry.getInvalidDesktopIntegrationCount() > 0 ? 'degraded' : 'healthy',
        registeredDesktopIntegrationEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidDesktopIntegrationEntries: this.registry.getInvalidDesktopIntegrationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      desktopTargetHealth: {
        status: integrationTargetsTracked > 0 ? 'healthy' : 'degraded',
        desktopConfigurationsTracked: this.desktopConfigurations.size,
        integrationTargetsTracked,
        targetDependenciesTracked,
        lastTargetUpdatedAt: this.lastTargetUpdatedAt,
      },
      desktopValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
