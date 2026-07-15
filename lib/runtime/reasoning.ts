import type { ConfidenceScore, IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  type ReasoningEngineContextInput,
  type ReasoningEngineGovernanceInput,
  type ReasoningEngineRegistrationInput,
  type ReasoningEngineSessionInput,
  type ReasoningEngineStage,
  type ReasoningOutputInput,
  type ReasoningPlanInput,
  RegistrationValidationService,
  type ReasoningArtifactType,
  type ReasoningGovernanceInput,
  type ReasoningPipelineStage,
  type ReasoningPipelineStatus,
  type ReasoningRegistrationInput,
  type ReasoningStageRegistrationInput,
  type RegistrationDiagnostic,
} from './validation'

export type RuntimeReasoningTrustLevel = 'untrusted' | 'candidate' | 'trusted' | 'authoritative'

export interface ReasoningSession {
  sessionId: string
  pipelineId: string
  createdAt: IsoDateTime
  status: ReasoningPipelineStatus
  metadata?: Metadata
}

export interface ReasoningContext {
  contextId: string
  sessionId: string
  stage: ReasoningPipelineStage
  metadata?: Metadata
}

export interface ReasoningRequest {
  requestId: string
  sessionId: string
  stage: ReasoningPipelineStage
  input: Metadata
  metadata?: Metadata
}

export interface ReasoningResult {
  resultId: string
  sessionId: string
  stage: ReasoningPipelineStage
  status: 'accepted' | 'rejected'
  diagnostics: RuntimeReasoningDiagnostic[]
  metadata?: Metadata
}

export interface RuntimeReasoningDiagnostic {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningArtifact {
  artifactId: string
  type: ReasoningArtifactType
  title: string
  version: VersionString
  payload: Metadata
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
  metadata?: Metadata
}

export interface ReasoningMetadata {
  pipelineId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  stageOrder: ReasoningPipelineStage[]
  dependencies: string[]
  governance: RuntimeReasoningGovernance
  diagnostics: RuntimeReasoningDiagnostic[]
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RuntimeReasoningGovernance {
  confidence: ConfidenceScore
  trust: RuntimeReasoningTrustLevel
  evidence: {
    required: boolean
    references: string[]
  }
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  version: VersionString
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
}

export interface ReasoningStageDefinition {
  stageId: string
  stage: ReasoningPipelineStage
  order: number
  dependencies: ReasoningPipelineStage[]
  transitionsTo: ReasoningPipelineStage[]
  metadata?: Metadata
}

export interface ReasoningRegistration extends ReasoningRegistrationInput {
  metadataModel: ReasoningMetadata
  registeredAt: IsoDateTime
}

export interface ReasoningPipelineHealth {
  registry: RegistryHealthSummary
  stageRegistry: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredCount: number
    invalidTransitions: number
    lastTransitionAt?: IsoDateTime
  }
  artifacts: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalArtifacts: number
    byType: Record<ReasoningArtifactType, number>
  }
  validation: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

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

function createMetadata(input: ReasoningRegistrationInput): ReasoningMetadata {
  return {
    pipelineId: input.pipelineId,
    name: input.name,
    version: input.version,
    contractVersion: input.contractVersion,
    stageOrder: input.stageOrder,
    dependencies: input.dependencies,
    governance: input.governance,
    diagnostics: [],
    createdAt: now(),
    metadata: input.metadata,
  }
}

export class ReasoningStageRegistry {
  private stages: Map<ReasoningPipelineStage, ReasoningStageDefinition> = new Map()
  private invalidTransitions = 0
  private lastTransitionAt?: IsoDateTime

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerStage(input: ReasoningStageRegistrationInput): ReasoningStageDefinition {
    const validation = this.validation.validateReasoningStageRegistration(
      input,
      new Set(this.stages.keys())
    )

    if (!validation.valid) {
      throw RuntimeError.stageValidation('Reasoning stage registration validation failed', {
        stage: input.stage,
      })
    }

    const stage: ReasoningStageDefinition = {
      stageId: input.stageId,
      stage: input.stage,
      order: input.order,
      dependencies: input.dependencies,
      transitionsTo: input.transitionsTo,
      metadata: input.metadata,
    }

    this.stages.set(stage.stage, stage)
    return stage
  }

  getStage(stage: ReasoningPipelineStage): ReasoningStageDefinition | undefined {
    return this.stages.get(stage)
  }

  listStages(): ReasoningStageDefinition[] {
    return Array.from(this.stages.values()).sort((a, b) => a.order - b.order)
  }

  canTransition(from: ReasoningPipelineStage, to: ReasoningPipelineStage): boolean {
    const validation = this.validation.validateReasoningStageTransition(from, to)
    if (!validation.valid) {
      this.invalidTransitions += 1
      return false
    }

    const stage = this.stages.get(from)
    if (!stage) {
      this.invalidTransitions += 1
      return false
    }

    const allowed = stage.transitionsTo.includes(to)
    if (!allowed) {
      this.invalidTransitions += 1
      return false
    }

    this.lastTransitionAt = now()
    return true
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredCount: number
    invalidTransitions: number
    lastTransitionAt?: IsoDateTime
  } {
    return {
      status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
      registeredCount: this.stages.size,
      invalidTransitions: this.invalidTransitions,
      lastTransitionAt: this.lastTransitionAt,
    }
  }
}

export class ReasoningRegistry {
  private pipelines: Map<string, ReasoningRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(registration: ReasoningRegistration): ReasoningRegistration {
    const registrationValidation = this.validation.validateReasoningRegistration(
      registration,
      new Set(this.pipelines.keys())
    )
    const metadataValidation = this.validation.validateReasoningMetadata(registration.metadataModel)
    const governanceValidation = this.validation.validateReasoningGovernance(
      registration.pipelineId,
      registration.governance
    )

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...metadataValidation.diagnostics,
      ...governanceValidation.diagnostics,
    ]

    this.diagnostics.push(...diagnostics)

    const valid = diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
    if (!valid) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.pipelineRegistration('Reasoning pipeline registration validation failed', {
        pipelineId: registration.pipelineId,
      })
    }

    this.pipelines.set(registration.pipelineId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(pipelineId: string): ReasoningRegistration | undefined {
    return this.pipelines.get(pipelineId)
  }

  list(): ReasoningRegistration[] {
    return Array.from(this.pipelines.values())
  }

  isRegistered(pipelineId: string): boolean {
    return this.pipelines.has(pipelineId)
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'reasoning-registry',
      name: 'Reasoning Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.pipelines.size,
      duplicateRejected: this.duplicateRejected,
      validationRejected: this.validationRejected,
      lastUpdatedAt: this.lastUpdatedAt,
      diagnostics: {
        total: this.diagnostics.length,
        errorCount,
        warningCount,
      },
    }
  }
}

export class ReasoningPipelineManager {
  private sessions: Map<string, ReasoningSession> = new Map()
  private artifacts: Map<string, ReasoningArtifact[]> = new Map()

  constructor(
    private registry: ReasoningRegistry,
    private stageRegistry: ReasoningStageRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerPipeline(input: ReasoningRegistrationInput): ReasoningRegistration {
    const registration: ReasoningRegistration = {
      ...input,
      metadataModel: createMetadata(input),
      registeredAt: now(),
    }

    return this.registry.register(registration)
  }

  registerStage(input: ReasoningStageRegistrationInput): ReasoningStageDefinition {
    return this.stageRegistry.registerStage(input)
  }

  discoverStages(): ReasoningStageDefinition[] {
    return this.stageRegistry.listStages()
  }

  createSession(pipelineId: string): ReasoningSession {
    if (!this.registry.isRegistered(pipelineId)) {
      throw RuntimeError.notFound(`Reasoning pipeline is not registered: ${pipelineId}`)
    }

    const session: ReasoningSession = {
      sessionId: `reasoning-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pipelineId,
      createdAt: now(),
      status: 'planning-gate',
    }

    this.sessions.set(session.sessionId, session)
    return session
  }

  transitionSession(sessionId: string, to: ReasoningPipelineStage): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw RuntimeError.notFound(`Reasoning session not found: ${sessionId}`)
    }

    const from = session.status
    if (!this.stageRegistry.canTransition(from, to)) {
      throw RuntimeError.transition('Reasoning stage transition is not allowed', {
        sessionId,
        from,
        to,
      })
    }

    session.status = to
    this.sessions.set(sessionId, session)
  }

  attachArtifact(sessionId: string, artifact: ReasoningArtifact): void {
    const validation = this.validation.validateReasoningArtifact(artifact)
    if (!validation.valid) {
      throw RuntimeError.artifactValidation('Reasoning artifact validation failed', {
        sessionId,
        artifactId: artifact.artifactId,
      })
    }

    const list = this.artifacts.get(sessionId) ?? []
    list.push(artifact)
    this.artifacts.set(sessionId, list)
  }

  getSession(sessionId: string): ReasoningSession | undefined {
    return this.sessions.get(sessionId)
  }

  getSessionArtifacts(sessionId: string): ReasoningArtifact[] {
    return this.artifacts.get(sessionId) ?? []
  }

  getHealth(): ReasoningPipelineHealth {
    const diagnostics = this.registry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const byType: Record<ReasoningArtifactType, number> = {
      intent: 0,
      objectives: 0,
      constraints: 0,
      assumptions: 0,
      'context-package': 0,
      'evidence-package': 0,
      'decision-package': 0,
      'validation-package': 0,
      'approval-package': 0,
    }

    for (const artifacts of this.artifacts.values()) {
      for (const artifact of artifacts) {
        byType[artifact.type] += 1
      }
    }

    const totalArtifacts = Object.values(byType).reduce((sum, value) => sum + value, 0)

    return {
      registry: this.registry.getHealthSummary(),
      stageRegistry: this.stageRegistry.getHealth(),
      artifacts: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalArtifacts,
        byType,
      },
      validation: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
    }
  }
}

export interface ReasoningEngineMetadata {
  engineId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningEngineDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface ReasoningEngineSession {
  sessionId: string
  engineId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningEngineOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface ReasoningEngineProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ReasoningEngineFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ReasoningEngineGovernance {
  ownership: ReasoningEngineOwnership
  confidence: number
  trust: RuntimeReasoningTrustLevel
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: ReasoningEngineProvenance
  freshness: ReasoningEngineFreshness
}

export interface ReasoningEngineContext {
  contextId: string
  engineId: string
  sessionId?: string
  governance: ReasoningEngineGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningObjective {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface ReasoningConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ReasoningAssumption {
  assumptionId: string
  statement: string
  confidence: number
  metadata?: Metadata
}

export interface ReasoningEvidence {
  evidenceId: string
  statement: string
  sourceIds: string[]
  trust: RuntimeReasoningTrustLevel
  metadata?: Metadata
}

export interface ReasoningDecisionPoint {
  decisionPointId: string
  question: string
  options: string[]
  selectedOption?: string
  rationale?: string
  metadata?: Metadata
}

export interface ReasoningOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface ReasoningSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
  metadata?: Metadata
}

export interface ReasoningPlan {
  planId: string
  engineId: string
  stage: ReasoningEngineStage
  objectives: ReasoningObjective[]
  constraints: ReasoningConstraint[]
  assumptions: ReasoningAssumption[]
  evidence: ReasoningEvidence[]
  decisionPoints: ReasoningDecisionPoint[]
  outcomes: ReasoningOutcome[]
  summary: ReasoningSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningEngineStageState {
  stage: ReasoningEngineStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningOutput {
  outputId: string
  engineId: string
  planId: string
  stage: ReasoningEngineStage
  summary: string
  references: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ReasoningEngineRegistration extends ReasoningEngineRegistrationInput {
  metadataModel: ReasoningEngineMetadata
  registeredAt: IsoDateTime
}

export interface ReasoningEngineRuntimeHealth {
  reasoningEngineHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredEngines: number
    sessionsTracked: number
    contextsTracked: number
    invalidEngineEntries: number
    lastUpdatedAt: IsoDateTime
  }
  reasoningPlanHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    plansTracked: number
    outputsTracked: number
    invalidPlans: number
    lastOutputAt?: IsoDateTime
  }
  reasoningValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class ReasoningEngineRegistry {
  private registrations: Map<string, ReasoningEngineRegistration> = new Map()
  private sessions: Map<string, ReasoningEngineSession> = new Map()
  private contexts: Map<string, ReasoningEngineContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidEngineEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ReasoningEngineRegistrationInput): ReasoningEngineRegistration {
    const validationResult = this.validation.validateReasoningEngine(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.engineId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.reasoningEngine('Duplicate reasoning engine ID detected', {
        engineId: input.engineId,
      })
    }

    if (!validationResult.valid) {
      this.invalidEngineEntries += 1
      this.validationRejected += 1
      throw RuntimeError.reasoningEngine('Reasoning engine registration validation failed', {
        engineId: input.engineId,
      })
    }

    const registration: ReasoningEngineRegistration = {
      ...input,
      metadataModel: {
        engineId: input.engineId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.engineId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: ReasoningEngineSessionInput): ReasoningEngineSession {
    if (!this.registrations.has(input.engineId)) {
      throw RuntimeError.reasoningEngine('Reasoning engine registration not found', {
        engineId: input.engineId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.reasoningEngine('Duplicate reasoning engine session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: ReasoningEngineSession = {
      sessionId: input.sessionId,
      engineId: input.engineId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: ReasoningEngineContextInput): ReasoningEngineContext {
    if (!this.registrations.has(input.engineId)) {
      throw RuntimeError.reasoningEngine('Reasoning engine registration not found for context', {
        engineId: input.engineId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.reasoningEngine('Reasoning engine session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.reasoningEngine('Duplicate reasoning engine context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateReasoningEngineGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidEngineEntries += 1
      this.validationRejected += 1
      throw RuntimeError.reasoningGovernance('Reasoning engine governance validation failed', {
        contextId: input.contextId,
        engineId: input.engineId,
      })
    }

    const context: ReasoningEngineContext = {
      contextId: input.contextId,
      engineId: input.engineId,
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

  get(engineId: string): ReasoningEngineRegistration | undefined {
    return this.registrations.get(engineId)
  }

  getSession(sessionId: string): ReasoningEngineSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): ReasoningEngineContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): ReasoningEngineRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): ReasoningEngineSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): ReasoningEngineContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidEngineCount(): number {
    return this.invalidEngineEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'reasoning-engine-registry',
      'Reasoning Engine Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class ReasoningEngineManager {
  private plans: Map<string, ReasoningPlan> = new Map()
  private outputs: Map<string, ReasoningOutput> = new Map()
  private diagnostics: ReasoningEngineDiagnostics[] = []
  private invalidPlans = 0
  private lastOutputAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: ReasoningEngineRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerEngine(input: ReasoningEngineRegistrationInput): ReasoningEngineRegistration {
    return this.registry.register(input)
  }

  startSession(input: ReasoningEngineSessionInput): ReasoningEngineSession {
    return this.registry.createSession(input)
  }

  createContext(input: ReasoningEngineContextInput): ReasoningEngineContext {
    return this.registry.createContext(input)
  }

  createPlan(input: ReasoningPlanInput): ReasoningPlan {
    if (!this.registry.get(input.engineId)) {
      throw RuntimeError.reasoningEngine('Reasoning engine registration not found for plan', {
        engineId: input.engineId,
      })
    }

    const planValidation = this.validation.validateReasoningPlan(input)
    const stageValidation = this.validation.validateReasoningStage(input.stage)
    const diagnostics = [...planValidation.diagnostics, ...stageValidation.diagnostics]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `reasoning-engine-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!stageValidation.valid) {
      this.invalidPlans += 1
      throw RuntimeError.reasoningStage('Reasoning plan stage validation failed', {
        planId: input.planId,
        stage: input.stage,
      })
    }

    if (!planValidation.valid) {
      this.invalidPlans += 1
      throw RuntimeError.reasoningPlan('Reasoning plan validation failed', {
        planId: input.planId,
        engineId: input.engineId,
      })
    }

    const plan: ReasoningPlan = {
      ...input,
      createdAt: now(),
    }

    this.plans.set(plan.planId, plan)
    this.lastUpdatedAt = now()
    return plan
  }

  publishOutput(input: ReasoningOutputInput): ReasoningOutput {
    if (!this.registry.get(input.engineId)) {
      throw RuntimeError.reasoningEngine('Reasoning engine registration not found for output', {
        engineId: input.engineId,
      })
    }

    if (!this.plans.has(input.planId)) {
      throw RuntimeError.reasoningPlan('Reasoning plan not found for output', {
        planId: input.planId,
      })
    }

    const outputValidation = this.validation.validateReasoningOutput(input)
    this.diagnostics.push(
      ...outputValidation.diagnostics.map((diagnostic) => ({
        diagnosticId: `reasoning-engine-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!outputValidation.valid) {
      throw RuntimeError.reasoningOutput('Reasoning output validation failed', {
        outputId: input.outputId,
        planId: input.planId,
      })
    }

    const output: ReasoningOutput = {
      ...input,
      createdAt: now(),
    }

    this.outputs.set(output.outputId, output)
    this.lastOutputAt = now()
    this.lastUpdatedAt = now()
    return output
  }

  getPlan(planId: string): ReasoningPlan | undefined {
    return this.plans.get(planId)
  }

  getOutput(outputId: string): ReasoningOutput | undefined {
    return this.outputs.get(outputId)
  }

  listPlans(): ReasoningPlan[] {
    return Array.from(this.plans.values())
  }

  listOutputs(): ReasoningOutput[] {
    return Array.from(this.outputs.values())
  }

  getHealth(): ReasoningEngineRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      reasoningEngineHealth: {
        status: this.registry.getInvalidEngineCount() > 0 ? 'degraded' : 'healthy',
        registeredEngines: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidEngineEntries: this.registry.getInvalidEngineCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      reasoningPlanHealth: {
        status: this.invalidPlans > 0 ? 'degraded' : 'healthy',
        plansTracked: this.plans.size,
        outputsTracked: this.outputs.size,
        invalidPlans: this.invalidPlans,
        lastOutputAt: this.lastOutputAt,
      },
      reasoningValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
