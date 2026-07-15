import type { ConfidenceScore, IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type WorkflowArtifactInput,
  type WorkflowArtifactType,
  type WorkflowGovernanceInput,
  type WorkflowRegistrationInput,
  type WorkflowState,
  type WorkflowStepInput,
} from './validation'

export interface WorkflowStep {
  stepId: string
  name: string
  order: number
  dependencies: string[]
  entryConditions: string[]
  exitConditions: string[]
  transitionsTo: string[]
  completionRules: string[]
  failureRules: string[]
  metadata?: Metadata
}

export interface WorkflowArtifact {
  artifactId: string
  type: WorkflowArtifactType
  title: string
  version: VersionString
  payload: Metadata
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
}

export interface RuntimeWorkflowGovernance {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  version: VersionString
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  confidence: ConfidenceScore
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
  audit: {
    createdBy: string
    createdAt: IsoDateTime
    updatedAt?: IsoDateTime
  }
}

export interface WorkflowMetadata {
  workflowId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  state: WorkflowState
  steps: WorkflowStep[]
  governance: RuntimeWorkflowGovernance
  diagnostics: RuntimeWorkflowDiagnostic[]
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RuntimeWorkflowDiagnostic {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowDefinition extends WorkflowRegistrationInput {
  metadataModel: WorkflowMetadata
  registeredAt: IsoDateTime
}

export interface WorkflowInstance {
  instanceId: string
  workflowId: string
  state: WorkflowState
  currentStepId?: string
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface WorkflowContext {
  contextId: string
  instanceId: string
  data: Metadata
  createdAt: IsoDateTime
}

export interface WorkflowEngineHealth {
  registry: RegistryHealthSummary
  validation: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
  lifecycle: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    instancesTracked: number
    byState: Record<WorkflowState, number>
    invalidTransitions: number
    lastTransitionAt?: IsoDateTime
  }
}

function now(): IsoDateTime {
  return new Date().toISOString()
}

function createMetadata(input: WorkflowRegistrationInput): WorkflowMetadata {
  return {
    workflowId: input.workflowId,
    name: input.name,
    version: input.version,
    contractVersion: input.contractVersion,
    state: input.state,
    steps: input.steps,
    governance: input.governance,
    diagnostics: [],
    createdAt: now(),
    metadata: input.metadata,
  }
}

export class WorkflowRegistry {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(definition: WorkflowDefinition): WorkflowDefinition {
    const registrationValidation = this.validation.validateWorkflowRegistration(
      definition,
      new Set(this.workflows.keys())
    )
    const metadataValidation = this.validation.validateWorkflowMetadata(definition.metadataModel)
    const governanceValidation = this.validation.validateWorkflowGovernance(
      definition.workflowId,
      definition.governance
    )

    const stepDiagnostics: RegistrationDiagnostic[] = []
    const knownStepIds = new Set<string>()
    for (const step of definition.steps) {
      const stepValidation = this.validation.validateWorkflowStep(step, knownStepIds)
      stepDiagnostics.push(...stepValidation.diagnostics)
      knownStepIds.add(step.stepId)

      for (const transition of step.transitionsTo) {
        const transitionValidation = this.validation.validateWorkflowTransition(step.stepId, transition)
        stepDiagnostics.push(...transitionValidation.diagnostics)
      }
    }

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...metadataValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...stepDiagnostics,
    ]

    this.diagnostics.push(...diagnostics)

    const valid = diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
    if (!valid) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.workflowRegistration('Workflow registration validation failed', {
        workflowId: definition.workflowId,
      })
    }

    this.workflows.set(definition.workflowId, definition)
    this.lastUpdatedAt = now()
    return definition
  }

  get(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  isRegistered(workflowId: string): boolean {
    return this.workflows.has(workflowId)
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'workflow-registry',
      name: 'Workflow Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.workflows.size,
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

export class WorkflowEngineManager {
  private instances: Map<string, WorkflowInstance> = new Map()
  private contexts: Map<string, WorkflowContext> = new Map()
  private artifacts: Map<string, WorkflowArtifact[]> = new Map()
  private invalidTransitions = 0
  private lastTransitionAt?: IsoDateTime

  private transitions: Record<WorkflowState, WorkflowState[]> = {
    draft: ['registered', 'archived'],
    registered: ['ready', 'archived'],
    ready: ['running', 'cancelled', 'archived'],
    running: ['waiting', 'suspended', 'completed', 'failed', 'cancelled'],
    waiting: ['running', 'cancelled', 'failed'],
    suspended: ['ready', 'running', 'cancelled'],
    completed: ['archived'],
    failed: ['ready', 'cancelled', 'archived'],
    cancelled: ['archived'],
    archived: [],
  }

  constructor(
    private registry: WorkflowRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerWorkflow(input: WorkflowRegistrationInput): WorkflowDefinition {
    const definition: WorkflowDefinition = {
      ...input,
      metadataModel: createMetadata(input),
      registeredAt: now(),
    }

    return this.registry.register(definition)
  }

  createInstance(workflowId: string): WorkflowInstance {
    if (!this.registry.isRegistered(workflowId)) {
      throw RuntimeError.notFound(`Workflow is not registered: ${workflowId}`)
    }

    const definition = this.registry.get(workflowId)
    if (!definition) {
      throw RuntimeError.notFound(`Workflow definition not found: ${workflowId}`)
    }

    const firstStep = [...definition.steps].sort((a, b) => a.order - b.order)[0]
    const instance: WorkflowInstance = {
      instanceId: `workflow-instance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workflowId,
      state: 'ready',
      currentStepId: firstStep?.stepId,
      createdAt: now(),
    }

    this.instances.set(instance.instanceId, instance)
    return instance
  }

  setState(instanceId: string, to: WorkflowState): void {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw RuntimeError.notFound(`Workflow instance not found: ${instanceId}`)
    }

    const from = instance.state
    const transitionValidation = this.validation.validateWorkflowTransition(from, to)
    if (!transitionValidation.valid) {
      this.invalidTransitions += 1
      throw RuntimeError.workflowTransition('Workflow transition validation failed', {
        instanceId,
        from,
        to,
      })
    }

    if (!this.transitions[from].includes(to)) {
      this.invalidTransitions += 1
      throw RuntimeError.workflowLifecycle('Workflow lifecycle transition is not allowed', {
        instanceId,
        from,
        to,
      })
    }

    instance.state = to
    this.instances.set(instanceId, instance)
    this.lastTransitionAt = now()
  }

  setContext(instanceId: string, data: Metadata): WorkflowContext {
    if (!this.instances.has(instanceId)) {
      throw RuntimeError.notFound(`Workflow instance not found: ${instanceId}`)
    }

    const context: WorkflowContext = {
      contextId: `workflow-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      instanceId,
      data,
      createdAt: now(),
    }

    this.contexts.set(instanceId, context)
    return context
  }

  attachArtifact(instanceId: string, artifact: WorkflowArtifactInput): void {
    if (!this.instances.has(instanceId)) {
      throw RuntimeError.notFound(`Workflow instance not found: ${instanceId}`)
    }

    const artifactValidation = this.validation.validateWorkflowArtifact(artifact)
    if (!artifactValidation.valid) {
      throw RuntimeError.workflowValidation('Workflow artifact validation failed', {
        instanceId,
        artifactId: artifact.artifactId,
      })
    }

    const list = this.artifacts.get(instanceId) ?? []
    list.push({
      artifactId: artifact.artifactId,
      type: artifact.type,
      title: artifact.title,
      version: artifact.version,
      payload: artifact.payload,
      provenance: artifact.provenance,
    })
    this.artifacts.set(instanceId, list)
  }

  getHealth(): WorkflowEngineHealth {
    const diagnostics = this.registry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const byState: Record<WorkflowState, number> = {
      draft: 0,
      registered: 0,
      ready: 0,
      running: 0,
      waiting: 0,
      suspended: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      archived: 0,
    }

    for (const instance of this.instances.values()) {
      byState[instance.state] += 1
    }

    return {
      registry: this.registry.getHealthSummary(),
      validation: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
      lifecycle: {
        status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
        instancesTracked: this.instances.size,
        byState,
        invalidTransitions: this.invalidTransitions,
        lastTransitionAt: this.lastTransitionAt,
      },
    }
  }
}
