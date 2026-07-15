import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type RepositoryIntelligenceConfigurationInput,
  type RepositoryIntelligenceContextInput,
  type RepositoryIntelligenceLifecycleStage,
  type RepositoryIntelligenceRegistrationInput,
  type RepositoryIntelligenceResourceInput,
  type RepositoryIntelligenceSessionInput,
  type RepositoryIntelligenceStateInput,
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

export interface RepositoryIntelligenceMetadata {
  repositoryIntelligenceId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceSession {
  sessionId: string
  repositoryIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface RepositoryIntelligenceProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface RepositoryIntelligenceFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface RepositoryIntelligenceGovernance {
  ownership: RepositoryIntelligenceOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: RepositoryIntelligenceProvenance
  freshness: RepositoryIntelligenceFreshness
}

export interface RepositoryIntelligenceContext {
  contextId: string
  repositoryIntelligenceId: string
  sessionId?: string
  governance: RepositoryIntelligenceGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryProfile {
  repositoryProfileId: string
  name: string
  primaryLanguage?: string
  category: string
  metadata?: Metadata
}

export interface RepositoryTopology {
  repositoryTopologyId: string
  repositoryProfileId: string
  moduleIds: string[]
  structureType: 'monolith' | 'modular' | 'monorepo' | 'microservices' | 'other'
  metadata?: Metadata
}

export interface RepositoryMetrics {
  repositoryMetricsId: string
  repositoryProfileId: string
  fileCount: number
  lineCount: number
  contributorCount: number
  metadata?: Metadata
}

export interface RepositoryHealth {
  repositoryHealthId: string
  repositoryProfileId: string
  status: 'healthy' | 'degraded' | 'at-risk' | 'critical' | 'unknown'
  score: number
  metadata?: Metadata
}

export interface RepositoryQuality {
  repositoryQualityId: string
  repositoryProfileId: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  metadata?: Metadata
}

export interface RepositoryDependencyGraph {
  repositoryDependencyGraphId: string
  repositoryProfileId: string
  nodes: Array<{
    nodeId: string
    name: string
    metadata?: Metadata
  }>
  edges: Array<{
    edgeId: string
    fromNodeId: string
    toNodeId: string
    relation: 'depends-on' | 'imports' | 'extends' | 'other'
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface RepositoryKnowledgeMap {
  repositoryKnowledgeMapId: string
  repositoryProfileId: string
  knowledgeAreaIds: string[]
  metadata?: Metadata
}

export interface RepositoryRiskProfile {
  repositoryRiskProfileId: string
  repositoryProfileId: string
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskFactors: string[]
  metadata?: Metadata
}

export interface RepositoryEvolution {
  repositoryEvolutionId: string
  repositoryProfileId: string
  trend: 'growing' | 'stable' | 'declining' | 'unknown'
  observedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export type RepositoryIntelligenceState = RepositoryIntelligenceStateInput

export interface RepositoryAnalysisPlan {
  repositoryAnalysisPlanId: string
  repositoryProfileId: string
  objective: string
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface ArchitectureAnalysis {
  architectureAnalysisId: string
  repositoryAnalysisPlanId: string
  patternIds: string[]
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface DependencyAnalysis {
  dependencyAnalysisId: string
  repositoryAnalysisPlanId: string
  dependencyGraphId?: string
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface QualityAnalysis {
  qualityAnalysisId: string
  repositoryAnalysisPlanId: string
  qualityId?: string
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface ComplexityAnalysis {
  complexityAnalysisId: string
  repositoryAnalysisPlanId: string
  complexityScore: number
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface TechnicalDebtAnalysis {
  technicalDebtAnalysisId: string
  repositoryAnalysisPlanId: string
  debtScore: number
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface ChangeAnalysis {
  changeAnalysisId: string
  repositoryAnalysisPlanId: string
  changeFrequency: number
  state: RepositoryIntelligenceState
  metadata?: Metadata
}

export interface RepositoryInsight {
  repositoryInsightId: string
  repositoryAnalysisPlanId: string
  category: 'architecture' | 'quality' | 'dependency' | 'risk' | 'evolution' | 'other'
  description: string
  metadata?: Metadata
}

export interface RepositoryRecommendation {
  repositoryRecommendationId: string
  repositoryAnalysisPlanId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceAudit {
  repositoryIntelligenceAuditId: string
  repositoryAnalysisPlanId: string
  summary: string
  recordedAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceResource {
  repositoryIntelligenceResourceId: string
  repositoryIntelligenceId: string
  repositoryAnalysisPlans: RepositoryAnalysisPlan[]
  architectureAnalyses: ArchitectureAnalysis[]
  dependencyAnalyses: DependencyAnalysis[]
  qualityAnalyses: QualityAnalysis[]
  complexityAnalyses: ComplexityAnalysis[]
  technicalDebtAnalyses: TechnicalDebtAnalysis[]
  changeAnalyses: ChangeAnalysis[]
  repositoryInsights: RepositoryInsight[]
  repositoryRecommendations: RepositoryRecommendation[]
  repositoryIntelligenceAudits: RepositoryIntelligenceAudit[]
  metadata?: Metadata
}

export interface RepositoryIntelligenceConfiguration {
  repositoryIntelligenceConfigurationId: string
  repositoryIntelligenceId: string
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
  repositoryProfiles: RepositoryProfile[]
  repositoryTopologies: RepositoryTopology[]
  repositoryMetrics: RepositoryMetrics[]
  repositoryHealths: RepositoryHealth[]
  repositoryQualities: RepositoryQuality[]
  repositoryDependencyGraphs: RepositoryDependencyGraph[]
  repositoryKnowledgeMaps: RepositoryKnowledgeMap[]
  repositoryRiskProfiles: RepositoryRiskProfile[]
  repositoryEvolutions: RepositoryEvolution[]
  governance: RepositoryIntelligenceGovernance
  resourceModel: RepositoryIntelligenceResource
  summary: RepositoryIntelligenceSummary
  metadata?: Metadata
}

export interface RepositoryIntelligenceRegisteredState {
  state: 'registered'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceIndexedState {
  state: 'indexed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceAnalysedState {
  state: 'analysed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceAssessedState {
  state: 'assessed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceClassifiedState {
  state: 'classified'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceReviewedState {
  state: 'reviewed'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceApprovedState {
  state: 'approved'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligencePublishedState {
  state: 'published'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceArchivedState {
  state: 'archived'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceDeprecatedState {
  state: 'deprecated'
  enteredAt: IsoDateTime
  metadata?: Metadata
}

export type RepositoryIntelligenceLifecycleStateModel =
  | RepositoryIntelligenceRegisteredState
  | RepositoryIntelligenceIndexedState
  | RepositoryIntelligenceAnalysedState
  | RepositoryIntelligenceAssessedState
  | RepositoryIntelligenceClassifiedState
  | RepositoryIntelligenceReviewedState
  | RepositoryIntelligenceApprovedState
  | RepositoryIntelligencePublishedState
  | RepositoryIntelligenceArchivedState
  | RepositoryIntelligenceDeprecatedState

export interface RepositoryIntelligenceLifecycleState {
  stage: RepositoryIntelligenceLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface RepositoryIntelligenceRegistration extends RepositoryIntelligenceRegistrationInput {
  metadataModel: RepositoryIntelligenceMetadata
  registeredAt: IsoDateTime
}

export interface RepositoryIntelligenceRuntimeHealth {
  repositoryIntelligenceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredRepositoryIntelligenceEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidRepositoryIntelligenceEntries: number
    lastUpdatedAt: IsoDateTime
  }
  repositoryAnalysisHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    repositoryIntelligenceConfigurationsTracked: number
    repositoryAnalysisPlansTracked: number
    architectureAnalysesTracked: number
    repositoryInsightsTracked: number
    lastRepositoryAnalysisUpdatedAt?: IsoDateTime
  }
  repositoryValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class RepositoryIntelligenceRegistry {
  private registrations: Map<string, RepositoryIntelligenceRegistration> = new Map()
  private sessions: Map<string, RepositoryIntelligenceSession> = new Map()
  private contexts: Map<string, RepositoryIntelligenceContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidRepositoryIntelligenceEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: RepositoryIntelligenceRegistrationInput): RepositoryIntelligenceRegistration {
    const validationResult = this.validation.validateRepositoryIntelligence(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.repositoryIntelligenceId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryIntelligence('Duplicate repository intelligence ID detected', {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    if (!validationResult.valid) {
      this.invalidRepositoryIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryIntelligence('Repository intelligence registration validation failed', {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    const registration: RepositoryIntelligenceRegistration = {
      ...input,
      metadataModel: {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.repositoryIntelligenceId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: RepositoryIntelligenceSessionInput): RepositoryIntelligenceSession {
    if (!this.registrations.has(input.repositoryIntelligenceId)) {
      throw RuntimeError.repositoryIntelligence('Repository intelligence registration not found', {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryIntelligence('Duplicate repository intelligence session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: RepositoryIntelligenceSession = {
      sessionId: input.sessionId,
      repositoryIntelligenceId: input.repositoryIntelligenceId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: RepositoryIntelligenceContextInput): RepositoryIntelligenceContext {
    if (!this.registrations.has(input.repositoryIntelligenceId)) {
      throw RuntimeError.repositoryIntelligence('Repository intelligence registration not found for context', {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.repositoryIntelligence('Repository intelligence session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryIntelligence('Duplicate repository intelligence context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateRepositoryIntelligenceGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidRepositoryIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.repositoryGovernance('Repository intelligence governance validation failed', {
        contextId: input.contextId,
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    const context: RepositoryIntelligenceContext = {
      contextId: input.contextId,
      repositoryIntelligenceId: input.repositoryIntelligenceId,
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

  get(repositoryIntelligenceId: string): RepositoryIntelligenceRegistration | undefined {
    return this.registrations.get(repositoryIntelligenceId)
  }

  list(): RepositoryIntelligenceRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): RepositoryIntelligenceSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): RepositoryIntelligenceContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidRepositoryIntelligenceCount(): number {
    return this.invalidRepositoryIntelligenceEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'repository-intelligence-registry',
      'Repository Intelligence Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

function mapResource(input: RepositoryIntelligenceResourceInput): RepositoryIntelligenceResource {
  return {
    repositoryIntelligenceResourceId: input.repositoryIntelligenceResourceId,
    repositoryIntelligenceId: input.repositoryIntelligenceId,
    repositoryAnalysisPlans: input.repositoryAnalysisPlans.map((plan) => ({ ...plan })),
    architectureAnalyses: input.architectureAnalyses.map((analysis) => ({ ...analysis, patternIds: [...analysis.patternIds] })),
    dependencyAnalyses: input.dependencyAnalyses.map((analysis) => ({ ...analysis })),
    qualityAnalyses: input.qualityAnalyses.map((analysis) => ({ ...analysis })),
    complexityAnalyses: input.complexityAnalyses.map((analysis) => ({ ...analysis })),
    technicalDebtAnalyses: input.technicalDebtAnalyses.map((analysis) => ({ ...analysis })),
    changeAnalyses: input.changeAnalyses.map((analysis) => ({ ...analysis })),
    repositoryInsights: input.repositoryInsights.map((insight) => ({ ...insight })),
    repositoryRecommendations: input.repositoryRecommendations.map((recommendation) => ({ ...recommendation })),
    repositoryIntelligenceAudits: input.repositoryIntelligenceAudits.map((audit) => ({ ...audit })),
    metadata: input.metadata,
  }
}

export class RepositoryIntelligenceManager {
  private repositoryIntelligenceConfigurations: Map<string, RepositoryIntelligenceConfiguration> = new Map()
  private diagnostics: RepositoryIntelligenceDiagnostics[] = []
  private lastRepositoryAnalysisUpdatedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: RepositoryIntelligenceRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerRepositoryIntelligence(input: RepositoryIntelligenceRegistrationInput): RepositoryIntelligenceRegistration {
    return this.registry.register(input)
  }

  startSession(input: RepositoryIntelligenceSessionInput): RepositoryIntelligenceSession {
    return this.registry.createSession(input)
  }

  createContext(input: RepositoryIntelligenceContextInput): RepositoryIntelligenceContext {
    return this.registry.createContext(input)
  }

  createRepositoryIntelligenceConfiguration(
    input: RepositoryIntelligenceConfigurationInput
  ): RepositoryIntelligenceConfiguration {
    if (!this.registry.get(input.repositoryIntelligenceId)) {
      throw RuntimeError.repositoryIntelligence('Repository intelligence registration not found for configuration', {
        repositoryIntelligenceId: input.repositoryIntelligenceId,
      })
    }

    const configurationValidation = this.validation.validateRepositoryIntelligenceConfiguration(input)
    const governanceValidation = this.validation.validateRepositoryIntelligenceGovernance(input.governance)
    const resourceValidation = this.validation.validateRepositoryIntelligenceResource(input.resourceModel)
    const lifecycleDiagnostics = input.resourceModel.repositoryAnalysisPlans.flatMap((plan) =>
      this.validation.validateRepositoryIntelligenceLifecycle(plan.state).diagnostics
    )
    const analysisPlanDiagnostics = input.resourceModel.repositoryAnalysisPlans.flatMap((plan) =>
      this.validation.validateRepositoryAnalysisPlan(plan).diagnostics
    )
    const architectureAnalysisDiagnostics = input.resourceModel.architectureAnalyses.flatMap((analysis) =>
      this.validation.validateArchitectureAnalysis(analysis).diagnostics
    )

    const diagnostics = [
      ...configurationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...resourceValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...analysisPlanDiagnostics,
      ...architectureAnalysisDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `repository-intelligence-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    if (!configurationValidation.valid) {
      throw RuntimeError.repositoryIntelligence('Repository intelligence configuration validation failed', {
        repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      })
    }

    if (!governanceValidation.valid) {
      throw RuntimeError.repositoryGovernance('Repository intelligence governance validation failed', {
        repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      })
    }

    if (!resourceValidation.valid) {
      throw RuntimeError.repositoryResource('Repository intelligence resource validation failed', {
        repositoryIntelligenceResourceId: input.resourceModel.repositoryIntelligenceResourceId,
      })
    }

    if (lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.repositoryLifecycle('Repository intelligence lifecycle validation failed', {
        repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      })
    }

    if (analysisPlanDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.repositoryAnalysis('Repository analysis plan validation failed', {
        repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      })
    }

    if (architectureAnalysisDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw RuntimeError.repositoryAnalysis('Architecture analysis validation failed', {
        repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      })
    }

    const config: RepositoryIntelligenceConfiguration = {
      repositoryIntelligenceConfigurationId: input.repositoryIntelligenceConfigurationId,
      repositoryIntelligenceId: input.repositoryIntelligenceId,
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
      repositoryProfiles: input.repositoryProfiles.map((profile) => ({ ...profile })),
      repositoryTopologies: input.repositoryTopologies.map((topology) => ({
        ...topology,
        moduleIds: [...topology.moduleIds],
      })),
      repositoryMetrics: input.repositoryMetrics.map((metrics) => ({ ...metrics })),
      repositoryHealths: input.repositoryHealths.map((health) => ({ ...health })),
      repositoryQualities: input.repositoryQualities.map((quality) => ({ ...quality })),
      repositoryDependencyGraphs: input.repositoryDependencyGraphs.map((graph) => ({
        ...graph,
        nodes: graph.nodes.map((node) => ({ ...node })),
        edges: graph.edges.map((edge) => ({ ...edge })),
      })),
      repositoryKnowledgeMaps: input.repositoryKnowledgeMaps.map((map) => ({
        ...map,
        knowledgeAreaIds: [...map.knowledgeAreaIds],
      })),
      repositoryRiskProfiles: input.repositoryRiskProfiles.map((profile) => ({
        ...profile,
        riskFactors: [...profile.riskFactors],
      })),
      repositoryEvolutions: input.repositoryEvolutions.map((evolution) => ({ ...evolution })),
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

    this.repositoryIntelligenceConfigurations.set(config.repositoryIntelligenceConfigurationId, config)
    this.lastRepositoryAnalysisUpdatedAt = now()
    this.lastUpdatedAt = now()
    return config
  }

  getRepositoryIntelligenceConfiguration(
    repositoryIntelligenceConfigurationId: string
  ): RepositoryIntelligenceConfiguration | undefined {
    return this.repositoryIntelligenceConfigurations.get(repositoryIntelligenceConfigurationId)
  }

  listRepositoryIntelligenceConfigurations(): RepositoryIntelligenceConfiguration[] {
    return Array.from(this.repositoryIntelligenceConfigurations.values())
  }

  getHealth(): RepositoryIntelligenceRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const configurations = this.listRepositoryIntelligenceConfigurations()
    const repositoryAnalysisPlansTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.repositoryAnalysisPlans.length,
      0
    )
    const architectureAnalysesTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.architectureAnalyses.length,
      0
    )
    const repositoryInsightsTracked = configurations.reduce(
      (count, config) => count + config.resourceModel.repositoryInsights.length,
      0
    )

    return {
      repositoryIntelligenceHealth: {
        status: this.registry.getInvalidRepositoryIntelligenceCount() > 0 ? 'degraded' : 'healthy',
        registeredRepositoryIntelligenceEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidRepositoryIntelligenceEntries: this.registry.getInvalidRepositoryIntelligenceCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      repositoryAnalysisHealth: {
        status: repositoryAnalysisPlansTracked > 0 ? 'healthy' : 'degraded',
        repositoryIntelligenceConfigurationsTracked: configurations.length,
        repositoryAnalysisPlansTracked,
        architectureAnalysesTracked,
        repositoryInsightsTracked,
        lastRepositoryAnalysisUpdatedAt: this.lastRepositoryAnalysisUpdatedAt,
      },
      repositoryValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
