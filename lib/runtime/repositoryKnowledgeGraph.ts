import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type RepositoryKnowledgeGraphConfigurationInput,
  type RepositoryKnowledgeGraphContextInput,
  type RepositoryKnowledgeGraphLifecycleStage,
  type RepositoryKnowledgeGraphRegistrationInput,
  type RepositoryKnowledgeGraphResourceInput,
  type RepositoryKnowledgeGraphSessionInput,
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

export interface RepositoryKnowledgeGraphMetadata {
  repositoryKnowledgeGraphId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphSession {
  sessionId: string
  repositoryKnowledgeGraphId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface RepositoryKnowledgeGraphProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface RepositoryKnowledgeGraphFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface RepositoryKnowledgeGraphGovernance {
  ownership: RepositoryKnowledgeGraphOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: RepositoryKnowledgeGraphProvenance
  freshness: RepositoryKnowledgeGraphFreshness
}

export interface RepositoryKnowledgeGraphContext {
  contextId: string
  repositoryKnowledgeGraphId: string
  sessionId?: string
  governance: RepositoryKnowledgeGraphGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeNode {
  knowledgeNodeId: string
  label: string
  category: 'entity' | 'artifact' | 'component' | 'module' | 'concern' | 'other'
  metadata?: Metadata
}

export interface KnowledgeEdge {
  knowledgeEdgeId: string
  fromNodeId: string
  toNodeId: string
  relation: 'relates-to' | 'depends-on' | 'contains' | 'references' | 'derived-from' | 'other'
  metadata?: Metadata
}

/**
 * Named RepositoryKnowledgeRelationship (not KnowledgeRelationship) to avoid colliding with
 * the pre-existing KnowledgeRelationship model in businessBrain.ts, which shares the flat
 * lib/runtime/index.ts export barrel.
 */
export interface RepositoryKnowledgeRelationship {
  repositoryKnowledgeRelationshipId: string
  sourceNodeId: string
  targetNodeId: string
  relationshipType: string
  strength: number
  metadata?: Metadata
}

export interface KnowledgeCluster {
  knowledgeClusterId: string
  name: string
  nodeIds: string[]
  metadata?: Metadata
}

export interface KnowledgePath {
  knowledgePathId: string
  nodeIds: string[]
  edgeIds: string[]
  metadata?: Metadata
}

/**
 * Named RepositoryKnowledgeReference (not KnowledgeReference) to avoid colliding with the
 * pre-existing KnowledgeReference models in knowledgeAssembly.ts and businessBrain.ts.
 */
export interface RepositoryKnowledgeReference {
  repositoryKnowledgeReferenceId: string
  nodeId: string
  referenceType: 'documentation' | 'specification' | 'external' | 'internal' | 'other'
  locator: string
  metadata?: Metadata
}

export interface KnowledgeEvidence {
  knowledgeEvidenceId: string
  nodeId: string
  description: string
  confidence: number
  metadata?: Metadata
}

export interface KnowledgeDependency {
  knowledgeDependencyId: string
  fromNodeId: string
  toNodeId: string
  dependencyType: 'required' | 'optional' | 'transitive' | 'other'
  metadata?: Metadata
}

export interface KnowledgeClassification {
  knowledgeClassificationId: string
  nodeId: string
  classification: string
  confidence: number
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface RepositoryEntity {
  repositoryEntityId: string
  name: string
  entityType: 'service' | 'library' | 'application' | 'package' | 'other'
  metadata?: Metadata
}

export interface RepositoryArtifact {
  repositoryArtifactId: string
  name: string
  artifactType: 'file' | 'document' | 'diagram' | 'config' | 'other'
  metadata?: Metadata
}

export interface RepositoryComponent {
  repositoryComponentId: string
  name: string
  componentType: 'ui' | 'service' | 'data' | 'infrastructure' | 'other'
  metadata?: Metadata
}

export interface RepositoryModule {
  repositoryModuleId: string
  name: string
  path: string
  metadata?: Metadata
}

export interface RepositoryBoundary {
  repositoryBoundaryId: string
  name: string
  boundaryType: 'domain' | 'team' | 'service' | 'layer' | 'other'
  metadata?: Metadata
}

export interface RepositoryCapability {
  repositoryCapabilityId: string
  name: string
  category: string
  supported: boolean
  metadata?: Metadata
}

export interface RepositoryConcern {
  repositoryConcernId: string
  name: string
  concernType: 'cross-cutting' | 'business' | 'technical' | 'other'
  metadata?: Metadata
}

export interface RepositoryObservation {
  repositoryObservationId: string
  subjectId: string
  description: string
  observedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryFinding {
  repositoryFindingId: string
  subjectId: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphAudit {
  repositoryKnowledgeGraphAuditId: string
  subjectId: string
  summary: string
  recordedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphResource {
  repositoryKnowledgeGraphResourceId: string
  repositoryKnowledgeGraphId: string
  knowledgeNodes: KnowledgeNode[]
  knowledgeEdges: KnowledgeEdge[]
  repositoryKnowledgeRelationships: RepositoryKnowledgeRelationship[]
  knowledgeClusters: KnowledgeCluster[]
  knowledgePaths: KnowledgePath[]
  repositoryKnowledgeReferences: RepositoryKnowledgeReference[]
  knowledgeEvidence: KnowledgeEvidence[]
  knowledgeDependencies: KnowledgeDependency[]
  knowledgeClassifications: KnowledgeClassification[]
  repositoryEntities: RepositoryEntity[]
  repositoryArtifacts: RepositoryArtifact[]
  repositoryComponents: RepositoryComponent[]
  repositoryModules: RepositoryModule[]
  repositoryBoundaries: RepositoryBoundary[]
  repositoryCapabilities: RepositoryCapability[]
  repositoryConcerns: RepositoryConcern[]
  repositoryObservations: RepositoryObservation[]
  repositoryFindings: RepositoryFinding[]
  repositoryKnowledgeGraphAudits: RepositoryKnowledgeGraphAudit[]
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphConfiguration {
  repositoryKnowledgeGraphConfigurationId: string
  repositoryKnowledgeGraphId: string
  repositoryIntelligenceReferences: {
    repositoryIntelligenceId?: string
    repositoryIntelligenceConfigurationId?: string
  }
  sourceControlReferences: {
    sourceControlId?: string
    sourceControlConfigurationId?: string
  }
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
  governance: RepositoryKnowledgeGraphGovernance
  resourceModel: RepositoryKnowledgeGraphResource
  summary: RepositoryKnowledgeGraphSummary
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphCreatedState {
  state: 'created'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphDiscoveredState {
  state: 'discovered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphClassifiedState {
  state: 'classified'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphLinkedState {
  state: 'linked'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphReviewedState {
  state: 'reviewed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphValidatedState {
  state: 'validated'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphApprovedState {
  state: 'approved'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphPublishedState {
  state: 'published'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphArchivedState {
  state: 'archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphDeprecatedState {
  state: 'deprecated'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type RepositoryKnowledgeGraphLifecycleStateModel =
  | RepositoryKnowledgeGraphCreatedState
  | RepositoryKnowledgeGraphDiscoveredState
  | RepositoryKnowledgeGraphClassifiedState
  | RepositoryKnowledgeGraphLinkedState
  | RepositoryKnowledgeGraphReviewedState
  | RepositoryKnowledgeGraphValidatedState
  | RepositoryKnowledgeGraphApprovedState
  | RepositoryKnowledgeGraphPublishedState
  | RepositoryKnowledgeGraphArchivedState
  | RepositoryKnowledgeGraphDeprecatedState

export interface RepositoryKnowledgeGraphLifecycleState {
  stage: RepositoryKnowledgeGraphLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphRegistration extends RepositoryKnowledgeGraphRegistrationInput {
  metadataModel: RepositoryKnowledgeGraphMetadata
  registeredAt: IsoDateTime
}

export interface RepositoryKnowledgeGraphRuntimeHealth {
  repositoryKnowledgeGraphHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredRepositoryKnowledgeGraphEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidRepositoryKnowledgeGraphEntries: number
    lastUpdatedAt: IsoDateTime
  }
  knowledgeGraphHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    repositoryKnowledgeGraphConfigurationsTracked: number
    knowledgeNodesTracked: number
    knowledgeEdgesTracked: number
    repositoryKnowledgeRelationshipsTracked: number
    lastKnowledgeGraphUpdatedAt?: IsoDateTime
  }
  knowledgeValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class RepositoryKnowledgeGraphRegistry {
  private registrations: Map<string, RepositoryKnowledgeGraphRegistration> = new Map()
  private sessions: Map<string, RepositoryKnowledgeGraphSession> = new Map()
  private contexts: Map<string, RepositoryKnowledgeGraphContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidRepositoryKnowledgeGraphEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: RepositoryKnowledgeGraphRegistrationInput): RepositoryKnowledgeGraphRegistration {
    const validationResult = this.validation.validateRepositoryKnowledgeGraph(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.repositoryKnowledgeGraphId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryKnowledgeGraph('Duplicate repository knowledge graph ID detected', {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    if (!validationResult.valid) {
      this.invalidRepositoryKnowledgeGraphEntries += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph registration validation failed', {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    const registration: RepositoryKnowledgeGraphRegistration = {
      ...input,
      metadataModel: {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.repositoryKnowledgeGraphId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: RepositoryKnowledgeGraphSessionInput): RepositoryKnowledgeGraphSession {
    if (!this.registrations.has(input.repositoryKnowledgeGraphId)) {
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph registration not found', {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryKnowledgeGraph('Duplicate repository knowledge graph session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: RepositoryKnowledgeGraphSession = {
      sessionId: input.sessionId,
      repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: RepositoryKnowledgeGraphContextInput): RepositoryKnowledgeGraphContext {
    if (!this.registrations.has(input.repositoryKnowledgeGraphId)) {
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph registration not found for context', {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryKnowledgeGraph('Duplicate repository knowledge graph context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateRepositoryKnowledgeGraphGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidRepositoryKnowledgeGraphEntries += 1
      this.validationRejected += 1
      throw RuntimeError.knowledgeGovernance('Repository knowledge graph governance validation failed', {
        contextId: input.contextId,
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    const context: RepositoryKnowledgeGraphContext = {
      contextId: input.contextId,
      repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
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

  get(repositoryKnowledgeGraphId: string): RepositoryKnowledgeGraphRegistration | undefined {
    return this.registrations.get(repositoryKnowledgeGraphId)
  }

  list(): RepositoryKnowledgeGraphRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): RepositoryKnowledgeGraphSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): RepositoryKnowledgeGraphContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidRepositoryKnowledgeGraphCount(): number {
    return this.invalidRepositoryKnowledgeGraphEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'repository-knowledge-graph-registry',
      'Repository Knowledge Graph Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: RepositoryKnowledgeGraphResourceInput): RepositoryKnowledgeGraphResource {
  return {
    repositoryKnowledgeGraphResourceId: input.repositoryKnowledgeGraphResourceId,
    repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
    knowledgeNodes: input.knowledgeNodes.map((node) => ({ ...node })),
    knowledgeEdges: input.knowledgeEdges.map((edge) => ({ ...edge })),
    repositoryKnowledgeRelationships: input.repositoryKnowledgeRelationships.map((relationship) => ({ ...relationship })),
    knowledgeClusters: input.knowledgeClusters.map((cluster) => ({ ...cluster, nodeIds: [...cluster.nodeIds] })),
    knowledgePaths: input.knowledgePaths.map((path) => ({
      ...path,
      nodeIds: [...path.nodeIds],
      edgeIds: [...path.edgeIds],
    })),
    repositoryKnowledgeReferences: input.repositoryKnowledgeReferences.map((reference) => ({ ...reference })),
    knowledgeEvidence: input.knowledgeEvidence.map((evidence) => ({ ...evidence })),
    knowledgeDependencies: input.knowledgeDependencies.map((dependency) => ({ ...dependency })),
    knowledgeClassifications: input.knowledgeClassifications.map((classification) => ({ ...classification })),
    repositoryEntities: input.repositoryEntities.map((entity) => ({ ...entity })),
    repositoryArtifacts: input.repositoryArtifacts.map((artifact) => ({ ...artifact })),
    repositoryComponents: input.repositoryComponents.map((component) => ({ ...component })),
    repositoryModules: input.repositoryModules.map((module) => ({ ...module })),
    repositoryBoundaries: input.repositoryBoundaries.map((boundary) => ({ ...boundary })),
    repositoryCapabilities: input.repositoryCapabilities.map((capability) => ({ ...capability })),
    repositoryConcerns: input.repositoryConcerns.map((concern) => ({ ...concern })),
    repositoryObservations: input.repositoryObservations.map((observation) => ({ ...observation })),
    repositoryFindings: input.repositoryFindings.map((finding) => ({ ...finding })),
    repositoryKnowledgeGraphAudits: input.repositoryKnowledgeGraphAudits.map((audit) => ({ ...audit })),
    metadata: input.metadata,
  }
}

export class RepositoryKnowledgeGraphManager {
  private repositoryKnowledgeGraphConfigurations: Map<string, RepositoryKnowledgeGraphConfiguration> = new Map()
  private diagnostics: RepositoryKnowledgeGraphDiagnostics[] = []
  private lastKnowledgeGraphUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: RepositoryKnowledgeGraphRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerRepositoryKnowledgeGraph(
    input: RepositoryKnowledgeGraphRegistrationInput
  ): RepositoryKnowledgeGraphRegistration {
    return this.registry.register(input)
  }

  startSession(input: RepositoryKnowledgeGraphSessionInput): RepositoryKnowledgeGraphSession {
    return this.registry.createSession(input)
  }

  createContext(input: RepositoryKnowledgeGraphContextInput): RepositoryKnowledgeGraphContext {
    return this.registry.createContext(input)
  }

  createRepositoryKnowledgeGraphConfiguration(
    input: RepositoryKnowledgeGraphConfigurationInput
  ): RepositoryKnowledgeGraphConfiguration {
    if (!this.registry.get(input.repositoryKnowledgeGraphId)) {
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph registration not found for configuration', {
        repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      })
    }

    const configurationValidation = this.validation.validateRepositoryKnowledgeGraphConfiguration(input)
    const governanceValidation = this.validation.validateRepositoryKnowledgeGraphGovernance(input.governance)
    const nodeDiagnostics = input.resourceModel.knowledgeNodes.flatMap((node) =>
      this.validation.validateKnowledgeNode(node).diagnostics
    )
    const relationshipDiagnostics = input.resourceModel.repositoryKnowledgeRelationships.flatMap((relationship) =>
      this.validation.validateKnowledgeRelationship(relationship).diagnostics
    )

    const diagnostics = [
      ...configurationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...nodeDiagnostics,
      ...relationshipDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `repository-knowledge-graph-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!configurationValidation.valid) {
      throw RuntimeError.repositoryKnowledgeGraph('Repository knowledge graph configuration validation failed', {
        repositoryKnowledgeGraphConfigurationId: input.repositoryKnowledgeGraphConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.knowledgeGovernance('Repository knowledge graph governance validation failed', {
        repositoryKnowledgeGraphConfigurationId: input.repositoryKnowledgeGraphConfigurationId,
      })
    }

    if (nodeDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.knowledgeGraph('Knowledge node validation failed', {
        repositoryKnowledgeGraphConfigurationId: input.repositoryKnowledgeGraphConfigurationId,
      })
    }

    if (relationshipDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.knowledgeRelationship('Knowledge relationship validation failed', {
        repositoryKnowledgeGraphConfigurationId: input.repositoryKnowledgeGraphConfigurationId,
      })
    }

    const config: RepositoryKnowledgeGraphConfiguration = {
      repositoryKnowledgeGraphConfigurationId: input.repositoryKnowledgeGraphConfigurationId,
      repositoryKnowledgeGraphId: input.repositoryKnowledgeGraphId,
      repositoryIntelligenceReferences: { ...input.repositoryIntelligenceReferences },
      sourceControlReferences: { ...input.sourceControlReferences },
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

    this.repositoryKnowledgeGraphConfigurations.set(config.repositoryKnowledgeGraphConfigurationId, config)
    this.lastKnowledgeGraphUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getRepositoryKnowledgeGraphConfiguration(
    repositoryKnowledgeGraphConfigurationId: string
  ): RepositoryKnowledgeGraphConfiguration | undefined {
    return this.repositoryKnowledgeGraphConfigurations.get(repositoryKnowledgeGraphConfigurationId)
  }

  listRepositoryKnowledgeGraphConfigurations(): RepositoryKnowledgeGraphConfiguration[] {
    return Array.from(this.repositoryKnowledgeGraphConfigurations.values())
  }

  getHealth(): RepositoryKnowledgeGraphRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listRepositoryKnowledgeGraphConfigurations()
    const knowledgeNodesTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.knowledgeNodes.length,
      0
    )
    const knowledgeEdgesTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.knowledgeEdges.length,
      0
    )
    const repositoryKnowledgeRelationshipsTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.repositoryKnowledgeRelationships.length,
      0
    )

    return {
      repositoryKnowledgeGraphHealth: {
        status: this.registry.getInvalidRepositoryKnowledgeGraphCount() > 0 ? 'degraded' : 'healthy',
        registeredRepositoryKnowledgeGraphEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidRepositoryKnowledgeGraphEntries: this.registry.getInvalidRepositoryKnowledgeGraphCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      knowledgeGraphHealth: {
        status: knowledgeNodesTracked > 0 ? 'healthy' : 'degraded',
        repositoryKnowledgeGraphConfigurationsTracked: configurations.length,
        knowledgeNodesTracked,
        knowledgeEdgesTracked,
        repositoryKnowledgeRelationshipsTracked,
        lastKnowledgeGraphUpdatedAt: this.lastKnowledgeGraphUpdatedAt,
      },
      knowledgeValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
