import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type GitBranchInput,
  type GitConfigurationInput,
  type GitIntegrationContextInput,
  type GitIntegrationGovernanceInput,
  type GitIntegrationLifecycleStage,
  type GitIntegrationRegistrationInput,
  type GitIntegrationSessionInput,
  type GitRepositoryInput,
  type GitResourceInput,
  type GitStateInput,
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

export interface GitIntegrationMetadata {
  gitIntegrationId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface GitIntegrationDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface GitIntegrationSession {
  sessionId: string
  gitIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface GitOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface GitProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface GitFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface GitGovernance {
  ownership: GitOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: GitProvenance
  freshness: GitFreshness
}

export interface GitIntegrationContext {
  contextId: string
  gitIntegrationId: string
  sessionId?: string
  governance: GitGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface GitRepository {
  repositoryId: string
  name: string
  rootPath: string
  defaultBranch: string
  state: GitStateInput
  metadata?: Metadata
}

export interface GitBranch {
  branchId: string
  repositoryId: string
  name: string
  isDefault: boolean
  isProtected: boolean
  headCommitId?: string
  metadata?: Metadata
}

export interface GitCommit {
  commitId: string
  repositoryId: string
  hash: string
  author: string
  message: string
  committedAt: IsoDateTime
  parentCommitIds: string[]
  metadata?: Metadata
}

export interface GitTag {
  tagId: string
  repositoryId: string
  name: string
  targetCommitId: string
  annotated: boolean
  metadata?: Metadata
}

export interface GitRemote {
  remoteId: string
  repositoryId: string
  name: string
  url: string
  default: boolean
  metadata?: Metadata
}

export interface GitWorkspace {
  workspaceId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface GitCapability {
  capabilityId: string
  name: string
  category: 'branch' | 'commit' | 'merge' | 'remote' | 'history' | 'workspace' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface GitIdentity {
  identityId: string
  displayName: string
  email: string
  signingKeyId?: string
  metadata?: Metadata
}

export interface GitSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface StagingArea {
  stagingAreaId: string
  repositoryId: string
  stagedFileIds: string[]
  unstagedFileIds: string[]
  metadata?: Metadata
}

export interface CommitHistory {
  commitHistoryId: string
  repositoryId: string
  commitIds: string[]
  metadata?: Metadata
}

export interface BranchGraph {
  branchGraphId: string
  repositoryId: string
  nodes: Array<{
    nodeId: string
    branchId: string
    commitId?: string
    metadata?: Metadata
  }>
  edges: Array<{
    edgeId: string
    fromNodeId: string
    toNodeId: string
    relation: 'parent' | 'merge' | 'rebase' | 'cherry-pick' | 'other'
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface MergeRequest {
  mergeRequestId: string
  repositoryId: string
  sourceBranchId: string
  targetBranchId: string
  status: 'open' | 'approved' | 'merged' | 'closed' | 'rejected'
  metadata?: Metadata
}

export interface MergeConflict {
  mergeConflictId: string
  repositoryId: string
  filePath: string
  conflictType: 'content' | 'rename' | 'delete-modify' | 'binary' | 'other'
  status: 'detected' | 'resolved' | 'unresolved'
  metadata?: Metadata
}

export interface RepositorySnapshot {
  repositorySnapshotId: string
  repositoryId: string
  branchId?: string
  commitId?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface FileChange {
  fileChangeId: string
  repositoryId: string
  path: string
  changeType: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  staged: boolean
  metadata?: Metadata
}

export interface WorkingTree {
  workingTreeId: string
  repositoryId: string
  clean: boolean
  fileChanges: FileChange[]
  metadata?: Metadata
}

export interface GitCheckpoint {
  gitCheckpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryState {
  repositoryStateId: string
  repositoryId: string
  branchId?: string
  headCommitId?: string
  state: GitStateInput
  metadata?: Metadata
}

export interface GitResource {
  gitResourceId: string
  gitIntegrationId: string
  stagingAreas: StagingArea[]
  commitHistories: CommitHistory[]
  branchGraphs: BranchGraph[]
  mergeRequests: MergeRequest[]
  mergeConflicts: MergeConflict[]
  repositorySnapshots: RepositorySnapshot[]
  workingTrees: WorkingTree[]
  gitCheckpoints: GitCheckpoint[]
  repositoryStates: RepositoryState[]
  metadata?: Metadata
}

export interface GitConfiguration {
  gitConfigurationId: string
  gitIntegrationId: string
  browserReferences: {
    browserIntegrationId?: string
    browserConfigurationId?: string
  }
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
  repositories: GitRepository[]
  branches: GitBranch[]
  commits: GitCommit[]
  tags: GitTag[]
  remotes: GitRemote[]
  workspace: GitWorkspace
  capabilities: GitCapability[]
  identity: GitIdentity
  governance: GitGovernance
  resourceModel: GitResource
  summary: GitSummary
  metadata?: Metadata
}

export interface RepositoryRegisteredState {
  state: 'repository-registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryAvailableState {
  state: 'repository-available'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryPreparedState {
  state: 'repository-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryReadyState {
  state: 'repository-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryActiveState {
  state: 'repository-active'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositorySyncPendingState {
  state: 'repository-sync-pending'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositorySuspendedState {
  state: 'repository-suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryArchivedState {
  state: 'repository-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryFailedState {
  state: 'repository-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryRecoveredState {
  state: 'repository-recovered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type GitLifecycleStateModel =
  | RepositoryRegisteredState
  | RepositoryAvailableState
  | RepositoryPreparedState
  | RepositoryReadyState
  | RepositoryActiveState
  | RepositorySyncPendingState
  | RepositorySuspendedState
  | RepositoryArchivedState
  | RepositoryFailedState
  | RepositoryRecoveredState

export type GitIntegrationState = GitStateInput

export interface GitIntegrationLifecycleState {
  stage: GitIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface GitIntegrationRegistration extends GitIntegrationRegistrationInput {
  metadataModel: GitIntegrationMetadata
  registeredAt: IsoDateTime
}

export interface GitIntegrationRuntimeHealth {
  gitIntegrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredGitIntegrationEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidGitIntegrationEntries: number
    lastUpdatedAt: IsoDateTime
  }
  repositoryHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    gitConfigurationsTracked: number
    repositoriesTracked: number
    branchesTracked: number
    commitsTracked: number
    lastRepositoryUpdatedAt?: IsoDateTime
  }
  gitValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class GitIntegrationRegistry {
  private registrations: Map<string, GitIntegrationRegistration> = new Map()
  private sessions: Map<string, GitIntegrationSession> = new Map()
  private contexts: Map<string, GitIntegrationContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidGitIntegrationEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: GitIntegrationRegistrationInput): GitIntegrationRegistration {
    const validationResult = this.validation.validateGitIntegration(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.gitIntegrationId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.gitIntegration('Duplicate git integration ID detected', {
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    if (!validationResult.valid) {
      this.invalidGitIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.gitIntegration('Git integration registration validation failed', {
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    const registration: GitIntegrationRegistration = {
      ...input,
      metadataModel: {
        gitIntegrationId: input.gitIntegrationId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.gitIntegrationId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: GitIntegrationSessionInput): GitIntegrationSession {
    if (!this.registrations.has(input.gitIntegrationId)) {
      throw RuntimeError.gitIntegration('Git integration registration not found', {
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.gitIntegration('Duplicate git integration session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: GitIntegrationSession = {
      sessionId: input.sessionId,
      gitIntegrationId: input.gitIntegrationId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: GitIntegrationContextInput): GitIntegrationContext {
    if (!this.registrations.has(input.gitIntegrationId)) {
      throw RuntimeError.gitIntegration('Git integration registration not found for context', {
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.gitIntegration('Git integration session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.gitIntegration('Duplicate git integration context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateGitGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidGitIntegrationEntries += 1
      this.validationRejected += 1
      throw RuntimeError.gitGovernance('Git governance validation failed', {
        contextId: input.contextId,
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    const context: GitIntegrationContext = {
      contextId: input.contextId,
      gitIntegrationId: input.gitIntegrationId,
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

  get(gitIntegrationId: string): GitIntegrationRegistration | undefined {
    return this.registrations.get(gitIntegrationId)
  }

  list(): GitIntegrationRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): GitIntegrationSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): GitIntegrationContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidGitIntegrationCount(): number {
    return this.invalidGitIntegrationEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'git-integration-registry',
      'Git Integration Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: GitResourceInput): GitResource {
  return {
    gitResourceId: input.gitResourceId,
    gitIntegrationId: input.gitIntegrationId,
    stagingAreas: input.stagingAreas.map((area) => ({ ...area, stagedFileIds: [...area.stagedFileIds], unstagedFileIds: [...area.unstagedFileIds] })),
    commitHistories: input.commitHistories.map((history) => ({ ...history, commitIds: [...history.commitIds] })),
    branchGraphs: input.branchGraphs.map((graph) => ({
      ...graph,
      nodes: graph.nodes.map((node) => ({ ...node })),
      edges: graph.edges.map((edge) => ({ ...edge })),
    })),
    mergeRequests: input.mergeRequests.map((request) => ({ ...request })),
    mergeConflicts: input.mergeConflicts.map((conflict) => ({ ...conflict })),
    repositorySnapshots: input.repositorySnapshots.map((snapshot) => ({ ...snapshot })),
    workingTrees: input.workingTrees.map((tree) => ({
      ...tree,
      fileChanges: tree.fileChanges.map((change) => ({ ...change })),
    })),
    gitCheckpoints: input.gitCheckpoints.map((checkpoint) => ({ ...checkpoint })),
    repositoryStates: input.repositoryStates.map((state) => ({ ...state })),
    metadata: input.metadata,
  }
}

export class GitIntegrationManager {
  private gitConfigurations: Map<string, GitConfiguration> = new Map()
  private diagnostics: GitIntegrationDiagnostics[] = []
  private lastRepositoryUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: GitIntegrationRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerGitIntegration(input: GitIntegrationRegistrationInput): GitIntegrationRegistration {
    return this.registry.register(input)
  }

  startSession(input: GitIntegrationSessionInput): GitIntegrationSession {
    return this.registry.createSession(input)
  }

  createContext(input: GitIntegrationContextInput): GitIntegrationContext {
    return this.registry.createContext(input)
  }

  createGitConfiguration(input: GitConfigurationInput): GitConfiguration {
    if (!this.registry.get(input.gitIntegrationId)) {
      throw RuntimeError.gitIntegration('Git integration registration not found for git configuration', {
        gitIntegrationId: input.gitIntegrationId,
      })
    }

    const integrationValidation = this.validation.validateGitConfiguration(input)
    const governanceValidation = this.validation.validateGitGovernance(input.governance)
    const resourceValidation = this.validation.validateGitResource(input.resourceModel)
    const lifecycleDiagnostics = input.repositories.flatMap((repository) =>
      this.validation.validateGitLifecycle(repository.state).diagnostics
    )
    const repositoryDiagnostics = input.repositories.flatMap((repository) =>
      this.validation.validateGitRepository(repository).diagnostics
    )
    const branchDiagnostics = input.branches.flatMap((branch) =>
      this.validation.validateGitBranch(branch).diagnostics
    )

    const diagnostics = [
      ...integrationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...repositoryDiagnostics,
      ...branchDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `git-integration-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!integrationValidation.valid) {
      throw RuntimeError.gitRepository('Git configuration validation failed', {
        gitConfigurationId: input.gitConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.gitGovernance('Git governance validation failed', {
        gitConfigurationId: input.gitConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.gitResource('Git resource validation failed', {
        gitResourceId: input.resourceModel.gitResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.gitLifecycle('Git lifecycle validation failed', {
        gitConfigurationId: input.gitConfigurationId,
      })
    }

    if (repositoryDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.gitRepository('Repository validation failed', {
        gitConfigurationId: input.gitConfigurationId,
      })
    }

    if (branchDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.gitRepository('Branch validation failed', {
        gitConfigurationId: input.gitConfigurationId,
      })
    }

    const config: GitConfiguration = {
      gitConfigurationId: input.gitConfigurationId,
      gitIntegrationId: input.gitIntegrationId,
      browserReferences: { ...input.browserReferences },
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
      repositories: input.repositories.map((repository) => ({ ...repository })),
      branches: input.branches.map((branch) => ({ ...branch })),
      commits: input.commits.map((commit) => ({ ...commit, parentCommitIds: [...commit.parentCommitIds] })),
      tags: input.tags.map((tag) => ({ ...tag })),
      remotes: input.remotes.map((remote) => ({ ...remote })),
      workspace: { ...input.workspace, repositoryIds: [...input.workspace.repositoryIds] },
      capabilities: input.capabilities.map((capability) => ({ ...capability })),
      identity: { ...input.identity },
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

    this.gitConfigurations.set(config.gitConfigurationId, config)
    this.lastRepositoryUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getGitConfiguration(gitConfigurationId: string): GitConfiguration | undefined {
    return this.gitConfigurations.get(gitConfigurationId)
  }

  listGitConfigurations(): GitConfiguration[] {
    return Array.from(this.gitConfigurations.values())
  }

  getHealth(): GitIntegrationRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listGitConfigurations()
    const repositoriesTracked = configurations.reduce((count, config) => count + config.repositories.length, 0)
    const branchesTracked = configurations.reduce((count, config) => count + config.branches.length, 0)
    const commitsTracked = configurations.reduce((count, config) => count + config.commits.length, 0)

    return {
      gitIntegrationHealth: {
        status: this.registry.getInvalidGitIntegrationCount() > 0 ? 'degraded' : 'healthy',
        registeredGitIntegrationEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidGitIntegrationEntries: this.registry.getInvalidGitIntegrationCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      repositoryHealth: {
        status: repositoriesTracked > 0 ? 'healthy' : 'degraded',
        gitConfigurationsTracked: configurations.length,
        repositoriesTracked,
        branchesTracked,
        commitsTracked,
        lastRepositoryUpdatedAt: this.lastRepositoryUpdatedAt,
      },
      gitValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
