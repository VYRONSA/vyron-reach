import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type BrowserConfigurationInput,
  type BrowserIntegrationContextInput,
  type BrowserIntegrationGovernanceInput,
  type BrowserIntegrationLifecycleStage,
  type BrowserIntegrationRegistrationInput,
  type BrowserIntegrationSessionInput,
  type BrowserResourceInput,
  type BrowserStateInput,
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

export interface BrowserIntegrationMetadata {
  browserIntegrationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface BrowserIntegrationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface BrowserIntegrationSession {
  sessionId: string
  browserIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface BrowserOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface BrowserProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface BrowserFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface BrowserGovernance {
  ownership: BrowserOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: BrowserProvenance
  freshness: BrowserFreshness
}

export interface BrowserIntegrationContext {
  contextId: string
  browserIntegrationId: string
  sessionId?: string
  governance: BrowserGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserProfile {
  profileId: string
  name: string
  description?: string
  browserType: 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface BrowserEnvironment {
  environmentId: string
  name: string
  platform: 'windows' | 'linux' | 'macos' | 'unknown'
  runtimeMode: 'headed' | 'headless' | 'virtual'
  metadata?: Metadata
}

export interface BrowserWindow {
  browserWindowId: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface BrowserSession {
  browserSessionId: string
  browserIntegrationId: string
  state: BrowserStateInput
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  metadata?: Metadata
}

export interface BrowserTab {
  browserTabId: string
  browserWindowId: string
  title?: string
  url?: string
  state: 'open' | 'active' | 'inactive' | 'loading' | 'suspended' | 'closed'
  metadata?: Metadata
}

export interface BrowserCapability {
  capabilityId: string
  name: string
  category: 'navigation' | 'storage' | 'network' | 'devtools' | 'session' | 'extension' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface BrowserExtension {
  extensionId: string
  name: string
  publisher?: string
  version?: string
  state: 'registered' | 'enabled' | 'disabled' | 'error'
  metadata?: Metadata
}

export interface BrowserBookmark {
  bookmarkId: string
  title: string
  url: string
  folder?: string
  metadata?: Metadata
}

export interface BrowserSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WebPage {
  webPageId: string
  browserTabId: string
  title?: string
  url: string
  contentType?: string
  metadata?: Metadata
}

export interface URLReference {
  urlReferenceId: string
  url: string
  sourceType: 'bookmark' | 'navigation' | 'redirect' | 'manual' | 'other'
  metadata?: Metadata
}

export interface NavigationHistory {
  navigationHistoryId: string
  browserTabId: string
  entries: Array<{
    entryId: string
    url: string
    title?: string
    visitedAt: IsoDateTime
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface CookieStore {
  cookieStoreId: string
  browserSessionId: string
  cookies: Array<{
    cookieId: string
    name: string
    domain: string
    path: string
    secure: boolean
    httpOnly: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface LocalStorageReference {
  localStorageReferenceId: string
  origin: string
  keys: string[]
  metadata?: Metadata
}

export interface SessionStorageReference {
  sessionStorageReferenceId: string
  origin: string
  browserTabId: string
  keys: string[]
  metadata?: Metadata
}

export interface BrowserDeveloperTools {
  developerToolsId: string
  browserTabId: string
  panels: Array<'elements' | 'console' | 'network' | 'sources' | 'performance' | 'application' | 'security' | 'memory' | 'other'>
  isOpen: boolean
  metadata?: Metadata
}

export interface BrowserNetworkSession {
  browserNetworkSessionId: string
  browserSessionId: string
  status: 'active' | 'paused' | 'stopped' | 'failed'
  capturedRequests: number
  capturedResponses: number
  metadata?: Metadata
}

export interface BrowserCheckpoint {
  browserCheckpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserSnapshot {
  browserSnapshotId: string
  browserIntegrationId: string
  browserConfigurationId?: string
  state?: BrowserStateInput
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserResource {
  browserResourceId: string
  browserIntegrationId: string
  webPages: WebPage[]
  urlReferences: URLReference[]
  navigationHistories: NavigationHistory[]
  cookieStores: CookieStore[]
  localStorageReferences: LocalStorageReference[]
  sessionStorageReferences: SessionStorageReference[]
  browserDeveloperTools: BrowserDeveloperTools[]
  browserNetworkSessions: BrowserNetworkSession[]
  browserCheckpoints: BrowserCheckpoint[]
  browserSnapshots: BrowserSnapshot[]
  metadata?: Metadata
}

export interface BrowserConfiguration {
  browserConfigurationId: string
  browserIntegrationId: string
  terminalReferences: {
    terminalIntegrationId?: string
    terminalConfigurationId?: string
  }
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
  profile: BrowserProfile
  environment: BrowserEnvironment
  browserWindows: BrowserWindow[]
  browserSessions: BrowserSession[]
  browserTabs: BrowserTab[]
  capabilities: BrowserCapability[]
  browserExtensions: BrowserExtension[]
  browserBookmarks: BrowserBookmark[]
  governance: BrowserGovernance
  resourceModel: BrowserResource
  summary: BrowserSummary
  metadata?: Metadata
}

export interface BrowserRegisteredState {
  state: 'browser-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserAvailableState {
  state: 'browser-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserPreparedState {
  state: 'browser-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserReadyState {
  state: 'browser-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserConnectedState {
  state: 'browser-connected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserActiveState {
  state: 'browser-active'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserSuspendedState {
  state: 'browser-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserDisconnectedState {
  state: 'browser-disconnected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserFailedState {
  state: 'browser-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface BrowserArchivedState {
  state: 'browser-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type BrowserLifecycleStateModel =
  | BrowserRegisteredState
  | BrowserAvailableState
  | BrowserPreparedState
  | BrowserReadyState
  | BrowserConnectedState
  | BrowserActiveState
  | BrowserSuspendedState
  | BrowserDisconnectedState
  | BrowserFailedState
  | BrowserArchivedState

export type BrowserIntegrationState = BrowserStateInput

export interface BrowserIntegrationLifecycleState {
  stage: BrowserIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface BrowserIntegrationRegistration extends BrowserIntegrationRegistrationInput {
  metadataModel: BrowserIntegrationMetadata
  registeredAt: IsoDateTime
}

export interface BrowserIntegrationRuntimeHealth {
  browserIntegrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredBrowserIntegrationEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidBrowserIntegrationEntries: number
    lastUpdatedAt: IsoDateTime
  }
  browserResourceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    browserConfigurationsTracked: number
    browserResourcesTracked: number
    webPagesTracked: number
    navigationEntriesTracked: number
    lastResourceUpdatedAt?: IsoDateTime
  }
  browserValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class BrowserIntegrationRegistry {
  private registrations: Map<string, BrowserIntegrationRegistration> = new Map()
  private sessions: Map<string, BrowserIntegrationSession> = new Map()
  private contexts: Map<string, BrowserIntegrationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidBrowserIntegrationEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: BrowserIntegrationRegistrationInput): BrowserIntegrationRegistration {
    const validationResult = this.validation.validateBrowserIntegration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.browserIntegrationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.browserIntegration('Duplicate browser integration ID detected', {
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidBrowserIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.browserIntegration('Browser integration registration validation failed', {
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    const registration: BrowserIntegrationRegistration = {
      ...input,
      metadataModel: {
        browserIntegrationId: input.browserIntegrationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.browserIntegrationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: BrowserIntegrationSessionInput): BrowserIntegrationSession {
    if (!this.registrations.has(input.browserIntegrationId)) {
      throw RuntimeError.browserIntegration('Browser integration registration not found', {
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.browserIntegration('Duplicate browser integration session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: BrowserIntegrationSession = {
      sessionId: input.sessionId,
      browserIntegrationId: input.browserIntegrationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: BrowserIntegrationContextInput): BrowserIntegrationContext {
    if (!this.registrations.has(input.browserIntegrationId)) {
      throw RuntimeError.browserIntegration('Browser integration registration not found for context', {
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.browserIntegration('Browser integration session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.browserIntegration('Duplicate browser integration context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateBrowserGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidBrowserIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.browserGovernance('Browser governance validation failed', {
        contextId: input.contextId,
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    const context: BrowserIntegrationContext = {
      contextId: input.contextId,
      browserIntegrationId: input.browserIntegrationId,
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

  get(browserIntegrationId: string): BrowserIntegrationRegistration | undefined {
    return this.registrations.get(browserIntegrationId)
  }

  list(): BrowserIntegrationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): BrowserIntegrationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): BrowserIntegrationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidBrowserIntegrationCount(): number {
    return this.invalidBrowserIntegrationEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'browser-integration-registry',
      'Browser Integration Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: BrowserResourceInput): BrowserResource {
  return {
    browserResourceId: input.browserResourceId,
    browserIntegrationId: input.browserIntegrationId,
    webPages: input.webPages.map((page) => ({ ...page })),
    urlReferences: input.urlReferences.map((ref) => ({ ...ref })),
    navigationHistories: input.navigationHistories.map((history) => ({
      ...history,
      entries: history.entries.map((entry) => ({ ...entry })),
    })),
    cookieStores: input.cookieStores.map((store) => ({
      ...store,
      cookies: store.cookies.map((cookie) => ({ ...cookie })),
    })),
    localStorageReferences: input.localStorageReferences.map((ref) => ({ ...ref, keys: [...ref.keys] })),
    sessionStorageReferences: input.sessionStorageReferences.map((ref) => ({ ...ref, keys: [...ref.keys] })),
    browserDeveloperTools: input.browserDeveloperTools.map((tools) => ({ ...tools, panels: [...tools.panels] })),
    browserNetworkSessions: input.browserNetworkSessions.map((session) => ({ ...session })),
    browserCheckpoints: input.browserCheckpoints.map((checkpoint) => ({ ...checkpoint })),
    browserSnapshots: input.browserSnapshots.map((snapshot) => ({ ...snapshot })),
    metadata: input.metadata,
  }
}

export class BrowserIntegrationManager {
  private browserConfigurations: Map<string, BrowserConfiguration> = new Map()
  private diagnostics: BrowserIntegrationDiagnostics[] = []
  private lastResourceUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: BrowserIntegrationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerBrowserIntegration(input: BrowserIntegrationRegistrationInput): BrowserIntegrationRegistration {
    return this.registry.register(input)
  }

  startSession(input: BrowserIntegrationSessionInput): BrowserIntegrationSession {
    return this.registry.createSession(input)
  }

  createContext(input: BrowserIntegrationContextInput): BrowserIntegrationContext {
    return this.registry.createContext(input)
  }

  createBrowserConfiguration(input: BrowserConfigurationInput): BrowserConfiguration {
    if (!this.registry.get(input.browserIntegrationId)) {
      throw RuntimeError.browserIntegration('Browser integration registration not found for browser configuration', {
        browserIntegrationId: input.browserIntegrationId,
      })
    }

    const integrationValidation = this.validation.validateBrowserIntegrationConfiguration(input)
    const governanceValidation = this.validation.validateBrowserGovernance(input.governance)
    const resourceValidation = this.validation.validateBrowserResource(input.resourceModel)
    const lifecycleDiagnostics = input.browserSessions.flatMap((session) =>
      this.validation.validateBrowserLifecycle(session.state).diagnostics
    )

    const diagnostics = [
      ...integrationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `browser-integration-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!integrationValidation.valid) {
      throw RuntimeError.browserConfiguration('Browser configuration validation failed', {
        browserConfigurationId: input.browserConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.browserGovernance('Browser governance validation failed', {
        browserConfigurationId: input.browserConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.browserResource('Browser resource validation failed', {
        browserResourceId: input.resourceModel.browserResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.browserLifecycle('Browser lifecycle validation failed', {
        browserConfigurationId: input.browserConfigurationId,
      })
    }

    const config: BrowserConfiguration = {
      browserConfigurationId: input.browserConfigurationId,
      browserIntegrationId: input.browserIntegrationId,
      terminalReferences: { ...input.terminalReferences },
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
      browserWindows: input.browserWindows.map((window) => ({ ...window })),
      browserSessions: input.browserSessions.map((session) => ({ ...session })),
      browserTabs: input.browserTabs.map((tab) => ({ ...tab })),
      capabilities: input.capabilities.map((capability) => ({ ...capability })),
      browserExtensions: input.browserExtensions.map((extension) => ({ ...extension })),
      browserBookmarks: input.browserBookmarks.map((bookmark) => ({ ...bookmark })),
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

    this.browserConfigurations.set(config.browserConfigurationId, config)
    this.lastResourceUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getBrowserConfiguration(browserConfigurationId: string): BrowserConfiguration | undefined {
    return this.browserConfigurations.get(browserConfigurationId)
  }

  listBrowserConfigurations(): BrowserConfiguration[] {
    return Array.from(this.browserConfigurations.values())
  }

  getHealth(): BrowserIntegrationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listBrowserConfigurations()
    const browserResourcesTracked = configurations.reduce((count, config) => {
      return count + (config.resourceModel.browserResourceId ? 1 : 0)
    }, 0)

    const webPagesTracked = configurations.reduce((count, config) => {
      return count + config.resourceModel.webPages.length
    }, 0)

    const navigationEntriesTracked = configurations.reduce((count, config) => {
      return (
        count +
        config.resourceModel.navigationHistories.reduce((historyCount, history) => {
          return historyCount + history.entries.length
        }, 0)
      )
    }, 0)

    return {
      browserIntegrationHealth: {
        status: this.registry.getInvalidBrowserIntegrationCount() > 0 ? 'degraded' : 'healthy',
        registeredBrowserIntegrationEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidBrowserIntegrationEntries: this.registry.getInvalidBrowserIntegrationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      browserResourceHealth: {
        status: browserResourcesTracked > 0 ? 'healthy' : 'degraded',
        browserConfigurationsTracked: configurations.length,
        browserResourcesTracked,
        webPagesTracked,
        navigationEntriesTracked,
        lastResourceUpdatedAt: this.lastResourceUpdatedAt,
      },
      browserValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
