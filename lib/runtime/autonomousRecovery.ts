import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AutonomousRecoveryContextInput,
  type AutonomousRecoveryGovernanceInput,
  type AutonomousRecoveryLifecycleStage,
  type AutonomousRecoveryLifecycleStateInput,
  type AutonomousRecoveryRegistrationInput,
  type AutonomousRecoverySessionInput,
  type RecoveryPlanInput,
  type RecoverySnapshotInput,
  type SessionContinuityPlanInput,
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

export interface AutonomousRecoveryMetadata {
  autonomousRecoveryId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousRecoveryDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface AutonomousRecoverySession {
  sessionId: string
  autonomousRecoveryId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface RecoveryProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface RecoveryFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface RecoveryGovernance {
  ownership: RecoveryOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: RecoveryProvenance
  freshness: RecoveryFreshness
}

export interface AutonomousRecoveryContext {
  contextId: string
  autonomousRecoveryId: string
  sessionId?: string
  governance: RecoveryGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export type RecoveryState =
  | 'recovery-detected'
  | 'recovery-planned'
  | 'recovery-prepared'
  | 'recovery-ready'
  | 'recovery-in-progress'
  | 'recovery-validated'
  | 'recovery-completed'
  | 'recovery-failed'
  | 'recovery-cancelled'
  | 'recovery-archived'

export interface RecoveryDependency {
  dependencyId: string
  fromStepId: string
  toStepId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface RecoveryStrategy {
  strategyId: string
  name: string
  type: 'state-restore' | 'session-continuity' | 'workspace-rebuild' | 'service-restart' | 'resume-orchestration'
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface RecoveryCheckpoint {
  checkpointId: string
  title: string
  description?: string
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryTimeline {
  timelineId: string
  events: Array<{
    eventId: string
    stage: RecoveryState
    occurredAt: IsoDateTime
    description: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface RecoveryRecommendation {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface RecoveryOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface RecoverySummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface SessionSnapshot {
  sessionSnapshotId: string
  autonomousRecoveryId: string
  workspaceSessionId?: string
  recoverySessionId?: string
  state: RecoveryState
  capturedAt: IsoDateTime
  metadata?: Metadata
}

export interface SessionRestorePoint {
  restorePointId: string
  sessionSnapshotId: string
  createdAt: IsoDateTime
  consistencyStatus: 'verified' | 'partial' | 'unknown'
  metadata?: Metadata
}

export interface WorkspaceRestorePlan {
  workspaceRestorePlanId: string
  workspaceReferences: {
    autonomousWorkspaceId?: string
    workspaceConfigurationId?: string
    workspaceSnapshotId?: string
  }
  targetState: 'workspace-ready' | 'workspace-active' | 'workspace-restored'
  metadata?: Metadata
}

export interface RuntimeRestorePlan {
  runtimeRestorePlanId: string
  runtimeScope: Array<'kernel' | 'registry' | 'validation' | 'health' | 'service-registry'>
  targetState: 'prepared' | 'ready' | 'validated'
  metadata?: Metadata
}

export interface ServiceRestorePlan {
  serviceRestorePlanId: string
  serviceIds: string[]
  strategy: 're-register' | 'rebind' | 'reload-state'
  metadata?: Metadata
}

export interface ExecutionResumePlan {
  executionResumePlanId: string
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
  resumePolicy: 'from-latest-checkpoint' | 'from-verified-restore-point' | 'manual-gate'
  metadata?: Metadata
}

export interface ContinuityAudit {
  continuityAuditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: IsoDateTime
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface SessionContinuityPlan {
  sessionContinuityPlanId: string
  autonomousRecoveryId: string
  sessionSnapshots: SessionSnapshot[]
  sessionRestorePoints: SessionRestorePoint[]
  workspaceRestorePlan: WorkspaceRestorePlan
  runtimeRestorePlan: RuntimeRestorePlan
  serviceRestorePlan: ServiceRestorePlan
  executionResumePlan: ExecutionResumePlan
  continuityAudit: ContinuityAudit
  summary: RecoverySummary
  metadata?: Metadata
}

export interface RecoveryPlan {
  recoveryPlanId: string
  autonomousRecoveryId: string
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
  state: RecoveryState
  dependencies: RecoveryDependency[]
  strategies: RecoveryStrategy[]
  timeline: RecoveryTimeline
  checkpoints: RecoveryCheckpoint[]
  recommendations: RecoveryRecommendation[]
  outcomes: RecoveryOutcome[]
  summary: RecoverySummary
  metadata?: Metadata
}

export interface RecoverySnapshot {
  recoverySnapshotId: string
  autonomousRecoveryId: string
  recoveryPlanId: string
  recoveryState: RecoveryState
  lifecycleStates: AutonomousRecoveryLifecycleState[]
  capturedAt: IsoDateTime
  summary: RecoverySummary
  metadata?: Metadata
}

export interface RecoveryDetectedState {
  state: 'recovery-detected'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryPlannedState {
  state: 'recovery-planned'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryPreparedState {
  state: 'recovery-prepared'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryReadyState {
  state: 'recovery-ready'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryInProgressState {
  state: 'recovery-in-progress'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryValidatedState {
  state: 'recovery-validated'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryCompletedState {
  state: 'recovery-completed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryFailedState {
  state: 'recovery-failed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryCancelledState {
  state: 'recovery-cancelled'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RecoveryArchivedState {
  state: 'recovery-archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type RecoveryLifecycleStateModel =
  | RecoveryDetectedState
  | RecoveryPlannedState
  | RecoveryPreparedState
  | RecoveryReadyState
  | RecoveryInProgressState
  | RecoveryValidatedState
  | RecoveryCompletedState
  | RecoveryFailedState
  | RecoveryCancelledState
  | RecoveryArchivedState

export interface AutonomousRecoveryLifecycleState {
  stage: AutonomousRecoveryLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AutonomousRecoveryRegistration extends AutonomousRecoveryRegistrationInput {
  metadataModel: AutonomousRecoveryMetadata
  registeredAt: IsoDateTime
}

export interface AutonomousRecoveryRuntimeHealth {
  autonomousRecoveryHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAutonomousRecoveryEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidAutonomousRecoveryEntries: number
    lastUpdatedAt: IsoDateTime
  }
  sessionContinuityHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    recoveryPlansTracked: number
    continuityPlansTracked: number
    snapshotsTracked: number
    restorePointsTracked: number
    lastContinuityUpdateAt?: IsoDateTime
  }
  recoveryValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class AutonomousRecoveryRegistry {
  private registrations: Map<string, AutonomousRecoveryRegistration> = new Map()
  private sessions: Map<string, AutonomousRecoverySession> = new Map()
  private contexts: Map<string, AutonomousRecoveryContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidAutonomousRecoveryEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AutonomousRecoveryRegistrationInput): AutonomousRecoveryRegistration {
    const validationResult = this.validation.validateAutonomousRecovery(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.autonomousRecoveryId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousRecovery('Duplicate autonomous recovery ID detected', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    if (!validationResult.valid) {
      this.invalidAutonomousRecoveryEntries += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousRecovery('Autonomous recovery registration validation failed', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    const registration: AutonomousRecoveryRegistration = {
      ...input,
      metadataModel: {
        autonomousRecoveryId: input.autonomousRecoveryId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.autonomousRecoveryId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: AutonomousRecoverySessionInput): AutonomousRecoverySession {
    if (!this.registrations.has(input.autonomousRecoveryId)) {
      throw RuntimeError.autonomousRecovery('Autonomous recovery registration not found', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousRecovery('Duplicate autonomous recovery session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: AutonomousRecoverySession = {
      sessionId: input.sessionId,
      autonomousRecoveryId: input.autonomousRecoveryId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: AutonomousRecoveryContextInput): AutonomousRecoveryContext {
    if (!this.registrations.has(input.autonomousRecoveryId)) {
      throw RuntimeError.autonomousRecovery('Autonomous recovery registration not found for context', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.autonomousRecovery('Autonomous recovery session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.autonomousRecovery('Duplicate autonomous recovery context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateRecoveryGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidAutonomousRecoveryEntries += 1
      this.validationRejected += 1
      throw RuntimeError.recoveryGovernance('Recovery governance validation failed', {
        contextId: input.contextId,
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    const context: AutonomousRecoveryContext = {
      contextId: input.contextId,
      autonomousRecoveryId: input.autonomousRecoveryId,
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

  get(autonomousRecoveryId: string): AutonomousRecoveryRegistration | undefined {
    return this.registrations.get(autonomousRecoveryId)
  }

  list(): AutonomousRecoveryRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): AutonomousRecoverySession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): AutonomousRecoveryContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidAutonomousRecoveryCount(): number {
    return this.invalidAutonomousRecoveryEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'autonomous-recovery-registry',
      'Autonomous Recovery Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapLifecycleStates(input: AutonomousRecoveryLifecycleStateInput[]): AutonomousRecoveryLifecycleState[] {
  return input.map((state) => ({ ...state }))
}

function mapSummary(input: RecoveryPlanInput['summary']): RecoverySummary {
  return {
    synopsis: input.synopsis,
    highlights: [...input.highlights],
    risks: [...input.risks],
    nextActions: [...input.nextActions],
  }
}

function mapRecoveryState(input: RecoverySnapshotInput): RecoveryState {
  return input.recoveryState ?? input.lifecycleStates[input.lifecycleStates.length - 1]?.stage ?? 'recovery-detected'
}

export class AutonomousRecoveryManager {
  private recoveryPlans: Map<string, RecoveryPlan> = new Map()
  private continuityPlans: Map<string, SessionContinuityPlan> = new Map()
  private recoverySnapshots: Map<string, RecoverySnapshot> = new Map()
  private diagnostics: AutonomousRecoveryDiagnostics[] = []
  private lastContinuityUpdateAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: AutonomousRecoveryRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerAutonomousRecovery(input: AutonomousRecoveryRegistrationInput): AutonomousRecoveryRegistration {
    return this.registry.register(input)
  }

  startSession(input: AutonomousRecoverySessionInput): AutonomousRecoverySession {
    return this.registry.createSession(input)
  }

  createContext(input: AutonomousRecoveryContextInput): AutonomousRecoveryContext {
    return this.registry.createContext(input)
  }

  createRecoveryPlan(input: RecoveryPlanInput): RecoveryPlan {
    if (!this.registry.get(input.autonomousRecoveryId)) {
      throw RuntimeError.autonomousRecovery('Autonomous recovery registration not found for recovery plan', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    const planValidation = this.validation.validateRecoveryPlan(input)
    const lifecycleDiagnostics = this.validation.validateRecoveryLifecycle(input.state).diagnostics

    this.diagnostics.push(
      ...[...planValidation.diagnostics, ...lifecycleDiagnostics].map((diagnostic) => ({
        diagnosticId: `autonomous-recovery-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!planValidation.valid) {
      throw RuntimeError.recoveryPlan('Recovery plan validation failed', {
        recoveryPlanId: input.recoveryPlanId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.recoveryLifecycle('Recovery lifecycle validation failed', {
        recoveryPlanId: input.recoveryPlanId,
      })
    }

    const recoveryPlan: RecoveryPlan = {
      recoveryPlanId: input.recoveryPlanId,
      autonomousRecoveryId: input.autonomousRecoveryId,
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
      state: input.state,
      dependencies: input.dependencies.map((dependency) => ({ ...dependency })),
      strategies: input.strategies.map((strategy) => ({ ...strategy })),
      timeline: {
        ...input.timeline,
        events: input.timeline.events.map((event) => ({ ...event })),
      },
      checkpoints: input.checkpoints.map((checkpoint) => ({ ...checkpoint })),
      recommendations: input.recommendations.map((recommendation) => ({ ...recommendation })),
      outcomes: input.outcomes.map((outcome) => ({ ...outcome })),
      summary: mapSummary(input.summary),
      metadata: input.metadata,
    }

    this.recoveryPlans.set(recoveryPlan.recoveryPlanId, recoveryPlan)
    this.lastUpdatedAt = now()
    return recoveryPlan
  }

  createSessionContinuityPlan(input: SessionContinuityPlanInput): SessionContinuityPlan {
    if (!this.registry.get(input.autonomousRecoveryId)) {
      throw RuntimeError.autonomousRecovery('Autonomous recovery registration not found for continuity plan', {
        autonomousRecoveryId: input.autonomousRecoveryId,
      })
    }

    const continuityValidation = this.validation.validateSessionContinuity(input)

    this.diagnostics.push(
      ...continuityValidation.diagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-recovery-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!continuityValidation.valid) {
      throw RuntimeError.sessionContinuity('Session continuity validation failed', {
        sessionContinuityPlanId: input.sessionContinuityPlanId,
      })
    }

    const continuityPlan: SessionContinuityPlan = {
      sessionContinuityPlanId: input.sessionContinuityPlanId,
      autonomousRecoveryId: input.autonomousRecoveryId,
      sessionSnapshots: input.sessionSnapshots.map((snapshot) => ({ ...snapshot })),
      sessionRestorePoints: input.sessionRestorePoints.map((restorePoint) => ({ ...restorePoint })),
      workspaceRestorePlan: {
        ...input.workspaceRestorePlan,
        workspaceReferences: { ...input.workspaceRestorePlan.workspaceReferences },
      },
      runtimeRestorePlan: {
        ...input.runtimeRestorePlan,
        runtimeScope: [...input.runtimeRestorePlan.runtimeScope],
      },
      serviceRestorePlan: {
        ...input.serviceRestorePlan,
        serviceIds: [...input.serviceRestorePlan.serviceIds],
      },
      executionResumePlan: {
        ...input.executionResumePlan,
        projectReferences: { ...input.executionResumePlan.projectReferences },
        workflowReferences: {
          ...input.executionResumePlan.workflowReferences,
          workflowPlanIds: [...input.executionResumePlan.workflowReferences.workflowPlanIds],
        },
        taskReferences: {
          ...input.executionResumePlan.taskReferences,
          taskIds: [...input.executionResumePlan.taskReferences.taskIds],
        },
        agentReferences: {
          ...input.executionResumePlan.agentReferences,
          agentIds: [...input.executionResumePlan.agentReferences.agentIds],
        },
      },
      continuityAudit: {
        ...input.continuityAudit,
        records: input.continuityAudit.records.map((record) => ({ ...record })),
      },
      summary: mapSummary(input.summary),
      metadata: input.metadata,
    }

    this.continuityPlans.set(continuityPlan.sessionContinuityPlanId, continuityPlan)
    this.lastContinuityUpdateAt = now()
    this.lastUpdatedAt = now()
    return continuityPlan
  }

  createRecoverySnapshot(input: RecoverySnapshotInput): RecoverySnapshot {
    if (!this.recoveryPlans.has(input.recoveryPlanId)) {
      throw RuntimeError.recoveryPlan('Recovery plan not found for snapshot', {
        recoveryPlanId: input.recoveryPlanId,
      })
    }

    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) => this.validation.validateRecoveryLifecycle(state.stage).diagnostics)

    this.diagnostics.push(
      ...lifecycleDiagnostics.map((diagnostic) => ({
        diagnosticId: `autonomous-recovery-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.recoveryLifecycle('Recovery snapshot lifecycle validation failed', {
        recoverySnapshotId: input.recoverySnapshotId,
      })
    }

    const recoverySnapshot: RecoverySnapshot = {
      recoverySnapshotId: input.recoverySnapshotId,
      autonomousRecoveryId: input.autonomousRecoveryId,
      recoveryPlanId: input.recoveryPlanId,
      recoveryState: mapRecoveryState(input),
      lifecycleStates: mapLifecycleStates(input.lifecycleStates),
      capturedAt: input.capturedAt,
      summary: mapSummary(input.summary),
      metadata: input.metadata,
    }

    this.recoverySnapshots.set(recoverySnapshot.recoverySnapshotId, recoverySnapshot)
    this.lastUpdatedAt = now()
    return recoverySnapshot
  }

  getRecoveryPlan(recoveryPlanId: string): RecoveryPlan | undefined {
    return this.recoveryPlans.get(recoveryPlanId)
  }

  getSessionContinuityPlan(sessionContinuityPlanId: string): SessionContinuityPlan | undefined {
    return this.continuityPlans.get(sessionContinuityPlanId)
  }

  getRecoverySnapshot(recoverySnapshotId: string): RecoverySnapshot | undefined {
    return this.recoverySnapshots.get(recoverySnapshotId)
  }

  listRecoveryPlans(): RecoveryPlan[] {
    return Array.from(this.recoveryPlans.values())
  }

  listSessionContinuityPlans(): SessionContinuityPlan[] {
    return Array.from(this.continuityPlans.values())
  }

  listRecoverySnapshots(): RecoverySnapshot[] {
    return Array.from(this.recoverySnapshots.values())
  }

  getHealth(): AutonomousRecoveryRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const restorePointsTracked = this.listSessionContinuityPlans().reduce((count, plan) => {
      return count + plan.sessionRestorePoints.length
    }, 0)

    return {
      autonomousRecoveryHealth: {
        status: this.registry.getInvalidAutonomousRecoveryCount() > 0 ? 'degraded' : 'healthy',
        registeredAutonomousRecoveryEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidAutonomousRecoveryEntries: this.registry.getInvalidAutonomousRecoveryCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      sessionContinuityHealth: {
        status: this.continuityPlans.size > 0 ? 'healthy' : 'degraded',
        recoveryPlansTracked: this.recoveryPlans.size,
        continuityPlansTracked: this.continuityPlans.size,
        snapshotsTracked: this.recoverySnapshots.size,
        restorePointsTracked,
        lastContinuityUpdateAt: this.lastContinuityUpdateAt,
      },
      recoveryValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
