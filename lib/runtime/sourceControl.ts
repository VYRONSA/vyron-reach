import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type SourceControlConfigurationInput,
  type SourceControlContextInput,
  type SourceControlLifecycleStage,
  type SourceControlRegistrationInput,
  type SourceControlResourceInput,
  type SourceControlSessionInput,
  type SourceControlStateInput,
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

export interface SourceControlMetadata {
  sourceControlId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface SourceControlSession {
  sessionId: string
  sourceControlId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface SourceControlProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface SourceControlFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface SourceControlGovernance {
  ownership: SourceControlOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: SourceControlProvenance
  freshness: SourceControlFreshness
}

export interface SourceControlContext {
  contextId: string
  sourceControlId: string
  sessionId?: string
  governance: SourceControlGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryWorkspace {
  repositoryWorkspaceId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface RepositoryGroup {
  repositoryGroupId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface BranchStrategy {
  branchStrategyId: string
  name: string
  pattern: string
  category: 'trunk-based' | 'feature-branch' | 'release-branch' | 'hotfix-branch' | 'other'
  metadata?: Metadata
}

export interface CommitStrategy {
  commitStrategyId: string
  name: string
  convention: string
  metadata?: Metadata
}

export interface MergeStrategy {
  mergeStrategyId: string
  name: string
  method: 'merge-commit' | 'squash' | 'rebase' | 'fast-forward' | 'other'
  metadata?: Metadata
}

export interface ReleaseStrategy {
  releaseStrategyId: string
  name: string
  cadence: string
  metadata?: Metadata
}

export interface RepositoryPolicy {
  repositoryPolicyId: string
  name: string
  rules: string[]
  metadata?: Metadata
}

export interface RepositoryGovernance {
  repositoryGovernanceId: string
  ownership: SourceControlOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: SourceControlProvenance
  freshness: SourceControlFreshness
  metadata?: Metadata
}

export interface SourceControlCapability {
  capabilityId: string
  name: string
  category: 'planning' | 'branching' | 'merging' | 'release' | 'synchronization' | 'audit' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface SourceControlSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export type SourceControlState = SourceControlStateInput

export interface RepositoryPlan {
  repositoryPlanId: string
  repositoryWorkspaceId: string
  objective: string
  state: SourceControlState
  metadata?: Metadata
}

export interface BranchPlan {
  branchPlanId: string
  repositoryPlanId: string
  branchStrategyId?: string
  proposedName: string
  state: SourceControlState
  metadata?: Metadata
}

export interface CommitPlan {
  commitPlanId: string
  repositoryPlanId: string
  commitStrategyId?: string
  proposedMessage: string
  state: SourceControlState
  metadata?: Metadata
}

export interface MergePlan {
  mergePlanId: string
  repositoryPlanId: string
  mergeStrategyId?: string
  sourceBranchPlanId?: string
  targetBranchPlanId?: string
  state: SourceControlState
  metadata?: Metadata
}

export interface ReleasePlan {
  releasePlanId: string
  repositoryPlanId: string
  releaseStrategyId?: string
  targetVersion: string
  state: SourceControlState
  metadata?: Metadata
}

export interface SynchronizationPlan {
  synchronizationPlanId: string
  repositoryPlanId: string
  direction: 'pull' | 'push' | 'bidirectional'
  state: SourceControlState
  metadata?: Metadata
}

export interface ConflictResolutionPlan {
  conflictResolutionPlanId: string
  repositoryPlanId: string
  strategy: string
  state: SourceControlState
  metadata?: Metadata
}

export interface RepositoryCheckpoint {
  repositoryCheckpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryAudit {
  repositoryAuditId: string
  repositoryPlanId: string
  summary: string
  recordedAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlResource {
  sourceControlResourceId: string
  sourceControlId: string
  repositoryPlans: RepositoryPlan[]
  branchPlans: BranchPlan[]
  commitPlans: CommitPlan[]
  mergePlans: MergePlan[]
  releasePlans: ReleasePlan[]
  synchronizationPlans: SynchronizationPlan[]
  conflictResolutionPlans: ConflictResolutionPlan[]
  repositoryCheckpoints: RepositoryCheckpoint[]
  repositoryAudits: RepositoryAudit[]
  metadata?: Metadata
}

export interface SourceControlConfiguration {
  sourceControlConfigurationId: string
  sourceControlId: string
  gitReferences: {
    gitIntegrationId?: string
    gitConfigurationId?: string
  }
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
  repositoryWorkspaces: RepositoryWorkspace[]
  repositoryGroups: RepositoryGroup[]
  branchStrategies: BranchStrategy[]
  commitStrategies: CommitStrategy[]
  mergeStrategies: MergeStrategy[]
  releaseStrategies: ReleaseStrategy[]
  repositoryPolicies: RepositoryPolicy[]
  repositoryGovernance: RepositoryGovernance
  capabilities: SourceControlCapability[]
  governance: SourceControlGovernance
  resourceModel: SourceControlResource
  summary: SourceControlSummary
  metadata?: Metadata
}

export interface SourceControlPlannedState {
  state: 'planned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlPreparedState {
  state: 'prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlReadyState {
  state: 'ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlPendingState {
  state: 'pending'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlActiveState {
  state: 'active'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlWaitingState {
  state: 'waiting'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlSuspendedState {
  state: 'suspended'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlCompletedState {
  state: 'completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlFailedState {
  state: 'failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlArchivedState {
  state: 'archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type SourceControlLifecycleStateModel =
  | SourceControlPlannedState
  | SourceControlPreparedState
  | SourceControlReadyState
  | SourceControlPendingState
  | SourceControlActiveState
  | SourceControlWaitingState
  | SourceControlSuspendedState
  | SourceControlCompletedState
  | SourceControlFailedState
  | SourceControlArchivedState

export interface SourceControlLifecycleState {
  stage: SourceControlLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface SourceControlRegistration extends SourceControlRegistrationInput {
  metadataModel: SourceControlMetadata
  registeredAt: IsoDateTime
}

export interface SourceControlRuntimeHealth {
  sourceControlHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredSourceControlEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidSourceControlEntries: number
    lastUpdatedAt: IsoDateTime
  }
  repositoryPlanningHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    sourceControlConfigurationsTracked: number
    repositoryPlansTracked: number
    branchPlansTracked: number
    mergePlansTracked: number
    lastRepositoryPlanningUpdatedAt?: IsoDateTime
  }
  sourceControlValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class SourceControlRegistry {
  private registrations: Map<string, SourceControlRegistration> = new Map()
  private sessions: Map<string, SourceControlSession> = new Map()
  private contexts: Map<string, SourceControlContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidSourceControlEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: SourceControlRegistrationInput): SourceControlRegistration {
    const validationResult = this.validation.validateSourceControl(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.sourceControlId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.sourceControl('Duplicate source control ID detected', {
        sourceControlId: input.sourceControlId,
      })
    }

    if (!validationResult.valid) {
      this.invalidSourceControlEntries += 1
      this.validationRejected += 1
      throw RuntimeError.sourceControl('Source control registration validation failed', {
        sourceControlId: input.sourceControlId,
      })
    }

    const registration: SourceControlRegistration = {
      ...input,
      metadataModel: {
        sourceControlId: input.sourceControlId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.sourceControlId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: SourceControlSessionInput): SourceControlSession {
    if (!this.registrations.has(input.sourceControlId)) {
      throw RuntimeError.sourceControl('Source control registration not found', {
        sourceControlId: input.sourceControlId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.sourceControl('Duplicate source control session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: SourceControlSession = {
      sessionId: input.sessionId,
      sourceControlId: input.sourceControlId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: SourceControlContextInput): SourceControlContext {
    if (!this.registrations.has(input.sourceControlId)) {
      throw RuntimeError.sourceControl('Source control registration not found for context', {
        sourceControlId: input.sourceControlId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.sourceControl('Source control session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.sourceControl('Duplicate source control context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateSourceControlGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidSourceControlEntries += 1
      this.validationRejected += 1
      throw RuntimeError.sourceControlGovernance('Source control governance validation failed', {
        contextId: input.contextId,
        sourceControlId: input.sourceControlId,
      })
    }

    const context: SourceControlContext = {
      contextId: input.contextId,
      sourceControlId: input.sourceControlId,
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

  get(sourceControlId: string): SourceControlRegistration | undefined {
    return this.registrations.get(sourceControlId)
  }

  list(): SourceControlRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): SourceControlSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): SourceControlContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidSourceControlCount(): number {
    return this.invalidSourceControlEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'source-control-registry',
      'Source Control Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: SourceControlResourceInput): SourceControlResource {
  return {
    sourceControlResourceId: input.sourceControlResourceId,
    sourceControlId: input.sourceControlId,
    repositoryPlans: input.repositoryPlans.map((plan) => ({ ...plan })),
    branchPlans: input.branchPlans.map((plan) => ({ ...plan })),
    commitPlans: input.commitPlans.map((plan) => ({ ...plan })),
    mergePlans: input.mergePlans.map((plan) => ({ ...plan })),
    releasePlans: input.releasePlans.map((plan) => ({ ...plan })),
    synchronizationPlans: input.synchronizationPlans.map((plan) => ({ ...plan })),
    conflictResolutionPlans: input.conflictResolutionPlans.map((plan) => ({ ...plan })),
    repositoryCheckpoints: input.repositoryCheckpoints.map((checkpoint) => ({ ...checkpoint })),
    repositoryAudits: input.repositoryAudits.map((audit) => ({ ...audit })),
    metadata: input.metadata,
  }
}

export class SourceControlManager {
  private sourceControlConfigurations: Map<string, SourceControlConfiguration> = new Map()
  private diagnostics: SourceControlDiagnostics[] = []
  private lastRepositoryPlanningUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: SourceControlRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerSourceControl(input: SourceControlRegistrationInput): SourceControlRegistration {
    return this.registry.register(input)
  }

  startSession(input: SourceControlSessionInput): SourceControlSession {
    return this.registry.createSession(input)
  }

  createContext(input: SourceControlContextInput): SourceControlContext {
    return this.registry.createContext(input)
  }

  createSourceControlConfiguration(input: SourceControlConfigurationInput): SourceControlConfiguration {
    if (!this.registry.get(input.sourceControlId)) {
      throw RuntimeError.sourceControl('Source control registration not found for configuration', {
        sourceControlId: input.sourceControlId,
      })
    }

    const configurationValidation = this.validation.validateSourceControlConfiguration(input)
    const governanceValidation = this.validation.validateSourceControlGovernance(input.governance)
    const resourceValidation = this.validation.validateSourceControlResource(input.resourceModel)
    const lifecycleDiagnostics = input.resourceModel.repositoryPlans.flatMap((plan) =>
      this.validation.validateSourceControlLifecycle(plan.state).diagnostics
    )
    const repositoryPlanDiagnostics = input.resourceModel.repositoryPlans.flatMap((plan) =>
      this.validation.validateRepositoryPlan(plan).diagnostics
    )
    const branchPlanDiagnostics = input.resourceModel.branchPlans.flatMap((plan) =>
      this.validation.validateBranchPlan(plan).diagnostics
    )

    const diagnostics = [
      ...configurationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...repositoryPlanDiagnostics,
      ...branchPlanDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `source-control-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!configurationValidation.valid) {
      throw RuntimeError.sourceControl('Source control configuration validation failed', {
        sourceControlConfigurationId: input.sourceControlConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.sourceControlGovernance('Source control governance validation failed', {
        sourceControlConfigurationId: input.sourceControlConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.sourceControlResource('Source control resource validation failed', {
        sourceControlResourceId: input.resourceModel.sourceControlResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.sourceControlLifecycle('Source control lifecycle validation failed', {
        sourceControlConfigurationId: input.sourceControlConfigurationId,
      })
    }

    if (repositoryPlanDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.repositoryPlanning('Repository plan validation failed', {
        sourceControlConfigurationId: input.sourceControlConfigurationId,
      })
    }

    if (branchPlanDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.repositoryPlanning('Branch plan validation failed', {
        sourceControlConfigurationId: input.sourceControlConfigurationId,
      })
    }

    const config: SourceControlConfiguration = {
      sourceControlConfigurationId: input.sourceControlConfigurationId,
      sourceControlId: input.sourceControlId,
      gitReferences: { ...input.gitReferences },
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
      repositoryWorkspaces: input.repositoryWorkspaces.map((workspace) => ({
        ...workspace,
        repositoryIds: [...workspace.repositoryIds],
      })),
      repositoryGroups: input.repositoryGroups.map((group) => ({
        ...group,
        repositoryIds: [...group.repositoryIds],
      })),
      branchStrategies: input.branchStrategies.map((strategy) => ({ ...strategy })),
      commitStrategies: input.commitStrategies.map((strategy) => ({ ...strategy })),
      mergeStrategies: input.mergeStrategies.map((strategy) => ({ ...strategy })),
      releaseStrategies: input.releaseStrategies.map((strategy) => ({ ...strategy })),
      repositoryPolicies: input.repositoryPolicies.map((policy) => ({ ...policy, rules: [...policy.rules] })),
      repositoryGovernance: { ...input.repositoryGovernance },
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

    this.sourceControlConfigurations.set(config.sourceControlConfigurationId, config)
    this.lastRepositoryPlanningUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getSourceControlConfiguration(sourceControlConfigurationId: string): SourceControlConfiguration | undefined {
    return this.sourceControlConfigurations.get(sourceControlConfigurationId)
  }

  listSourceControlConfigurations(): SourceControlConfiguration[] {
    return Array.from(this.sourceControlConfigurations.values())
  }

  getHealth(): SourceControlRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listSourceControlConfigurations()
    const repositoryPlansTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.repositoryPlans.length,
      0
    )
    const branchPlansTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.branchPlans.length,
      0
    )
    const mergePlansTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.mergePlans.length,
      0
    )

    return {
      sourceControlHealth: {
        status: this.registry.getInvalidSourceControlCount() > 0 ? 'degraded' : 'healthy',
        registeredSourceControlEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidSourceControlEntries: this.registry.getInvalidSourceControlCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      repositoryPlanningHealth: {
        status: repositoryPlansTracked > 0 ? 'healthy' : 'degraded',
        sourceControlConfigurationsTracked: configurations.length,
        repositoryPlansTracked,
        branchPlansTracked,
        mergePlansTracked,
        lastRepositoryPlanningUpdatedAt: this.lastRepositoryPlanningUpdatedAt,
      },
      sourceControlValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
