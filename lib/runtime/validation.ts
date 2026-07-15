import type { IsoDateTime, Metadata, Severity } from '@/lib/ai-framework/types/base'
import type { ServiceLifetime } from './di'

export type RegistrationScope =
  | 'service'
  | 'provider'
  | 'adapter'
  | 'skill'
  | 'memory'
  | 'knowledge'
  | 'reasoning'
  | 'workflow'
  | 'team'
  | 'prompt'
  | 'execution'
  | 'registry'
  | 'resolution'
  | 'selection'
  | 'quality'
  | 'readiness'
  | 'certification'
  | 'strategic'
  | 'tactical'
  | 'decision'
  | 'action'
  | 'execution-readiness'
  | 'autonomous-workflow'
  | 'autonomous-task'
  | 'autonomous-agent'
  | 'autonomous-project'
  | 'autonomous-workspace'
  | 'autonomous-recovery'
  | 'desktop-integration'
  | 'ide-integration'
  | 'terminal-integration'
  | 'browser-integration'
  | 'git-integration'
  | 'source-control'
  | 'repository-intelligence'
  | 'repository-knowledge-graph'

export const MEMORY_CLASSIFICATIONS = [
  'company',
  'platform',
  'product',
  'domain',
  'project',
  'sprint',
  'session',
  'user',
  'temporary-working',
] as const

export type MemoryClassification = (typeof MEMORY_CLASSIFICATIONS)[number]

export const MEMORY_LIFECYCLE_STATES = [
  'uninitialized',
  'created',
  'registered',
  'loaded',
  'active',
  'suspended',
  'archived',
  'disposed',
] as const

export type MemoryLifecycleState = (typeof MEMORY_LIFECYCLE_STATES)[number]

export const KNOWLEDGE_DOMAINS = [
  'company-identity',
  'mission',
  'vision',
  'values',
  'products',
  'services',
  'customers',
  'personas',
  'competitors',
  'pricing',
  'marketing',
  'sales',
  'operations',
  'finance',
  'policies',
  'constraints',
  'strategic-objectives',
  'kpis',
  'documents',
  'assets',
  'historical-decisions',
] as const

export type KnowledgeDomain = (typeof KNOWLEDGE_DOMAINS)[number]

export const KNOWLEDGE_RELATIONSHIP_TYPES = [
  'parent',
  'child',
  'dependency',
  'reference',
  'traceability',
  'decision',
  'domain',
] as const

export type KnowledgeRelationshipType = (typeof KNOWLEDGE_RELATIONSHIP_TYPES)[number]

export const KNOWLEDGE_LIFECYCLE_STATUSES = [
  'draft',
  'review',
  'approved',
  'active',
  'archived',
  'retired',
] as const

export type KnowledgeLifecycleStatus = (typeof KNOWLEDGE_LIFECYCLE_STATUSES)[number]

export const REASONING_PIPELINE_STAGES = [
  'planning-gate',
  'strategic-planning',
  'strategic-reasoning',
  'tactical-planning',
  'generation-brief-lock',
  'generation',
  'validation',
  'repair',
  'approval',
] as const

export type ReasoningPipelineStage = (typeof REASONING_PIPELINE_STAGES)[number]
export type ReasoningPipelineStatus = ReasoningPipelineStage

export const REASONING_ARTIFACT_TYPES = [
  'intent',
  'objectives',
  'constraints',
  'assumptions',
  'context-package',
  'evidence-package',
  'decision-package',
  'validation-package',
  'approval-package',
] as const

export type ReasoningArtifactType = (typeof REASONING_ARTIFACT_TYPES)[number]

export const REASONING_ENGINE_STAGES = [
  'planning',
  'analysis',
  'synthesis',
  'evaluation',
  'validation',
  'review',
  'approval',
  'completion',
] as const

export type ReasoningEngineStage = (typeof REASONING_ENGINE_STAGES)[number]

export const STRATEGIC_THINKING_STAGES = [
  'situation-assessment',
  'goal-definition',
  'constraint-analysis',
  'opportunity-analysis',
  'risk-analysis',
  'option-evaluation',
  'recommendation',
  'strategic-approval',
] as const

export type StrategicThinkingStage = (typeof STRATEGIC_THINKING_STAGES)[number]

export const TACTICAL_PLANNING_STAGES = [
  'strategy-translation',
  'task-decomposition',
  'dependency-analysis',
  'resource-allocation',
  'schedule-planning',
  'risk-mitigation',
  'plan-validation',
  'tactical-approval',
] as const

export type TacticalPlanningStage = (typeof TACTICAL_PLANNING_STAGES)[number]

export const DECISION_LIFECYCLE_STAGES = [
  'decision-identification',
  'option-analysis',
  'tradeoff-analysis',
  'risk-assessment',
  'impact-assessment',
  'recommendation',
  'approval',
  'decision-complete',
] as const

export type DecisionLifecycleStage = (typeof DECISION_LIFECYCLE_STAGES)[number]

export const ACTION_LIFECYCLE_STAGES = [
  'action-planning',
  'action-sequencing',
  'dependency-resolution',
  'assignment',
  'readiness-review',
  'approval',
  'action-ready',
  'action-complete',
] as const

export type ActionLifecycleStage = (typeof ACTION_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_WORKFLOW_LIFECYCLE_STAGES = [
  'workflow-created',
  'workflow-planned',
  'workflow-ready',
  'workflow-running',
  'workflow-waiting',
  'workflow-paused',
  'workflow-resumed',
  'workflow-completed',
  'workflow-cancelled',
  'workflow-failed',
] as const

export type AutonomousWorkflowLifecycleStage = (typeof AUTONOMOUS_WORKFLOW_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_TASK_LIFECYCLE_STAGES = [
  'task-created',
  'task-planned',
  'task-ready',
  'task-assigned',
  'task-waiting',
  'task-running',
  'task-paused',
  'task-completed',
  'task-failed',
  'task-cancelled',
] as const

export type AutonomousTaskLifecycleStage = (typeof AUTONOMOUS_TASK_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_AGENT_LIFECYCLE_STAGES = [
  'agent-registered',
  'agent-available',
  'agent-assigned',
  'agent-working',
  'agent-waiting',
  'agent-reviewing',
  'agent-completed',
  'agent-suspended',
  'agent-failed',
  'agent-retired',
] as const

export type AutonomousAgentLifecycleStage = (typeof AUTONOMOUS_AGENT_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_PROJECT_LIFECYCLE_STAGES = [
  'project-created',
  'project-planned',
  'project-coordinating',
  'project-ready',
  'project-running',
  'project-reviewing',
  'project-completed',
  'project-blocked',
  'project-failed',
  'project-cancelled',
] as const

export type AutonomousProjectLifecycleStage = (typeof AUTONOMOUS_PROJECT_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_WORKSPACE_LIFECYCLE_STAGES = [
  'workspace-created',
  'workspace-configured',
  'workspace-ready',
  'workspace-active',
  'workspace-suspended',
  'workspace-restored',
  'workspace-archived',
  'workspace-closed',
  'workspace-failed',
  'workspace-recovered',
] as const

export type AutonomousWorkspaceLifecycleStage = (typeof AUTONOMOUS_WORKSPACE_LIFECYCLE_STAGES)[number]

export const AUTONOMOUS_RECOVERY_LIFECYCLE_STAGES = [
  'recovery-detected',
  'recovery-planned',
  'recovery-prepared',
  'recovery-ready',
  'recovery-in-progress',
  'recovery-validated',
  'recovery-completed',
  'recovery-failed',
  'recovery-cancelled',
  'recovery-archived',
] as const

export type AutonomousRecoveryLifecycleStage = (typeof AUTONOMOUS_RECOVERY_LIFECYCLE_STAGES)[number]

export const DESKTOP_INTEGRATION_LIFECYCLE_STAGES = [
  'desktop-registered',
  'desktop-available',
  'desktop-prepared',
  'desktop-ready',
  'desktop-connected',
  'desktop-suspended',
  'desktop-disconnected',
  'desktop-recovered',
  'desktop-failed',
  'desktop-archived',
] as const

export type DesktopIntegrationLifecycleStage = (typeof DESKTOP_INTEGRATION_LIFECYCLE_STAGES)[number]

export const IDE_INTEGRATION_LIFECYCLE_STAGES = [
  'ide-registered',
  'ide-available',
  'ide-prepared',
  'ide-ready',
  'ide-connected',
  'ide-suspended',
  'ide-disconnected',
  'ide-recovered',
  'ide-failed',
  'ide-archived',
] as const

export type IDEIntegrationLifecycleStage = (typeof IDE_INTEGRATION_LIFECYCLE_STAGES)[number]

export const TERMINAL_INTEGRATION_LIFECYCLE_STAGES = [
  'terminal-registered',
  'terminal-available',
  'terminal-prepared',
  'terminal-ready',
  'terminal-connected',
  'terminal-busy',
  'terminal-waiting',
  'terminal-suspended',
  'terminal-failed',
  'terminal-archived',
] as const

export type TerminalIntegrationLifecycleStage = (typeof TERMINAL_INTEGRATION_LIFECYCLE_STAGES)[number]

export const BROWSER_INTEGRATION_LIFECYCLE_STAGES = [
  'browser-registered',
  'browser-available',
  'browser-prepared',
  'browser-ready',
  'browser-connected',
  'browser-active',
  'browser-suspended',
  'browser-disconnected',
  'browser-failed',
  'browser-archived',
] as const

export type BrowserIntegrationLifecycleStage = (typeof BROWSER_INTEGRATION_LIFECYCLE_STAGES)[number]

export const GIT_INTEGRATION_LIFECYCLE_STAGES = [
  'repository-registered',
  'repository-available',
  'repository-prepared',
  'repository-ready',
  'repository-active',
  'repository-sync-pending',
  'repository-suspended',
  'repository-archived',
  'repository-failed',
  'repository-recovered',
] as const

export type GitIntegrationLifecycleStage = (typeof GIT_INTEGRATION_LIFECYCLE_STAGES)[number]

export const SOURCE_CONTROL_LIFECYCLE_STAGES = [
  'planned',
  'prepared',
  'ready',
  'pending',
  'active',
  'waiting',
  'suspended',
  'completed',
  'failed',
  'archived',
] as const

export type SourceControlLifecycleStage = (typeof SOURCE_CONTROL_LIFECYCLE_STAGES)[number]

export const REPOSITORY_INTELLIGENCE_LIFECYCLE_STAGES = [
  'registered',
  'indexed',
  'analysed',
  'assessed',
  'classified',
  'reviewed',
  'approved',
  'published',
  'archived',
  'deprecated',
] as const

export type RepositoryIntelligenceLifecycleStage = (typeof REPOSITORY_INTELLIGENCE_LIFECYCLE_STAGES)[number]

export const REPOSITORY_KNOWLEDGE_GRAPH_LIFECYCLE_STAGES = [
  'created',
  'discovered',
  'classified',
  'linked',
  'reviewed',
  'validated',
  'approved',
  'published',
  'archived',
  'deprecated',
] as const

export type RepositoryKnowledgeGraphLifecycleStage = (typeof REPOSITORY_KNOWLEDGE_GRAPH_LIFECYCLE_STAGES)[number]

export const WORKFLOW_STATES = [
  'draft',
  'registered',
  'ready',
  'running',
  'waiting',
  'suspended',
  'completed',
  'failed',
  'cancelled',
  'archived',
] as const

export type WorkflowState = (typeof WORKFLOW_STATES)[number]

export const WORKFLOW_ARTIFACT_TYPES = [
  'inputs',
  'outputs',
  'context',
  'evidence',
  'decisions',
  'validation-results',
  'approval-records',
] as const

export type WorkflowArtifactType = (typeof WORKFLOW_ARTIFACT_TYPES)[number]

export interface RegistrationDiagnostic {
  scope: RegistrationScope
  code: string
  message: string
  severity: Severity
  entityId?: string
  createdAt: IsoDateTime
  details?: Metadata
}

export interface RegistrationValidationResult {
  valid: boolean
  diagnostics: RegistrationDiagnostic[]
}

export interface ServiceRegistrationInput {
  serviceId: string
  name: string
  interface: string
  implementation: string
  version: string
  lifetime: ServiceLifetime
  dependencies: string[]
  metadata?: Metadata
  scope: 'framework' | 'product'
}

export interface ProviderRegistrationInput {
  providerId: string
  name: string
  type: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
  version: string
  contractVersion: string
  capabilities: Array<{
    capabilityId: string
    name: string
    supported: boolean
    metadata?: Metadata
  }>
  dependencies: string[]
  metadata?: Metadata
}

export const PROVIDER_RUNTIME_LIFECYCLE_STATES = [
  'registered',
  'configured',
  'validated',
  'initialized',
  'ready',
  'suspended',
  'shutdown',
  'disposed',
] as const

export type ProviderRuntimeLifecycleState = (typeof PROVIDER_RUNTIME_LIFECYCLE_STATES)[number]

export const ADAPTER_LIFECYCLE_STATES = [
  'registered',
  'validated',
  'initialized',
  'active',
  'suspended',
  'inactive',
  'disposed',
] as const

export type AdapterLifecycleState = (typeof ADAPTER_LIFECYCLE_STATES)[number]

export interface ProviderAdapterCapabilityInput {
  capabilityId: string
  name: string
  supported: boolean
  minVersion?: string
  features: string[]
  metadata?: Metadata
}

export interface ProviderAdapterRegistrationInput {
  adapterId: string
  providerId: string
  name: string
  type: 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
  version: string
  contractVersion: string
  supportedModels: string[]
  capabilities: ProviderAdapterCapabilityInput[]
  dependencies: string[]
  timeoutPolicy: {
    requestTimeoutMs: number
    connectTimeoutMs: number
  }
  retryPolicy: {
    maxAttempts: number
    backoffMs: number
    retryableStatusCodes: number[]
  }
  costMetadata: {
    currency: string
    unit: string
    inputCostPerUnit: number
    outputCostPerUnit: number
  }
  availabilityMetadata: {
    region: string
    status: 'available' | 'degraded' | 'unavailable' | 'maintenance'
    priority: number
  }
  metadata?: Metadata
}

export interface ProviderAdapterConfigurationInput {
  adapterId: string
  adapterVersion: string
  supportedModels: string[]
  capabilityMatrix: ProviderAdapterCapabilityInput[]
  timeoutPolicy: {
    requestTimeoutMs: number
    connectTimeoutMs: number
  }
  retryPolicy: {
    maxAttempts: number
    backoffMs: number
    retryableStatusCodes: number[]
  }
  costMetadata: {
    currency: string
    unit: string
    inputCostPerUnit: number
    outputCostPerUnit: number
  }
  availabilityMetadata: {
    region: string
    status: 'available' | 'degraded' | 'unavailable' | 'maintenance'
    priority: number
  }
  metadata?: Metadata
}

export interface ProviderConfigurationInput {
  providerId: string
  providerVersion: string
  supportedModels: string[]
  capabilityDeclaration: Array<{
    capabilityId: string
    name: string
    supported: boolean
    metadata?: Metadata
  }>
  rateLimits: {
    requestsPerMinute: number
    burstLimit: number
  }
  timeout: {
    requestTimeoutMs: number
    connectTimeoutMs: number
  }
  retry: {
    maxAttempts: number
    backoffMs: number
    retryableStatusCodes: number[]
  }
  cost: {
    currency: string
    unit: string
    inputCostPerUnit: number
    outputCostPerUnit: number
  }
  availability: {
    region: string
    status: 'available' | 'degraded' | 'unavailable' | 'maintenance'
    priority: number
  }
  metadata?: Metadata
}

export const AI_SPECIALIST_ROLES = [
  'architect',
  'planner',
  'researcher',
  'engineer',
  'reviewer',
  'tester',
  'security',
  'documentation',
  'ux',
  'product',
  'business',
  'custom',
] as const

export type AISpecialistRole = (typeof AI_SPECIALIST_ROLES)[number]

export interface AITeamGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  responsibilities: string[]
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  version: string
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
}

export interface AISpecialistRegistrationInput {
  specialistId: string
  name: string
  role: AISpecialistRole
  capabilities: string[]
  responsibilities: string[]
  metadata?: Metadata
}

export interface AITeamRegistrationInput {
  teamId: string
  name: string
  version: string
  contractVersion: string
  specialistIds: string[]
  capabilities: string[]
  responsibilities: string[]
  governance: AITeamGovernanceInput
  metadata?: Metadata
}

export interface AITeamAssignmentInput {
  assignmentId: string
  teamId: string
  workItemId: string
  title: string
  description: string
  ownerSpecialistId: string
  assignedTo: string
  assignedBy: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  status: 'proposed' | 'assigned' | 'in-progress' | 'review' | 'blocked' | 'completed' | 'cancelled'
  reviewChain: string[]
  approvalChain: string[]
  metadata?: Metadata
}

export const PROMPT_CLASSIFICATIONS = [
  'general',
  'planning',
  'analysis',
  'generation',
  'validation',
  'governance',
  'system',
] as const

export type PromptClassification = (typeof PROMPT_CLASSIFICATIONS)[number]

export interface PromptGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  version: string
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  classification: PromptClassification
}

export interface PromptMetadataInput {
  promptId: string
  name: string
  version: string
  contractVersion: string
  classification: PromptClassification
  tags: string[]
  governance: PromptGovernanceInput
  createdAt: string
  updatedAt?: string
  metadata?: Metadata
}

export interface PromptRegistrationInput {
  promptId: string
  name: string
  version: string
  contractVersion: string
  tags: string[]
  governance: PromptGovernanceInput
  metadata?: Metadata
}

export interface PromptTemplateRegistrationInput {
  templateId: string
  name: string
  version: string
  classification: PromptClassification
  systemInstructions: string[]
  developerInstructions: string[]
  userInstructions: string[]
  constraints: string[]
  objectives: string[]
  validationRequirements: string[]
  metadata?: Metadata
}

export interface PromptContextSectionInput {
  sectionId: string
  source:
    | 'runtime-context'
    | 'memory-context'
    | 'business-brain-context'
    | 'workflow-context'
    | 'reasoning-context'
    | 'ai-team-context'
    | 'provider-context'
    | 'user-context'
    | 'tenant-context'
  title: string
  priority: number
  content: Metadata
  metadata?: Metadata
}

export interface PromptContextPackageInput {
  promptId: string
  sections: PromptContextSectionInput[]
  runtimeContext: Metadata
  memoryContext: Metadata
  businessBrainContext: Metadata
  workflowContext: Metadata
  reasoningContext: Metadata
  aiTeamContext: Metadata
  providerContext: Metadata
  userContext: Metadata
  tenantContext: Metadata
}

export interface PromptPackageInput {
  promptId: string
  systemInstructions: string[]
  developerInstructions: string[]
  userInstructions: string[]
  contextSections: PromptContextSectionInput[]
  constraints: string[]
  objectives: string[]
  evidence: string[]
  references: string[]
  expectedOutputSpecification: string[]
  validationRequirements: string[]
  metadata?: Metadata
}

export const EXECUTION_PIPELINE_STATES = [
  'request-accepted',
  'context-prepared',
  'memory-ready',
  'business-brain-ready',
  'prompt-ready',
  'provider-selected',
  'awaiting-execution',
  'executing',
  'awaiting-validation',
  'validated',
  'awaiting-approval',
  'completed',
  'failed',
  'cancelled',
] as const

export type ExecutionPipelineState = (typeof EXECUTION_PIPELINE_STATES)[number]

export interface ExecutionGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  version: string
  audit: {
    createdBy: string
    createdAt: string
    updatedAt?: string
  }
}

export interface ExecutionStageInput {
  stageId: string
  state: ExecutionPipelineState
  order: number
  dependencies: ExecutionPipelineState[]
  description?: string
  metadata?: Metadata
}

export interface ExecutionWorkPackageInput {
  workPackageId: string
  assignedAITeamId: string
  assignedSpecialistId: string
  promptPackageId: string
  contextPackageId: string
  providerSelection: {
    providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
    providerId?: string
    model?: string
  }
  expectedOutput: string[]
  validationRequirements: string[]
  reviewRequirements: string[]
  approvalRequirements: string[]
  metadata?: Metadata
}

export interface ExecutionContextInput {
  executionId: string
  runtimeContext: Metadata
  memoryContext: Metadata
  businessBrainContext: Metadata
  workflowContext: Metadata
  reasoningContext: Metadata
  aiTeamContext: Metadata
  providerContext: Metadata
  userContext: Metadata
  tenantContext: Metadata
}

export interface ExecutionPlanInput {
  planId: string
  executionId: string
  workPackage: ExecutionWorkPackageInput
  stages: ExecutionStageInput[]
  metadata?: Metadata
}

export interface ExecutionRegistrationInput {
  executionId: string
  name: string
  version: string
  contractVersion: string
  governance: ExecutionGovernanceInput
  metadata?: Metadata
}

export const EXECUTION_RESPONSE_STATUSES = [
  'queued',
  'dispatched',
  'routing-failed',
  'dispatch-failed',
  'validation-failed',
  'completed',
] as const

export type ExecutionResponseStatus = (typeof EXECUTION_RESPONSE_STATUSES)[number]

export interface ExecutionGatewayRequestInput {
  requestId: string
  executionId: string
  sessionId: string
  metadata: {
    correlationId: string
    tenantId: string
    source: string
    createdBy: string
    createdAt: string
    tags: string[]
  }
  context: {
    runtimeContext: Metadata
    memoryContext: Metadata
    businessBrainContext: Metadata
    workflowContext: Metadata
    reasoningContext: Metadata
    aiTeamContext: Metadata
    providerContext: Metadata
    userContext: Metadata
    tenantContext: Metadata
  }
  promptPackage: {
    promptId: string
    promptVersion: string
    promptBody: string
    systemInstructions: string[]
    developerInstructions: string[]
    userInstructions: string[]
  }
  providerSelection: {
    providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
    providerId?: string
    capabilityId?: string
    requiredModel?: string
    minVersion?: string
    allowDegraded?: boolean
  }
  adapterSelection: {
    adapterType: 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
    preferredAdapterId?: string
    requiredCapabilityId?: string
    requiredModel?: string
    minVersion?: string
    allowDegraded?: boolean
  }
  executionConstraints: {
    maxTokens?: number
    maxOutputItems?: number
    hardLimitMs: number
    requireApproval: boolean
  }
  timeoutPolicy: {
    requestTimeoutMs: number
    connectTimeoutMs: number
  }
  retryPolicy: {
    maxAttempts: number
    backoffMs: number
    retryableStatusCodes: number[]
  }
  expectedOutput: {
    outputType: 'text' | 'vectors' | 'images' | 'audio' | 'moderation'
    schemaVersion: string
    validationRequirements: string[]
  }
}

export interface ExecutionDispatchInput {
  dispatchId: string
  requestId: string
  executionId: string
  route: {
    providerResolutionId: string
    adapterResolutionId: string
    executionRoute: string
    responseRoute: string
    failureRoute: string
  }
  retryPlan: {
    maxAttempts: number
    attemptNumber: number
    nextRetryAt?: string
  }
  metadata?: Metadata
}

export interface ProviderResolutionInput {
  requestId: string
  providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
  resolvedProviderId?: string
  resolvedAdapterId?: string
  resolvedModel?: string
  capabilityId?: string
  versionCompatible: boolean
  available: boolean
}

export interface ExecutionGatewayResponseInput {
  responseId: string
  requestId: string
  executionId: string
  status: ExecutionResponseStatus
  validationStatus: 'not-validated' | 'validated' | 'invalid'
  providerMetadata: {
    providerId?: string
    adapterId?: string
    model?: string
    providerVersion?: string
  }
  costMetadata: {
    currency: string
    estimatedInputCost: number
    estimatedOutputCost: number
    estimatedTotalCost: number
  }
  timingMetadata: {
    queuedAt: string
    dispatchedAt?: string
    completedAt?: string
    totalDurationMs?: number
  }
  diagnostics: string[]
  auditReferences: string[]
  placeholderOutput: Metadata
}

export interface ExecutionAuditRecordInput {
  auditId: string
  requestId: string
  executionId: string
  sessionId: string
  dispatchRecord: {
    dispatchId: string
    executionRoute: string
    responseRoute: string
    failureRoute: string
    attemptNumber: number
  }
  providerResolutionRecord: {
    resolutionId: string
    providerId?: string
    adapterId?: string
    model?: string
    capabilityId?: string
    versionCompatible: boolean
    available: boolean
  }
  validationRecord: {
    requestValidated: boolean
    dispatchValidated: boolean
    responseValidated: boolean
    auditValidated: boolean
  }
  approvalRecord: {
    required: boolean
    status: 'not-required' | 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approvedAt?: string
  }
  timeline: Array<{
    eventId: string
    eventType: string
    timestamp: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export const RETRIEVAL_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type RetrievalPriority = (typeof RETRIEVAL_PRIORITIES)[number]

export const RETRIEVAL_SCOPES = ['session', 'request', 'workflow', 'tenant', 'global'] as const
export type RetrievalScope = (typeof RETRIEVAL_SCOPES)[number]

export const RETRIEVAL_STRATEGIES = ['baseline', 'targeted', 'broad', 'fallback'] as const
export type RetrievalStrategy = (typeof RETRIEVAL_STRATEGIES)[number]

export const KNOWLEDGE_SOURCE_TYPES = [
  'business-brain',
  'memory-engine',
  'runtime-context',
  'workflow-engine',
  'reasoning-pipeline',
  'ai-team',
  'prompt-construction',
  'provider-runtime',
  'execution-gateway',
  'tenant-configuration',
] as const
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number]

export interface RetrievalSourceDescriptorInput {
  sourceId: string
  sourceType: KnowledgeSourceType
  title: string
  scope: RetrievalScope
  priority: RetrievalPriority
  enabled: boolean
  trustLevel: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  freshness: {
    updatedAt: string
    staleAfterMs: number
  }
  weighting: {
    weight: number
    rationale: string
  }
  metadata?: Metadata
}

export interface RetrievalRequestInput {
  requestId: string
  assemblyId: string
  sessionId: string
  query: string
  scope: RetrievalScope
  priority: RetrievalPriority
  constraints: {
    maxSources: number
    maxReferences: number
    includeHistoricalDecisions: boolean
    includePolicies: boolean
    includeConstraints: boolean
    hardTimeoutMs: number
  }
  strategy: RetrievalStrategy
  metadata?: Metadata
}

export interface RetrievalPlanInput {
  planId: string
  assemblyId: string
  request: RetrievalRequestInput
  sources: RetrievalSourceDescriptorInput[]
  constraints: RetrievalRequestInput['constraints']
  strategy: RetrievalStrategy
  resultMetadata: {
    expectedReferenceCount: number
    expectedEvidenceCount: number
    expectedCompleteness: number
  }
  metadata?: Metadata
}

export interface KnowledgeReferenceAssemblyInput {
  referenceId: string
  sourceId: string
  type: 'document' | 'asset' | 'record' | 'decision' | 'policy' | 'constraint' | 'external'
  label: string
  target: string
  relevance: number
  metadata?: Metadata
}

export interface KnowledgePackageInput {
  packageId: string
  assemblyId: string
  planId: string
  retrievedKnowledge: string[]
  supportingEvidence: string[]
  policies: string[]
  constraints: string[]
  historicalDecisions: string[]
  contextSummary: string
  confidenceSummary: {
    overallConfidence: number
    confidenceBySource: Record<string, number>
  }
  references: KnowledgeReferenceAssemblyInput[]
  gaps: string[]
  metadata?: Metadata
}

export interface KnowledgePrioritisationInput {
  prioritisationId: string
  assemblyId: string
  priorityRules: string[]
  rankingMetadata: {
    rankingVersion: string
    rationale: string
  }
  freshnessMetadata: {
    freshnessWindowMs: number
    staleThresholdMs: number
  }
  trustMetadata: {
    minimumTrustLevel: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    enforceTrust: boolean
  }
  sourceWeighting: Array<{
    sourceId: string
    weight: number
  }>
  conflictIndicators: string[]
  completenessIndicators: string[]
  metadata?: Metadata
}

export interface KnowledgeAssemblyRegistrationInput {
  assemblyId: string
  name: string
  version: string
  contractVersion: string
  sourceIds: string[]
  metadata?: Metadata
}

export const QUERY_INTENTS = [
  'knowledge-discovery',
  'policy-discovery',
  'constraint-discovery',
  'decision-trace',
  'context-summary',
] as const
export type QueryIntent = (typeof QUERY_INTENTS)[number]

export const QUERY_SCOPES = ['session', 'request', 'workflow', 'tenant', 'global'] as const
export type QueryScope = (typeof QUERY_SCOPES)[number]

export const QUERY_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type QueryPriority = (typeof QUERY_PRIORITIES)[number]

export const RETRIEVAL_STRATEGY_PATTERNS = [
  'sequential',
  'parallel',
  'conditional',
  'incremental',
  'cached',
  'deferred',
] as const
export type RetrievalStrategyPattern = (typeof RETRIEVAL_STRATEGY_PATTERNS)[number]

export const SOURCE_PLANNING_TARGETS = [
  'business-brain',
  'memory-engine',
  'workflow-engine',
  'runtime-context',
  'ai-team',
  'prompt-construction',
  'execution-gateway',
  'provider-runtime',
  'tenant-configuration',
  'future-domain-packs',
] as const
export type SourcePlanningTarget = (typeof SOURCE_PLANNING_TARGETS)[number]

export const CONTEXT_COMPOSITION_SOURCES = [
  'business-brain',
  'memory-engine',
  'retrieval-strategy',
  'workflow-engine',
  'runtime-context',
  'reasoning-pipeline',
  'ai-team',
  'prompt-construction',
  'provider-runtime',
  'execution-gateway',
  'tenant-configuration',
] as const
export type ContextCompositionSource = (typeof CONTEXT_COMPOSITION_SOURCES)[number]

export const CONTEXT_SECTION_TYPES = [
  'knowledge',
  'evidence',
  'policy',
  'constraint',
  'decision',
  'workflow',
  'runtime',
  'tenant',
] as const
export type ContextSectionType = (typeof CONTEXT_SECTION_TYPES)[number]

export const CONTEXT_ORDERING_MODES = ['fixed', 'weighted', 'adaptive'] as const
export type ContextOrderingMode = (typeof CONTEXT_ORDERING_MODES)[number]

export const CONTEXT_PRIORITISATION_MODES = [
  'priority-first',
  'source-first',
  'governance-first',
] as const
export type ContextPrioritisationMode = (typeof CONTEXT_PRIORITISATION_MODES)[number]

export const CONTEXT_COMPLETENESS_STATUSES = ['complete', 'partial', 'insufficient'] as const
export type ContextCompletenessStatus = (typeof CONTEXT_COMPLETENESS_STATUSES)[number]

export const CONTEXT_GAP_SEVERITIES = ['low', 'medium', 'high'] as const
export type ContextGapSeverity = (typeof CONTEXT_GAP_SEVERITIES)[number]

export const MERGE_POLICY_STRATEGIES = [
  'append',
  'replace',
  'merge-by-priority',
  'merge-by-source',
] as const
export type MergePolicyStrategy = (typeof MERGE_POLICY_STRATEGIES)[number]

export const CONFLICT_RESOLUTION_STRATEGIES = [
  'highest-confidence',
  'highest-trust',
  'newest',
  'manual-review',
] as const
export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[number]

export const MISSING_KNOWLEDGE_STRATEGIES = ['allow', 'warn', 'block-context-package'] as const
export type MissingKnowledgeStrategy = (typeof MISSING_KNOWLEDGE_STRATEGIES)[number]

export interface ContextGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface ResolutionContextReferenceInput {
  referenceId: string
  sourceId: string
  targetId: string
  type: 'knowledge' | 'evidence' | 'decision' | 'constraint' | 'policy' | 'context'
  label: string
  metadata?: Metadata
}

export interface ContextCompositionInput {
  contextId: string
  sources: ContextCompositionSource[]
  sections: Array<{
    sectionId: string
    source: ContextCompositionSource
    type: ContextSectionType
    title: string
    content: Metadata
    order: number
    priority: number
    references: ResolutionContextReferenceInput[]
    dependencies: Array<{
      dependencyId: string
      dependsOnSectionId: string
      requiredBySectionId: string
      rationale?: string
    }>
    metadata?: Metadata
  }>
  ordering: {
    mode: ContextOrderingMode
    orderedSectionIds: string[]
  }
  prioritisation: {
    mode: ContextPrioritisationMode
    sectionWeights: Array<{
      sectionId: string
      weight: number
    }>
  }
  references: ResolutionContextReferenceInput[]
  dependencies: Array<{
    dependencyId: string
    dependsOnSectionId: string
    requiredBySectionId: string
    rationale?: string
  }>
  completeness: {
    status: ContextCompletenessStatus
    score: number
    missingSections: string[]
  }
  gaps: Array<{
    gapId: string
    statement: string
    severity: ContextGapSeverity
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ResolutionPolicyInput {
  mergePolicy: {
    strategy: MergePolicyStrategy
    allowSectionOverwrite: boolean
  }
  conflictResolutionPolicy: {
    strategy: ConflictResolutionStrategy
    preserveAlternatives: boolean
  }
  sourcePriorityPolicy: {
    orderedSources: ContextCompositionSource[]
    defaultWeight: number
    sourceWeights: Array<{
      source: ContextCompositionSource
      weight: number
    }>
  }
  contextSizePolicy: {
    maxSections: number
    maxCharacters: number
    truncateStrategy: 'tail-trim' | 'low-priority-trim' | 'source-weighted-trim'
  }
  contextQualityPolicy: {
    minimumConfidence: number
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    requireReferences: boolean
  }
  missingKnowledgePolicy: {
    strategy: MissingKnowledgeStrategy
    placeholderEnabled: boolean
    requiredSections: string[]
  }
}

export interface KnowledgeResolutionRegistrationInput {
  resolutionId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface KnowledgeResolutionSessionInput {
  sessionId: string
  resolutionId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export const CANDIDATE_KNOWLEDGE_SOURCES = [
  'knowledge-resolution',
  'business-brain',
  'memory-engine',
  'retrieval-strategy',
  'workflow-engine',
  'runtime-context',
  'reasoning-pipeline',
  'ai-team',
  'provider-runtime',
  'execution-gateway',
  'tenant-configuration',
] as const
export type CandidateKnowledgeSource = (typeof CANDIDATE_KNOWLEDGE_SOURCES)[number]

export const SELECTION_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type SelectionPriority = (typeof SELECTION_PRIORITIES)[number]

export const SELECTION_DECISION_TYPES = ['selected', 'excluded', 'deferred'] as const
export type SelectionDecisionType = (typeof SELECTION_DECISION_TYPES)[number]

export const RELEVANCE_POLICY_STRATEGIES = ['strict-threshold', 'rank-only', 'balanced'] as const
export type RelevancePolicyStrategy = (typeof RELEVANCE_POLICY_STRATEGIES)[number]

export const CONFLICT_POLICY_STRATEGIES = [
  'highest-confidence',
  'highest-trust',
  'freshest',
  'retain-conflicts',
] as const
export type ConflictPolicyStrategy = (typeof CONFLICT_POLICY_STRATEGIES)[number]

export interface SelectionGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface EvidenceReferenceInput {
  referenceId: string
  sourceId: string
  targetId: string
  kind: 'knowledge' | 'evidence' | 'decision' | 'constraint' | 'policy' | 'context'
  label: string
  confidence: number
  metadata?: Metadata
}

export interface EvidencePackageInput {
  packageId: string
  selectionId: string
  evidenceSources: Array<{
    sourceId: string
    sourceType: 'knowledge' | 'document' | 'record' | 'policy' | 'constraint' | 'decision' | 'external'
    label: string
    capturedAt: string
    metadata?: Metadata
  }>
  evidenceReferences: EvidenceReferenceInput[]
  evidenceChains: Array<{
    chainId: string
    steps: Array<{
      stepId: string
      fromReferenceId: string
      toReferenceId: string
      relation: string
    }>
    metadata?: Metadata
  }>
  evidenceSummary: {
    summaryId: string
    highlights: string[]
    gaps: string[]
    risks: string[]
  }
  evidenceConfidence: {
    overall: number
    byEvidenceId: Record<string, number>
  }
  evidenceTraceability: {
    enabled: boolean
    traceIds: string[]
  }
  evidenceCoverage: {
    requiredTopics: string[]
    coveredTopics: string[]
    coverageScore: number
  }
  metadata?: Metadata
}

export interface SelectionPolicyInput {
  relevancePolicy: {
    strategy: RelevancePolicyStrategy
    minimumRelevance: number
  }
  confidencePolicy: {
    minimumConfidence: number
    preferHigherConfidence: boolean
  }
  trustPolicy: {
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    allowUntrusted: boolean
  }
  freshnessPolicy: {
    maxAgeMs: number
    requireFreshness: boolean
  }
  diversityPolicy: {
    enabled: boolean
    maxPerSource: number
    minSourceDiversity: number
  }
  completenessPolicy: {
    minimumCoverageScore: number
    requiredTopics: string[]
  }
  conflictPolicy: {
    strategy: ConflictPolicyStrategy
    preserveAlternatives: boolean
  }
  evidenceSufficiencyPolicy: {
    minimumEvidenceCount: number
    minimumCoverageScore: number
    requireTraceability: boolean
  }
}

export interface KnowledgeSelectionRegistrationInput {
  selectionId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface KnowledgeSelectionSessionInput {
  sessionId: string
  selectionId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface KnowledgeSelectionInput {
  selectionId: string
  priority: SelectionPriority
  candidateKnowledge: Array<{
    candidateId: string
    knowledgeId: string
    source: CandidateKnowledgeSource
    title: string
    summary: string
    relevance: number
    confidence: number
    trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    metadata?: Metadata
  }>
  selectedKnowledge: Array<{
    selectedId: string
    candidateId: string
    knowledgeId: string
    rationale: string
    confidence: number
    trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    evidenceReferenceIds: string[]
    metadata?: Metadata
  }>
  criteria: {
    intent: string
    requiredDomains: string[]
    preferredSources: CandidateKnowledgeSource[]
    minimumConfidence: number
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  }
  constraints: {
    maxSelections: number
    maxEvidenceItems: number
    maxContextCharacters: number
    requireEvidence: boolean
  }
  decisions: Array<{
    decisionId: string
    candidateId: string
    decision: SelectionDecisionType
    rationale: string
    evidenceReferenceIds: string[]
    metadata?: Metadata
  }>
  exclusions: Array<{
    exclusionId: string
    candidateId: string
    reason: string
    policyReference?: string
    metadata?: Metadata
  }>
  summary: {
    totalCandidates: number
    selectedCount: number
    excludedCount: number
    deferredCount: number
    relevanceScore: number
    evidenceScore: number
    coverageScore: number
  }
}

export interface KnowledgeSelectionContextInput {
  contextId: string
  selectionId: string
  sessionId?: string
  selection: KnowledgeSelectionInput
  policies: SelectionPolicyInput
  governance: SelectionGovernanceInput
  metadata?: Metadata
}

export const QUALITY_ASSESSMENT_STATUSES = ['pass', 'warn', 'fail', 'unknown'] as const
export type QualityAssessmentStatus = (typeof QUALITY_ASSESSMENT_STATUSES)[number]

export const CONFLICT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type ConflictSeverity = (typeof CONFLICT_SEVERITIES)[number]

export const CONFLICT_CATEGORIES = [
  'semantic',
  'policy',
  'constraint',
  'decision',
  'factual',
  'temporal',
  'source-disagreement',
] as const
export type ConflictCategory = (typeof CONFLICT_CATEGORIES)[number]

export const GAP_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type GapSeverity = (typeof GAP_SEVERITIES)[number]

export const QUALITY_CONFLICT_POLICY_STRATEGIES = [
  'highest-confidence',
  'highest-trust',
  'latest',
  'human-review',
  'retain-alternatives',
] as const
export type QualityConflictPolicyStrategy = (typeof QUALITY_CONFLICT_POLICY_STRATEGIES)[number]

export interface QualityGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface KnowledgeQualityRegistrationInput {
  qualityId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface KnowledgeQualitySessionInput {
  sessionId: string
  qualityId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface KnowledgeQualityContextInput {
  contextId: string
  qualityId: string
  sessionId?: string
  governance: QualityGovernanceInput
  policies: KnowledgeQualityPolicyInput
  scope: string[]
  metadata?: Metadata
}

export interface KnowledgeQualityPolicyInput {
  completenessPolicy: {
    minimumCompletenessScore: number
    requiredSections: string[]
  }
  consistencyPolicy: {
    allowConflicts: boolean
    maximumCriticalConflicts: number
  }
  trustPolicy: {
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    allowUntrustedSources: boolean
  }
  freshnessPolicy: {
    maxAgeMs: number
    requireFreshness: boolean
  }
  conflictPolicy: {
    strategy: QualityConflictPolicyStrategy
    preserveAlternatives: boolean
  }
  coveragePolicy: {
    minimumCoverageScore: number
    requiredTopics: string[]
  }
  relevancePolicy: {
    minimumRelevanceScore: number
    requireRelevanceForAll: boolean
  }
  evidenceQualityPolicy: {
    minimumEvidenceConfidence: number
    requireTraceability: boolean
  }
}

export interface ConflictReferenceInput {
  referenceId: string
  groupId: string
  sourceId: string
  sourceType: 'knowledge' | 'evidence' | 'policy' | 'constraint' | 'decision' | 'external'
  statement: string
  metadata?: Metadata
}

export interface KnowledgeQualityReportInput {
  reportId: string
  qualityId: string
  completenessAssessment: {
    status: QualityAssessmentStatus
    score: number
    missingItems: string[]
  }
  freshnessAssessment: {
    status: QualityAssessmentStatus
    score: number
    staleItems: string[]
  }
  trustAssessment: {
    status: QualityAssessmentStatus
    score: number
    trustIssues: string[]
  }
  confidenceAssessment: {
    status: QualityAssessmentStatus
    score: number
    lowConfidenceItems: string[]
  }
  coverageAssessment: {
    status: QualityAssessmentStatus
    score: number
    coveredTopics: string[]
    missingTopics: string[]
  }
  consistencyAssessment: {
    status: QualityAssessmentStatus
    score: number
    inconsistencies: string[]
  }
  relevanceAssessment: {
    status: QualityAssessmentStatus
    score: number
    irrelevantItems: string[]
  }
  metadata?: Metadata
}

export interface ConflictAnalysisInput {
  resultId: string
  qualityId: string
  conflictGroups: Array<{
    groupId: string
    category: ConflictCategory
    severity: ConflictSeverity
    sources: Array<{
      sourceId: string
      sourceType: 'knowledge' | 'evidence' | 'policy' | 'constraint' | 'decision' | 'external'
      statement: string
      metadata?: Metadata
    }>
    recommendations: Array<{
      recommendationId: string
      strategy: 'highest-confidence' | 'highest-trust' | 'latest' | 'human-review' | 'retain-alternatives'
      rationale: string
    }>
    traceability: {
      enabled: boolean
      traceIds: string[]
    }
    metadata?: Metadata
  }>
  summary: {
    totalConflicts: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    categories: ConflictCategory[]
  }
  metadata?: Metadata
}

export interface GapAnalysisInput {
  analysisId: string
  qualityId: string
  knowledgeGaps: Array<{
    gapId: string
    type: 'context' | 'evidence' | 'decision' | 'reference' | 'other'
    statement: string
    severity: GapSeverity
    recommendations: Array<{
      recommendationId: string
      action: string
      rationale: string
    }>
    metadata?: Metadata
  }>
  missingContext: Array<{
    contextId: string
    statement: string
    severity: GapSeverity
  }>
  missingEvidence: Array<{
    evidenceId: string
    statement: string
    severity: GapSeverity
  }>
  missingDecisions: Array<{
    decisionId: string
    statement: string
    severity: GapSeverity
  }>
  missingReferences: Array<{
    referenceId: string
    statement: string
    severity: GapSeverity
  }>
  summary: {
    totalGaps: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
  }
  metadata?: Metadata
}

export const READINESS_STATUSES = ['not-ready', 'conditionally-ready', 'ready', 'blocked'] as const
export type ReadinessStatus = (typeof READINESS_STATUSES)[number]

export const READINESS_DECISIONS = ['approve', 'hold', 'revise', 'reject'] as const
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number]

export interface ReadinessGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface ReadinessPolicyInput {
  minimumCompletenessPolicy: {
    minimumCompletenessScore: number
    requiredSections: string[]
  }
  minimumConfidencePolicy: {
    minimumConfidenceScore: number
    enforceConfidence: boolean
  }
  minimumTrustPolicy: {
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    allowUntrustedSources: boolean
  }
  conflictTolerancePolicy: {
    maximumCriticalConflicts: number
    maximumHighConflicts: number
  }
  freshnessPolicy: {
    maxAgeMs: number
    requireFreshness: boolean
  }
  evidenceCoveragePolicy: {
    minimumCoverageScore: number
    requiredEvidenceTypes: string[]
  }
  promptReadinessPolicy: {
    requireValidationPackage: boolean
    requireObjectivePackage: boolean
    requireReferencePackage: boolean
  }
}

export interface KnowledgeReadinessRegistrationInput {
  readinessId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface KnowledgeReadinessSessionInput {
  sessionId: string
  readinessId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface KnowledgeReadinessContextInput {
  contextId: string
  readinessId: string
  sessionId?: string
  governance: ReadinessGovernanceInput
  policies: ReadinessPolicyInput
  scope: string[]
  metadata?: Metadata
}

export interface ReadinessReportInput {
  reportId: string
  readinessId: string
  status: ReadinessStatus
  score: {
    overall: number
    byCriteria: Record<string, number>
  }
  criteria: Array<{
    criteriaId: string
    name: string
    description: string
    required: boolean
    metadata?: Metadata
  }>
  decision: ReadinessDecision
  recommendations: Array<{
    recommendationId: string
    action: string
    rationale: string
    metadata?: Metadata
  }>
  summary: {
    totalCriteria: number
    satisfiedCriteria: number
    failedCriteria: number
    blockedCriteria: number
  }
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  metadata?: Metadata
}

export interface PromptHandoffPackageInput {
  handoffId: string
  readinessId: string
  finalContextPackage: {
    contextId: string
    sections: string[]
    summary: string
    metadata?: Metadata
  }
  finalKnowledgePackage: {
    knowledgeIds: string[]
    summary: string
    metadata?: Metadata
  }
  finalEvidencePackage: {
    evidenceIds: string[]
    summary: string
    metadata?: Metadata
  }
  finalConstraintPackage: {
    constraints: string[]
    summary: string
    metadata?: Metadata
  }
  finalObjectivePackage: {
    objectives: string[]
    summary: string
    metadata?: Metadata
  }
  finalReferencePackage: {
    referenceIds: string[]
    summary: string
    metadata?: Metadata
  }
  finalValidationPackage: {
    validationChecks: string[]
    summary: string
    metadata?: Metadata
  }
  metadata?: Metadata
}

export const CERTIFICATION_STATUSES = [
  'not-certified',
  'conditionally-certified',
  'certified',
  'rejected',
] as const
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number]

export const CERTIFICATION_DECISIONS = [
  'certify',
  'conditional-certify',
  'hold',
  'reject',
] as const
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number]

export interface CertificationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface CertificationPolicyInput {
  completenessCertificationPolicy: {
    minimumCompletenessScore: number
    requiredSections: string[]
  }
  confidenceCertificationPolicy: {
    minimumConfidenceScore: number
    enforceConfidence: boolean
  }
  trustCertificationPolicy: {
    minimumTrust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
    allowUntrustedSources: boolean
  }
  conflictCertificationPolicy: {
    maximumCriticalConflicts: number
    maximumHighConflicts: number
  }
  freshnessCertificationPolicy: {
    maxAgeMs: number
    requireFreshness: boolean
  }
  evidenceCertificationPolicy: {
    minimumCoverageScore: number
    requiredEvidenceTypes: string[]
  }
  promptDeliveryPolicy: {
    requireCertifiedKnowledgePackage: boolean
    requireCertifiedEvidencePackage: boolean
    requireCertifiedContextPackage: boolean
    requireCertifiedValidationPackage: boolean
  }
}

export interface KnowledgeCertificationRegistrationInput {
  certificationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface KnowledgeCertificationSessionInput {
  sessionId: string
  certificationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface KnowledgeCertificationContextInput {
  contextId: string
  certificationId: string
  sessionId?: string
  governance: CertificationGovernanceInput
  policies: CertificationPolicyInput
  scope: string[]
  metadata?: Metadata
}

export interface CertificationCriteriaInput {
  criteriaId: string
  name: string
  description: string
  required: boolean
  passed: boolean
  score?: number
  metadata?: Metadata
}

export interface CertificationRecommendationInput {
  recommendationId: string
  action: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface CertificationEvidenceInput {
  evidenceId: string
  label: string
  sourceType: 'knowledge' | 'evidence' | 'policy' | 'constraint' | 'decision' | 'validation' | 'external'
  sourceId: string
  confidence: number
  summary?: string
  metadata?: Metadata
}

export interface CertificationTraceabilityInput {
  enabled: boolean
  traceIds: string[]
  references: string[]
}

export interface KnowledgeCertificationReportInput {
  reportId: string
  certificationId: string
  status: CertificationStatus
  decision: CertificationDecision
  criteria: CertificationCriteriaInput[]
  recommendations: CertificationRecommendationInput[]
  evidence: CertificationEvidenceInput[]
  traceability: CertificationTraceabilityInput
  summary: {
    totalCriteria: number
    passedCriteria: number
    failedCriteria: number
    requiredCriteria: number
    requiredPassedCriteria: number
  }
  metadata?: Metadata
}

export interface PromptDeliveryPackageInput {
  deliveryId: string
  certificationId: string
  reportId: string
  certifiedKnowledgePackage: {
    packageId: string
    knowledgeIds: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedEvidencePackage: {
    packageId: string
    evidenceIds: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedContextPackage: {
    packageId: string
    contextIds: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedConstraintPackage: {
    packageId: string
    constraints: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedObjectivePackage: {
    packageId: string
    objectives: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedReferencePackage: {
    packageId: string
    referenceIds: string[]
    summary: string
    metadata?: Metadata
  }
  certifiedValidationPackage: {
    packageId: string
    validationChecks: string[]
    summary: string
    metadata?: Metadata
  }
  metadata?: Metadata
}

export interface StrategyGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
}

export interface QueryPlanInput {
  queryId: string
  queryText: string
  intent: QueryIntent
  scope: QueryScope
  priority: QueryPriority
  constraints: {
    maxSources: number
    maxResults: number
    hardTimeoutMs: number
    includeHistoricalDecisions: boolean
    includePolicies: boolean
    includeConstraints: boolean
  }
  expansion: {
    enabled: boolean
    terms: string[]
    rationale?: string
  }
  reduction: {
    enabled: boolean
    includeTerms: string[]
    excludeTerms: string[]
    rationale?: string
  }
  optimisation: {
    mode: 'none' | 'latency-first' | 'coverage-first' | 'precision-first'
    hints: string[]
  }
  metadata: {
    queryVersion: string
    createdAt: string
    updatedAt?: string
    metadata?: Metadata
  }
}

export interface QueryPlanningRegistrationInput {
  planningId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface SourcePlanningInput {
  sourceId: string
  target: SourcePlanningTarget
  queryScope: QueryScope
  enabled: boolean
  metadata?: Metadata
}

export interface RetrievalStrategyDefinitionInput {
  strategyId: string
  name: string
  pattern: RetrievalStrategyPattern
  sourceIds: string[]
  governance: StrategyGovernanceInput
  metadata?: Metadata
}

export interface RetrievalPackageInput {
  packageId: string
  planningId: string
  plannedSources: Array<{
    sourceId: string
    order: number
    strategyHint: string
    metadata?: Metadata
  }>
  plannedQueries: Array<{
    queryId: string
    sourceId: string
    intent: QueryIntent
    queryText: string
    metadata?: Metadata
  }>
  retrievalDependencies: Array<{
    dependencyId: string
    dependsOnSourceId: string
    requiredBySourceId: string
    rationale?: string
  }>
  retrievalOrdering: {
    orderedSourceIds: string[]
    mode: 'sequential' | 'parallel' | 'hybrid'
  }
  expectedEvidence: string[]
  expectedKnowledge: string[]
  expectedContext: string[]
  retrievalGaps: Array<{
    statement: string
    severity: 'low' | 'medium' | 'high'
  }>
  retrievalRisks: Array<{
    statement: string
    severity: 'low' | 'medium' | 'high'
  }>
  metadata?: Metadata
}

export interface SkillRegistrationInput {
  skillId: string
  name: string
  category: string
  version: string
  contractVersion: string
  dependencies: string[]
  capabilities: Array<{
    capabilityId: string
    name: string
    declared: boolean
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface MemoryGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
    tenantId: string
  }
  visibility: 'private' | 'tenant' | 'platform'
  accessScope: 'session' | 'project' | 'domain' | 'tenant' | 'global'
  tenantIsolation: {
    tenantId: string
    isolated: boolean
  }
  trustLevel: 'untrusted' | 'provisional' | 'trusted' | 'verified'
  confidence: number
  freshness: {
    updatedAt: string
    staleAfterMs: number
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    confidence: number
    capturedAt: string
  }
  retentionPolicy: {
    retainForDays: number
    archiveAfterDays?: number
  }
  expirationPolicy: {
    expiresAt?: string
    autoDispose: boolean
  }
}

export interface MemoryMetadataInput {
  memoryId: string
  name: string
  classification: MemoryClassification
  version: string
  contractVersion: string
  dependencies: string[]
  capabilities: Array<{
    capabilityId: string
    name: string
    declared: boolean
    metadata?: Metadata
  }>
  governance: MemoryGovernanceInput
  createdAt: string
  updatedAt?: string
  metadata?: Metadata
}

export interface MemoryRegistrationInput {
  memoryId: string
  name: string
  classification: MemoryClassification
  version: string
  contractVersion: string
  dependencies: string[]
  capabilities: Array<{
    capabilityId: string
    name: string
    declared: boolean
    metadata?: Metadata
  }>
  governance: MemoryGovernanceInput
  metadata?: Metadata
}

export interface KnowledgeGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  stewardship: {
    stewardId: string
    stewardType: 'team' | 'role' | 'individual'
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
    confidence: number
  }
  confidence: number
  freshness: {
    updatedAt: string
    staleAfterMs: number
  }
  trustLevel: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  lifecycleStatus: KnowledgeLifecycleStatus
}

export interface KnowledgeReferenceInput {
  referenceId: string
  type: 'document' | 'asset' | 'record' | 'decision' | 'external'
  label: string
  target: string
  metadata?: Metadata
}

export interface KnowledgeRelationshipInput {
  relationshipId: string
  type: KnowledgeRelationshipType
  sourceKnowledgeId: string
  targetKnowledgeId: string
  metadata?: Metadata
}

export interface KnowledgeMetadataInput {
  knowledgeId: string
  title: string
  domain: KnowledgeDomain
  classification: string
  version: string
  contractVersion: string
  references: KnowledgeReferenceInput[]
  relationships: KnowledgeRelationshipInput[]
  governance: KnowledgeGovernanceInput
  createdAt: string
  updatedAt?: string
  metadata?: Metadata
}

export interface KnowledgeRegistrationInput {
  knowledgeId: string
  title: string
  domain: KnowledgeDomain
  classification: string
  version: string
  contractVersion: string
  references: KnowledgeReferenceInput[]
  relationships: KnowledgeRelationshipInput[]
  governance: KnowledgeGovernanceInput
  metadata?: Metadata
}

export interface ReasoningGovernanceInput {
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
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
  version: string
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
}

export interface ReasoningMetadataInput {
  pipelineId: string
  name: string
  version: string
  contractVersion: string
  stageOrder: ReasoningPipelineStage[]
  dependencies: string[]
  governance: ReasoningGovernanceInput
  createdAt: string
  updatedAt?: string
  metadata?: Metadata
}

export interface ReasoningRegistrationInput {
  pipelineId: string
  name: string
  version: string
  contractVersion: string
  stageOrder: ReasoningPipelineStage[]
  dependencies: string[]
  governance: ReasoningGovernanceInput
  metadata?: Metadata
}

export interface ReasoningStageRegistrationInput {
  stageId: string
  stage: ReasoningPipelineStage
  order: number
  dependencies: ReasoningPipelineStage[]
  transitionsTo: ReasoningPipelineStage[]
  metadata?: Metadata
}

export interface ReasoningArtifactInput {
  artifactId: string
  type: ReasoningArtifactType
  title: string
  version: string
  payload: Metadata
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
}

export interface ReasoningEngineGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface ReasoningEngineRegistrationInput {
  engineId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface ReasoningEngineSessionInput {
  sessionId: string
  engineId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface ReasoningEngineContextInput {
  contextId: string
  engineId: string
  sessionId?: string
  governance: ReasoningEngineGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface ReasoningObjectiveInput {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface ReasoningConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ReasoningAssumptionInput {
  assumptionId: string
  statement: string
  confidence: number
  metadata?: Metadata
}

export interface ReasoningEvidenceInput {
  evidenceId: string
  statement: string
  sourceIds: string[]
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  metadata?: Metadata
}

export interface ReasoningDecisionPointInput {
  decisionPointId: string
  question: string
  options: string[]
  selectedOption?: string
  rationale?: string
  metadata?: Metadata
}

export interface ReasoningOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface ReasoningSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
  metadata?: Metadata
}

export interface ReasoningPlanInput {
  planId: string
  engineId: string
  stage: ReasoningEngineStage
  objectives: ReasoningObjectiveInput[]
  constraints: ReasoningConstraintInput[]
  assumptions: ReasoningAssumptionInput[]
  evidence: ReasoningEvidenceInput[]
  decisionPoints: ReasoningDecisionPointInput[]
  outcomes: ReasoningOutcomeInput[]
  summary: ReasoningSummaryInput
  metadata?: Metadata
}

export interface ReasoningOutputInput {
  outputId: string
  engineId: string
  planId: string
  stage: ReasoningEngineStage
  summary: string
  references: string[]
  metadata?: Metadata
}

export interface StrategicGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface StrategicReasoningRegistrationInput {
  strategicReasoningId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface StrategicReasoningSessionInput {
  sessionId: string
  strategicReasoningId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface StrategicReasoningContextInput {
  contextId: string
  strategicReasoningId: string
  sessionId?: string
  governance: StrategicGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface StrategicObjectiveInput {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicProblemInput {
  problemId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface StrategicAssumptionInput {
  assumptionId: string
  statement: string
  confidence: number
  metadata?: Metadata
}

export interface StrategicOpportunityInput {
  opportunityId: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicRiskInput {
  riskId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation?: string
  metadata?: Metadata
}

export interface StrategicScenarioInput {
  scenarioId: string
  name: string
  description: string
  likelihood: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface StrategicOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface StrategicRecommendationInput {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface StrategicPlanningInput {
  planningId: string
  strategicReasoningId: string
  stage: StrategicThinkingStage
  objectives: StrategicObjectiveInput[]
  problems: StrategicProblemInput[]
  constraints: StrategicConstraintInput[]
  assumptions: StrategicAssumptionInput[]
  opportunities: StrategicOpportunityInput[]
  risks: StrategicRiskInput[]
  scenarios: StrategicScenarioInput[]
  outcomes: StrategicOutcomeInput[]
  recommendations: StrategicRecommendationInput[]
  summary: {
    synopsis: string
    highlights: string[]
    risks: string[]
    nextActions: string[]
  }
  metadata?: Metadata
}

export interface TacticalGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface TacticalPlanningRegistrationInput {
  tacticalPlanningId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface TacticalPlanningSessionInput {
  sessionId: string
  tacticalPlanningId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface TacticalPlanningContextInput {
  contextId: string
  tacticalPlanningId: string
  sessionId?: string
  governance: TacticalGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface TacticalObjectiveInput {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TacticalTaskInput {
  taskId: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'blocked' | 'deferred'
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface TacticalMilestoneInput {
  milestoneId: string
  title: string
  description?: string
  targetDate?: string
  metadata?: Metadata
}

export interface TacticalDependencyInput {
  dependencyId: string
  fromTaskId: string
  toTaskId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface TacticalConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface TacticalResourceInput {
  resourceId: string
  resourceType: 'human' | 'budget' | 'tooling' | 'data' | 'time' | 'other'
  name: string
  quantity?: number
  unit?: string
  metadata?: Metadata
}

export interface TacticalScheduleInput {
  scheduleId: string
  startAt?: string
  endAt?: string
  checkpoints: Array<{
    checkpointId: string
    name: string
    dueAt?: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface TacticalOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface TacticalRecommendationInput {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface TacticalPlanInput {
  planId: string
  tacticalPlanningId: string
  stage: TacticalPlanningStage
  strategicReferences: {
    strategicReasoningId?: string
    strategicPlanningId?: string
    strategicRecommendationIds: string[]
  }
  objectives: TacticalObjectiveInput[]
  tasks: TacticalTaskInput[]
  milestones: TacticalMilestoneInput[]
  dependencies: TacticalDependencyInput[]
  constraints: TacticalConstraintInput[]
  resources: TacticalResourceInput[]
  schedule: TacticalScheduleInput
  outcomes: TacticalOutcomeInput[]
  recommendations: TacticalRecommendationInput[]
  summary: {
    synopsis: string
    highlights: string[]
    risks: string[]
    nextActions: string[]
  }
  metadata?: Metadata
}

export interface DecisionGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface DecisionIntelligenceRegistrationInput {
  decisionIntelligenceId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface DecisionIntelligenceSessionInput {
  sessionId: string
  decisionIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface DecisionIntelligenceContextInput {
  contextId: string
  decisionIntelligenceId: string
  sessionId?: string
  governance: DecisionGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface DecisionCandidateInput {
  candidateId: string
  title: string
  description: string
  confidence: number
  metadata?: Metadata
}

export interface DecisionOptionInput {
  optionId: string
  title: string
  description: string
  status: 'considered' | 'recommended' | 'deferred' | 'rejected'
  confidence: number
  metadata?: Metadata
}

export interface DecisionConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface DecisionRiskInput {
  riskId: string
  title: string
  description: string
  likelihood: number
  impact: number
  mitigation?: string
  metadata?: Metadata
}

export interface DecisionTradeoffInput {
  tradeoffId: string
  title: string
  description: string
  comparedOptions: string[]
  rationale: string
  metadata?: Metadata
}

export interface DecisionImpactInput {
  impactId: string
  area: string
  description: string
  magnitude: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface DecisionRecommendationInput {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface DecisionOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface DecisionSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface DecisionLifecycleStateInput {
  stage: DecisionLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface DecisionPackageInput {
  packageId: string
  decisionIntelligenceId: string
  tacticalReferences: {
    tacticalPlanningId?: string
    tacticalPlanId?: string
    tacticalRecommendationIds: string[]
  }
  candidates: DecisionCandidateInput[]
  options: DecisionOptionInput[]
  constraints: DecisionConstraintInput[]
  risks: DecisionRiskInput[]
  tradeoffs: DecisionTradeoffInput[]
  impacts: DecisionImpactInput[]
  recommendations: DecisionRecommendationInput[]
  outcomes: DecisionOutcomeInput[]
  lifecycleStates: DecisionLifecycleStateInput[]
  summary: DecisionSummaryInput
  metadata?: Metadata
}

export interface ActionGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface ActionIntelligenceRegistrationInput {
  actionIntelligenceId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface ActionIntelligenceSessionInput {
  sessionId: string
  actionIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface ActionIntelligenceContextInput {
  contextId: string
  actionIntelligenceId: string
  sessionId?: string
  governance: ActionGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type ActionPriorityInput = 'low' | 'medium' | 'high' | 'critical'

export interface ActionGroupInput {
  groupId: string
  title: string
  description?: string
  priority: ActionPriorityInput
  metadata?: Metadata
}

export interface ActionItemInput {
  actionItemId: string
  groupId?: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'blocked' | 'deferred'
  priority: ActionPriorityInput
  metadata?: Metadata
}

export interface ActionDependencyInput {
  dependencyId: string
  fromActionItemId: string
  toActionItemId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface ActionConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ActionAssignmentInput {
  assignmentId: string
  actionItemId: string
  assigneeType: 'system' | 'team' | 'user'
  assigneeId: string
  role?: string
  metadata?: Metadata
}

export interface ActionMilestoneInput {
  milestoneId: string
  title: string
  description?: string
  targetDate?: string
  metadata?: Metadata
}

export interface ActionOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface ActionSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ActionLifecycleStateInput {
  stage: ActionLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface ActionPlanInput {
  actionPlanId: string
  actionIntelligenceId: string
  decisionReferences: {
    decisionIntelligenceId?: string
    decisionPackageId?: string
    decisionRecommendationIds: string[]
  }
  groups: ActionGroupInput[]
  actionItems: ActionItemInput[]
  dependencies: ActionDependencyInput[]
  constraints: ActionConstraintInput[]
  assignments: ActionAssignmentInput[]
  milestones: ActionMilestoneInput[]
  outcomes: ActionOutcomeInput[]
  lifecycleStates: ActionLifecycleStateInput[]
  summary: ActionSummaryInput
  metadata?: Metadata
}

export interface ActionReadinessInput {
  actionPlanId: string
  lifecycleStates: ActionLifecycleStateInput[]
  assignments: ActionAssignmentInput[]
  dependencies: ActionDependencyInput[]
  metadata?: Metadata
}

export interface AutonomousWorkflowGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousWorkflowRegistrationInput {
  autonomousWorkflowId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousWorkflowSessionInput {
  sessionId: string
  autonomousWorkflowId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowContextInput {
  contextId: string
  autonomousWorkflowId: string
  sessionId?: string
  governance: AutonomousWorkflowGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface AutonomousWorkflowObjectiveInput {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousWorkflowPhaseInput {
  phaseId: string
  title: string
  description?: string
  order: number
  stepIds: string[]
  metadata?: Metadata
}

export interface AutonomousWorkflowStepInput {
  stepId: string
  title: string
  description: string
  phaseId?: string
  order: number
  status: 'planned' | 'ready' | 'blocked' | 'in-progress' | 'completed'
  metadata?: Metadata
}

export interface AutonomousWorkflowDependencyInput {
  dependencyId: string
  fromStepId: string
  toStepId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface AutonomousWorkflowCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  dueAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowApprovalInput {
  approvalId: string
  title: string
  status: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface AutonomousWorkflowSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface AutonomousWorkflowLifecycleStateInput {
  stage: AutonomousWorkflowLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkflowInput {
  workflowId: string
  autonomousWorkflowId: string
  objectives: AutonomousWorkflowObjectiveInput[]
  phases: AutonomousWorkflowPhaseInput[]
  steps: AutonomousWorkflowStepInput[]
  dependencies: AutonomousWorkflowDependencyInput[]
  constraints: AutonomousWorkflowConstraintInput[]
  checkpoints: AutonomousWorkflowCheckpointInput[]
  approvals: AutonomousWorkflowApprovalInput[]
  outcomes: AutonomousWorkflowOutcomeInput[]
  lifecycleStates: AutonomousWorkflowLifecycleStateInput[]
  summary: AutonomousWorkflowSummaryInput
  metadata?: Metadata
}

export interface AutonomousWorkflowReadinessInput {
  workflowId: string
  lifecycleStates: AutonomousWorkflowLifecycleStateInput[]
  dependencies: AutonomousWorkflowDependencyInput[]
  approvals: AutonomousWorkflowApprovalInput[]
  metadata?: Metadata
}

export interface AutonomousTaskGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousTaskRegistrationInput {
  autonomousTaskId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousTaskSessionInput {
  sessionId: string
  autonomousTaskId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousTaskContextInput {
  contextId: string
  autonomousTaskId: string
  sessionId?: string
  governance: AutonomousTaskGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface AutonomousTaskObjectiveInput {
  objectiveId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousTaskGroupInput {
  groupId: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousTaskTaskInput {
  taskId: string
  groupId?: string
  title: string
  description: string
  status: 'planned' | 'ready' | 'assigned' | 'waiting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousTaskDependencyInput {
  dependencyId: string
  fromTaskId: string
  toTaskId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface AutonomousTaskConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface AutonomousTaskCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  dueAt?: string
  metadata?: Metadata
}

export interface AutonomousTaskAssignmentInput {
  assignmentId: string
  taskId: string
  assigneeType: 'system' | 'team' | 'user'
  assigneeId: string
  role?: string
  metadata?: Metadata
}

export interface AutonomousTaskApprovalInput {
  approvalId: string
  title: string
  status: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: string
  metadata?: Metadata
}

export interface AutonomousTaskOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface AutonomousTaskSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface AutonomousTaskLifecycleStateInput {
  stage: AutonomousTaskLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface AutonomousTaskInput {
  taskPlanId: string
  autonomousTaskId: string
  workflowReferences: {
    autonomousWorkflowId?: string
    workflowId?: string
    workflowStepIds: string[]
  }
  objectives: AutonomousTaskObjectiveInput[]
  groups: AutonomousTaskGroupInput[]
  tasks: AutonomousTaskTaskInput[]
  dependencies: AutonomousTaskDependencyInput[]
  constraints: AutonomousTaskConstraintInput[]
  checkpoints: AutonomousTaskCheckpointInput[]
  assignments: AutonomousTaskAssignmentInput[]
  approvals: AutonomousTaskApprovalInput[]
  outcomes: AutonomousTaskOutcomeInput[]
  lifecycleStates: AutonomousTaskLifecycleStateInput[]
  summary: AutonomousTaskSummaryInput
  metadata?: Metadata
}

export interface AutonomousTaskReadinessInput {
  taskPlanId: string
  lifecycleStates: AutonomousTaskLifecycleStateInput[]
  dependencies: AutonomousTaskDependencyInput[]
  assignments: AutonomousTaskAssignmentInput[]
  metadata?: Metadata
}

export interface AutonomousAgentGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousAgentRegistrationInput {
  autonomousAgentId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousAgentSessionInput {
  sessionId: string
  autonomousAgentId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousAgentContextInput {
  contextId: string
  autonomousAgentId: string
  sessionId?: string
  governance: AutonomousAgentGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface AutonomousAgentRoleInput {
  roleId: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface AutonomousAgentCapabilityInput {
  capabilityId: string
  name: string
  description: string
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  metadata?: Metadata
}

export interface AgentAssignmentInput {
  assignmentId: string
  agentId: string
  taskReference: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskId?: string
  }
  role: string
  status: 'pending' | 'assigned' | 'active' | 'completed' | 'blocked'
  metadata?: Metadata
}

export interface AutonomousAgentResponsibilityInput {
  responsibilityId: string
  title: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface AutonomousAgentDependencyInput {
  dependencyId: string
  fromAgentId: string
  toAgentId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface AutonomousAgentCommunicationInput {
  communicationId: string
  fromAgentId: string
  toAgentId: string
  channel: 'system' | 'event' | 'message' | 'review'
  subject: string
  status: 'queued' | 'sent' | 'acknowledged' | 'failed'
  createdAt: string
  metadata?: Metadata
}

export interface AutonomousAgentDecisionInput {
  decisionId: string
  title: string
  rationale: string
  confidence: number
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface AutonomousAgentOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface AutonomousAgentSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface AutonomousAgentInput {
  agentId: string
  autonomousAgentId: string
  name: string
  roleIds: string[]
  capabilityIds: string[]
  assignmentIds: string[]
  responsibilityIds: string[]
  status: 'registered' | 'available' | 'assigned' | 'working' | 'waiting' | 'reviewing' | 'completed' | 'suspended' | 'failed' | 'retired'
  metadata?: Metadata
}

export interface AutonomousAgentLifecycleStateInput {
  stage: AutonomousAgentLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface CoordinationGroupInput {
  groupId: string
  name: string
  description?: string
  agentIds: string[]
  metadata?: Metadata
}

export interface CoordinationQueueInput {
  queueId: string
  name: string
  assignmentIds: string[]
  policy: 'fifo' | 'priority' | 'dependency-aware'
  metadata?: Metadata
}

export interface CoordinationCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  dueAt?: string
  metadata?: Metadata
}

export interface CoordinationDependencyInput {
  dependencyId: string
  fromAssignmentId: string
  toAssignmentId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface CoordinationConflictInput {
  conflictId: string
  type: 'ownership' | 'assignment' | 'dependency' | 'priority' | 'capacity'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-review' | 'resolved'
  metadata?: Metadata
}

export interface CoordinationResolutionInput {
  resolutionId: string
  conflictId: string
  action: string
  rationale: string
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface CoordinationAuditInput {
  auditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface CoordinationPlanInput {
  coordinationPlanId: string
  autonomousAgentId: string
  taskReferences: {
    autonomousTaskId?: string
    taskPlanId?: string
    taskIds: string[]
  }
  agents: AutonomousAgentInput[]
  roles: AutonomousAgentRoleInput[]
  capabilities: AutonomousAgentCapabilityInput[]
  assignments: AgentAssignmentInput[]
  responsibilities: AutonomousAgentResponsibilityInput[]
  dependencies: AutonomousAgentDependencyInput[]
  communications: AutonomousAgentCommunicationInput[]
  decisions: AutonomousAgentDecisionInput[]
  outcomes: AutonomousAgentOutcomeInput[]
  lifecycleStates: AutonomousAgentLifecycleStateInput[]
  coordinationGroups: CoordinationGroupInput[]
  coordinationQueues: CoordinationQueueInput[]
  coordinationCheckpoints: CoordinationCheckpointInput[]
  coordinationDependencies: CoordinationDependencyInput[]
  coordinationConflicts: CoordinationConflictInput[]
  coordinationResolutions: CoordinationResolutionInput[]
  coordinationAudit: CoordinationAuditInput
  summary: AutonomousAgentSummaryInput
  metadata?: Metadata
}

export interface AutonomousProjectGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousProjectRegistrationInput {
  autonomousProjectId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousProjectSessionInput {
  sessionId: string
  autonomousProjectId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousProjectContextInput {
  contextId: string
  autonomousProjectId: string
  sessionId?: string
  governance: AutonomousProjectGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface ProjectPortfolioInput {
  portfolioId: string
  name: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface ProjectMilestoneInput {
  milestoneId: string
  title: string
  description?: string
  dueAt?: string
  status: 'planned' | 'in-progress' | 'completed' | 'blocked' | 'cancelled'
  metadata?: Metadata
}

export interface ProjectDependencyInput {
  dependencyId: string
  fromMilestoneId: string
  toMilestoneId: string
  type: 'hard' | 'soft' | 'ordering'
  rationale?: string
  metadata?: Metadata
}

export interface ProjectConstraintInput {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface ProjectResourceInput {
  resourceId: string
  name: string
  category: 'budget' | 'capacity' | 'tooling' | 'infrastructure' | 'knowledge'
  allocation: number
  unit: string
  metadata?: Metadata
}

export interface ProjectRiskInput {
  riskId: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'low' | 'medium' | 'high'
  status: 'open' | 'monitoring' | 'mitigated' | 'accepted' | 'closed'
  metadata?: Metadata
}

export interface ProjectDecisionInput {
  decisionId: string
  title: string
  rationale: string
  confidence: number
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred'
  metadata?: Metadata
}

export interface ProjectOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface AutonomousProjectSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface AutonomousProjectLifecycleStateInput {
  stage: AutonomousProjectLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface AutonomousProjectInput {
  projectPlanId: string
  autonomousProjectId: string
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
  portfolios: ProjectPortfolioInput[]
  milestones: ProjectMilestoneInput[]
  dependencies: ProjectDependencyInput[]
  constraints: ProjectConstraintInput[]
  resources: ProjectResourceInput[]
  risks: ProjectRiskInput[]
  decisions: ProjectDecisionInput[]
  outcomes: ProjectOutcomeInput[]
  lifecycleStates: AutonomousProjectLifecycleStateInput[]
  summary: AutonomousProjectSummaryInput
  metadata?: Metadata
}

export interface ProjectCoordinationInput {
  projectCoordinationId: string
  autonomousProjectId: string
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
  milestones: ProjectMilestoneInput[]
  dependencies: ProjectDependencyInput[]
  risks: ProjectRiskInput[]
  decisions: ProjectDecisionInput[]
  outcomes: ProjectOutcomeInput[]
  summary: AutonomousProjectSummaryInput
  metadata?: Metadata
}

export interface AutonomousWorkspaceGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousWorkspaceRegistrationInput {
  autonomousWorkspaceId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousWorkspaceSessionInput {
  sessionId: string
  autonomousWorkspaceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkspaceContextInput {
  contextId: string
  autonomousWorkspaceId: string
  sessionId?: string
  governance: AutonomousWorkspaceGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface WorkspaceProfileInput {
  profileId: string
  name: string
  description?: string
  type: 'local' | 'remote' | 'container' | 'hybrid'
  metadata?: Metadata
}

export interface WorkspaceEnvironmentInput {
  environmentId: string
  name: string
  osFamily: 'windows' | 'linux' | 'macos' | 'unknown'
  variables: Array<{
    key: string
    value: string
    masked?: boolean
  }>
  metadata?: Metadata
}

export interface WorkspaceLayoutInput {
  layoutId: string
  name: string
  windowIds: string[]
  terminalIds: string[]
  browserIds: string[]
  metadata?: Metadata
}

export interface IDEInstanceInput {
  ideId: string
  type: 'vscode' | 'visual-studio' | 'jetbrains' | 'other'
  status: 'starting' | 'ready' | 'busy' | 'inactive' | 'failed'
  workspaceRoots: string[]
  metadata?: Metadata
}

export interface TerminalInstanceInput {
  terminalId: string
  shell: string
  status: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  cwd?: string
  metadata?: Metadata
}

export interface BrowserInstanceInput {
  browserId: string
  type: 'chromium' | 'firefox' | 'webkit' | 'other'
  status: 'starting' | 'ready' | 'busy' | 'closed' | 'failed'
  tabCount: number
  metadata?: Metadata
}

export interface ApplicationInstanceInput {
  applicationId: string
  name: string
  category: 'ide' | 'terminal' | 'browser' | 'tool' | 'service' | 'other'
  status: 'installed' | 'available' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface WindowInstanceInput {
  windowId: string
  title: string
  applicationId: string
  status: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface WorkspaceProcessInput {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'starting' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface WorkspaceServiceInput {
  serviceId: string
  name: string
  type: 'runtime' | 'tooling' | 'integration' | 'monitoring' | 'other'
  status: 'registered' | 'available' | 'degraded' | 'unavailable'
  metadata?: Metadata
}

export interface WorkspaceConnectionInput {
  connectionId: string
  fromResourceId: string
  toResourceId: string
  type: 'dependency' | 'integration' | 'communication' | 'data'
  status: 'active' | 'inactive' | 'degraded' | 'failed'
  metadata?: Metadata
}

export interface WorkspaceDependencyInput {
  dependencyId: string
  fromResourceId: string
  toResourceId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface WorkspaceCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface WorkspaceResourceInput {
  workspaceResourceId: string
  autonomousWorkspaceId: string
  ideInstances: IDEInstanceInput[]
  terminalInstances: TerminalInstanceInput[]
  browserInstances: BrowserInstanceInput[]
  applicationInstances: ApplicationInstanceInput[]
  windowInstances: WindowInstanceInput[]
  workspaceProcesses: WorkspaceProcessInput[]
  workspaceServices: WorkspaceServiceInput[]
  workspaceConnections: WorkspaceConnectionInput[]
  workspaceDependencies: WorkspaceDependencyInput[]
  workspaceCheckpoints: WorkspaceCheckpointInput[]
  metadata?: Metadata
}

export interface WorkspaceResourceModelInput {
  resourceId: string
  name: string
  category: 'ide' | 'terminal' | 'browser' | 'application' | 'process' | 'service' | 'connection' | 'dependency' | 'checkpoint'
  status: 'registered' | 'available' | 'active' | 'inactive' | 'failed'
  metadata?: Metadata
}

export type WorkspaceStateInput =
  | 'workspace-created'
  | 'workspace-configured'
  | 'workspace-ready'
  | 'workspace-active'
  | 'workspace-suspended'
  | 'workspace-restored'
  | 'workspace-archived'
  | 'workspace-closed'
  | 'workspace-failed'
  | 'workspace-recovered'

export interface WorkspaceOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface WorkspaceSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WorkspaceSessionInput {
  workspaceSessionId: string
  autonomousWorkspaceId: string
  state: WorkspaceStateInput
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface AutonomousWorkspaceLifecycleStateInput {
  stage: AutonomousWorkspaceLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface WorkspaceConfigurationInput {
  workspaceConfigurationId: string
  autonomousWorkspaceId: string
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
  profile: WorkspaceProfileInput
  environment: WorkspaceEnvironmentInput
  layout: WorkspaceLayoutInput
  resources: WorkspaceResourceModelInput[]
  resourceSnapshot: WorkspaceResourceInput
  governance: AutonomousWorkspaceGovernanceInput
  summary: WorkspaceSummaryInput
  metadata?: Metadata
}

export interface WorkspaceSnapshotInput {
  workspaceSnapshotId: string
  autonomousWorkspaceId: string
  workspaceConfigurationId: string
  workspaceSessionId?: string
  state?: WorkspaceStateInput
  lifecycleStates: AutonomousWorkspaceLifecycleStateInput[]
  outcomes: WorkspaceOutcomeInput[]
  summary: WorkspaceSummaryInput
  capturedAt: string
  metadata?: Metadata
}

export interface AutonomousRecoveryGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface AutonomousRecoveryRegistrationInput {
  autonomousRecoveryId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface AutonomousRecoverySessionInput {
  sessionId: string
  autonomousRecoveryId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface AutonomousRecoveryContextInput {
  contextId: string
  autonomousRecoveryId: string
  sessionId?: string
  governance: AutonomousRecoveryGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type RecoveryStateInput =
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

export interface RecoveryDependencyInput {
  dependencyId: string
  fromStepId: string
  toStepId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface RecoveryStrategyInput {
  strategyId: string
  name: string
  type: 'state-restore' | 'session-continuity' | 'workspace-rebuild' | 'service-restart' | 'resume-orchestration'
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Metadata
}

export interface RecoveryCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface RecoveryTimelineInput {
  timelineId: string
  events: Array<{
    eventId: string
    stage: RecoveryStateInput
    occurredAt: string
    description: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface RecoveryRecommendationInput {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface RecoveryOutcomeInput {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface RecoverySummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface SessionSnapshotInput {
  sessionSnapshotId: string
  autonomousRecoveryId: string
  workspaceSessionId?: string
  recoverySessionId?: string
  state: RecoveryStateInput
  capturedAt: string
  metadata?: Metadata
}

export interface SessionRestorePointInput {
  restorePointId: string
  sessionSnapshotId: string
  createdAt: string
  consistencyStatus: 'verified' | 'partial' | 'unknown'
  metadata?: Metadata
}

export interface WorkspaceRestorePlanInput {
  workspaceRestorePlanId: string
  workspaceReferences: {
    autonomousWorkspaceId?: string
    workspaceConfigurationId?: string
    workspaceSnapshotId?: string
  }
  targetState: 'workspace-ready' | 'workspace-active' | 'workspace-restored'
  metadata?: Metadata
}

export interface RuntimeRestorePlanInput {
  runtimeRestorePlanId: string
  runtimeScope: Array<'kernel' | 'registry' | 'validation' | 'health' | 'service-registry'>
  targetState: 'prepared' | 'ready' | 'validated'
  metadata?: Metadata
}

export interface ServiceRestorePlanInput {
  serviceRestorePlanId: string
  serviceIds: string[]
  strategy: 're-register' | 'rebind' | 'reload-state'
  metadata?: Metadata
}

export interface ExecutionResumePlanInput {
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

export interface ContinuityAuditInput {
  continuityAuditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface SessionContinuityPlanInput {
  sessionContinuityPlanId: string
  autonomousRecoveryId: string
  sessionSnapshots: SessionSnapshotInput[]
  sessionRestorePoints: SessionRestorePointInput[]
  workspaceRestorePlan: WorkspaceRestorePlanInput
  runtimeRestorePlan: RuntimeRestorePlanInput
  serviceRestorePlan: ServiceRestorePlanInput
  executionResumePlan: ExecutionResumePlanInput
  continuityAudit: ContinuityAuditInput
  summary: RecoverySummaryInput
  metadata?: Metadata
}

export interface RecoveryPlanInput {
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
  state: RecoveryStateInput
  dependencies: RecoveryDependencyInput[]
  strategies: RecoveryStrategyInput[]
  timeline: RecoveryTimelineInput
  checkpoints: RecoveryCheckpointInput[]
  recommendations: RecoveryRecommendationInput[]
  outcomes: RecoveryOutcomeInput[]
  summary: RecoverySummaryInput
  metadata?: Metadata
}

export interface AutonomousRecoveryLifecycleStateInput {
  stage: AutonomousRecoveryLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface RecoverySnapshotInput {
  recoverySnapshotId: string
  autonomousRecoveryId: string
  recoveryPlanId: string
  recoveryState?: RecoveryStateInput
  lifecycleStates: AutonomousRecoveryLifecycleStateInput[]
  capturedAt: string
  summary: RecoverySummaryInput
  metadata?: Metadata
}

export interface DesktopIntegrationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface DesktopIntegrationRegistrationInput {
  desktopIntegrationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface DesktopIntegrationSessionInput {
  sessionId: string
  desktopIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface DesktopIntegrationContextInput {
  contextId: string
  desktopIntegrationId: string
  sessionId?: string
  governance: DesktopIntegrationGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface DesktopProfileInput {
  profileId: string
  name: string
  description?: string
  type: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface DesktopEnvironmentInput {
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

export interface DesktopApplicationInput {
  applicationId: string
  name: string
  kind: 'ide' | 'browser' | 'terminal' | 'scm' | 'container' | 'database' | 'tool' | 'other'
  version?: string
  status: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface DesktopWorkspaceInput {
  workspaceId: string
  name: string
  rootPaths: string[]
  status: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface DesktopWindowInput {
  windowId: string
  title: string
  applicationId: string
  status: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export type DesktopIntegrationStateInput =
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

export interface DesktopSessionInput {
  desktopSessionId: string
  desktopIntegrationId: string
  state: DesktopIntegrationStateInput
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface DesktopProcessInput {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface DesktopCapabilityInput {
  capabilityId: string
  name: string
  targetType: 'ide' | 'browser' | 'terminal' | 'application' | 'service' | 'process' | 'workspace' | 'window' | 'automation'
  supported: boolean
  metadata?: Metadata
}

export interface DesktopSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface IDETargetInput {
  targetId: string
  ideType: 'vscode' | 'visual-studio' | 'jetbrains' | 'other'
  workspaceIds: string[]
  metadata?: Metadata
}

export interface BrowserTargetInput {
  targetId: string
  browserType: 'chromium' | 'firefox' | 'webkit' | 'other'
  profileId?: string
  metadata?: Metadata
}

export interface TerminalTargetInput {
  targetId: string
  shell: string
  sessionIds: string[]
  metadata?: Metadata
}

export interface ApplicationTargetInput {
  targetId: string
  applicationId: string
  kind: 'ide' | 'browser' | 'terminal' | 'scm' | 'container' | 'database' | 'tool' | 'other'
  metadata?: Metadata
}

export interface ServiceTargetInput {
  targetId: string
  serviceId: string
  type: 'runtime' | 'integration' | 'tooling' | 'monitoring' | 'other'
  metadata?: Metadata
}

export interface ProcessTargetInput {
  targetId: string
  processId: string
  processName: string
  metadata?: Metadata
}

export interface WorkspaceTargetInput {
  targetId: string
  workspaceId: string
  roots: string[]
  metadata?: Metadata
}

export interface WindowTargetInput {
  targetId: string
  windowId: string
  applicationId: string
  metadata?: Metadata
}

export interface AutomationTargetInput {
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

export interface IntegrationDependencyInput {
  dependencyId: string
  fromTargetId: string
  toTargetId: string
  type: 'hard' | 'soft' | 'ordering'
  metadata?: Metadata
}

export interface IntegrationTargetInput {
  integrationTargetId: string
  desktopIntegrationId: string
  ideTargets: IDETargetInput[]
  browserTargets: BrowserTargetInput[]
  terminalTargets: TerminalTargetInput[]
  applicationTargets: ApplicationTargetInput[]
  serviceTargets: ServiceTargetInput[]
  processTargets: ProcessTargetInput[]
  workspaceTargets: WorkspaceTargetInput[]
  windowTargets: WindowTargetInput[]
  automationTargets: AutomationTargetInput[]
  dependencies: IntegrationDependencyInput[]
  metadata?: Metadata
}

export interface DesktopConfigurationInput {
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
  profile: DesktopProfileInput
  environment: DesktopEnvironmentInput
  applications: DesktopApplicationInput[]
  workspaces: DesktopWorkspaceInput[]
  windows: DesktopWindowInput[]
  processes: DesktopProcessInput[]
  sessions: DesktopSessionInput[]
  capabilities: DesktopCapabilityInput[]
  targets: IntegrationTargetInput
  governance: DesktopIntegrationGovernanceInput
  summary: DesktopSummaryInput
  metadata?: Metadata
}

export interface DesktopIntegrationLifecycleStateInput {
  stage: DesktopIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface IDEIntegrationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface IDEIntegrationRegistrationInput {
  ideIntegrationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface IDEIntegrationSessionInput {
  sessionId: string
  ideIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface IDEIntegrationContextInput {
  contextId: string
  ideIntegrationId: string
  sessionId?: string
  governance: IDEIntegrationGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface IDEProfileInput {
  profileId: string
  name: string
  description?: string
  ideType: 'vscode' | 'cursor' | 'visual-studio' | 'jetbrains' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface IDEWorkspaceInput {
  workspaceId: string
  name: string
  rootPaths: string[]
  state: 'registered' | 'available' | 'prepared' | 'ready' | 'connected' | 'suspended' | 'disconnected' | 'failed' | 'archived'
  metadata?: Metadata
}

export interface IDEProjectInput {
  projectId: string
  name: string
  workspaceId: string
  projectType: 'application' | 'library' | 'service' | 'tooling' | 'other'
  metadata?: Metadata
}

export interface IDEWindowInput {
  windowId: string
  workspaceId?: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface IDEEditorInput {
  editorId: string
  windowId: string
  language?: string
  state: 'active' | 'inactive' | 'split' | 'preview' | 'closed'
  metadata?: Metadata
}

export interface IDETerminalInput {
  ideTerminalId: string
  windowId?: string
  shell: string
  state: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  metadata?: Metadata
}

export interface IDEExtensionInput {
  extensionId: string
  name: string
  publisher?: string
  version?: string
  state: 'registered' | 'enabled' | 'disabled' | 'error'
  metadata?: Metadata
}

export interface IDECapabilityInput {
  capabilityId: string
  name: string
  category: 'editing' | 'terminal' | 'debugging' | 'automation' | 'workspace' | 'extension' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface IDESummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WorkspaceFolderInput {
  folderId: string
  workspaceId: string
  path: string
  name: string
  metadata?: Metadata
}

export interface OpenFileInput {
  fileId: string
  workspaceId: string
  path: string
  language?: string
  isDirty: boolean
  metadata?: Metadata
}

export interface EditorGroupInput {
  editorGroupId: string
  windowId: string
  position: 'left' | 'center' | 'right' | 'top' | 'bottom'
  fileIds: string[]
  metadata?: Metadata
}

export interface CursorPositionInput {
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

export interface BreakpointInput {
  breakpointId: string
  fileId: string
  line: number
  column?: number
  condition?: string
  enabled: boolean
  metadata?: Metadata
}

export interface TerminalSessionInput {
  terminalSessionId: string
  ideTerminalId: string
  state: 'idle' | 'running' | 'blocked' | 'closed' | 'failed'
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface DebugSessionInput {
  debugSessionId: string
  workspaceId: string
  state: 'created' | 'running' | 'paused' | 'stopped' | 'failed'
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface TaskRunnerInput {
  taskRunnerId: string
  workspaceId: string
  name: string
  state: 'registered' | 'ready' | 'running' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface IDEProcessInput {
  processId: string
  name: string
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  status: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface IDECheckpointInput {
  checkpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface IDEResourceInput {
  ideResourceId: string
  ideIntegrationId: string
  workspaceFolders: WorkspaceFolderInput[]
  openFiles: OpenFileInput[]
  editorGroups: EditorGroupInput[]
  cursorPositions: CursorPositionInput[]
  breakpoints: BreakpointInput[]
  terminalSessions: TerminalSessionInput[]
  debugSessions: DebugSessionInput[]
  taskRunners: TaskRunnerInput[]
  ideProcesses: IDEProcessInput[]
  ideCheckpoints: IDECheckpointInput[]
  metadata?: Metadata
}

export type IDEStateInput =
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

export interface IDEConfigurationInput {
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
  profile: IDEProfileInput
  workspaces: IDEWorkspaceInput[]
  projects: IDEProjectInput[]
  windows: IDEWindowInput[]
  editors: IDEEditorInput[]
  terminals: IDETerminalInput[]
  extensions: IDEExtensionInput[]
  capabilities: IDECapabilityInput[]
  governance: IDEIntegrationGovernanceInput
  resourceModel: IDEResourceInput
  summary: IDESummaryInput
  metadata?: Metadata
}

export interface IDELifecycleStateInput {
  stage: IDEIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface TerminalIntegrationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface TerminalIntegrationRegistrationInput {
  terminalIntegrationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface TerminalIntegrationSessionInput {
  sessionId: string
  terminalIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface TerminalIntegrationContextInput {
  contextId: string
  terminalIntegrationId: string
  sessionId?: string
  governance: TerminalIntegrationGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface TerminalProfileInput {
  profileId: string
  name: string
  description?: string
  terminalType: 'integrated' | 'external' | 'remote' | 'virtual' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface TerminalEnvironmentInput {
  environmentId: string
  name: string
  shellFamily: 'powershell' | 'cmd' | 'bash' | 'zsh' | 'fish' | 'wsl' | 'other'
  platform: 'windows' | 'linux' | 'macos' | 'unknown'
  metadata?: Metadata
}

export type TerminalStateInput =
  | 'terminal-registered'
  | 'terminal-available'
  | 'terminal-prepared'
  | 'terminal-ready'
  | 'terminal-connected'
  | 'terminal-busy'
  | 'terminal-waiting'
  | 'terminal-suspended'
  | 'terminal-failed'
  | 'terminal-archived'

export interface TerminalWorkspaceInput {
  workspaceId: string
  name: string
  rootPaths: string[]
  state: TerminalStateInput
  metadata?: Metadata
}

export interface TerminalWindowInput {
  windowId: string
  workspaceId?: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface TerminalInstanceInput {
  terminalInstanceId: string
  windowId?: string
  shell: string
  state: TerminalStateInput
  metadata?: Metadata
}

export interface TerminalCapabilityInput {
  capabilityId: string
  name: string
  category: 'shell' | 'session' | 'queue' | 'history' | 'buffer' | 'snapshot' | 'integration' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface TerminalShellInput {
  shellId: string
  name: string
  family: 'powershell' | 'cmd' | 'bash' | 'zsh' | 'fish' | 'wsl' | 'other'
  executable?: string
  metadata?: Metadata
}

export interface TerminalCommandInput {
  commandId: string
  commandText: string
  source: 'manual' | 'automation' | 'system'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  metadata?: Metadata
}

export interface TerminalSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ShellSessionInput {
  shellSessionId: string
  terminalInstanceId: string
  shellId: string
  state: 'created' | 'active' | 'idle' | 'closed' | 'failed'
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface ShellProfileInput {
  shellProfileId: string
  shellId: string
  profileName: string
  initScriptPath?: string
  metadata?: Metadata
}

export interface CommandQueueInput {
  queueId: string
  terminalInstanceId: string
  pendingCommandIds: string[]
  blocked: boolean
  metadata?: Metadata
}

export interface CommandHistoryInput {
  historyId: string
  terminalInstanceId: string
  commandIds: string[]
  retainedEntries: number
  metadata?: Metadata
}

export interface WorkingDirectoryInput {
  workingDirectoryId: string
  terminalInstanceId: string
  path: string
  exists: boolean
  metadata?: Metadata
}

export interface EnvironmentVariableInput {
  variableId: string
  key: string
  value: string
  masked?: boolean
  source?: 'system' | 'profile' | 'session' | 'runtime'
  metadata?: Metadata
}

export interface ProcessHandleInput {
  processHandleId: string
  processId: string
  name: string
  state: 'registered' | 'running' | 'suspended' | 'stopped' | 'failed'
  metadata?: Metadata
}

export interface ConsoleBufferInput {
  bufferId: string
  terminalInstanceId: string
  lineCount: number
  truncated: boolean
  metadata?: Metadata
}

export interface TerminalCheckpointInput {
  checkpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface TerminalSnapshotInput {
  terminalSnapshotId: string
  terminalIntegrationId: string
  terminalConfigurationId?: string
  state?: TerminalStateInput
  capturedAt: string
  metadata?: Metadata
}

export interface TerminalResourceInput {
  terminalResourceId: string
  terminalIntegrationId: string
  shellSessions: ShellSessionInput[]
  shellProfiles: ShellProfileInput[]
  commandQueues: CommandQueueInput[]
  commandHistories: CommandHistoryInput[]
  workingDirectories: WorkingDirectoryInput[]
  environmentVariables: EnvironmentVariableInput[]
  processHandles: ProcessHandleInput[]
  consoleBuffers: ConsoleBufferInput[]
  terminalCheckpoints: TerminalCheckpointInput[]
  terminalSnapshots: TerminalSnapshotInput[]
  metadata?: Metadata
}

export interface TerminalConfigurationInput {
  terminalConfigurationId: string
  terminalIntegrationId: string
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
  profile: TerminalProfileInput
  environment: TerminalEnvironmentInput
  workspaces: TerminalWorkspaceInput[]
  windows: TerminalWindowInput[]
  terminalInstances: TerminalInstanceInput[]
  capabilities: TerminalCapabilityInput[]
  shells: TerminalShellInput[]
  commands: TerminalCommandInput[]
  governance: TerminalIntegrationGovernanceInput
  resourceModel: TerminalResourceInput
  summary: TerminalSummaryInput
  metadata?: Metadata
}

export interface TerminalLifecycleStateInput {
  stage: TerminalIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface BrowserIntegrationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface BrowserIntegrationRegistrationInput {
  browserIntegrationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface BrowserIntegrationSessionInput {
  sessionId: string
  browserIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface BrowserIntegrationContextInput {
  contextId: string
  browserIntegrationId: string
  sessionId?: string
  governance: BrowserIntegrationGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export interface BrowserProfileInput {
  profileId: string
  name: string
  description?: string
  browserType: 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'other'
  mode: 'local' | 'remote' | 'hybrid'
  metadata?: Metadata
}

export interface BrowserEnvironmentInput {
  environmentId: string
  name: string
  platform: 'windows' | 'linux' | 'macos' | 'unknown'
  runtimeMode: 'headed' | 'headless' | 'virtual'
  metadata?: Metadata
}

export type BrowserStateInput =
  | 'browser-registered'
  | 'browser-available'
  | 'browser-prepared'
  | 'browser-ready'
  | 'browser-connected'
  | 'browser-active'
  | 'browser-suspended'
  | 'browser-disconnected'
  | 'browser-failed'
  | 'browser-archived'

export interface BrowserWindowInput {
  browserWindowId: string
  title: string
  state: 'visible' | 'hidden' | 'focused' | 'minimized' | 'closed'
  metadata?: Metadata
}

export interface BrowserSessionInput {
  browserSessionId: string
  browserIntegrationId: string
  state: BrowserStateInput
  startedAt: string
  endedAt?: string
  metadata?: Metadata
}

export interface BrowserTabInput {
  browserTabId: string
  browserWindowId: string
  title?: string
  url?: string
  state: 'open' | 'active' | 'inactive' | 'loading' | 'suspended' | 'closed'
  metadata?: Metadata
}

export interface BrowserCapabilityInput {
  capabilityId: string
  name: string
  category: 'navigation' | 'storage' | 'network' | 'devtools' | 'session' | 'extension' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface BrowserExtensionInput {
  extensionId: string
  name: string
  publisher?: string
  version?: string
  state: 'registered' | 'enabled' | 'disabled' | 'error'
  metadata?: Metadata
}

export interface BrowserBookmarkInput {
  bookmarkId: string
  title: string
  url: string
  folder?: string
  metadata?: Metadata
}

export interface BrowserSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface WebPageInput {
  webPageId: string
  browserTabId: string
  title?: string
  url: string
  contentType?: string
  metadata?: Metadata
}

export interface URLReferenceInput {
  urlReferenceId: string
  url: string
  sourceType: 'bookmark' | 'navigation' | 'redirect' | 'manual' | 'other'
  metadata?: Metadata
}

export interface NavigationHistoryInput {
  navigationHistoryId: string
  browserTabId: string
  entries: Array<{
    entryId: string
    url: string
    title?: string
    visitedAt: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface CookieStoreInput {
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

export interface LocalStorageReferenceInput {
  localStorageReferenceId: string
  origin: string
  keys: string[]
  metadata?: Metadata
}

export interface SessionStorageReferenceInput {
  sessionStorageReferenceId: string
  origin: string
  browserTabId: string
  keys: string[]
  metadata?: Metadata
}

export interface BrowserDeveloperToolsInput {
  developerToolsId: string
  browserTabId: string
  panels: Array<'elements' | 'console' | 'network' | 'sources' | 'performance' | 'application' | 'security' | 'memory' | 'other'>
  isOpen: boolean
  metadata?: Metadata
}

export interface BrowserNetworkSessionInput {
  browserNetworkSessionId: string
  browserSessionId: string
  status: 'active' | 'paused' | 'stopped' | 'failed'
  capturedRequests: number
  capturedResponses: number
  metadata?: Metadata
}

export interface BrowserCheckpointInput {
  browserCheckpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface BrowserSnapshotInput {
  browserSnapshotId: string
  browserIntegrationId: string
  browserConfigurationId?: string
  state?: BrowserStateInput
  capturedAt: string
  metadata?: Metadata
}

export interface BrowserResourceInput {
  browserResourceId: string
  browserIntegrationId: string
  webPages: WebPageInput[]
  urlReferences: URLReferenceInput[]
  navigationHistories: NavigationHistoryInput[]
  cookieStores: CookieStoreInput[]
  localStorageReferences: LocalStorageReferenceInput[]
  sessionStorageReferences: SessionStorageReferenceInput[]
  browserDeveloperTools: BrowserDeveloperToolsInput[]
  browserNetworkSessions: BrowserNetworkSessionInput[]
  browserCheckpoints: BrowserCheckpointInput[]
  browserSnapshots: BrowserSnapshotInput[]
  metadata?: Metadata
}

export interface BrowserConfigurationInput {
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
  profile: BrowserProfileInput
  environment: BrowserEnvironmentInput
  browserWindows: BrowserWindowInput[]
  browserSessions: BrowserSessionInput[]
  browserTabs: BrowserTabInput[]
  capabilities: BrowserCapabilityInput[]
  browserExtensions: BrowserExtensionInput[]
  browserBookmarks: BrowserBookmarkInput[]
  governance: BrowserIntegrationGovernanceInput
  resourceModel: BrowserResourceInput
  summary: BrowserSummaryInput
  metadata?: Metadata
}

export interface BrowserLifecycleStateInput {
  stage: BrowserIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface GitIntegrationGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface GitIntegrationRegistrationInput {
  gitIntegrationId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface GitIntegrationSessionInput {
  sessionId: string
  gitIntegrationId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface GitIntegrationContextInput {
  contextId: string
  gitIntegrationId: string
  sessionId?: string
  governance: GitIntegrationGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type GitStateInput =
  | 'repository-registered'
  | 'repository-available'
  | 'repository-prepared'
  | 'repository-ready'
  | 'repository-active'
  | 'repository-sync-pending'
  | 'repository-suspended'
  | 'repository-archived'
  | 'repository-failed'
  | 'repository-recovered'

export interface GitRepositoryInput {
  repositoryId: string
  name: string
  rootPath: string
  defaultBranch: string
  state: GitStateInput
  metadata?: Metadata
}

export interface GitBranchInput {
  branchId: string
  repositoryId: string
  name: string
  isDefault: boolean
  isProtected: boolean
  headCommitId?: string
  metadata?: Metadata
}

export interface GitCommitInput {
  commitId: string
  repositoryId: string
  hash: string
  author: string
  message: string
  committedAt: string
  parentCommitIds: string[]
  metadata?: Metadata
}

export interface GitTagInput {
  tagId: string
  repositoryId: string
  name: string
  targetCommitId: string
  annotated: boolean
  metadata?: Metadata
}

export interface GitRemoteInput {
  remoteId: string
  repositoryId: string
  name: string
  url: string
  default: boolean
  metadata?: Metadata
}

export interface GitWorkspaceInput {
  workspaceId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface GitCapabilityInput {
  capabilityId: string
  name: string
  category: 'branch' | 'commit' | 'merge' | 'remote' | 'history' | 'workspace' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface GitIdentityInput {
  identityId: string
  displayName: string
  email: string
  signingKeyId?: string
  metadata?: Metadata
}

export interface GitSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface StagingAreaInput {
  stagingAreaId: string
  repositoryId: string
  stagedFileIds: string[]
  unstagedFileIds: string[]
  metadata?: Metadata
}

export interface CommitHistoryInput {
  commitHistoryId: string
  repositoryId: string
  commitIds: string[]
  metadata?: Metadata
}

export interface BranchGraphInput {
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

export interface MergeRequestInput {
  mergeRequestId: string
  repositoryId: string
  sourceBranchId: string
  targetBranchId: string
  status: 'open' | 'approved' | 'merged' | 'closed' | 'rejected'
  metadata?: Metadata
}

export interface MergeConflictInput {
  mergeConflictId: string
  repositoryId: string
  filePath: string
  conflictType: 'content' | 'rename' | 'delete-modify' | 'binary' | 'other'
  status: 'detected' | 'resolved' | 'unresolved'
  metadata?: Metadata
}

export interface RepositorySnapshotInput {
  repositorySnapshotId: string
  repositoryId: string
  branchId?: string
  commitId?: string
  capturedAt: string
  metadata?: Metadata
}

export interface FileChangeInput {
  fileChangeId: string
  repositoryId: string
  path: string
  changeType: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  staged: boolean
  metadata?: Metadata
}

export interface WorkingTreeInput {
  workingTreeId: string
  repositoryId: string
  clean: boolean
  fileChanges: FileChangeInput[]
  metadata?: Metadata
}

export interface GitCheckpointInput {
  gitCheckpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface RepositoryStateInput {
  repositoryStateId: string
  repositoryId: string
  branchId?: string
  headCommitId?: string
  state: GitStateInput
  metadata?: Metadata
}

export interface GitResourceInput {
  gitResourceId: string
  gitIntegrationId: string
  stagingAreas: StagingAreaInput[]
  commitHistories: CommitHistoryInput[]
  branchGraphs: BranchGraphInput[]
  mergeRequests: MergeRequestInput[]
  mergeConflicts: MergeConflictInput[]
  repositorySnapshots: RepositorySnapshotInput[]
  workingTrees: WorkingTreeInput[]
  gitCheckpoints: GitCheckpointInput[]
  repositoryStates: RepositoryStateInput[]
  metadata?: Metadata
}

export interface GitConfigurationInput {
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
  repositories: GitRepositoryInput[]
  branches: GitBranchInput[]
  commits: GitCommitInput[]
  tags: GitTagInput[]
  remotes: GitRemoteInput[]
  workspace: GitWorkspaceInput
  capabilities: GitCapabilityInput[]
  identity: GitIdentityInput
  governance: GitIntegrationGovernanceInput
  resourceModel: GitResourceInput
  summary: GitSummaryInput
  metadata?: Metadata
}

export interface GitLifecycleStateInput {
  stage: GitIntegrationLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface SourceControlGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface SourceControlRegistrationInput {
  sourceControlId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface SourceControlSessionInput {
  sessionId: string
  sourceControlId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface SourceControlContextInput {
  contextId: string
  sourceControlId: string
  sessionId?: string
  governance: SourceControlGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type SourceControlStateInput = SourceControlLifecycleStage

export interface RepositoryWorkspaceInput {
  repositoryWorkspaceId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface RepositoryGroupInput {
  repositoryGroupId: string
  name: string
  repositoryIds: string[]
  metadata?: Metadata
}

export interface BranchStrategyInput {
  branchStrategyId: string
  name: string
  pattern: string
  category: 'trunk-based' | 'feature-branch' | 'release-branch' | 'hotfix-branch' | 'other'
  metadata?: Metadata
}

export interface CommitStrategyInput {
  commitStrategyId: string
  name: string
  convention: string
  metadata?: Metadata
}

export interface MergeStrategyInput {
  mergeStrategyId: string
  name: string
  method: 'merge-commit' | 'squash' | 'rebase' | 'fast-forward' | 'other'
  metadata?: Metadata
}

export interface ReleaseStrategyInput {
  releaseStrategyId: string
  name: string
  cadence: string
  metadata?: Metadata
}

export interface RepositoryPolicyInput {
  repositoryPolicyId: string
  name: string
  rules: string[]
  metadata?: Metadata
}

export interface RepositoryGovernanceInput {
  repositoryGovernanceId: string
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
  metadata?: Metadata
}

export interface SourceControlCapabilityInput {
  capabilityId: string
  name: string
  category: 'planning' | 'branching' | 'merging' | 'release' | 'synchronization' | 'audit' | 'other'
  supported: boolean
  metadata?: Metadata
}

export interface SourceControlSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface RepositoryPlanInput {
  repositoryPlanId: string
  repositoryWorkspaceId: string
  objective: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface BranchPlanInput {
  branchPlanId: string
  repositoryPlanId: string
  branchStrategyId?: string
  proposedName: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface CommitPlanInput {
  commitPlanId: string
  repositoryPlanId: string
  commitStrategyId?: string
  proposedMessage: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface MergePlanInput {
  mergePlanId: string
  repositoryPlanId: string
  mergeStrategyId?: string
  sourceBranchPlanId?: string
  targetBranchPlanId?: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface ReleasePlanInput {
  releasePlanId: string
  repositoryPlanId: string
  releaseStrategyId?: string
  targetVersion: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface SynchronizationPlanInput {
  synchronizationPlanId: string
  repositoryPlanId: string
  direction: 'pull' | 'push' | 'bidirectional'
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface ConflictResolutionPlanInput {
  conflictResolutionPlanId: string
  repositoryPlanId: string
  strategy: string
  state: SourceControlStateInput
  metadata?: Metadata
}

export interface RepositoryCheckpointInput {
  repositoryCheckpointId: string
  title: string
  description?: string
  capturedAt: string
  metadata?: Metadata
}

export interface RepositoryAuditInput {
  repositoryAuditId: string
  repositoryPlanId: string
  summary: string
  recordedAt: string
  metadata?: Metadata
}

export interface SourceControlResourceInput {
  sourceControlResourceId: string
  sourceControlId: string
  repositoryPlans: RepositoryPlanInput[]
  branchPlans: BranchPlanInput[]
  commitPlans: CommitPlanInput[]
  mergePlans: MergePlanInput[]
  releasePlans: ReleasePlanInput[]
  synchronizationPlans: SynchronizationPlanInput[]
  conflictResolutionPlans: ConflictResolutionPlanInput[]
  repositoryCheckpoints: RepositoryCheckpointInput[]
  repositoryAudits: RepositoryAuditInput[]
  metadata?: Metadata
}

export interface SourceControlConfigurationInput {
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
  repositoryWorkspaces: RepositoryWorkspaceInput[]
  repositoryGroups: RepositoryGroupInput[]
  branchStrategies: BranchStrategyInput[]
  commitStrategies: CommitStrategyInput[]
  mergeStrategies: MergeStrategyInput[]
  releaseStrategies: ReleaseStrategyInput[]
  repositoryPolicies: RepositoryPolicyInput[]
  repositoryGovernance: RepositoryGovernanceInput
  capabilities: SourceControlCapabilityInput[]
  governance: SourceControlGovernanceInput
  resourceModel: SourceControlResourceInput
  summary: SourceControlSummaryInput
  metadata?: Metadata
}

export interface SourceControlLifecycleStateInput {
  stage: SourceControlLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface RepositoryIntelligenceRegistrationInput {
  repositoryIntelligenceId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceSessionInput {
  sessionId: string
  repositoryIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceContextInput {
  contextId: string
  repositoryIntelligenceId: string
  sessionId?: string
  governance: RepositoryIntelligenceGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type RepositoryIntelligenceStateInput = RepositoryIntelligenceLifecycleStage

export interface RepositoryProfileInput {
  repositoryProfileId: string
  name: string
  primaryLanguage?: string
  category: string
  metadata?: Metadata
}

export interface RepositoryTopologyInput {
  repositoryTopologyId: string
  repositoryProfileId: string
  moduleIds: string[]
  structureType: 'monolith' | 'modular' | 'monorepo' | 'microservices' | 'other'
  metadata?: Metadata
}

export interface RepositoryMetricsInput {
  repositoryMetricsId: string
  repositoryProfileId: string
  fileCount: number
  lineCount: number
  contributorCount: number
  metadata?: Metadata
}

export interface RepositoryHealthInput {
  repositoryHealthId: string
  repositoryProfileId: string
  status: 'healthy' | 'degraded' | 'at-risk' | 'critical' | 'unknown'
  score: number
  metadata?: Metadata
}

export interface RepositoryQualityInput {
  repositoryQualityId: string
  repositoryProfileId: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  metadata?: Metadata
}

export interface RepositoryDependencyGraphInput {
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

export interface RepositoryKnowledgeMapInput {
  repositoryKnowledgeMapId: string
  repositoryProfileId: string
  knowledgeAreaIds: string[]
  metadata?: Metadata
}

export interface RepositoryRiskProfileInput {
  repositoryRiskProfileId: string
  repositoryProfileId: string
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskFactors: string[]
  metadata?: Metadata
}

export interface RepositoryEvolutionInput {
  repositoryEvolutionId: string
  repositoryProfileId: string
  trend: 'growing' | 'stable' | 'declining' | 'unknown'
  observedAt: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface RepositoryAnalysisPlanInput {
  repositoryAnalysisPlanId: string
  repositoryProfileId: string
  objective: string
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface ArchitectureAnalysisInput {
  architectureAnalysisId: string
  repositoryAnalysisPlanId: string
  patternIds: string[]
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface DependencyAnalysisInput {
  dependencyAnalysisId: string
  repositoryAnalysisPlanId: string
  dependencyGraphId?: string
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface QualityAnalysisInput {
  qualityAnalysisId: string
  repositoryAnalysisPlanId: string
  qualityId?: string
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface ComplexityAnalysisInput {
  complexityAnalysisId: string
  repositoryAnalysisPlanId: string
  complexityScore: number
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface TechnicalDebtAnalysisInput {
  technicalDebtAnalysisId: string
  repositoryAnalysisPlanId: string
  debtScore: number
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface ChangeAnalysisInput {
  changeAnalysisId: string
  repositoryAnalysisPlanId: string
  changeFrequency: number
  state: RepositoryIntelligenceStateInput
  metadata?: Metadata
}

export interface RepositoryInsightInput {
  repositoryInsightId: string
  repositoryAnalysisPlanId: string
  category: 'architecture' | 'quality' | 'dependency' | 'risk' | 'evolution' | 'other'
  description: string
  metadata?: Metadata
}

export interface RepositoryRecommendationInput {
  repositoryRecommendationId: string
  repositoryAnalysisPlanId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceAuditInput {
  repositoryIntelligenceAuditId: string
  repositoryAnalysisPlanId: string
  summary: string
  recordedAt: string
  metadata?: Metadata
}

export interface RepositoryIntelligenceResourceInput {
  repositoryIntelligenceResourceId: string
  repositoryIntelligenceId: string
  repositoryAnalysisPlans: RepositoryAnalysisPlanInput[]
  architectureAnalyses: ArchitectureAnalysisInput[]
  dependencyAnalyses: DependencyAnalysisInput[]
  qualityAnalyses: QualityAnalysisInput[]
  complexityAnalyses: ComplexityAnalysisInput[]
  technicalDebtAnalyses: TechnicalDebtAnalysisInput[]
  changeAnalyses: ChangeAnalysisInput[]
  repositoryInsights: RepositoryInsightInput[]
  repositoryRecommendations: RepositoryRecommendationInput[]
  repositoryIntelligenceAudits: RepositoryIntelligenceAuditInput[]
  metadata?: Metadata
}

export interface RepositoryIntelligenceConfigurationInput {
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
  repositoryProfiles: RepositoryProfileInput[]
  repositoryTopologies: RepositoryTopologyInput[]
  repositoryMetrics: RepositoryMetricsInput[]
  repositoryHealths: RepositoryHealthInput[]
  repositoryQualities: RepositoryQualityInput[]
  repositoryDependencyGraphs: RepositoryDependencyGraphInput[]
  repositoryKnowledgeMaps: RepositoryKnowledgeMapInput[]
  repositoryRiskProfiles: RepositoryRiskProfileInput[]
  repositoryEvolutions: RepositoryEvolutionInput[]
  governance: RepositoryIntelligenceGovernanceInput
  resourceModel: RepositoryIntelligenceResourceInput
  summary: RepositoryIntelligenceSummaryInput
  metadata?: Metadata
}

export interface RepositoryIntelligenceLifecycleStateInput {
  stage: RepositoryIntelligenceLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface RepositoryKnowledgeGraphRegistrationInput {
  repositoryKnowledgeGraphId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphSessionInput {
  sessionId: string
  repositoryKnowledgeGraphId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphContextInput {
  contextId: string
  repositoryKnowledgeGraphId: string
  sessionId?: string
  governance: RepositoryKnowledgeGraphGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type RepositoryKnowledgeGraphStateInput = RepositoryKnowledgeGraphLifecycleStage

export interface KnowledgeNodeInput {
  knowledgeNodeId: string
  label: string
  category: 'entity' | 'artifact' | 'component' | 'module' | 'concern' | 'other'
  metadata?: Metadata
}

export interface KnowledgeEdgeInput {
  knowledgeEdgeId: string
  fromNodeId: string
  toNodeId: string
  relation: 'relates-to' | 'depends-on' | 'contains' | 'references' | 'derived-from' | 'other'
  metadata?: Metadata
}

export interface RepositoryKnowledgeRelationshipInput {
  repositoryKnowledgeRelationshipId: string
  sourceNodeId: string
  targetNodeId: string
  relationshipType: string
  strength: number
  metadata?: Metadata
}

export interface KnowledgeClusterInput {
  knowledgeClusterId: string
  name: string
  nodeIds: string[]
  metadata?: Metadata
}

export interface KnowledgePathInput {
  knowledgePathId: string
  nodeIds: string[]
  edgeIds: string[]
  metadata?: Metadata
}

export interface RepositoryKnowledgeReferenceInput {
  repositoryKnowledgeReferenceId: string
  nodeId: string
  referenceType: 'documentation' | 'specification' | 'external' | 'internal' | 'other'
  locator: string
  metadata?: Metadata
}

export interface KnowledgeEvidenceInput {
  knowledgeEvidenceId: string
  nodeId: string
  description: string
  confidence: number
  metadata?: Metadata
}

export interface KnowledgeDependencyInput {
  knowledgeDependencyId: string
  fromNodeId: string
  toNodeId: string
  dependencyType: 'required' | 'optional' | 'transitive' | 'other'
  metadata?: Metadata
}

export interface KnowledgeClassificationInput {
  knowledgeClassificationId: string
  nodeId: string
  classification: string
  confidence: number
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface RepositoryEntityInput {
  repositoryEntityId: string
  name: string
  entityType: 'service' | 'library' | 'application' | 'package' | 'other'
  metadata?: Metadata
}

export interface RepositoryArtifactInput {
  repositoryArtifactId: string
  name: string
  artifactType: 'file' | 'document' | 'diagram' | 'config' | 'other'
  metadata?: Metadata
}

export interface RepositoryComponentInput {
  repositoryComponentId: string
  name: string
  componentType: 'ui' | 'service' | 'data' | 'infrastructure' | 'other'
  metadata?: Metadata
}

export interface RepositoryModuleInput {
  repositoryModuleId: string
  name: string
  path: string
  metadata?: Metadata
}

export interface RepositoryBoundaryInput {
  repositoryBoundaryId: string
  name: string
  boundaryType: 'domain' | 'team' | 'service' | 'layer' | 'other'
  metadata?: Metadata
}

export interface RepositoryCapabilityInput {
  repositoryCapabilityId: string
  name: string
  category: string
  supported: boolean
  metadata?: Metadata
}

export interface RepositoryConcernInput {
  repositoryConcernId: string
  name: string
  concernType: 'cross-cutting' | 'business' | 'technical' | 'other'
  metadata?: Metadata
}

export interface RepositoryObservationInput {
  repositoryObservationId: string
  subjectId: string
  description: string
  observedAt: string
  metadata?: Metadata
}

export interface RepositoryFindingInput {
  repositoryFindingId: string
  subjectId: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphAuditInput {
  repositoryKnowledgeGraphAuditId: string
  subjectId: string
  summary: string
  recordedAt: string
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphResourceInput {
  repositoryKnowledgeGraphResourceId: string
  repositoryKnowledgeGraphId: string
  knowledgeNodes: KnowledgeNodeInput[]
  knowledgeEdges: KnowledgeEdgeInput[]
  repositoryKnowledgeRelationships: RepositoryKnowledgeRelationshipInput[]
  knowledgeClusters: KnowledgeClusterInput[]
  knowledgePaths: KnowledgePathInput[]
  repositoryKnowledgeReferences: RepositoryKnowledgeReferenceInput[]
  knowledgeEvidence: KnowledgeEvidenceInput[]
  knowledgeDependencies: KnowledgeDependencyInput[]
  knowledgeClassifications: KnowledgeClassificationInput[]
  repositoryEntities: RepositoryEntityInput[]
  repositoryArtifacts: RepositoryArtifactInput[]
  repositoryComponents: RepositoryComponentInput[]
  repositoryModules: RepositoryModuleInput[]
  repositoryBoundaries: RepositoryBoundaryInput[]
  repositoryCapabilities: RepositoryCapabilityInput[]
  repositoryConcerns: RepositoryConcernInput[]
  repositoryObservations: RepositoryObservationInput[]
  repositoryFindings: RepositoryFindingInput[]
  repositoryKnowledgeGraphAudits: RepositoryKnowledgeGraphAuditInput[]
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphConfigurationInput {
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
  governance: RepositoryKnowledgeGraphGovernanceInput
  resourceModel: RepositoryKnowledgeGraphResourceInput
  summary: RepositoryKnowledgeGraphSummaryInput
  metadata?: Metadata
}

export interface RepositoryKnowledgeGraphLifecycleStateInput {
  stage: RepositoryKnowledgeGraphLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: string
  exitedAt?: string
  metadata?: Metadata
}

export interface ExecutionReadinessGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: string
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  freshness: {
    capturedAt: string
    lastVerifiedAt?: string
    maxAgeMs?: number
  }
}

export interface ExecutionReadinessRegistrationInput {
  executionReadinessId: string
  name: string
  version: string
  contractVersion: string
  metadata?: Metadata
}

export interface ExecutionReadinessSessionInput {
  sessionId: string
  executionReadinessId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  metadata?: Metadata
}

export interface ExecutionReadinessContextInput {
  contextId: string
  executionReadinessId: string
  sessionId?: string
  governance: ExecutionReadinessGovernanceInput
  scope: string[]
  metadata?: Metadata
}

export type ExecutionReadinessStatusInput = 'not-ready' | 'in-review' | 'ready' | 'blocked'
export type ExecutionReadinessDecisionInput = 'pending' | 'approved' | 'rejected' | 'deferred'

export interface ExecutionReadinessCriteriaInput {
  criteriaId: string
  name: string
  required: boolean
  status: 'met' | 'not-met' | 'unknown'
  rationale?: string
  metadata?: Metadata
}

export interface ExecutionReadinessRecommendationInput {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface ExecutionReadinessEvidenceInput {
  evidenceId: string
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: string
  notes?: string
  metadata?: Metadata
}

export interface ExecutionReadinessTraceabilityInput {
  enabled: boolean
  traceIds: string[]
  references: string[]
  metadata?: Metadata
}

export interface ExecutionReadinessSummaryInput {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ExecutionReadinessReportInput {
  reportId: string
  executionReadinessId: string
  actionReferences: {
    actionIntelligenceId?: string
    actionPlanId?: string
    actionItemIds: string[]
  }
  status: ExecutionReadinessStatusInput
  decision: ExecutionReadinessDecisionInput
  criteria: ExecutionReadinessCriteriaInput[]
  recommendations: ExecutionReadinessRecommendationInput[]
  evidence: ExecutionReadinessEvidenceInput[]
  traceability: ExecutionReadinessTraceabilityInput
  summary: ExecutionReadinessSummaryInput
  metadata?: Metadata
}

export interface ExecutableActionPackageInput {
  actionPlanId: string
  actionItemIds: string[]
  assignments: Array<{
    assignmentId: string
    actionItemId: string
    assigneeType: 'system' | 'team' | 'user'
    assigneeId: string
    role?: string
  }>
  metadata?: Metadata
}

export interface ExecutableWorkflowPackageInput {
  workflowId: string
  workflowVersion: string
  workflowState: 'draft' | 'registered' | 'ready'
  metadata?: Metadata
}

export interface ExecutableContextPackageInput {
  contextId: string
  scope: string[]
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  metadata?: Metadata
}

export interface ExecutableConstraintPackageInput {
  constraints: Array<{
    constraintId: string
    description: string
    required: boolean
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ExecutableValidationPackageInput {
  validations: Array<{
    validationId: string
    status: 'passed' | 'failed' | 'warning'
    message: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ExecutionApprovalPackageInput {
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: string
  metadata?: Metadata
}

export interface ExecutionAuditPackageInput {
  auditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ActionCompletionPolicyInput {
  policyId: string
  requireAllActionsCompleted: boolean
  minimumCompletionRatio?: number
  metadata?: Metadata
}

export interface DependencyCompletionPolicyInput {
  policyId: string
  requireHardDependenciesCompleted: boolean
  allowSoftDependencyBypass: boolean
  metadata?: Metadata
}

export interface ValidationCompletionPolicyInput {
  policyId: string
  requireAllCriticalValidationsPassed: boolean
  allowWarnings: boolean
  metadata?: Metadata
}

export interface ApprovalCompletionPolicyInput {
  policyId: string
  requireApproval: boolean
  minimumApproverCount?: number
  metadata?: Metadata
}

export interface WorkflowReadinessPolicyInput {
  policyId: string
  requireWorkflowStateReady: boolean
  allowedWorkflowStates: Array<'draft' | 'registered' | 'ready'>
  metadata?: Metadata
}

export interface ExecutionSafetyPolicyInput {
  policyId: string
  requireSafetyChecksPassed: boolean
  blockedConditions: string[]
  metadata?: Metadata
}

export interface ExecutionReadinessPolicyInput {
  actionCompletionPolicy: ActionCompletionPolicyInput
  dependencyCompletionPolicy: DependencyCompletionPolicyInput
  validationCompletionPolicy: ValidationCompletionPolicyInput
  approvalCompletionPolicy: ApprovalCompletionPolicyInput
  workflowReadinessPolicy: WorkflowReadinessPolicyInput
  executionSafetyPolicy: ExecutionSafetyPolicyInput
  metadata?: Metadata
}

export interface ExecutionApprovalInput {
  reportId: string
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: string
  metadata?: Metadata
}

export interface ExecutionPackageInput {
  packageId: string
  executionReadinessId: string
  executableActionPackage: ExecutableActionPackageInput
  executableWorkflowPackage: ExecutableWorkflowPackageInput
  executableContextPackage: ExecutableContextPackageInput
  executableConstraintPackage: ExecutableConstraintPackageInput
  executableValidationPackage: ExecutableValidationPackageInput
  executionApprovalPackage: ExecutionApprovalPackageInput
  executionAuditPackage: ExecutionAuditPackageInput
  readinessPolicy: ExecutionReadinessPolicyInput
  metadata?: Metadata
}

export interface WorkflowGovernanceInput {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  version: string
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  confidence: number
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
  audit: {
    createdBy: string
    createdAt: string
    updatedAt?: string
  }
}

export interface WorkflowStepInput {
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

export interface WorkflowMetadataInput {
  workflowId: string
  name: string
  version: string
  contractVersion: string
  state: WorkflowState
  steps: WorkflowStepInput[]
  governance: WorkflowGovernanceInput
  createdAt: string
  updatedAt?: string
  metadata?: Metadata
}

export interface WorkflowRegistrationInput {
  workflowId: string
  name: string
  version: string
  contractVersion: string
  state: WorkflowState
  steps: WorkflowStepInput[]
  governance: WorkflowGovernanceInput
  metadata?: Metadata
}

export interface WorkflowArtifactInput {
  artifactId: string
  type: WorkflowArtifactType
  title: string
  version: string
  payload: Metadata
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: string
  }
}

function now(): IsoDateTime {
  return new Date().toISOString()
}

function createDiagnostic(
  scope: RegistrationScope,
  severity: Severity,
  code: string,
  message: string,
  entityId?: string,
  details?: Metadata
): RegistrationDiagnostic {
  return {
    scope,
    code,
    message,
    severity,
    entityId,
    createdAt: now(),
    details,
  }
}

export class ServiceRegistrationValidator {
  validate(
    registration: ServiceRegistrationInput,
    existingServiceIds: Set<string>,
    existingImplementations: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.serviceId) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_ID_REQUIRED', 'Service ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_NAME_REQUIRED', 'Service name is required', registration.serviceId))
    }

    if (!registration.interface) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_INTERFACE_REQUIRED', 'Service interface is required', registration.serviceId))
    }

    if (!registration.implementation) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_IMPLEMENTATION_REQUIRED', 'Service implementation is required', registration.serviceId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_VERSION_REQUIRED', 'Service version is required', registration.serviceId))
    }

    if (!Array.isArray(registration.dependencies)) {
      diagnostics.push(createDiagnostic('service', 'error', 'SERVICE_DEPENDENCIES_INVALID', 'Service dependencies must be an array', registration.serviceId))
    }

    if (registration.scope !== 'framework') {
      diagnostics.push(
        createDiagnostic(
          'service',
          'error',
          'SERVICE_SCOPE_INVALID',
          'Only framework services can be registered in the runtime foundation',
          registration.serviceId,
          { scope: registration.scope }
        )
      )
    }

    if (existingServiceIds.has(registration.serviceId)) {
      diagnostics.push(
        createDiagnostic(
          'service',
          'error',
          'SERVICE_DUPLICATE_ID',
          `Duplicate service ID detected: ${registration.serviceId}`,
          registration.serviceId
        )
      )
    }

    const implementationKey = `${registration.interface}::${registration.implementation}`
    if (existingImplementations.has(implementationKey)) {
      diagnostics.push(
        createDiagnostic(
          'service',
          'warning',
          'SERVICE_DUPLICATE_IMPLEMENTATION',
          `Service interface/implementation pair already registered: ${implementationKey}`,
          registration.serviceId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateLifetime(
    serviceId: string,
    declared: ServiceLifetime,
    registered: ServiceLifetime | undefined
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registered) {
      diagnostics.push(
        createDiagnostic(
          'service',
          'error',
          'SERVICE_LIFETIME_NOT_REGISTERED',
          `Service lifetime could not be verified because the service is not registered in DI: ${serviceId}`,
          serviceId
        )
      )
      return { valid: false, diagnostics }
    }

    if (declared !== registered) {
      diagnostics.push(
        createDiagnostic(
          'service',
          'error',
          'SERVICE_LIFETIME_MISMATCH',
          `Service lifetime mismatch for ${serviceId}. Declared ${declared}, registered ${registered}`,
          serviceId,
          { declared, registered }
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ProviderRegistrationValidator {
  validate(
    registration: ProviderRegistrationInput,
    existingProviderIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.providerId) {
      diagnostics.push(createDiagnostic('provider', 'error', 'PROVIDER_ID_REQUIRED', 'Provider ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('provider', 'error', 'PROVIDER_NAME_REQUIRED', 'Provider name is required', registration.providerId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('provider', 'error', 'PROVIDER_VERSION_REQUIRED', 'Provider version is required', registration.providerId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('provider', 'error', 'PROVIDER_CONTRACT_VERSION_REQUIRED', 'Provider contract version is required', registration.providerId)
      )
    }

    if (!Array.isArray(registration.capabilities)) {
      diagnostics.push(
        createDiagnostic('provider', 'error', 'PROVIDER_CAPABILITIES_INVALID', 'Provider capabilities must be an array', registration.providerId)
      )
    }

    if (!Array.isArray(registration.dependencies)) {
      diagnostics.push(
        createDiagnostic('provider', 'error', 'PROVIDER_DEPENDENCIES_INVALID', 'Provider dependencies must be an array', registration.providerId)
      )
    }

    if (existingProviderIds.has(registration.providerId)) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_DUPLICATE_ID',
          `Duplicate provider ID detected: ${registration.providerId}`,
          registration.providerId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateConfiguration(configuration: ProviderConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!configuration.providerId) {
      diagnostics.push(createDiagnostic('provider', 'error', 'PROVIDER_CONFIG_ID_REQUIRED', 'Provider configuration requires providerId'))
    }

    if (!configuration.providerVersion) {
      diagnostics.push(
        createDiagnostic('provider', 'error', 'PROVIDER_CONFIG_VERSION_REQUIRED', 'Provider configuration requires providerVersion', configuration.providerId)
      )
    }

    if (!Array.isArray(configuration.supportedModels) || configuration.supportedModels.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_SUPPORTED_MODELS_INVALID',
          'Provider configuration requires at least one supported model',
          configuration.providerId
        )
      )
    }

    if (!Array.isArray(configuration.capabilityDeclaration) || configuration.capabilityDeclaration.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_CAPABILITY_DECLARATION_INVALID',
          'Provider capability declaration must be a non-empty array',
          configuration.providerId
        )
      )
    }

    if (configuration.rateLimits.requestsPerMinute <= 0 || configuration.rateLimits.burstLimit <= 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_RATE_LIMIT_INVALID',
          'Provider rate limits must be greater than zero',
          configuration.providerId
        )
      )
    }

    if (configuration.timeout.requestTimeoutMs <= 0 || configuration.timeout.connectTimeoutMs <= 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_TIMEOUT_INVALID',
          'Provider timeout values must be greater than zero',
          configuration.providerId
        )
      )
    }

    if (configuration.retry.maxAttempts < 1 || configuration.retry.backoffMs < 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_RETRY_INVALID',
          'Provider retry configuration is invalid',
          configuration.providerId
        )
      )
    }

    if (configuration.cost.inputCostPerUnit < 0 || configuration.cost.outputCostPerUnit < 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_COST_INVALID',
          'Provider cost metadata cannot contain negative values',
          configuration.providerId
        )
      )
    }

    if (configuration.availability.priority < 0) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_AVAILABILITY_PRIORITY_INVALID',
          'Provider availability priority must be non-negative',
          configuration.providerId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCapabilities(
    providerId: string,
    capabilities: Array<{
      capabilityId: string
      name: string
      supported: boolean
      metadata?: Metadata
    }>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []
    const seenCapabilityIds = new Set<string>()

    for (const capability of capabilities) {
      if (!capability.capabilityId) {
        diagnostics.push(
          createDiagnostic('provider', 'error', 'PROVIDER_CAPABILITY_ID_REQUIRED', 'Provider capabilityId is required', providerId)
        )
      }

      if (!capability.name) {
        diagnostics.push(
          createDiagnostic('provider', 'error', 'PROVIDER_CAPABILITY_NAME_REQUIRED', 'Provider capability name is required', providerId)
        )
      }

      if (seenCapabilityIds.has(capability.capabilityId)) {
        diagnostics.push(
          createDiagnostic(
            'provider',
            'error',
            'PROVIDER_CAPABILITY_DUPLICATE',
            `Duplicate provider capability detected: ${capability.capabilityId}`,
            providerId
          )
        )
      }

      seenCapabilityIds.add(capability.capabilityId)
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateLifecycle(
    providerId: string,
    currentState: ProviderRuntimeLifecycleState,
    nextState: ProviderRuntimeLifecycleState
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    const allowedTransitions: Record<ProviderRuntimeLifecycleState, ProviderRuntimeLifecycleState[]> = {
      registered: ['configured', 'disposed'],
      configured: ['validated', 'shutdown', 'disposed'],
      validated: ['initialized', 'shutdown', 'disposed'],
      initialized: ['ready', 'shutdown', 'disposed'],
      ready: ['suspended', 'shutdown', 'disposed'],
      suspended: ['ready', 'shutdown', 'disposed'],
      shutdown: ['disposed'],
      disposed: [],
    }

    if (!PROVIDER_RUNTIME_LIFECYCLE_STATES.includes(currentState) || !PROVIDER_RUNTIME_LIFECYCLE_STATES.includes(nextState)) {
      diagnostics.push(
        createDiagnostic('provider', 'error', 'PROVIDER_LIFECYCLE_STATE_INVALID', 'Provider lifecycle state is invalid', providerId)
      )
      return { valid: false, diagnostics }
    }

    if (currentState === nextState) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'warning',
          'PROVIDER_LIFECYCLE_NOOP',
          `Provider lifecycle transition is a no-op: ${currentState}`,
          providerId
        )
      )
    }

    if (!allowedTransitions[currentState].includes(nextState) && currentState !== nextState) {
      diagnostics.push(
        createDiagnostic(
          'provider',
          'error',
          'PROVIDER_LIFECYCLE_TRANSITION_INVALID',
          `Provider lifecycle transition is invalid: ${currentState} -> ${nextState}`,
          providerId,
          { currentState, nextState }
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ProviderAdapterValidator {
  validateRegistration(
    registration: ProviderAdapterRegistrationInput,
    existingAdapterIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.adapterId) {
      diagnostics.push(createDiagnostic('adapter', 'error', 'ADAPTER_ID_REQUIRED', 'Adapter ID is required'))
    }

    if (!registration.providerId) {
      diagnostics.push(
        createDiagnostic('adapter', 'error', 'ADAPTER_PROVIDER_ID_REQUIRED', 'Adapter providerId is required', registration.adapterId)
      )
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('adapter', 'error', 'ADAPTER_NAME_REQUIRED', 'Adapter name is required', registration.adapterId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('adapter', 'error', 'ADAPTER_VERSION_REQUIRED', 'Adapter version is required', registration.adapterId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONTRACT_VERSION_REQUIRED',
          'Adapter contractVersion is required',
          registration.adapterId
        )
      )
    }

    if (!Array.isArray(registration.supportedModels) || registration.supportedModels.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_SUPPORTED_MODELS_INVALID',
          'Adapter supportedModels must be a non-empty array',
          registration.adapterId
        )
      )
    }

    if (!Array.isArray(registration.capabilities) || registration.capabilities.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CAPABILITIES_INVALID',
          'Adapter capabilities must be a non-empty array',
          registration.adapterId
        )
      )
    }

    if (!Array.isArray(registration.dependencies)) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_DEPENDENCIES_INVALID',
          'Adapter dependencies must be an array',
          registration.adapterId
        )
      )
    }

    if (existingAdapterIds.has(registration.adapterId)) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_DUPLICATE_ID',
          `Duplicate adapter ID detected: ${registration.adapterId}`,
          registration.adapterId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCapabilities(
    adapterId: string,
    capabilities: ProviderAdapterCapabilityInput[]
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []
    const seenCapabilityIds = new Set<string>()

    if (!Array.isArray(capabilities)) {
      diagnostics.push(
        createDiagnostic('adapter', 'error', 'ADAPTER_CAPABILITY_DECLARATION_INVALID', 'Adapter capabilities must be an array', adapterId)
      )
      return { valid: false, diagnostics }
    }

    for (const capability of capabilities) {
      if (!capability.capabilityId) {
        diagnostics.push(
          createDiagnostic('adapter', 'error', 'ADAPTER_CAPABILITY_ID_REQUIRED', 'Adapter capabilityId is required', adapterId)
        )
      }

      if (!capability.name) {
        diagnostics.push(
          createDiagnostic('adapter', 'error', 'ADAPTER_CAPABILITY_NAME_REQUIRED', 'Adapter capability name is required', adapterId)
        )
      }

      if (!Array.isArray(capability.features)) {
        diagnostics.push(
          createDiagnostic(
            'adapter',
            'error',
            'ADAPTER_CAPABILITY_FEATURES_INVALID',
            'Adapter capability features must be an array',
            adapterId
          )
        )
      }

      if (seenCapabilityIds.has(capability.capabilityId)) {
        diagnostics.push(
          createDiagnostic(
            'adapter',
            'error',
            'ADAPTER_CAPABILITY_DUPLICATE',
            `Duplicate adapter capability detected: ${capability.capabilityId}`,
            adapterId
          )
        )
      }

      seenCapabilityIds.add(capability.capabilityId)
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateConfiguration(configuration: ProviderAdapterConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!configuration.adapterId) {
      diagnostics.push(createDiagnostic('adapter', 'error', 'ADAPTER_CONFIG_ID_REQUIRED', 'Adapter configuration requires adapterId'))
    }

    if (!configuration.adapterVersion) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_VERSION_REQUIRED',
          'Adapter configuration requires adapterVersion',
          configuration.adapterId
        )
      )
    }

    if (!Array.isArray(configuration.supportedModels) || configuration.supportedModels.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_SUPPORTED_MODELS_INVALID',
          'Adapter configuration requires at least one supported model',
          configuration.adapterId
        )
      )
    }

    if (!Array.isArray(configuration.capabilityMatrix) || configuration.capabilityMatrix.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_CAPABILITY_MATRIX_INVALID',
          'Adapter configuration requires a non-empty capability matrix',
          configuration.adapterId
        )
      )
    }

    if (configuration.timeoutPolicy.requestTimeoutMs <= 0 || configuration.timeoutPolicy.connectTimeoutMs <= 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_TIMEOUT_INVALID',
          'Adapter timeout policy values must be greater than zero',
          configuration.adapterId
        )
      )
    }

    if (configuration.retryPolicy.maxAttempts < 1 || configuration.retryPolicy.backoffMs < 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_RETRY_INVALID',
          'Adapter retry policy is invalid',
          configuration.adapterId
        )
      )
    }

    if (configuration.costMetadata.inputCostPerUnit < 0 || configuration.costMetadata.outputCostPerUnit < 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_COST_INVALID',
          'Adapter cost metadata cannot contain negative values',
          configuration.adapterId
        )
      )
    }

    if (configuration.availabilityMetadata.priority < 0) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_CONFIG_AVAILABILITY_PRIORITY_INVALID',
          'Adapter availability priority must be non-negative',
          configuration.adapterId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateLifecycle(
    adapterId: string,
    currentState: AdapterLifecycleState,
    nextState: AdapterLifecycleState
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    const allowedTransitions: Record<AdapterLifecycleState, AdapterLifecycleState[]> = {
      registered: ['validated', 'disposed'],
      validated: ['initialized', 'disposed'],
      initialized: ['active', 'inactive', 'disposed'],
      active: ['suspended', 'inactive', 'disposed'],
      suspended: ['active', 'inactive', 'disposed'],
      inactive: ['active', 'disposed'],
      disposed: [],
    }

    if (!ADAPTER_LIFECYCLE_STATES.includes(currentState) || !ADAPTER_LIFECYCLE_STATES.includes(nextState)) {
      diagnostics.push(
        createDiagnostic('adapter', 'error', 'ADAPTER_LIFECYCLE_STATE_INVALID', 'Adapter lifecycle state is invalid', adapterId)
      )
      return { valid: false, diagnostics }
    }

    if (currentState === nextState) {
      diagnostics.push(
        createDiagnostic('adapter', 'warning', 'ADAPTER_LIFECYCLE_NOOP', `Adapter lifecycle transition is a no-op: ${currentState}`, adapterId)
      )
    }

    if (!allowedTransitions[currentState].includes(nextState) && currentState !== nextState) {
      diagnostics.push(
        createDiagnostic(
          'adapter',
          'error',
          'ADAPTER_LIFECYCLE_TRANSITION_INVALID',
          `Adapter lifecycle transition is invalid: ${currentState} -> ${nextState}`,
          adapterId,
          { currentState, nextState }
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class SkillRegistrationValidator {
  validate(
    registration: SkillRegistrationInput,
    existingSkillIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.skillId) {
      diagnostics.push(createDiagnostic('skill', 'error', 'SKILL_ID_REQUIRED', 'Skill ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('skill', 'error', 'SKILL_NAME_REQUIRED', 'Skill name is required', registration.skillId))
    }

    if (!registration.category) {
      diagnostics.push(
        createDiagnostic('skill', 'error', 'SKILL_CATEGORY_REQUIRED', 'Skill category is required', registration.skillId)
      )
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('skill', 'error', 'SKILL_VERSION_REQUIRED', 'Skill version is required', registration.skillId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('skill', 'error', 'SKILL_CONTRACT_VERSION_REQUIRED', 'Skill contract version is required', registration.skillId)
      )
    }

    if (!Array.isArray(registration.dependencies)) {
      diagnostics.push(
        createDiagnostic('skill', 'error', 'SKILL_DEPENDENCIES_INVALID', 'Skill dependencies must be an array', registration.skillId)
      )
    }

    if (!Array.isArray(registration.capabilities)) {
      diagnostics.push(
        createDiagnostic('skill', 'error', 'SKILL_CAPABILITIES_INVALID', 'Skill capabilities must be an array', registration.skillId)
      )
    }

    if (existingSkillIds.has(registration.skillId)) {
      diagnostics.push(
        createDiagnostic(
          'skill',
          'error',
          'SKILL_DUPLICATE_ID',
          `Duplicate skill ID detected: ${registration.skillId}`,
          registration.skillId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AITeamValidator {
  validateTeamRegistration(
    registration: AITeamRegistrationInput,
    existingTeamIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.teamId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_TEAM_ID_REQUIRED', 'AI Team ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_TEAM_NAME_REQUIRED', 'AI Team name is required', registration.teamId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_TEAM_VERSION_REQUIRED', 'AI Team version is required', registration.teamId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_CONTRACT_VERSION_REQUIRED', 'AI Team contractVersion is required', registration.teamId)
      )
    }

    if (!Array.isArray(registration.specialistIds)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_SPECIALISTS_INVALID', 'AI Team specialistIds must be an array', registration.teamId)
      )
    }

    if (!Array.isArray(registration.capabilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_CAPABILITIES_INVALID', 'AI Team capabilities must be an array', registration.teamId)
      )
    }

    if (!Array.isArray(registration.responsibilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_RESPONSIBILITIES_INVALID', 'AI Team responsibilities must be an array', registration.teamId)
      )
    }

    if (existingTeamIds.has(registration.teamId)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_DUPLICATE_ID', `Duplicate AI Team ID detected: ${registration.teamId}`, registration.teamId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSpecialistRegistration(
    specialist: AISpecialistRegistrationInput,
    existingSpecialistIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!specialist.specialistId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_SPECIALIST_ID_REQUIRED', 'AI Specialist ID is required'))
    }

    if (!specialist.name) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_SPECIALIST_NAME_REQUIRED', 'AI Specialist name is required', specialist.specialistId))
    }

    if (!AI_SPECIALIST_ROLES.includes(specialist.role)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_SPECIALIST_ROLE_INVALID', `AI Specialist role is invalid: ${specialist.role}`, specialist.specialistId)
      )
    }

    if (!Array.isArray(specialist.capabilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_SPECIALIST_CAPABILITIES_INVALID', 'AI Specialist capabilities must be an array', specialist.specialistId)
      )
    }

    if (!Array.isArray(specialist.responsibilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_SPECIALIST_RESPONSIBILITIES_INVALID', 'AI Specialist responsibilities must be an array', specialist.specialistId)
      )
    }

    if (existingSpecialistIds.has(specialist.specialistId)) {
      diagnostics.push(
        createDiagnostic(
          'team',
          'error',
          'AI_SPECIALIST_DUPLICATE_ID',
          `Duplicate AI Specialist ID detected: ${specialist.specialistId}`,
          specialist.specialistId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCapabilities(teamId: string, capabilities: string[]): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []
    const seenCapabilities = new Set<string>()

    if (!Array.isArray(capabilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_CAPABILITY_SET_INVALID', 'AI Team capability set must be an array', teamId)
      )
      return { valid: false, diagnostics }
    }

    for (const capability of capabilities) {
      if (!capability) {
        diagnostics.push(
          createDiagnostic('team', 'error', 'AI_TEAM_CAPABILITY_REQUIRED', 'AI Team capability cannot be empty', teamId)
        )
      }

      if (seenCapabilities.has(capability)) {
        diagnostics.push(
          createDiagnostic('team', 'warning', 'AI_TEAM_CAPABILITY_DUPLICATE', `Duplicate AI Team capability: ${capability}`, teamId)
        )
      }

      seenCapabilities.add(capability)
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateAssignment(assignment: AITeamAssignmentInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!assignment.assignmentId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_ID_REQUIRED', 'AI Team assignmentId is required'))
    }

    if (!assignment.teamId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_TEAM_REQUIRED', 'AI Team assignment teamId is required', assignment.assignmentId))
    }

    if (!assignment.workItemId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_WORK_ITEM_REQUIRED', 'AI Team assignment workItemId is required', assignment.assignmentId))
    }

    if (!assignment.assignedTo) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_ASSIGNEE_REQUIRED', 'AI Team assignment assignee is required', assignment.assignmentId))
    }

    if (!assignment.assignedBy) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_ASSIGNER_REQUIRED', 'AI Team assignment assigner is required', assignment.assignmentId))
    }

    if (!Array.isArray(assignment.dependencies)) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_DEPENDENCIES_INVALID', 'AI Team assignment dependencies must be an array', assignment.assignmentId))
    }

    if (!Array.isArray(assignment.reviewChain)) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_REVIEW_CHAIN_INVALID', 'AI Team assignment reviewChain must be an array', assignment.assignmentId))
    }

    if (!Array.isArray(assignment.approvalChain)) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_ASSIGNMENT_APPROVAL_CHAIN_INVALID', 'AI Team assignment approvalChain must be an array', assignment.assignmentId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(teamId: string, governance: AITeamGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!governance.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('team', 'error', 'AI_TEAM_OWNER_REQUIRED', 'AI Team owner is required', teamId))
    }

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic('team', 'warning', 'AI_TEAM_CONFIDENCE_OUT_OF_RANGE', 'AI Team confidence should be between 0 and 1', teamId)
      )
    }

    if (!governance.version) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_GOVERNANCE_VERSION_REQUIRED', 'AI Team governance version is required', teamId)
      )
    }

    if (!Array.isArray(governance.responsibilities)) {
      diagnostics.push(
        createDiagnostic('team', 'error', 'AI_TEAM_GOVERNANCE_RESPONSIBILITIES_INVALID', 'AI Team governance responsibilities must be an array', teamId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class MemoryRegistrationValidator {
  validateRegistration(
    registration: MemoryRegistrationInput,
    existingMemoryIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.memoryId) {
      diagnostics.push(createDiagnostic('memory', 'error', 'MEMORY_ID_REQUIRED', 'Memory ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('memory', 'error', 'MEMORY_NAME_REQUIRED', 'Memory name is required', registration.memoryId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('memory', 'error', 'MEMORY_VERSION_REQUIRED', 'Memory version is required', registration.memoryId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_CONTRACT_VERSION_REQUIRED', 'Memory contract version is required', registration.memoryId)
      )
    }

    if (!MEMORY_CLASSIFICATIONS.includes(registration.classification)) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_CLASSIFICATION_INVALID', 'Memory classification is invalid', registration.memoryId)
      )
    }

    if (!Array.isArray(registration.dependencies)) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_DEPENDENCIES_INVALID', 'Memory dependencies must be an array', registration.memoryId)
      )
    }

    if (!Array.isArray(registration.capabilities)) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_CAPABILITIES_INVALID', 'Memory capabilities must be an array', registration.memoryId)
      )
    }

    if (existingMemoryIds.has(registration.memoryId)) {
      diagnostics.push(
        createDiagnostic(
          'memory',
          'error',
          'MEMORY_DUPLICATE_ID',
          `Duplicate memory ID detected: ${registration.memoryId}`,
          registration.memoryId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateMetadata(metadata: MemoryMetadataInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!metadata.memoryId) {
      diagnostics.push(createDiagnostic('memory', 'error', 'MEMORY_METADATA_ID_REQUIRED', 'Memory metadata must include memory ID'))
    }

    if (!metadata.createdAt) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_METADATA_CREATED_AT_REQUIRED', 'Memory metadata must include createdAt', metadata.memoryId)
      )
    }

    if (!metadata.governance) {
      diagnostics.push(
        createDiagnostic('memory', 'error', 'MEMORY_GOVERNANCE_REQUIRED', 'Memory governance is required', metadata.memoryId)
      )
    } else {
      if (!metadata.governance.ownership?.ownerId) {
        diagnostics.push(
          createDiagnostic('memory', 'error', 'MEMORY_OWNER_REQUIRED', 'Memory ownership ownerId is required', metadata.memoryId)
        )
      }

      if (!metadata.governance.tenantIsolation?.tenantId) {
        diagnostics.push(
          createDiagnostic('memory', 'error', 'MEMORY_TENANT_ID_REQUIRED', 'Memory tenant isolation tenantId is required', metadata.memoryId)
        )
      }

      if (metadata.governance.confidence < 0 || metadata.governance.confidence > 1) {
        diagnostics.push(
          createDiagnostic(
            'memory',
            'warning',
            'MEMORY_CONFIDENCE_OUT_OF_RANGE',
            'Memory confidence should be between 0 and 1',
            metadata.memoryId
          )
        )
      }

      if (metadata.governance.retentionPolicy.retainForDays < 0) {
        diagnostics.push(
          createDiagnostic(
            'memory',
            'error',
            'MEMORY_RETENTION_INVALID',
            'Memory retention policy retainForDays cannot be negative',
            metadata.memoryId
          )
        )
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDependencies(
    memoryId: string,
    dependencies: string[],
    availableMemoryIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    for (const dependency of dependencies) {
      if (!availableMemoryIds.has(dependency)) {
        diagnostics.push(
          createDiagnostic(
            'memory',
            'warning',
            'MEMORY_DEPENDENCY_NOT_REGISTERED',
            `Memory dependency is not currently registered: ${dependency}`,
            memoryId,
            { dependency }
          )
        )
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateLifecycle(
    memoryId: string,
    currentState: MemoryLifecycleState,
    nextState: MemoryLifecycleState
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (currentState === nextState) {
      diagnostics.push(
        createDiagnostic(
          'memory',
          'warning',
          'MEMORY_LIFECYCLE_NOOP',
          `Memory lifecycle transition does not change state: ${currentState}`,
          memoryId
        )
      )
    }

    if (currentState === 'disposed') {
      diagnostics.push(
        createDiagnostic(
          'memory',
          'error',
          'MEMORY_LIFECYCLE_FROM_DISPOSED',
          'Disposed memory cannot transition to another state',
          memoryId
        )
      )
    }

    if (!MEMORY_LIFECYCLE_STATES.includes(currentState) || !MEMORY_LIFECYCLE_STATES.includes(nextState)) {
      diagnostics.push(
        createDiagnostic(
          'memory',
          'error',
          'MEMORY_LIFECYCLE_STATE_INVALID',
          'Memory lifecycle state is invalid',
          memoryId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeRegistrationValidator {
  validateRegistration(
    registration: KnowledgeRegistrationInput,
    existingKnowledgeIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.knowledgeId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_ID_REQUIRED', 'Knowledge ID is required'))
    }

    if (!registration.title) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_TITLE_REQUIRED', 'Knowledge title is required', registration.knowledgeId))
    }

    if (!KNOWLEDGE_DOMAINS.includes(registration.domain)) {
      diagnostics.push(
        createDiagnostic(
          'knowledge',
          'error',
          'KNOWLEDGE_DOMAIN_INVALID',
          'Knowledge domain is invalid',
          registration.knowledgeId
        )
      )
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_VERSION_REQUIRED', 'Knowledge version is required', registration.knowledgeId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('knowledge', 'error', 'KNOWLEDGE_CONTRACT_VERSION_REQUIRED', 'Knowledge contract version is required', registration.knowledgeId)
      )
    }

    if (!Array.isArray(registration.references)) {
      diagnostics.push(
        createDiagnostic('knowledge', 'error', 'KNOWLEDGE_REFERENCES_INVALID', 'Knowledge references must be an array', registration.knowledgeId)
      )
    }

    if (!Array.isArray(registration.relationships)) {
      diagnostics.push(
        createDiagnostic('knowledge', 'error', 'KNOWLEDGE_RELATIONSHIPS_INVALID', 'Knowledge relationships must be an array', registration.knowledgeId)
      )
    }

    if (existingKnowledgeIds.has(registration.knowledgeId)) {
      diagnostics.push(
        createDiagnostic(
          'knowledge',
          'error',
          'KNOWLEDGE_DUPLICATE_ID',
          `Duplicate knowledge ID detected: ${registration.knowledgeId}`,
          registration.knowledgeId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateMetadata(metadata: KnowledgeMetadataInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!metadata.knowledgeId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_METADATA_ID_REQUIRED', 'Knowledge metadata must include knowledge ID'))
    }

    if (!metadata.createdAt) {
      diagnostics.push(
        createDiagnostic(
          'knowledge',
          'error',
          'KNOWLEDGE_METADATA_CREATED_AT_REQUIRED',
          'Knowledge metadata must include createdAt',
          metadata.knowledgeId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRelationships(
    knowledgeId: string,
    relationships: KnowledgeRelationshipInput[],
    availableKnowledgeIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    for (const relationship of relationships) {
      if (!KNOWLEDGE_RELATIONSHIP_TYPES.includes(relationship.type)) {
        diagnostics.push(
          createDiagnostic(
            'knowledge',
            'error',
            'KNOWLEDGE_RELATIONSHIP_TYPE_INVALID',
            `Knowledge relationship type is invalid: ${relationship.type}`,
            knowledgeId
          )
        )
      }

      if (relationship.sourceKnowledgeId !== knowledgeId) {
        diagnostics.push(
          createDiagnostic(
            'knowledge',
            'warning',
            'KNOWLEDGE_RELATIONSHIP_SOURCE_MISMATCH',
            `Relationship source does not match knowledge ID: ${relationship.sourceKnowledgeId}`,
            knowledgeId
          )
        )
      }

      if (!availableKnowledgeIds.has(relationship.targetKnowledgeId)) {
        diagnostics.push(
          createDiagnostic(
            'knowledge',
            'warning',
            'KNOWLEDGE_RELATIONSHIP_TARGET_NOT_REGISTERED',
            `Relationship target is not currently registered: ${relationship.targetKnowledgeId}`,
            knowledgeId,
            { targetKnowledgeId: relationship.targetKnowledgeId }
          )
        )
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(
    knowledgeId: string,
    governance: KnowledgeGovernanceInput
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!governance.ownership?.ownerId) {
      diagnostics.push(
        createDiagnostic('knowledge', 'error', 'KNOWLEDGE_OWNER_REQUIRED', 'Knowledge owner is required', knowledgeId)
      )
    }

    if (!governance.stewardship?.stewardId) {
      diagnostics.push(
        createDiagnostic('knowledge', 'error', 'KNOWLEDGE_STEWARD_REQUIRED', 'Knowledge steward is required', knowledgeId)
      )
    }

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic(
          'knowledge',
          'warning',
          'KNOWLEDGE_CONFIDENCE_OUT_OF_RANGE',
          'Knowledge confidence should be between 0 and 1',
          knowledgeId
        )
      )
    }

    if (!KNOWLEDGE_LIFECYCLE_STATUSES.includes(governance.lifecycleStatus)) {
      diagnostics.push(
        createDiagnostic(
          'knowledge',
          'error',
          'KNOWLEDGE_LIFECYCLE_INVALID',
          'Knowledge lifecycle status is invalid',
          knowledgeId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ReasoningPipelineValidator {
  validateRegistration(
    registration: ReasoningRegistrationInput,
    existingPipelineIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.pipelineId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'PIPELINE_ID_REQUIRED', 'Reasoning pipeline ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'PIPELINE_NAME_REQUIRED', 'Reasoning pipeline name is required', registration.pipelineId)
      )
    }

    if (!registration.version) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'PIPELINE_VERSION_REQUIRED', 'Reasoning pipeline version is required', registration.pipelineId)
      )
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'error',
          'PIPELINE_CONTRACT_VERSION_REQUIRED',
          'Reasoning pipeline contract version is required',
          registration.pipelineId
        )
      )
    }

    if (!Array.isArray(registration.stageOrder) || registration.stageOrder.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'error',
          'PIPELINE_STAGE_ORDER_INVALID',
          'Reasoning pipeline stage order must be a non-empty array',
          registration.pipelineId
        )
      )
    }

    if (existingPipelineIds.has(registration.pipelineId)) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'error',
          'PIPELINE_DUPLICATE_ID',
          `Duplicate reasoning pipeline ID detected: ${registration.pipelineId}`,
          registration.pipelineId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStageRegistration(
    stage: ReasoningStageRegistrationInput,
    existingStages: Set<ReasoningPipelineStage>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!stage.stageId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'STAGE_ID_REQUIRED', 'Stage ID is required'))
    }

    if (!REASONING_PIPELINE_STAGES.includes(stage.stage)) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'STAGE_INVALID', 'Reasoning stage is invalid', stage.stageId)
      )
    }

    if (!Array.isArray(stage.dependencies)) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'STAGE_DEPENDENCIES_INVALID', 'Stage dependencies must be an array', stage.stageId)
      )
    }

    if (!Array.isArray(stage.transitionsTo)) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'STAGE_TRANSITIONS_INVALID', 'Stage transitions must be an array', stage.stageId)
      )
    }

    if (existingStages.has(stage.stage)) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'error',
          'STAGE_DUPLICATE',
          `Reasoning stage already registered: ${stage.stage}`,
          stage.stageId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStageTransition(
    from: ReasoningPipelineStage,
    to: ReasoningPipelineStage
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!REASONING_PIPELINE_STAGES.includes(from) || !REASONING_PIPELINE_STAGES.includes(to)) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'STAGE_TRANSITION_INVALID', 'Reasoning stage transition is invalid')
      )
    }

    if (from === to) {
      diagnostics.push(
        createDiagnostic('reasoning', 'warning', 'STAGE_TRANSITION_NOOP', `Reasoning stage transition is a no-op: ${from}`)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateArtifact(artifact: ReasoningArtifactInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!artifact.artifactId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'ARTIFACT_ID_REQUIRED', 'Reasoning artifact ID is required'))
    }

    if (!REASONING_ARTIFACT_TYPES.includes(artifact.type)) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'ARTIFACT_TYPE_INVALID', 'Reasoning artifact type is invalid', artifact.artifactId)
      )
    }

    if (!artifact.title) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'ARTIFACT_TITLE_REQUIRED', 'Reasoning artifact title is required', artifact.artifactId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateMetadata(metadata: ReasoningMetadataInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!metadata.pipelineId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_METADATA_ID_REQUIRED', 'Reasoning metadata must include pipeline ID'))
    }

    if (!metadata.createdAt) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'error',
          'REASONING_METADATA_CREATED_AT_REQUIRED',
          'Reasoning metadata must include createdAt',
          metadata.pipelineId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(
    pipelineId: string,
    governance: ReasoningGovernanceInput
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic(
          'reasoning',
          'warning',
          'REASONING_CONFIDENCE_OUT_OF_RANGE',
          'Reasoning confidence should be between 0 and 1',
          pipelineId
        )
      )
    }

    if (!governance.version) {
      diagnostics.push(
        createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_VERSION_REQUIRED', 'Reasoning governance version is required', pipelineId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class WorkflowValidator {
  validateRegistration(
    registration: WorkflowRegistrationInput,
    existingWorkflowIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.workflowId) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_ID_REQUIRED', 'Workflow ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_NAME_REQUIRED', 'Workflow name is required', registration.workflowId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_VERSION_REQUIRED', 'Workflow version is required', registration.workflowId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic(
          'workflow',
          'error',
          'WORKFLOW_CONTRACT_VERSION_REQUIRED',
          'Workflow contract version is required',
          registration.workflowId
        )
      )
    }

    if (!WORKFLOW_STATES.includes(registration.state)) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STATE_INVALID', 'Workflow state is invalid', registration.workflowId))
    }

    if (!Array.isArray(registration.steps) || registration.steps.length === 0) {
      diagnostics.push(
        createDiagnostic(
          'workflow',
          'error',
          'WORKFLOW_STEPS_INVALID',
          'Workflow steps must be a non-empty array',
          registration.workflowId
        )
      )
    }

    if (existingWorkflowIds.has(registration.workflowId)) {
      diagnostics.push(
        createDiagnostic(
          'workflow',
          'error',
          'WORKFLOW_DUPLICATE_ID',
          `Duplicate workflow ID detected: ${registration.workflowId}`,
          registration.workflowId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateMetadata(metadata: WorkflowMetadataInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!metadata.workflowId) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_METADATA_ID_REQUIRED', 'Workflow metadata must include workflow ID'))
    }

    if (!metadata.createdAt) {
      diagnostics.push(
        createDiagnostic(
          'workflow',
          'error',
          'WORKFLOW_METADATA_CREATED_AT_REQUIRED',
          'Workflow metadata must include createdAt',
          metadata.workflowId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStep(step: WorkflowStepInput, stepIds: Set<string>): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!step.stepId) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STEP_ID_REQUIRED', 'Workflow step ID is required'))
    }

    if (!step.name) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STEP_NAME_REQUIRED', 'Workflow step name is required', step.stepId))
    }

    if (step.order < 0) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STEP_ORDER_INVALID', 'Workflow step order must be non-negative', step.stepId))
    }

    if (stepIds.has(step.stepId)) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STEP_DUPLICATE', `Workflow step already exists: ${step.stepId}`, step.stepId))
    }

    if (!Array.isArray(step.dependencies)) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_STEP_DEPENDENCIES_INVALID', 'Workflow step dependencies must be an array', step.stepId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTransition(fromStepId: string, toStepId: string): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!fromStepId || !toStepId) {
      diagnostics.push(
        createDiagnostic('workflow', 'error', 'WORKFLOW_TRANSITION_INVALID', 'Workflow transition requires both source and target step IDs')
      )
    }

    if (fromStepId === toStepId) {
      diagnostics.push(
        createDiagnostic('workflow', 'warning', 'WORKFLOW_TRANSITION_NOOP', `Workflow transition is a no-op: ${fromStepId}`)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateArtifact(artifact: WorkflowArtifactInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!artifact.artifactId) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_ARTIFACT_ID_REQUIRED', 'Workflow artifact ID is required'))
    }

    if (!WORKFLOW_ARTIFACT_TYPES.includes(artifact.type)) {
      diagnostics.push(
        createDiagnostic('workflow', 'error', 'WORKFLOW_ARTIFACT_TYPE_INVALID', 'Workflow artifact type is invalid', artifact.artifactId)
      )
    }

    if (!artifact.title) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_ARTIFACT_TITLE_REQUIRED', 'Workflow artifact title is required', artifact.artifactId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(workflowId: string, governance: WorkflowGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!governance.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_OWNER_REQUIRED', 'Workflow owner is required', workflowId))
    }

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic(
          'workflow',
          'warning',
          'WORKFLOW_CONFIDENCE_OUT_OF_RANGE',
          'Workflow confidence should be between 0 and 1',
          workflowId
        )
      )
    }

    if (!governance.version) {
      diagnostics.push(createDiagnostic('workflow', 'error', 'WORKFLOW_GOVERNANCE_VERSION_REQUIRED', 'Workflow governance version is required', workflowId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class PromptConstructionValidator {
  validateRegistration(
    registration: PromptRegistrationInput,
    existingPromptIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.promptId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_ID_REQUIRED', 'Prompt ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_NAME_REQUIRED', 'Prompt name is required', registration.promptId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_VERSION_REQUIRED', 'Prompt version is required', registration.promptId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_CONTRACT_VERSION_REQUIRED', 'Prompt contractVersion is required', registration.promptId)
      )
    }

    if (!Array.isArray(registration.tags)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_TAGS_INVALID', 'Prompt tags must be an array', registration.promptId))
    }

    if (existingPromptIds.has(registration.promptId)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_DUPLICATE_ID', `Duplicate prompt ID detected: ${registration.promptId}`, registration.promptId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTemplateRegistration(
    template: PromptTemplateRegistrationInput,
    existingTemplateIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!template.templateId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_ID_REQUIRED', 'Prompt template ID is required'))
    }

    if (!template.name) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_NAME_REQUIRED', 'Prompt template name is required', template.templateId)
      )
    }

    if (!template.version) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_VERSION_REQUIRED', 'Prompt template version is required', template.templateId)
      )
    }

    if (!PROMPT_CLASSIFICATIONS.includes(template.classification)) {
      diagnostics.push(
        createDiagnostic(
          'prompt',
          'error',
          'PROMPT_TEMPLATE_CLASSIFICATION_INVALID',
          'Prompt template classification is invalid',
          template.templateId
        )
      )
    }

    if (!Array.isArray(template.systemInstructions)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_SYSTEM_INSTRUCTIONS_INVALID', 'System instructions must be an array', template.templateId)
      )
    }

    if (!Array.isArray(template.developerInstructions)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_DEVELOPER_INSTRUCTIONS_INVALID', 'Developer instructions must be an array', template.templateId)
      )
    }

    if (!Array.isArray(template.userInstructions)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_TEMPLATE_USER_INSTRUCTIONS_INVALID', 'User instructions must be an array', template.templateId)
      )
    }

    if (existingTemplateIds.has(template.templateId)) {
      diagnostics.push(
        createDiagnostic(
          'prompt',
          'error',
          'PROMPT_TEMPLATE_DUPLICATE_ID',
          `Duplicate prompt template ID detected: ${template.templateId}`,
          template.templateId
        )
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateMetadata(metadata: PromptMetadataInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!metadata.promptId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_METADATA_ID_REQUIRED', 'Prompt metadata promptId is required'))
    }

    if (!metadata.createdAt) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_METADATA_CREATED_AT_REQUIRED', 'Prompt metadata createdAt is required', metadata.promptId)
      )
    }

    if (!PROMPT_CLASSIFICATIONS.includes(metadata.classification)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_METADATA_CLASSIFICATION_INVALID', 'Prompt metadata classification is invalid', metadata.promptId)
      )
    }

    if (!Array.isArray(metadata.tags)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_METADATA_TAGS_INVALID', 'Prompt metadata tags must be an array', metadata.promptId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateContextPackage(input: PromptContextPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.promptId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_CONTEXT_PROMPT_ID_REQUIRED', 'Prompt context package promptId is required'))
    }

    if (!Array.isArray(input.sections) || input.sections.length === 0) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_CONTEXT_SECTIONS_INVALID', 'Prompt context package sections must be a non-empty array', input.promptId)
      )
    }

    for (const section of input.sections) {
      if (!section.sectionId) {
        diagnostics.push(
          createDiagnostic('prompt', 'error', 'PROMPT_CONTEXT_SECTION_ID_REQUIRED', 'Prompt context sectionId is required', input.promptId)
        )
      }

      if (!section.title) {
        diagnostics.push(
          createDiagnostic('prompt', 'error', 'PROMPT_CONTEXT_SECTION_TITLE_REQUIRED', 'Prompt context section title is required', input.promptId)
        )
      }

      if (section.priority < 0) {
        diagnostics.push(
          createDiagnostic('prompt', 'warning', 'PROMPT_CONTEXT_SECTION_PRIORITY_INVALID', 'Prompt context section priority should be non-negative', input.promptId)
        )
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validatePackage(input: PromptPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.promptId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_PROMPT_ID_REQUIRED', 'Prompt package promptId is required'))
    }

    if (!Array.isArray(input.systemInstructions)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_SYSTEM_INSTRUCTIONS_INVALID', 'Prompt package systemInstructions must be an array', input.promptId))
    }

    if (!Array.isArray(input.developerInstructions)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_DEVELOPER_INSTRUCTIONS_INVALID', 'Prompt package developerInstructions must be an array', input.promptId))
    }

    if (!Array.isArray(input.userInstructions)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_USER_INSTRUCTIONS_INVALID', 'Prompt package userInstructions must be an array', input.promptId))
    }

    if (!Array.isArray(input.contextSections)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_CONTEXT_SECTIONS_INVALID', 'Prompt package contextSections must be an array', input.promptId))
    }

    if (!Array.isArray(input.expectedOutputSpecification)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_OUTPUT_SPEC_INVALID', 'Prompt package expectedOutputSpecification must be an array', input.promptId))
    }

    if (!Array.isArray(input.validationRequirements)) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_PACKAGE_VALIDATION_REQUIREMENTS_INVALID', 'Prompt package validationRequirements must be an array', input.promptId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(promptId: string, governance: PromptGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!governance.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_GOVERNANCE_OWNER_REQUIRED', 'Prompt governance owner is required', promptId))
    }

    if (!governance.version) {
      diagnostics.push(createDiagnostic('prompt', 'error', 'PROMPT_GOVERNANCE_VERSION_REQUIRED', 'Prompt governance version is required', promptId))
    }

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic('prompt', 'warning', 'PROMPT_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Prompt governance confidence should be between 0 and 1', promptId)
      )
    }

    if (!PROMPT_CLASSIFICATIONS.includes(governance.classification)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_GOVERNANCE_CLASSIFICATION_INVALID', 'Prompt governance classification is invalid', promptId)
      )
    }

    if (!Array.isArray(governance.traceability?.traceIds)) {
      diagnostics.push(
        createDiagnostic('prompt', 'error', 'PROMPT_GOVERNANCE_TRACEABILITY_INVALID', 'Prompt governance traceability.traceIds must be an array', promptId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ExecutionOrchestratorValidator {
  validateRegistration(
    registration: ExecutionRegistrationInput,
    existingExecutionIds: Set<string>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!registration.executionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_ID_REQUIRED', 'Execution ID is required'))
    }

    if (!registration.name) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_NAME_REQUIRED', 'Execution name is required', registration.executionId))
    }

    if (!registration.version) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_VERSION_REQUIRED', 'Execution version is required', registration.executionId))
    }

    if (!registration.contractVersion) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_CONTRACT_VERSION_REQUIRED', 'Execution contractVersion is required', registration.executionId)
      )
    }

    if (existingExecutionIds.has(registration.executionId)) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_DUPLICATE_ID', `Duplicate execution ID detected: ${registration.executionId}`, registration.executionId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validatePlan(plan: ExecutionPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!plan.planId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_PLAN_ID_REQUIRED', 'Execution planId is required'))
    }

    if (!plan.executionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_PLAN_EXECUTION_ID_REQUIRED', 'Execution plan executionId is required', plan.planId))
    }

    if (!Array.isArray(plan.stages) || plan.stages.length === 0) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_PLAN_STAGES_INVALID', 'Execution plan stages must be a non-empty array', plan.planId)
      )
    }

    if (!plan.workPackage?.workPackageId) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_PLAN_WORK_PACKAGE_REQUIRED', 'Execution plan workPackage.workPackageId is required', plan.planId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStage(
    stage: ExecutionStageInput,
    existingStates: Set<ExecutionPipelineState>
  ): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!stage.stageId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_STAGE_ID_REQUIRED', 'Execution stageId is required'))
    }

    if (!EXECUTION_PIPELINE_STATES.includes(stage.state)) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_STAGE_STATE_INVALID', `Execution stage state is invalid: ${stage.state}`, stage.stageId)
      )
    }

    if (stage.order < 0) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_STAGE_ORDER_INVALID', 'Execution stage order must be non-negative', stage.stageId)
      )
    }

    if (!Array.isArray(stage.dependencies)) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_STAGE_DEPENDENCIES_INVALID', 'Execution stage dependencies must be an array', stage.stageId)
      )
    }

    if (existingStates.has(stage.state)) {
      diagnostics.push(
        createDiagnostic('execution', 'warning', 'EXECUTION_STAGE_STATE_DUPLICATE', `Execution stage state is duplicated: ${stage.state}`, stage.stageId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateContext(context: ExecutionContextInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!context.executionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_CONTEXT_EXECUTION_ID_REQUIRED', 'Execution context executionId is required'))
    }

    if (!context.runtimeContext) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_CONTEXT_RUNTIME_REQUIRED', 'Execution runtimeContext is required', context.executionId))
    }

    if (!context.memoryContext) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_CONTEXT_MEMORY_EMPTY', 'Execution memoryContext is empty', context.executionId))
    }

    if (!context.businessBrainContext) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_CONTEXT_BUSINESS_BRAIN_EMPTY', 'Execution businessBrainContext is empty', context.executionId))
    }

    if (!context.providerContext) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_CONTEXT_PROVIDER_EMPTY', 'Execution providerContext is empty', context.executionId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGovernance(executionId: string, governance: ExecutionGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!governance.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_GOVERNANCE_OWNER_REQUIRED', 'Execution governance owner is required', executionId))
    }

    if (!governance.version) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_GOVERNANCE_VERSION_REQUIRED', 'Execution governance version is required', executionId))
    }

    if (governance.confidence < 0 || governance.confidence > 1) {
      diagnostics.push(
        createDiagnostic('execution', 'warning', 'EXECUTION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Execution governance confidence should be between 0 and 1', executionId)
      )
    }

    if (!Array.isArray(governance.traceability?.traceIds)) {
      diagnostics.push(
        createDiagnostic('execution', 'error', 'EXECUTION_GOVERNANCE_TRACEABILITY_INVALID', 'Execution governance traceability.traceIds must be an array', executionId)
      )
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ExecutionGatewayValidator {
  validateRequest(input: ExecutionGatewayRequestInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.requestId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_ID_REQUIRED', 'Execution requestId is required'))
    }

    if (!input.executionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_EXECUTION_ID_REQUIRED', 'Execution executionId is required', input.requestId))
    }

    if (!input.sessionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_SESSION_ID_REQUIRED', 'Execution sessionId is required', input.requestId))
    }

    if (!input.metadata?.correlationId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_CORRELATION_REQUIRED', 'Execution metadata.correlationId is required', input.requestId))
    }

    if (!input.promptPackage?.promptId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_PROMPT_ID_REQUIRED', 'Execution promptPackage.promptId is required', input.requestId))
    }

    if (!input.promptPackage?.promptBody) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_PROMPT_BODY_REQUIRED', 'Execution promptPackage.promptBody is required', input.requestId))
    }

    if (input.timeoutPolicy.requestTimeoutMs <= 0 || input.timeoutPolicy.connectTimeoutMs <= 0) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_TIMEOUT_INVALID', 'Execution timeoutPolicy values must be greater than zero', input.requestId))
    }

    if (input.retryPolicy.maxAttempts < 1 || input.retryPolicy.backoffMs < 0) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_RETRY_INVALID', 'Execution retryPolicy is invalid', input.requestId))
    }

    if (input.executionConstraints.hardLimitMs <= 0) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_HARD_LIMIT_INVALID', 'Execution constraints hardLimitMs must be greater than zero', input.requestId))
    }

    if (!Array.isArray(input.expectedOutput.validationRequirements)) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_REQUEST_OUTPUT_VALIDATION_INVALID', 'Execution expectedOutput.validationRequirements must be an array', input.requestId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDispatch(input: ExecutionDispatchInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.dispatchId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_DISPATCH_ID_REQUIRED', 'Execution dispatchId is required'))
    }

    if (!input.requestId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_DISPATCH_REQUEST_ID_REQUIRED', 'Execution dispatch requestId is required', input.dispatchId))
    }

    if (!input.route?.executionRoute || !input.route?.responseRoute || !input.route?.failureRoute) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_DISPATCH_ROUTE_INVALID', 'Execution dispatch route declarations are required', input.dispatchId))
    }

    if (input.retryPlan.maxAttempts < 1 || input.retryPlan.attemptNumber < 1 || input.retryPlan.attemptNumber > input.retryPlan.maxAttempts) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_DISPATCH_RETRY_PLAN_INVALID', 'Execution dispatch retry plan is invalid', input.dispatchId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateProviderResolution(input: ProviderResolutionInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.requestId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_PROVIDER_RESOLUTION_REQUEST_ID_REQUIRED', 'Provider resolution requestId is required'))
    }

    if (!input.resolvedProviderId) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_PROVIDER_NOT_RESOLVED', 'Provider resolution did not resolve a providerId', input.requestId))
    }

    if (!input.resolvedAdapterId) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_ADAPTER_NOT_RESOLVED', 'Provider resolution did not resolve an adapterId', input.requestId))
    }

    if (!input.available) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_PROVIDER_UNAVAILABLE', 'Resolved provider is currently unavailable', input.requestId))
    }

    if (!input.versionCompatible) {
      diagnostics.push(createDiagnostic('execution', 'warning', 'EXECUTION_PROVIDER_VERSION_INCOMPATIBLE', 'Resolved provider version is not compatible', input.requestId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateResponse(input: ExecutionGatewayResponseInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.responseId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_ID_REQUIRED', 'Execution responseId is required'))
    }

    if (!input.requestId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_REQUEST_ID_REQUIRED', 'Execution response requestId is required', input.responseId))
    }

    if (!EXECUTION_RESPONSE_STATUSES.includes(input.status)) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_STATUS_INVALID', `Execution response status is invalid: ${input.status}`, input.responseId))
    }

    if (input.costMetadata.estimatedInputCost < 0 || input.costMetadata.estimatedOutputCost < 0 || input.costMetadata.estimatedTotalCost < 0) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_COST_INVALID', 'Execution response cost metadata cannot contain negative values', input.responseId))
    }

    if (!Array.isArray(input.diagnostics)) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_DIAGNOSTICS_INVALID', 'Execution response diagnostics must be an array', input.responseId))
    }

    if (!Array.isArray(input.auditReferences)) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_RESPONSE_AUDIT_REFERENCES_INVALID', 'Execution response auditReferences must be an array', input.responseId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateAudit(input: ExecutionAuditRecordInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.auditId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_AUDIT_ID_REQUIRED', 'Execution auditId is required'))
    }

    if (!input.requestId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_AUDIT_REQUEST_ID_REQUIRED', 'Execution audit requestId is required', input.auditId))
    }

    if (!input.dispatchRecord?.dispatchId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_AUDIT_DISPATCH_REQUIRED', 'Execution audit dispatchRecord.dispatchId is required', input.auditId))
    }

    if (!input.providerResolutionRecord?.resolutionId) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_AUDIT_PROVIDER_RESOLUTION_REQUIRED', 'Execution audit providerResolutionRecord.resolutionId is required', input.auditId))
    }

    if (!Array.isArray(input.timeline)) {
      diagnostics.push(createDiagnostic('execution', 'error', 'EXECUTION_AUDIT_TIMELINE_INVALID', 'Execution audit timeline must be an array', input.auditId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeAssemblyValidator {
  validateRetrievalPlan(input: RetrievalPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.planId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_ID_REQUIRED', 'Retrieval planId is required'))
    }

    if (!input.assemblyId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_ASSEMBLY_ID_REQUIRED', 'Retrieval assemblyId is required', input.planId))
    }

    if (!input.request?.requestId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_REQUEST_REQUIRED', 'Retrieval plan request.requestId is required', input.planId))
    }

    if (!Array.isArray(input.sources) || input.sources.length === 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_SOURCES_INVALID', 'Retrieval plan sources must be a non-empty array', input.planId))
    }

    if (!RETRIEVAL_STRATEGIES.includes(input.strategy)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_STRATEGY_INVALID', `Retrieval strategy is invalid: ${input.strategy}`, input.planId))
    }

    if (input.constraints.hardTimeoutMs <= 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PLAN_TIMEOUT_INVALID', 'Retrieval constraints hardTimeoutMs must be greater than zero', input.planId))
    }

    if (input.resultMetadata.expectedCompleteness < 0 || input.resultMetadata.expectedCompleteness > 1) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'RETRIEVAL_PLAN_EXPECTED_COMPLETENESS_OUT_OF_RANGE', 'Retrieval expected completeness should be between 0 and 1', input.planId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgePackage(input: KnowledgePackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.packageId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PACKAGE_ID_REQUIRED', 'Knowledge packageId is required'))
    }

    if (!input.assemblyId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PACKAGE_ASSEMBLY_ID_REQUIRED', 'Knowledge package assemblyId is required', input.packageId))
    }

    if (!input.planId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PACKAGE_PLAN_ID_REQUIRED', 'Knowledge package planId is required', input.packageId))
    }

    if (!Array.isArray(input.retrievedKnowledge)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PACKAGE_RETRIEVED_KNOWLEDGE_INVALID', 'Knowledge package retrievedKnowledge must be an array', input.packageId))
    }

    if (!Array.isArray(input.references)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PACKAGE_REFERENCES_INVALID', 'Knowledge package references must be an array', input.packageId))
    }

    if (!input.contextSummary) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_PACKAGE_CONTEXT_SUMMARY_EMPTY', 'Knowledge package contextSummary is empty', input.packageId))
    }

    if (input.confidenceSummary.overallConfidence < 0 || input.confidenceSummary.overallConfidence > 1) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_PACKAGE_CONFIDENCE_OUT_OF_RANGE', 'Knowledge package overall confidence should be between 0 and 1', input.packageId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSource(input: RetrievalSourceDescriptorInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_SOURCE_ID_REQUIRED', 'Knowledge sourceId is required'))
    }

    if (!KNOWLEDGE_SOURCE_TYPES.includes(input.sourceType)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_SOURCE_TYPE_INVALID', `Knowledge source type is invalid: ${input.sourceType}`, input.sourceId))
    }

    if (!RETRIEVAL_SCOPES.includes(input.scope)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_SOURCE_SCOPE_INVALID', `Knowledge source scope is invalid: ${input.scope}`, input.sourceId))
    }

    if (!RETRIEVAL_PRIORITIES.includes(input.priority)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_SOURCE_PRIORITY_INVALID', `Knowledge source priority is invalid: ${input.priority}`, input.sourceId))
    }

    if (input.weighting.weight < 0) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_SOURCE_WEIGHT_INVALID', 'Knowledge source weighting cannot be negative', input.sourceId))
    }

    if (input.freshness.staleAfterMs < 0) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_SOURCE_FRESHNESS_INVALID', 'Knowledge source staleAfterMs should be non-negative', input.sourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgeReference(input: KnowledgeReferenceAssemblyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.referenceId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_REFERENCE_ID_REQUIRED', 'Knowledge referenceId is required'))
    }

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_REFERENCE_SOURCE_REQUIRED', 'Knowledge reference sourceId is required', input.referenceId))
    }

    if (!input.label) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_REFERENCE_LABEL_REQUIRED', 'Knowledge reference label is required', input.referenceId))
    }

    if (!input.target) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_REFERENCE_TARGET_REQUIRED', 'Knowledge reference target is required', input.referenceId))
    }

    if (input.relevance < 0 || input.relevance > 1) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_REFERENCE_RELEVANCE_OUT_OF_RANGE', 'Knowledge reference relevance should be between 0 and 1', input.referenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validatePrioritisation(input: KnowledgePrioritisationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.prioritisationId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PRIORITISATION_ID_REQUIRED', 'Knowledge prioritisationId is required'))
    }

    if (!input.assemblyId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PRIORITISATION_ASSEMBLY_ID_REQUIRED', 'Knowledge prioritisation assemblyId is required', input.prioritisationId))
    }

    if (!Array.isArray(input.priorityRules)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PRIORITISATION_RULES_INVALID', 'Knowledge prioritisation priorityRules must be an array', input.prioritisationId))
    }

    if (input.freshnessMetadata.freshnessWindowMs < 0 || input.freshnessMetadata.staleThresholdMs < 0) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'KNOWLEDGE_PRIORITISATION_FRESHNESS_INVALID', 'Knowledge prioritisation freshness values should be non-negative', input.prioritisationId))
    }

    if (!Array.isArray(input.sourceWeighting)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'KNOWLEDGE_PRIORITISATION_WEIGHTING_INVALID', 'Knowledge prioritisation sourceWeighting must be an array', input.prioritisationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class RetrievalStrategyPlanningValidator {
  validateQueryPlan(input: QueryPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.queryId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_ID_REQUIRED', 'Query plan queryId is required'))
    }

    if (!input.queryText) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_TEXT_REQUIRED', 'Query plan queryText is required', input.queryId))
    }

    if (!QUERY_INTENTS.includes(input.intent)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_INTENT_INVALID', `Query plan intent is invalid: ${input.intent}`, input.queryId))
    }

    if (!QUERY_SCOPES.includes(input.scope)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_SCOPE_INVALID', `Query plan scope is invalid: ${input.scope}`, input.queryId))
    }

    if (!QUERY_PRIORITIES.includes(input.priority)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_PRIORITY_INVALID', `Query plan priority is invalid: ${input.priority}`, input.queryId))
    }

    if (input.constraints.maxSources < 1 || input.constraints.maxResults < 1 || input.constraints.hardTimeoutMs <= 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_CONSTRAINTS_INVALID', 'Query plan constraints are invalid', input.queryId))
    }

    if (!Array.isArray(input.expansion.terms) || !Array.isArray(input.reduction.includeTerms) || !Array.isArray(input.reduction.excludeTerms)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_EXPANSION_REDUCTION_INVALID', 'Query plan expansion/reduction terms must be arrays', input.queryId))
    }

    if (!Array.isArray(input.optimisation.hints)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'QUERY_PLAN_OPTIMISATION_INVALID', 'Query plan optimisation hints must be an array', input.queryId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRetrievalStrategy(input: RetrievalStrategyDefinitionInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.strategyId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_STRATEGY_ID_REQUIRED', 'Retrieval strategyId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_STRATEGY_NAME_REQUIRED', 'Retrieval strategy name is required', input.strategyId))
    }

    if (!RETRIEVAL_STRATEGY_PATTERNS.includes(input.pattern)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_STRATEGY_PATTERN_INVALID', `Retrieval strategy pattern is invalid: ${input.pattern}`, input.strategyId))
    }

    if (!Array.isArray(input.sourceIds) || input.sourceIds.length === 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_STRATEGY_SOURCES_INVALID', 'Retrieval strategy sourceIds must be a non-empty array', input.strategyId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRetrievalPackage(input: RetrievalPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.packageId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_ID_REQUIRED', 'Retrieval packageId is required'))
    }

    if (!input.planningId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_PLANNING_ID_REQUIRED', 'Retrieval package planningId is required', input.packageId))
    }

    if (!Array.isArray(input.plannedSources) || input.plannedSources.length === 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_PLANNED_SOURCES_INVALID', 'Retrieval plannedSources must be a non-empty array', input.packageId))
    }

    if (!Array.isArray(input.plannedQueries) || input.plannedQueries.length === 0) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_PLANNED_QUERIES_INVALID', 'Retrieval plannedQueries must be a non-empty array', input.packageId))
    }

    if (!Array.isArray(input.retrievalDependencies)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_DEPENDENCIES_INVALID', 'Retrieval dependencies must be an array', input.packageId))
    }

    if (!Array.isArray(input.retrievalOrdering.orderedSourceIds)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'RETRIEVAL_PACKAGE_ORDERING_INVALID', 'Retrieval ordering orderedSourceIds must be an array', input.packageId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSourcePlanning(input: SourcePlanningInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'SOURCE_PLANNING_SOURCE_ID_REQUIRED', 'Source planning sourceId is required'))
    }

    if (!SOURCE_PLANNING_TARGETS.includes(input.target)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'SOURCE_PLANNING_TARGET_INVALID', `Source planning target is invalid: ${input.target}`, input.sourceId))
    }

    if (!QUERY_SCOPES.includes(input.queryScope)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'SOURCE_PLANNING_SCOPE_INVALID', `Source planning queryScope is invalid: ${input.queryScope}`, input.sourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStrategyGovernance(input: StrategyGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'STRATEGY_GOVERNANCE_OWNER_REQUIRED', 'Strategy governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('knowledge', 'warning', 'STRATEGY_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Strategy governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'STRATEGY_GOVERNANCE_VERSION_REQUIRED', 'Strategy governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'STRATEGY_GOVERNANCE_TRACEABILITY_INVALID', 'Strategy governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('knowledge', 'error', 'STRATEGY_GOVERNANCE_PROVENANCE_REQUIRED', 'Strategy governance provenance.source is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeResolutionValidator {
  validateKnowledgeResolution(input: KnowledgeResolutionRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.resolutionId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'KNOWLEDGE_RESOLUTION_ID_REQUIRED', 'Knowledge resolutionId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'KNOWLEDGE_RESOLUTION_NAME_REQUIRED', 'Knowledge resolution name is required', input.resolutionId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'KNOWLEDGE_RESOLUTION_VERSION_REQUIRED', 'Knowledge resolution version is required', input.resolutionId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'KNOWLEDGE_RESOLUTION_CONTRACT_VERSION_REQUIRED', 'Knowledge resolution contractVersion is required', input.resolutionId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateContextComposition(input: ContextCompositionInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.contextId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_ID_REQUIRED', 'Context composition contextId is required'))
    }

    if (!Array.isArray(input.sources) || input.sources.length === 0) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_SOURCES_INVALID', 'Context composition sources must be a non-empty array', input.contextId))
    }

    if (!Array.isArray(input.sections) || input.sections.length === 0) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_SECTIONS_INVALID', 'Context composition sections must be a non-empty array', input.contextId))
    }

    if (!CONTEXT_ORDERING_MODES.includes(input.ordering.mode)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_ORDERING_MODE_INVALID', `Context ordering mode is invalid: ${input.ordering.mode}`, input.contextId))
    }

    if (!CONTEXT_PRIORITISATION_MODES.includes(input.prioritisation.mode)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_PRIORITISATION_MODE_INVALID', `Context prioritisation mode is invalid: ${input.prioritisation.mode}`, input.contextId))
    }

    if (!CONTEXT_COMPLETENESS_STATUSES.includes(input.completeness.status)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_COMPOSITION_COMPLETENESS_STATUS_INVALID', `Context completeness status is invalid: ${input.completeness.status}`, input.contextId))
    }

    if (input.completeness.score < 0 || input.completeness.score > 1) {
      diagnostics.push(createDiagnostic('resolution', 'warning', 'CONTEXT_COMPOSITION_COMPLETENESS_SCORE_OUT_OF_RANGE', 'Context completeness score should be between 0 and 1', input.contextId))
    }

    for (const section of input.sections) {
      if (!CONTEXT_COMPOSITION_SOURCES.includes(section.source)) {
        diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_SECTION_SOURCE_INVALID', `Context section source is invalid: ${section.source}`, section.sectionId))
      }

      if (!CONTEXT_SECTION_TYPES.includes(section.type)) {
        diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_SECTION_TYPE_INVALID', `Context section type is invalid: ${section.type}`, section.sectionId))
      }

      if (!section.title) {
        diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_SECTION_TITLE_REQUIRED', 'Context section title is required', section.sectionId))
      }
    }

    for (const gap of input.gaps) {
      if (!CONTEXT_GAP_SEVERITIES.includes(gap.severity)) {
        diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GAP_SEVERITY_INVALID', `Context gap severity is invalid: ${gap.severity}`, gap.gapId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateContextReference(input: ResolutionContextReferenceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.referenceId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_REFERENCE_ID_REQUIRED', 'Context referenceId is required'))
    }

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_REFERENCE_SOURCE_ID_REQUIRED', 'Context sourceId is required', input.referenceId))
    }

    if (!input.targetId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_REFERENCE_TARGET_ID_REQUIRED', 'Context targetId is required', input.referenceId))
    }

    if (!input.label) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_REFERENCE_LABEL_REQUIRED', 'Context label is required', input.referenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateResolutionPolicy(input: ResolutionPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!MERGE_POLICY_STRATEGIES.includes(input.mergePolicy.strategy)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'RESOLUTION_POLICY_MERGE_STRATEGY_INVALID', `Merge policy strategy is invalid: ${input.mergePolicy.strategy}`))
    }

    if (!CONFLICT_RESOLUTION_STRATEGIES.includes(input.conflictResolutionPolicy.strategy)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'RESOLUTION_POLICY_CONFLICT_STRATEGY_INVALID', `Conflict resolution strategy is invalid: ${input.conflictResolutionPolicy.strategy}`))
    }

    if (!Array.isArray(input.sourcePriorityPolicy.orderedSources) || input.sourcePriorityPolicy.orderedSources.length === 0) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'RESOLUTION_POLICY_SOURCE_PRIORITY_INVALID', 'Source priority policy orderedSources must be a non-empty array'))
    }

    if (input.contextSizePolicy.maxSections < 1 || input.contextSizePolicy.maxCharacters < 1) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'RESOLUTION_POLICY_SIZE_INVALID', 'Context size policy maxSections and maxCharacters must be positive'))
    }

    if (input.contextQualityPolicy.minimumConfidence < 0 || input.contextQualityPolicy.minimumConfidence > 1) {
      diagnostics.push(createDiagnostic('resolution', 'warning', 'RESOLUTION_POLICY_QUALITY_CONFIDENCE_OUT_OF_RANGE', 'Context quality minimumConfidence should be between 0 and 1'))
    }

    if (!MISSING_KNOWLEDGE_STRATEGIES.includes(input.missingKnowledgePolicy.strategy)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'RESOLUTION_POLICY_MISSING_KNOWLEDGE_STRATEGY_INVALID', `Missing knowledge strategy is invalid: ${input.missingKnowledgePolicy.strategy}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateContextGovernance(input: ContextGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GOVERNANCE_OWNER_REQUIRED', 'Context governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('resolution', 'warning', 'CONTEXT_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Context governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GOVERNANCE_VERSION_REQUIRED', 'Context governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GOVERNANCE_TRACEABILITY_INVALID', 'Context governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GOVERNANCE_PROVENANCE_REQUIRED', 'Context governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('resolution', 'error', 'CONTEXT_GOVERNANCE_FRESHNESS_REQUIRED', 'Context governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeSelectionValidator {
  validateKnowledgeSelectionRegistration(input: KnowledgeSelectionRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.selectionId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_ID_REQUIRED', 'Knowledge selectionId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_NAME_REQUIRED', 'Knowledge selection name is required', input.selectionId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_VERSION_REQUIRED', 'Knowledge selection version is required', input.selectionId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_CONTRACT_VERSION_REQUIRED', 'Knowledge selection contractVersion is required', input.selectionId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgeSelection(input: KnowledgeSelectionInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.selectionId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_INPUT_ID_REQUIRED', 'Knowledge selection input selectionId is required'))
    }

    if (!SELECTION_PRIORITIES.includes(input.priority)) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_PRIORITY_INVALID', `Selection priority is invalid: ${input.priority}`, input.selectionId))
    }

    if (!Array.isArray(input.candidateKnowledge) || input.candidateKnowledge.length === 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_CANDIDATES_INVALID', 'Candidate knowledge must be a non-empty array', input.selectionId))
    }

    for (const candidate of input.candidateKnowledge) {
      if (!candidate.candidateId || !candidate.knowledgeId) {
        diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_CANDIDATE_ID_REQUIRED', 'Candidate knowledge candidateId and knowledgeId are required', input.selectionId))
      }

      if (!CANDIDATE_KNOWLEDGE_SOURCES.includes(candidate.source)) {
        diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_CANDIDATE_SOURCE_INVALID', `Candidate source is invalid: ${candidate.source}`, candidate.candidateId))
      }
    }

    if (input.criteria.minimumConfidence < 0 || input.criteria.minimumConfidence > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'KNOWLEDGE_SELECTION_CRITERIA_CONFIDENCE_OUT_OF_RANGE', 'Selection criteria minimumConfidence should be between 0 and 1', input.selectionId))
    }

    if (input.constraints.maxSelections < 1 || input.constraints.maxEvidenceItems < 0 || input.constraints.maxContextCharacters < 1) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_CONSTRAINTS_INVALID', 'Selection constraints are invalid', input.selectionId))
    }

    for (const decision of input.decisions) {
      if (!SELECTION_DECISION_TYPES.includes(decision.decision)) {
        diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_DECISION_TYPE_INVALID', `Selection decision type is invalid: ${decision.decision}`, decision.decisionId))
      }
    }

    if (input.summary.totalCandidates < 0 || input.summary.selectedCount < 0 || input.summary.excludedCount < 0 || input.summary.deferredCount < 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'KNOWLEDGE_SELECTION_SUMMARY_COUNTS_INVALID', 'Selection summary counts should be non-negative', input.selectionId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateEvidencePackage(input: EvidencePackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.packageId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_PACKAGE_ID_REQUIRED', 'Evidence packageId is required'))
    }

    if (!input.selectionId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_PACKAGE_SELECTION_ID_REQUIRED', 'Evidence selectionId is required', input.packageId))
    }

    if (!Array.isArray(input.evidenceSources) || input.evidenceSources.length === 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_PACKAGE_SOURCES_INVALID', 'Evidence sources must be a non-empty array', input.packageId))
    }

    if (!Array.isArray(input.evidenceReferences) || input.evidenceReferences.length === 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_PACKAGE_REFERENCES_INVALID', 'Evidence references must be a non-empty array', input.packageId))
    }

    if (!Array.isArray(input.evidenceChains)) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_PACKAGE_CHAINS_INVALID', 'Evidence chains must be an array', input.packageId))
    }

    if (input.evidenceConfidence.overall < 0 || input.evidenceConfidence.overall > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'EVIDENCE_PACKAGE_CONFIDENCE_OUT_OF_RANGE', 'Evidence overall confidence should be between 0 and 1', input.packageId))
    }

    if (input.evidenceCoverage.coverageScore < 0 || input.evidenceCoverage.coverageScore > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'EVIDENCE_PACKAGE_COVERAGE_OUT_OF_RANGE', 'Evidence coverage score should be between 0 and 1', input.packageId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSelectionPolicy(input: SelectionPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!RELEVANCE_POLICY_STRATEGIES.includes(input.relevancePolicy.strategy)) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_POLICY_RELEVANCE_STRATEGY_INVALID', `Relevance policy strategy is invalid: ${input.relevancePolicy.strategy}`))
    }

    if (!CONFLICT_POLICY_STRATEGIES.includes(input.conflictPolicy.strategy)) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_POLICY_CONFLICT_STRATEGY_INVALID', `Conflict policy strategy is invalid: ${input.conflictPolicy.strategy}`))
    }

    if (input.relevancePolicy.minimumRelevance < 0 || input.relevancePolicy.minimumRelevance > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'SELECTION_POLICY_RELEVANCE_OUT_OF_RANGE', 'Relevance policy minimumRelevance should be between 0 and 1'))
    }

    if (input.confidencePolicy.minimumConfidence < 0 || input.confidencePolicy.minimumConfidence > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'SELECTION_POLICY_CONFIDENCE_OUT_OF_RANGE', 'Confidence policy minimumConfidence should be between 0 and 1'))
    }

    if (input.freshnessPolicy.maxAgeMs < 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_POLICY_FRESHNESS_INVALID', 'Freshness policy maxAgeMs must be non-negative'))
    }

    if (input.diversityPolicy.maxPerSource < 1 || input.diversityPolicy.minSourceDiversity < 0) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_POLICY_DIVERSITY_INVALID', 'Diversity policy maxPerSource/minSourceDiversity are invalid'))
    }

    if (input.completenessPolicy.minimumCoverageScore < 0 || input.completenessPolicy.minimumCoverageScore > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'SELECTION_POLICY_COMPLETENESS_OUT_OF_RANGE', 'Completeness policy minimumCoverageScore should be between 0 and 1'))
    }

    if (input.evidenceSufficiencyPolicy.minimumEvidenceCount < 0 || input.evidenceSufficiencyPolicy.minimumCoverageScore < 0 || input.evidenceSufficiencyPolicy.minimumCoverageScore > 1) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_POLICY_EVIDENCE_SUFFICIENCY_INVALID', 'Evidence sufficiency policy values are invalid'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateEvidenceReference(input: EvidenceReferenceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.referenceId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_REFERENCE_ID_REQUIRED', 'Evidence referenceId is required'))
    }

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_REFERENCE_SOURCE_ID_REQUIRED', 'Evidence sourceId is required', input.referenceId))
    }

    if (!input.targetId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_REFERENCE_TARGET_ID_REQUIRED', 'Evidence targetId is required', input.referenceId))
    }

    if (!input.label) {
      diagnostics.push(createDiagnostic('selection', 'error', 'EVIDENCE_REFERENCE_LABEL_REQUIRED', 'Evidence reference label is required', input.referenceId))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'EVIDENCE_REFERENCE_CONFIDENCE_OUT_OF_RANGE', 'Evidence reference confidence should be between 0 and 1', input.referenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSelectionGovernance(input: SelectionGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_GOVERNANCE_OWNER_REQUIRED', 'Selection governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('selection', 'warning', 'SELECTION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Selection governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_GOVERNANCE_VERSION_REQUIRED', 'Selection governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_GOVERNANCE_TRACEABILITY_INVALID', 'Selection governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_GOVERNANCE_PROVENANCE_REQUIRED', 'Selection governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('selection', 'error', 'SELECTION_GOVERNANCE_FRESHNESS_REQUIRED', 'Selection governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeQualityValidator {
  validateKnowledgeQuality(input: KnowledgeQualityRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.qualityId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_ID_REQUIRED', 'Knowledge qualityId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_NAME_REQUIRED', 'Knowledge quality name is required', input.qualityId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_VERSION_REQUIRED', 'Knowledge quality version is required', input.qualityId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_CONTRACT_VERSION_REQUIRED', 'Knowledge quality contractVersion is required', input.qualityId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateQualityReport(input: KnowledgeQualityReportInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.reportId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_REPORT_ID_REQUIRED', 'Quality reportId is required'))
    }

    if (!input.qualityId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_REPORT_QUALITY_ID_REQUIRED', 'Quality report qualityId is required', input.reportId))
    }

    const assessments = [
      input.completenessAssessment,
      input.freshnessAssessment,
      input.trustAssessment,
      input.confidenceAssessment,
      input.coverageAssessment,
      input.consistencyAssessment,
      input.relevanceAssessment,
    ]

    for (const assessment of assessments) {
      if (!QUALITY_ASSESSMENT_STATUSES.includes(assessment.status)) {
        diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_REPORT_ASSESSMENT_STATUS_INVALID', `Quality assessment status is invalid: ${assessment.status}`, input.reportId))
      }

      if (assessment.score < 0 || assessment.score > 1) {
        diagnostics.push(createDiagnostic('quality', 'warning', 'QUALITY_REPORT_ASSESSMENT_SCORE_OUT_OF_RANGE', 'Quality assessment score should be between 0 and 1', input.reportId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateConflictAnalysis(input: ConflictAnalysisInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.resultId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_ANALYSIS_ID_REQUIRED', 'Conflict analysis resultId is required'))
    }

    if (!input.qualityId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_ANALYSIS_QUALITY_ID_REQUIRED', 'Conflict analysis qualityId is required', input.resultId))
    }

    if (!Array.isArray(input.conflictGroups)) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_ANALYSIS_GROUPS_INVALID', 'Conflict groups must be an array', input.resultId))
    }

    for (const group of input.conflictGroups) {
      if (!CONFLICT_CATEGORIES.includes(group.category)) {
        diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_GROUP_CATEGORY_INVALID', `Conflict category is invalid: ${group.category}`, group.groupId))
      }

      if (!CONFLICT_SEVERITIES.includes(group.severity)) {
        diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_GROUP_SEVERITY_INVALID', `Conflict severity is invalid: ${group.severity}`, group.groupId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateConflictReference(input: ConflictReferenceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.referenceId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_REFERENCE_ID_REQUIRED', 'Conflict referenceId is required'))
    }

    if (!input.groupId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_REFERENCE_GROUP_ID_REQUIRED', 'Conflict groupId is required', input.referenceId))
    }

    if (!input.sourceId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_REFERENCE_SOURCE_ID_REQUIRED', 'Conflict sourceId is required', input.referenceId))
    }

    if (!input.statement) {
      diagnostics.push(createDiagnostic('quality', 'error', 'CONFLICT_REFERENCE_STATEMENT_REQUIRED', 'Conflict reference statement is required', input.referenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGapAnalysis(input: GapAnalysisInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.analysisId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'GAP_ANALYSIS_ID_REQUIRED', 'Gap analysis analysisId is required'))
    }

    if (!input.qualityId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'GAP_ANALYSIS_QUALITY_ID_REQUIRED', 'Gap analysis qualityId is required', input.analysisId))
    }

    if (!Array.isArray(input.knowledgeGaps)) {
      diagnostics.push(createDiagnostic('quality', 'error', 'GAP_ANALYSIS_GAPS_INVALID', 'Knowledge gaps must be an array', input.analysisId))
    }

    for (const gap of input.knowledgeGaps) {
      if (!GAP_SEVERITIES.includes(gap.severity)) {
        diagnostics.push(createDiagnostic('quality', 'error', 'GAP_ANALYSIS_SEVERITY_INVALID', `Gap severity is invalid: ${gap.severity}`, gap.gapId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateQualityGovernance(input: QualityGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_GOVERNANCE_OWNER_REQUIRED', 'Quality governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('quality', 'warning', 'QUALITY_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Quality governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_GOVERNANCE_VERSION_REQUIRED', 'Quality governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_GOVERNANCE_TRACEABILITY_INVALID', 'Quality governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_GOVERNANCE_PROVENANCE_REQUIRED', 'Quality governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('quality', 'error', 'QUALITY_GOVERNANCE_FRESHNESS_REQUIRED', 'Quality governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgeQualityPolicy(input: KnowledgeQualityPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (input.completenessPolicy.minimumCompletenessScore < 0 || input.completenessPolicy.minimumCompletenessScore > 1) {
      diagnostics.push(createDiagnostic('quality', 'warning', 'KNOWLEDGE_QUALITY_POLICY_COMPLETENESS_OUT_OF_RANGE', 'Completeness policy minimumCompletenessScore should be between 0 and 1'))
    }

    if (input.consistencyPolicy.maximumCriticalConflicts < 0) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_POLICY_CONSISTENCY_INVALID', 'Consistency policy maximumCriticalConflicts must be non-negative'))
    }

    if (input.freshnessPolicy.maxAgeMs < 0) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_POLICY_FRESHNESS_INVALID', 'Freshness policy maxAgeMs must be non-negative'))
    }

    if (!QUALITY_CONFLICT_POLICY_STRATEGIES.includes(input.conflictPolicy.strategy)) {
      diagnostics.push(createDiagnostic('quality', 'error', 'KNOWLEDGE_QUALITY_POLICY_CONFLICT_STRATEGY_INVALID', `Conflict policy strategy is invalid: ${input.conflictPolicy.strategy}`))
    }

    if (input.coveragePolicy.minimumCoverageScore < 0 || input.coveragePolicy.minimumCoverageScore > 1) {
      diagnostics.push(createDiagnostic('quality', 'warning', 'KNOWLEDGE_QUALITY_POLICY_COVERAGE_OUT_OF_RANGE', 'Coverage policy minimumCoverageScore should be between 0 and 1'))
    }

    if (input.relevancePolicy.minimumRelevanceScore < 0 || input.relevancePolicy.minimumRelevanceScore > 1) {
      diagnostics.push(createDiagnostic('quality', 'warning', 'KNOWLEDGE_QUALITY_POLICY_RELEVANCE_OUT_OF_RANGE', 'Relevance policy minimumRelevanceScore should be between 0 and 1'))
    }

    if (input.evidenceQualityPolicy.minimumEvidenceConfidence < 0 || input.evidenceQualityPolicy.minimumEvidenceConfidence > 1) {
      diagnostics.push(createDiagnostic('quality', 'warning', 'KNOWLEDGE_QUALITY_POLICY_EVIDENCE_OUT_OF_RANGE', 'Evidence quality policy minimumEvidenceConfidence should be between 0 and 1'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeReadinessValidator {
  validateKnowledgeReadiness(input: KnowledgeReadinessRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.readinessId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'KNOWLEDGE_READINESS_ID_REQUIRED', 'Knowledge readinessId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'KNOWLEDGE_READINESS_NAME_REQUIRED', 'Knowledge readiness name is required', input.readinessId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'KNOWLEDGE_READINESS_VERSION_REQUIRED', 'Knowledge readiness version is required', input.readinessId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'KNOWLEDGE_READINESS_CONTRACT_VERSION_REQUIRED', 'Knowledge readiness contractVersion is required', input.readinessId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReadinessReport(input: ReadinessReportInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.reportId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_ID_REQUIRED', 'Readiness reportId is required'))
    }

    if (!input.readinessId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_READINESS_ID_REQUIRED', 'Readiness report readinessId is required', input.reportId))
    }

    if (!READINESS_STATUSES.includes(input.status)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_STATUS_INVALID', `Readiness status is invalid: ${input.status}`, input.reportId))
    }

    if (!READINESS_DECISIONS.includes(input.decision)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_DECISION_INVALID', `Readiness decision is invalid: ${input.decision}`, input.reportId))
    }

    if (input.score.overall < 0 || input.score.overall > 1) {
      diagnostics.push(createDiagnostic('readiness', 'warning', 'READINESS_REPORT_SCORE_OUT_OF_RANGE', 'Readiness overall score should be between 0 and 1', input.reportId))
    }

    if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_CRITERIA_INVALID', 'Readiness criteria must be a non-empty array', input.reportId))
    }

    if (!Array.isArray(input.traceability.traceIds)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_REPORT_TRACEABILITY_INVALID', 'Readiness traceability.traceIds must be an array', input.reportId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validatePromptHandoff(input: PromptHandoffPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.handoffId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_ID_REQUIRED', 'Prompt handoffId is required'))
    }

    if (!input.readinessId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_READINESS_ID_REQUIRED', 'Prompt handoff readinessId is required', input.handoffId))
    }

    if (!input.finalContextPackage.contextId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_CONTEXT_ID_REQUIRED', 'Final context package contextId is required', input.handoffId))
    }

    if (!Array.isArray(input.finalKnowledgePackage.knowledgeIds)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_KNOWLEDGE_IDS_INVALID', 'Final knowledge package knowledgeIds must be an array', input.handoffId))
    }

    if (!Array.isArray(input.finalEvidencePackage.evidenceIds)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_EVIDENCE_IDS_INVALID', 'Final evidence package evidenceIds must be an array', input.handoffId))
    }

    if (!Array.isArray(input.finalValidationPackage.validationChecks)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'PROMPT_HANDOFF_VALIDATION_CHECKS_INVALID', 'Final validation package validationChecks must be an array', input.handoffId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReadinessPolicy(input: ReadinessPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (input.minimumCompletenessPolicy.minimumCompletenessScore < 0 || input.minimumCompletenessPolicy.minimumCompletenessScore > 1) {
      diagnostics.push(createDiagnostic('readiness', 'warning', 'READINESS_POLICY_COMPLETENESS_OUT_OF_RANGE', 'Minimum completeness score should be between 0 and 1'))
    }

    if (input.minimumConfidencePolicy.minimumConfidenceScore < 0 || input.minimumConfidencePolicy.minimumConfidenceScore > 1) {
      diagnostics.push(createDiagnostic('readiness', 'warning', 'READINESS_POLICY_CONFIDENCE_OUT_OF_RANGE', 'Minimum confidence score should be between 0 and 1'))
    }

    if (input.conflictTolerancePolicy.maximumCriticalConflicts < 0 || input.conflictTolerancePolicy.maximumHighConflicts < 0) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_POLICY_CONFLICT_TOLERANCE_INVALID', 'Conflict tolerance values must be non-negative'))
    }

    if (input.freshnessPolicy.maxAgeMs < 0) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_POLICY_FRESHNESS_INVALID', 'Freshness policy maxAgeMs must be non-negative'))
    }

    if (input.evidenceCoveragePolicy.minimumCoverageScore < 0 || input.evidenceCoveragePolicy.minimumCoverageScore > 1) {
      diagnostics.push(createDiagnostic('readiness', 'warning', 'READINESS_POLICY_EVIDENCE_COVERAGE_OUT_OF_RANGE', 'Evidence coverage minimumCoverageScore should be between 0 and 1'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReadinessGovernance(input: ReadinessGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_GOVERNANCE_OWNER_REQUIRED', 'Readiness governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('readiness', 'warning', 'READINESS_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Readiness governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_GOVERNANCE_VERSION_REQUIRED', 'Readiness governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_GOVERNANCE_TRACEABILITY_INVALID', 'Readiness governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_GOVERNANCE_PROVENANCE_REQUIRED', 'Readiness governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('readiness', 'error', 'READINESS_GOVERNANCE_FRESHNESS_REQUIRED', 'Readiness governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class KnowledgeCertificationValidator {
  validateKnowledgeCertification(input: KnowledgeCertificationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.certificationId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'KNOWLEDGE_CERTIFICATION_ID_REQUIRED', 'Knowledge certificationId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('certification', 'error', 'KNOWLEDGE_CERTIFICATION_NAME_REQUIRED', 'Knowledge certification name is required', input.certificationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('certification', 'error', 'KNOWLEDGE_CERTIFICATION_VERSION_REQUIRED', 'Knowledge certification version is required', input.certificationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('certification', 'error', 'KNOWLEDGE_CERTIFICATION_CONTRACT_VERSION_REQUIRED', 'Knowledge certification contractVersion is required', input.certificationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCertificationReport(input: KnowledgeCertificationReportInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.reportId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_ID_REQUIRED', 'Certification reportId is required'))
    }

    if (!input.certificationId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_CERTIFICATION_ID_REQUIRED', 'Certification report certificationId is required', input.reportId))
    }

    if (!CERTIFICATION_STATUSES.includes(input.status)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_STATUS_INVALID', `Certification status is invalid: ${input.status}`, input.reportId))
    }

    if (!CERTIFICATION_DECISIONS.includes(input.decision)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_DECISION_INVALID', `Certification decision is invalid: ${input.decision}`, input.reportId))
    }

    if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_CRITERIA_INVALID', 'Certification criteria must be a non-empty array', input.reportId))
    }

    if (!Array.isArray(input.recommendations)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_RECOMMENDATIONS_INVALID', 'Certification recommendations must be an array', input.reportId))
    }

    if (!Array.isArray(input.evidence)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_EVIDENCE_INVALID', 'Certification evidence must be an array', input.reportId))
    }

    if (!Array.isArray(input.traceability.traceIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_TRACEABILITY_INVALID', 'Certification traceability.traceIds must be an array', input.reportId))
    }

    if (!Array.isArray(input.traceability.references)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_REFERENCES_INVALID', 'Certification traceability.references must be an array', input.reportId))
    }

    if (
      input.summary.totalCriteria < 0 ||
      input.summary.passedCriteria < 0 ||
      input.summary.failedCriteria < 0 ||
      input.summary.requiredCriteria < 0 ||
      input.summary.requiredPassedCriteria < 0
    ) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_REPORT_SUMMARY_INVALID', 'Certification summary counters must be non-negative', input.reportId))
    }

    for (const criterion of input.criteria) {
      if (criterion.score !== undefined && (criterion.score < 0 || criterion.score > 1)) {
        diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_CRITERIA_SCORE_OUT_OF_RANGE', 'Certification criteria score should be between 0 and 1', criterion.criteriaId))
      }
    }

    for (const evidence of input.evidence) {
      if (evidence.confidence < 0 || evidence.confidence > 1) {
        diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_EVIDENCE_CONFIDENCE_OUT_OF_RANGE', 'Certification evidence confidence should be between 0 and 1', evidence.evidenceId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validatePromptDeliveryPackage(input: PromptDeliveryPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.deliveryId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_ID_REQUIRED', 'Prompt delivery deliveryId is required'))
    }

    if (!input.certificationId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_CERTIFICATION_ID_REQUIRED', 'Prompt delivery certificationId is required', input.deliveryId))
    }

    if (!input.reportId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_REPORT_ID_REQUIRED', 'Prompt delivery reportId is required', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedKnowledgePackage.knowledgeIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_KNOWLEDGE_PACKAGE_INVALID', 'Certified knowledge package knowledgeIds must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedEvidencePackage.evidenceIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_EVIDENCE_PACKAGE_INVALID', 'Certified evidence package evidenceIds must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedContextPackage.contextIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_CONTEXT_PACKAGE_INVALID', 'Certified context package contextIds must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedConstraintPackage.constraints)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_CONSTRAINT_PACKAGE_INVALID', 'Certified constraint package constraints must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedObjectivePackage.objectives)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_OBJECTIVE_PACKAGE_INVALID', 'Certified objective package objectives must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedReferencePackage.referenceIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_REFERENCE_PACKAGE_INVALID', 'Certified reference package referenceIds must be an array', input.deliveryId))
    }

    if (!Array.isArray(input.certifiedValidationPackage.validationChecks)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'PROMPT_DELIVERY_VALIDATION_PACKAGE_INVALID', 'Certified validation package validationChecks must be an array', input.deliveryId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCertificationPolicy(input: CertificationPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (input.completenessCertificationPolicy.minimumCompletenessScore < 0 || input.completenessCertificationPolicy.minimumCompletenessScore > 1) {
      diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_POLICY_COMPLETENESS_OUT_OF_RANGE', 'Completeness certification minimumCompletenessScore should be between 0 and 1'))
    }

    if (input.confidenceCertificationPolicy.minimumConfidenceScore < 0 || input.confidenceCertificationPolicy.minimumConfidenceScore > 1) {
      diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_POLICY_CONFIDENCE_OUT_OF_RANGE', 'Confidence certification minimumConfidenceScore should be between 0 and 1'))
    }

    if (input.conflictCertificationPolicy.maximumCriticalConflicts < 0 || input.conflictCertificationPolicy.maximumHighConflicts < 0) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_POLICY_CONFLICT_INVALID', 'Conflict certification thresholds must be non-negative'))
    }

    if (input.freshnessCertificationPolicy.maxAgeMs < 0) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_POLICY_FRESHNESS_INVALID', 'Freshness certification maxAgeMs must be non-negative'))
    }

    if (input.evidenceCertificationPolicy.minimumCoverageScore < 0 || input.evidenceCertificationPolicy.minimumCoverageScore > 1) {
      diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_POLICY_EVIDENCE_COVERAGE_OUT_OF_RANGE', 'Evidence certification minimumCoverageScore should be between 0 and 1'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCertificationGovernance(input: CertificationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_GOVERNANCE_OWNER_REQUIRED', 'Certification governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('certification', 'warning', 'CERTIFICATION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Certification governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_GOVERNANCE_VERSION_REQUIRED', 'Certification governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_GOVERNANCE_TRACEABILITY_INVALID', 'Certification governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_GOVERNANCE_PROVENANCE_REQUIRED', 'Certification governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('certification', 'error', 'CERTIFICATION_GOVERNANCE_FRESHNESS_REQUIRED', 'Certification governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ReasoningEngineValidator {
  validateReasoningEngine(input: ReasoningEngineRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.engineId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_ENGINE_ID_REQUIRED', 'Reasoning engineId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_ENGINE_NAME_REQUIRED', 'Reasoning engine name is required', input.engineId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_ENGINE_VERSION_REQUIRED', 'Reasoning engine version is required', input.engineId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_ENGINE_CONTRACT_VERSION_REQUIRED', 'Reasoning engine contractVersion is required', input.engineId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReasoningPlan(input: ReasoningPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.planId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_ID_REQUIRED', 'Reasoning planId is required'))
    }

    if (!input.engineId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_ENGINE_ID_REQUIRED', 'Reasoning plan engineId is required', input.planId))
    }

    if (!REASONING_ENGINE_STAGES.includes(input.stage)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_STAGE_INVALID', `Reasoning plan stage is invalid: ${input.stage}`, input.planId))
    }

    if (!Array.isArray(input.objectives)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_OBJECTIVES_INVALID', 'Reasoning plan objectives must be an array', input.planId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_CONSTRAINTS_INVALID', 'Reasoning plan constraints must be an array', input.planId))
    }

    if (!Array.isArray(input.assumptions)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_ASSUMPTIONS_INVALID', 'Reasoning plan assumptions must be an array', input.planId))
    }

    if (!Array.isArray(input.evidence)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_EVIDENCE_INVALID', 'Reasoning plan evidence must be an array', input.planId))
    }

    if (!Array.isArray(input.decisionPoints)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_DECISION_POINTS_INVALID', 'Reasoning plan decisionPoints must be an array', input.planId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_OUTCOMES_INVALID', 'Reasoning plan outcomes must be an array', input.planId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_PLAN_SUMMARY_REQUIRED', 'Reasoning plan summary synopsis is required', input.planId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReasoningStage(stage: ReasoningEngineStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!REASONING_ENGINE_STAGES.includes(stage)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_STAGE_INVALID', `Reasoning stage is invalid: ${stage}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReasoningGovernance(input: ReasoningEngineGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_OWNER_REQUIRED', 'Reasoning governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('reasoning', 'warning', 'REASONING_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Reasoning governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_VERSION_REQUIRED', 'Reasoning governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_TRACEABILITY_INVALID', 'Reasoning governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_PROVENANCE_REQUIRED', 'Reasoning governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_GOVERNANCE_FRESHNESS_REQUIRED', 'Reasoning governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateReasoningOutput(input: ReasoningOutputInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.outputId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_ID_REQUIRED', 'Reasoning outputId is required'))
    }

    if (!input.engineId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_ENGINE_ID_REQUIRED', 'Reasoning output engineId is required', input.outputId))
    }

    if (!input.planId) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_PLAN_ID_REQUIRED', 'Reasoning output planId is required', input.outputId))
    }

    if (!REASONING_ENGINE_STAGES.includes(input.stage)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_STAGE_INVALID', `Reasoning output stage is invalid: ${input.stage}`, input.outputId))
    }

    if (!input.summary) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_SUMMARY_REQUIRED', 'Reasoning output summary is required', input.outputId))
    }

    if (!Array.isArray(input.references)) {
      diagnostics.push(createDiagnostic('reasoning', 'error', 'REASONING_OUTPUT_REFERENCES_INVALID', 'Reasoning output references must be an array', input.outputId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class StrategicReasoningValidator {
  validateStrategicReasoning(input: StrategicReasoningRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.strategicReasoningId) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_REASONING_ID_REQUIRED', 'Strategic reasoningId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_REASONING_NAME_REQUIRED', 'Strategic reasoning name is required', input.strategicReasoningId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_REASONING_VERSION_REQUIRED', 'Strategic reasoning version is required', input.strategicReasoningId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_REASONING_CONTRACT_VERSION_REQUIRED', 'Strategic reasoning contractVersion is required', input.strategicReasoningId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStrategicPlanning(input: StrategicPlanningInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.planningId) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_ID_REQUIRED', 'Strategic planningId is required'))
    }

    if (!input.strategicReasoningId) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_REASONING_ID_REQUIRED', 'Strategic planning strategicReasoningId is required', input.planningId))
    }

    if (!STRATEGIC_THINKING_STAGES.includes(input.stage)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_STAGE_INVALID', `Strategic planning stage is invalid: ${input.stage}`, input.planningId))
    }

    if (!Array.isArray(input.objectives)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_OBJECTIVES_INVALID', 'Strategic planning objectives must be an array', input.planningId))
    }

    if (!Array.isArray(input.problems)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_PROBLEMS_INVALID', 'Strategic planning problems must be an array', input.planningId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_CONSTRAINTS_INVALID', 'Strategic planning constraints must be an array', input.planningId))
    }

    if (!Array.isArray(input.assumptions)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_ASSUMPTIONS_INVALID', 'Strategic planning assumptions must be an array', input.planningId))
    }

    if (!Array.isArray(input.opportunities)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_OPPORTUNITIES_INVALID', 'Strategic planning opportunities must be an array', input.planningId))
    }

    if (!Array.isArray(input.risks)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_RISKS_INVALID', 'Strategic planning risks must be an array', input.planningId))
    }

    if (!Array.isArray(input.scenarios)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_SCENARIOS_INVALID', 'Strategic planning scenarios must be an array', input.planningId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_OUTCOMES_INVALID', 'Strategic planning outcomes must be an array', input.planningId))
    }

    if (!Array.isArray(input.recommendations)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_RECOMMENDATIONS_INVALID', 'Strategic planning recommendations must be an array', input.planningId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_PLANNING_SUMMARY_REQUIRED', 'Strategic planning summary synopsis is required', input.planningId))
    }

    for (const assumption of input.assumptions) {
      if (assumption.confidence < 0 || assumption.confidence > 1) {
        diagnostics.push(createDiagnostic('strategic', 'warning', 'STRATEGIC_ASSUMPTION_CONFIDENCE_OUT_OF_RANGE', 'Strategic assumption confidence should be between 0 and 1', assumption.assumptionId))
      }
    }

    for (const scenario of input.scenarios) {
      if (scenario.likelihood < 0 || scenario.likelihood > 1) {
        diagnostics.push(createDiagnostic('strategic', 'warning', 'STRATEGIC_SCENARIO_LIKELIHOOD_OUT_OF_RANGE', 'Strategic scenario likelihood should be between 0 and 1', scenario.scenarioId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStrategicStage(stage: StrategicThinkingStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!STRATEGIC_THINKING_STAGES.includes(stage)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_STAGE_INVALID', `Strategic stage is invalid: ${stage}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStrategicGovernance(input: StrategicGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_GOVERNANCE_OWNER_REQUIRED', 'Strategic governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('strategic', 'warning', 'STRATEGIC_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Strategic governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_GOVERNANCE_VERSION_REQUIRED', 'Strategic governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_GOVERNANCE_TRACEABILITY_INVALID', 'Strategic governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_GOVERNANCE_PROVENANCE_REQUIRED', 'Strategic governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_GOVERNANCE_FRESHNESS_REQUIRED', 'Strategic governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateStrategicRecommendation(input: StrategicRecommendationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.recommendationId) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_RECOMMENDATION_ID_REQUIRED', 'Strategic recommendationId is required'))
    }

    if (!input.title) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_RECOMMENDATION_TITLE_REQUIRED', 'Strategic recommendation title is required', input.recommendationId))
    }

    if (!input.rationale) {
      diagnostics.push(createDiagnostic('strategic', 'error', 'STRATEGIC_RECOMMENDATION_RATIONALE_REQUIRED', 'Strategic recommendation rationale is required', input.recommendationId))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('strategic', 'warning', 'STRATEGIC_RECOMMENDATION_CONFIDENCE_OUT_OF_RANGE', 'Strategic recommendation confidence should be between 0 and 1', input.recommendationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class TacticalPlanningValidator {
  validateTacticalPlanning(input: TacticalPlanningRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.tacticalPlanningId) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLANNING_ID_REQUIRED', 'Tactical planningId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLANNING_NAME_REQUIRED', 'Tactical planning name is required', input.tacticalPlanningId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLANNING_VERSION_REQUIRED', 'Tactical planning version is required', input.tacticalPlanningId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLANNING_CONTRACT_VERSION_REQUIRED', 'Tactical planning contractVersion is required', input.tacticalPlanningId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTacticalPlan(input: TacticalPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.planId) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_ID_REQUIRED', 'Tactical planId is required'))
    }

    if (!input.tacticalPlanningId) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_PLANNING_ID_REQUIRED', 'Tactical plan tacticalPlanningId is required', input.planId))
    }

    if (!TACTICAL_PLANNING_STAGES.includes(input.stage)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_STAGE_INVALID', `Tactical plan stage is invalid: ${input.stage}`, input.planId))
    }

    if (!Array.isArray(input.strategicReferences?.strategicRecommendationIds)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_STRATEGIC_REFERENCES_INVALID', 'Tactical plan strategic references must include strategicRecommendationIds array', input.planId))
    }

    if (!Array.isArray(input.objectives)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_OBJECTIVES_INVALID', 'Tactical plan objectives must be an array', input.planId))
    }

    if (!Array.isArray(input.tasks)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_TASKS_INVALID', 'Tactical plan tasks must be an array', input.planId))
    }

    if (!Array.isArray(input.milestones)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_MILESTONES_INVALID', 'Tactical plan milestones must be an array', input.planId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_DEPENDENCIES_INVALID', 'Tactical plan dependencies must be an array', input.planId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_CONSTRAINTS_INVALID', 'Tactical plan constraints must be an array', input.planId))
    }

    if (!Array.isArray(input.resources)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_RESOURCES_INVALID', 'Tactical plan resources must be an array', input.planId))
    }

    if (!Array.isArray(input.schedule?.checkpoints)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_SCHEDULE_INVALID', 'Tactical plan schedule checkpoints must be an array', input.planId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_OUTCOMES_INVALID', 'Tactical plan outcomes must be an array', input.planId))
    }

    if (!Array.isArray(input.recommendations)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_RECOMMENDATIONS_INVALID', 'Tactical plan recommendations must be an array', input.planId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_PLAN_SUMMARY_REQUIRED', 'Tactical plan summary synopsis is required', input.planId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTacticalStage(stage: TacticalPlanningStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!TACTICAL_PLANNING_STAGES.includes(stage)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_STAGE_INVALID', `Tactical stage is invalid: ${stage}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTacticalGovernance(input: TacticalGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_GOVERNANCE_OWNER_REQUIRED', 'Tactical governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('tactical', 'warning', 'TACTICAL_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Tactical governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_GOVERNANCE_VERSION_REQUIRED', 'Tactical governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_GOVERNANCE_TRACEABILITY_INVALID', 'Tactical governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_GOVERNANCE_PROVENANCE_REQUIRED', 'Tactical governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_GOVERNANCE_FRESHNESS_REQUIRED', 'Tactical governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTacticalRecommendation(input: TacticalRecommendationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.recommendationId) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_RECOMMENDATION_ID_REQUIRED', 'Tactical recommendationId is required'))
    }

    if (!input.title) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_RECOMMENDATION_TITLE_REQUIRED', 'Tactical recommendation title is required', input.recommendationId))
    }

    if (!input.rationale) {
      diagnostics.push(createDiagnostic('tactical', 'error', 'TACTICAL_RECOMMENDATION_RATIONALE_REQUIRED', 'Tactical recommendation rationale is required', input.recommendationId))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('tactical', 'warning', 'TACTICAL_RECOMMENDATION_CONFIDENCE_OUT_OF_RANGE', 'Tactical recommendation confidence should be between 0 and 1', input.recommendationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class DecisionIntelligenceValidator {
  validateDecisionIntelligence(input: DecisionIntelligenceRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.decisionIntelligenceId) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_INTELLIGENCE_ID_REQUIRED', 'Decision intelligenceId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_INTELLIGENCE_NAME_REQUIRED', 'Decision intelligence name is required', input.decisionIntelligenceId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_INTELLIGENCE_VERSION_REQUIRED', 'Decision intelligence version is required', input.decisionIntelligenceId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_INTELLIGENCE_CONTRACT_VERSION_REQUIRED', 'Decision intelligence contractVersion is required', input.decisionIntelligenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDecisionPackage(input: DecisionPackageInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.packageId) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_ID_REQUIRED', 'Decision packageId is required'))
    }

    if (!input.decisionIntelligenceId) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_INTELLIGENCE_ID_REQUIRED', 'Decision package decisionIntelligenceId is required', input.packageId))
    }

    if (!Array.isArray(input.tacticalReferences?.tacticalRecommendationIds)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_TACTICAL_REFERENCES_INVALID', 'Decision package tactical references must include tacticalRecommendationIds array', input.packageId))
    }

    if (!Array.isArray(input.candidates)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_CANDIDATES_INVALID', 'Decision package candidates must be an array', input.packageId))
    }

    if (!Array.isArray(input.options)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_OPTIONS_INVALID', 'Decision package options must be an array', input.packageId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_CONSTRAINTS_INVALID', 'Decision package constraints must be an array', input.packageId))
    }

    if (!Array.isArray(input.risks)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_RISKS_INVALID', 'Decision package risks must be an array', input.packageId))
    }

    if (!Array.isArray(input.tradeoffs)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_TRADEOFFS_INVALID', 'Decision package tradeoffs must be an array', input.packageId))
    }

    if (!Array.isArray(input.impacts)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_IMPACTS_INVALID', 'Decision package impacts must be an array', input.packageId))
    }

    if (!Array.isArray(input.recommendations)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_RECOMMENDATIONS_INVALID', 'Decision package recommendations must be an array', input.packageId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_OUTCOMES_INVALID', 'Decision package outcomes must be an array', input.packageId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_LIFECYCLE_INVALID', 'Decision package lifecycleStates must be an array', input.packageId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_PACKAGE_SUMMARY_REQUIRED', 'Decision package summary synopsis is required', input.packageId))
    }

    for (const candidate of input.candidates) {
      if (candidate.confidence < 0 || candidate.confidence > 1) {
        diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_CANDIDATE_CONFIDENCE_OUT_OF_RANGE', 'Decision candidate confidence should be between 0 and 1', candidate.candidateId))
      }
    }

    for (const option of input.options) {
      if (option.confidence < 0 || option.confidence > 1) {
        diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_OPTION_CONFIDENCE_OUT_OF_RANGE', 'Decision option confidence should be between 0 and 1', option.optionId))
      }
    }

    for (const risk of input.risks) {
      if (risk.likelihood < 0 || risk.likelihood > 1) {
        diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_RISK_LIKELIHOOD_OUT_OF_RANGE', 'Decision risk likelihood should be between 0 and 1', risk.riskId))
      }

      if (risk.impact < 0 || risk.impact > 1) {
        diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_RISK_IMPACT_OUT_OF_RANGE', 'Decision risk impact should be between 0 and 1', risk.riskId))
      }
    }

    for (const impact of input.impacts) {
      if (impact.confidence < 0 || impact.confidence > 1) {
        diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_IMPACT_CONFIDENCE_OUT_OF_RANGE', 'Decision impact confidence should be between 0 and 1', impact.impactId))
      }
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDecisionLifecycle(input: DecisionLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!DECISION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_LIFECYCLE_INVALID', `Decision lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDecisionGovernance(input: DecisionGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_GOVERNANCE_OWNER_REQUIRED', 'Decision governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Decision governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_GOVERNANCE_VERSION_REQUIRED', 'Decision governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_GOVERNANCE_TRACEABILITY_INVALID', 'Decision governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_GOVERNANCE_PROVENANCE_REQUIRED', 'Decision governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_GOVERNANCE_FRESHNESS_REQUIRED', 'Decision governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDecisionRecommendation(input: DecisionRecommendationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.recommendationId) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_RECOMMENDATION_ID_REQUIRED', 'Decision recommendationId is required'))
    }

    if (!input.title) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_RECOMMENDATION_TITLE_REQUIRED', 'Decision recommendation title is required', input.recommendationId))
    }

    if (!input.rationale) {
      diagnostics.push(createDiagnostic('decision', 'error', 'DECISION_RECOMMENDATION_RATIONALE_REQUIRED', 'Decision recommendation rationale is required', input.recommendationId))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('decision', 'warning', 'DECISION_RECOMMENDATION_CONFIDENCE_OUT_OF_RANGE', 'Decision recommendation confidence should be between 0 and 1', input.recommendationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ActionIntelligenceValidator {
  validateActionIntelligence(input: ActionIntelligenceRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.actionIntelligenceId) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_INTELLIGENCE_ID_REQUIRED', 'Action intelligenceId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_INTELLIGENCE_NAME_REQUIRED', 'Action intelligence name is required', input.actionIntelligenceId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_INTELLIGENCE_VERSION_REQUIRED', 'Action intelligence version is required', input.actionIntelligenceId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_INTELLIGENCE_CONTRACT_VERSION_REQUIRED', 'Action intelligence contractVersion is required', input.actionIntelligenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateActionPlan(input: ActionPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.actionPlanId) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_ID_REQUIRED', 'Action planId is required'))
    }

    if (!input.actionIntelligenceId) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_INTELLIGENCE_ID_REQUIRED', 'Action plan actionIntelligenceId is required', input.actionPlanId))
    }

    if (!Array.isArray(input.decisionReferences?.decisionRecommendationIds)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_DECISION_REFERENCES_INVALID', 'Action plan decision references must include decisionRecommendationIds array', input.actionPlanId))
    }

    if (!Array.isArray(input.groups)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_GROUPS_INVALID', 'Action plan groups must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.actionItems)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_ITEMS_INVALID', 'Action plan actionItems must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_DEPENDENCIES_INVALID', 'Action plan dependencies must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_CONSTRAINTS_INVALID', 'Action plan constraints must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.assignments)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_ASSIGNMENTS_INVALID', 'Action plan assignments must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.milestones)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_MILESTONES_INVALID', 'Action plan milestones must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_OUTCOMES_INVALID', 'Action plan outcomes must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_LIFECYCLE_INVALID', 'Action plan lifecycleStates must be an array', input.actionPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_PLAN_SUMMARY_REQUIRED', 'Action plan summary synopsis is required', input.actionPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateActionLifecycle(input: ActionLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!ACTION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_LIFECYCLE_INVALID', `Action lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateActionGovernance(input: ActionGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_GOVERNANCE_OWNER_REQUIRED', 'Action governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('action', 'warning', 'ACTION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Action governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_GOVERNANCE_VERSION_REQUIRED', 'Action governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_GOVERNANCE_TRACEABILITY_INVALID', 'Action governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_GOVERNANCE_PROVENANCE_REQUIRED', 'Action governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_GOVERNANCE_FRESHNESS_REQUIRED', 'Action governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateActionReadiness(input: ActionReadinessInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.actionPlanId) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_READINESS_PLAN_ID_REQUIRED', 'Action readiness actionPlanId is required'))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_READINESS_LIFECYCLE_INVALID', 'Action readiness lifecycleStates must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.assignments)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_READINESS_ASSIGNMENTS_INVALID', 'Action readiness assignments must be an array', input.actionPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('action', 'error', 'ACTION_READINESS_DEPENDENCIES_INVALID', 'Action readiness dependencies must be an array', input.actionPlanId))
    }

    const hasReadyOrCompleteState = input.lifecycleStates.some((state) => {
      return state.stage === 'action-ready' || state.stage === 'action-complete'
    })

    if (!hasReadyOrCompleteState) {
      diagnostics.push(createDiagnostic('action', 'warning', 'ACTION_READINESS_STATE_NOT_REACHED', 'Action readiness does not include action-ready or action-complete lifecycle stage', input.actionPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousWorkflowValidator {
  validateAutonomousWorkflow(input: AutonomousWorkflowRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousWorkflowId) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'AUTONOMOUS_WORKFLOW_ID_REQUIRED', 'Autonomous workflow ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'AUTONOMOUS_WORKFLOW_NAME_REQUIRED', 'Autonomous workflow name is required', input.autonomousWorkflowId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'AUTONOMOUS_WORKFLOW_VERSION_REQUIRED', 'Autonomous workflow version is required', input.autonomousWorkflowId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'AUTONOMOUS_WORKFLOW_CONTRACT_VERSION_REQUIRED', 'Autonomous workflow contractVersion is required', input.autonomousWorkflowId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkflowPlan(input: AutonomousWorkflowInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.workflowId) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_ID_REQUIRED', 'Workflow plan workflowId is required'))
    }

    if (!input.autonomousWorkflowId) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_AUTONOMOUS_ID_REQUIRED', 'Workflow plan autonomousWorkflowId is required', input.workflowId))
    }

    if (!Array.isArray(input.objectives)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_OBJECTIVES_INVALID', 'Workflow plan objectives must be an array', input.workflowId))
    }

    if (!Array.isArray(input.phases)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_PHASES_INVALID', 'Workflow plan phases must be an array', input.workflowId))
    }

    if (!Array.isArray(input.steps)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_STEPS_INVALID', 'Workflow plan steps must be an array', input.workflowId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_DEPENDENCIES_INVALID', 'Workflow plan dependencies must be an array', input.workflowId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_CONSTRAINTS_INVALID', 'Workflow plan constraints must be an array', input.workflowId))
    }

    if (!Array.isArray(input.checkpoints)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_CHECKPOINTS_INVALID', 'Workflow plan checkpoints must be an array', input.workflowId))
    }

    if (!Array.isArray(input.approvals)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_APPROVALS_INVALID', 'Workflow plan approvals must be an array', input.workflowId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_OUTCOMES_INVALID', 'Workflow plan outcomes must be an array', input.workflowId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_LIFECYCLE_INVALID', 'Workflow plan lifecycleStates must be an array', input.workflowId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_PLAN_SUMMARY_REQUIRED', 'Workflow plan summary synopsis is required', input.workflowId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkflowLifecycle(input: AutonomousWorkflowLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_WORKFLOW_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_LIFECYCLE_INVALID', `Workflow lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkflowGovernance(input: AutonomousWorkflowGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_GOVERNANCE_OWNER_REQUIRED', 'Workflow governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'warning', 'WORKFLOW_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Workflow governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_GOVERNANCE_VERSION_REQUIRED', 'Workflow governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_GOVERNANCE_TRACEABILITY_INVALID', 'Workflow governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_GOVERNANCE_PROVENANCE_REQUIRED', 'Workflow governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_GOVERNANCE_FRESHNESS_REQUIRED', 'Workflow governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkflowReadiness(input: AutonomousWorkflowReadinessInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.workflowId) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_READINESS_ID_REQUIRED', 'Workflow readiness workflowId is required'))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_READINESS_LIFECYCLE_INVALID', 'Workflow readiness lifecycleStates must be an array', input.workflowId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_READINESS_DEPENDENCIES_INVALID', 'Workflow readiness dependencies must be an array', input.workflowId))
    }

    if (!Array.isArray(input.approvals)) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'error', 'WORKFLOW_READINESS_APPROVALS_INVALID', 'Workflow readiness approvals must be an array', input.workflowId))
    }

    const hasReadyOrLaterState = input.lifecycleStates.some((state) => {
      return (
        state.stage === 'workflow-ready' ||
        state.stage === 'workflow-running' ||
        state.stage === 'workflow-completed'
      )
    })

    if (!hasReadyOrLaterState) {
      diagnostics.push(createDiagnostic('autonomous-workflow', 'warning', 'WORKFLOW_READINESS_STATE_NOT_REACHED', 'Workflow readiness does not include workflow-ready, workflow-running, or workflow-completed lifecycle stage', input.workflowId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousTaskValidator {
  validateAutonomousTask(input: AutonomousTaskRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousTaskId) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'AUTONOMOUS_TASK_ID_REQUIRED', 'Autonomous task ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'AUTONOMOUS_TASK_NAME_REQUIRED', 'Autonomous task name is required', input.autonomousTaskId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'AUTONOMOUS_TASK_VERSION_REQUIRED', 'Autonomous task version is required', input.autonomousTaskId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'AUTONOMOUS_TASK_CONTRACT_VERSION_REQUIRED', 'Autonomous task contractVersion is required', input.autonomousTaskId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTaskPlan(input: AutonomousTaskInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.taskPlanId) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_ID_REQUIRED', 'Task plan taskPlanId is required'))
    }

    if (!input.autonomousTaskId) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_AUTONOMOUS_ID_REQUIRED', 'Task plan autonomousTaskId is required', input.taskPlanId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowStepIds)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_WORKFLOW_REFERENCES_INVALID', 'Task plan workflow references must include workflowStepIds array', input.taskPlanId))
    }

    if (!Array.isArray(input.objectives)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_OBJECTIVES_INVALID', 'Task plan objectives must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.groups)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_GROUPS_INVALID', 'Task plan groups must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.tasks)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_TASKS_INVALID', 'Task plan tasks must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_DEPENDENCIES_INVALID', 'Task plan dependencies must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.constraints)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_CONSTRAINTS_INVALID', 'Task plan constraints must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.checkpoints)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_CHECKPOINTS_INVALID', 'Task plan checkpoints must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.assignments)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_ASSIGNMENTS_INVALID', 'Task plan assignments must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.approvals)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_APPROVALS_INVALID', 'Task plan approvals must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_OUTCOMES_INVALID', 'Task plan outcomes must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_LIFECYCLE_INVALID', 'Task plan lifecycleStates must be an array', input.taskPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_PLAN_SUMMARY_REQUIRED', 'Task plan summary synopsis is required', input.taskPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTaskLifecycle(input: AutonomousTaskLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_TASK_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_LIFECYCLE_INVALID', `Task lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTaskGovernance(input: AutonomousTaskGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_GOVERNANCE_OWNER_REQUIRED', 'Task governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-task', 'warning', 'TASK_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Task governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_GOVERNANCE_VERSION_REQUIRED', 'Task governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_GOVERNANCE_TRACEABILITY_INVALID', 'Task governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_GOVERNANCE_PROVENANCE_REQUIRED', 'Task governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_GOVERNANCE_FRESHNESS_REQUIRED', 'Task governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTaskReadiness(input: AutonomousTaskReadinessInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.taskPlanId) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_READINESS_ID_REQUIRED', 'Task readiness taskPlanId is required'))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_READINESS_LIFECYCLE_INVALID', 'Task readiness lifecycleStates must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_READINESS_DEPENDENCIES_INVALID', 'Task readiness dependencies must be an array', input.taskPlanId))
    }

    if (!Array.isArray(input.assignments)) {
      diagnostics.push(createDiagnostic('autonomous-task', 'error', 'TASK_READINESS_ASSIGNMENTS_INVALID', 'Task readiness assignments must be an array', input.taskPlanId))
    }

    const hasReadyOrLaterState = input.lifecycleStates.some((state) => {
      return (
        state.stage === 'task-ready' ||
        state.stage === 'task-running' ||
        state.stage === 'task-completed'
      )
    })

    if (!hasReadyOrLaterState) {
      diagnostics.push(createDiagnostic('autonomous-task', 'warning', 'TASK_READINESS_STATE_NOT_REACHED', 'Task readiness does not include task-ready, task-running, or task-completed lifecycle stage', input.taskPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousAgentValidator {
  validateAutonomousAgent(input: AutonomousAgentRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousAgentId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AUTONOMOUS_AGENT_ID_REQUIRED', 'Autonomous agent ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AUTONOMOUS_AGENT_NAME_REQUIRED', 'Autonomous agent name is required', input.autonomousAgentId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AUTONOMOUS_AGENT_VERSION_REQUIRED', 'Autonomous agent version is required', input.autonomousAgentId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AUTONOMOUS_AGENT_CONTRACT_VERSION_REQUIRED', 'Autonomous agent contractVersion is required', input.autonomousAgentId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateAgentAssignment(input: AgentAssignmentInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.assignmentId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_ASSIGNMENT_ID_REQUIRED', 'Agent assignmentId is required'))
    }

    if (!input.agentId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_ASSIGNMENT_AGENT_REQUIRED', 'Agent assignment agentId is required', input.assignmentId))
    }

    if (!input.role) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_ASSIGNMENT_ROLE_REQUIRED', 'Agent assignment role is required', input.assignmentId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateAgentLifecycle(input: AutonomousAgentLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_AGENT_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_LIFECYCLE_INVALID', `Agent lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateAgentGovernance(input: AutonomousAgentGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_GOVERNANCE_OWNER_REQUIRED', 'Agent governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'warning', 'AGENT_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Agent governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_GOVERNANCE_VERSION_REQUIRED', 'Agent governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_GOVERNANCE_TRACEABILITY_INVALID', 'Agent governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_GOVERNANCE_PROVENANCE_REQUIRED', 'Agent governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'AGENT_GOVERNANCE_FRESHNESS_REQUIRED', 'Agent governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateCoordination(input: CoordinationPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.coordinationPlanId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_PLAN_ID_REQUIRED', 'Coordination plan coordinationPlanId is required'))
    }

    if (!input.autonomousAgentId) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_PLAN_AUTONOMOUS_ID_REQUIRED', 'Coordination plan autonomousAgentId is required', input.coordinationPlanId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_TASK_REFERENCES_INVALID', 'Coordination plan task references must include taskIds array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.agents)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_AGENTS_INVALID', 'Coordination plan agents must be an array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.roles)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_ROLES_INVALID', 'Coordination plan roles must be an array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_CAPABILITIES_INVALID', 'Coordination plan capabilities must be an array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.assignments)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_ASSIGNMENTS_INVALID', 'Coordination plan assignments must be an array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_LIFECYCLE_INVALID', 'Coordination plan lifecycleStates must be an array', input.coordinationPlanId))
    }

    if (!Array.isArray(input.coordinationConflicts)) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_CONFLICTS_INVALID', 'Coordination plan coordinationConflicts must be an array', input.coordinationPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-agent', 'error', 'COORDINATION_SUMMARY_REQUIRED', 'Coordination plan summary synopsis is required', input.coordinationPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousProjectValidator {
  validateAutonomousProject(input: AutonomousProjectRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousProjectId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'AUTONOMOUS_PROJECT_ID_REQUIRED', 'Autonomous project ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'AUTONOMOUS_PROJECT_NAME_REQUIRED', 'Autonomous project name is required', input.autonomousProjectId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'AUTONOMOUS_PROJECT_VERSION_REQUIRED', 'Autonomous project version is required', input.autonomousProjectId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'AUTONOMOUS_PROJECT_CONTRACT_VERSION_REQUIRED', 'Autonomous project contractVersion is required', input.autonomousProjectId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateProjectPlanning(input: AutonomousProjectInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.projectPlanId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_ID_REQUIRED', 'Project planning projectPlanId is required'))
    }

    if (!input.autonomousProjectId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_AUTONOMOUS_ID_REQUIRED', 'Project planning autonomousProjectId is required', input.projectPlanId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_WORKFLOW_REFERENCES_INVALID', 'Project planning workflow references must include workflowPlanIds array', input.projectPlanId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_TASK_REFERENCES_INVALID', 'Project planning task references must include taskIds array', input.projectPlanId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_AGENT_REFERENCES_INVALID', 'Project planning agent references must include agentIds array', input.projectPlanId))
    }

    if (!Array.isArray(input.portfolios)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_PORTFOLIOS_INVALID', 'Project planning portfolios must be an array', input.projectPlanId))
    }

    if (!Array.isArray(input.milestones)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_MILESTONES_INVALID', 'Project planning milestones must be an array', input.projectPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_DEPENDENCIES_INVALID', 'Project planning dependencies must be an array', input.projectPlanId))
    }

    if (!Array.isArray(input.resources)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_RESOURCES_INVALID', 'Project planning resources must be an array', input.projectPlanId))
    }

    if (!Array.isArray(input.lifecycleStates)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_LIFECYCLE_INVALID', 'Project planning lifecycleStates must be an array', input.projectPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_PLAN_SUMMARY_REQUIRED', 'Project planning summary synopsis is required', input.projectPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateProjectLifecycle(input: AutonomousProjectLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_PROJECT_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_LIFECYCLE_INVALID', `Project lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateProjectGovernance(input: AutonomousProjectGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_GOVERNANCE_OWNER_REQUIRED', 'Project governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-project', 'warning', 'PROJECT_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Project governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_GOVERNANCE_VERSION_REQUIRED', 'Project governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_GOVERNANCE_TRACEABILITY_INVALID', 'Project governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_GOVERNANCE_PROVENANCE_REQUIRED', 'Project governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_GOVERNANCE_FRESHNESS_REQUIRED', 'Project governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateProjectCoordination(input: ProjectCoordinationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.projectCoordinationId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_ID_REQUIRED', 'Project coordination projectCoordinationId is required'))
    }

    if (!input.autonomousProjectId) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_AUTONOMOUS_ID_REQUIRED', 'Project coordination autonomousProjectId is required', input.projectCoordinationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_WORKFLOW_REFERENCES_INVALID', 'Project coordination workflow references must include workflowPlanIds array', input.projectCoordinationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_TASK_REFERENCES_INVALID', 'Project coordination task references must include taskIds array', input.projectCoordinationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_AGENT_REFERENCES_INVALID', 'Project coordination agent references must include agentIds array', input.projectCoordinationId))
    }

    if (!Array.isArray(input.milestones)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_MILESTONES_INVALID', 'Project coordination milestones must be an array', input.projectCoordinationId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_DEPENDENCIES_INVALID', 'Project coordination dependencies must be an array', input.projectCoordinationId))
    }

    if (!Array.isArray(input.risks)) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_RISKS_INVALID', 'Project coordination risks must be an array', input.projectCoordinationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-project', 'error', 'PROJECT_COORDINATION_SUMMARY_REQUIRED', 'Project coordination summary synopsis is required', input.projectCoordinationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousWorkspaceValidator {
  validateAutonomousWorkspace(input: AutonomousWorkspaceRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousWorkspaceId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'AUTONOMOUS_WORKSPACE_ID_REQUIRED', 'Autonomous workspace ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'AUTONOMOUS_WORKSPACE_NAME_REQUIRED', 'Autonomous workspace name is required', input.autonomousWorkspaceId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'AUTONOMOUS_WORKSPACE_VERSION_REQUIRED', 'Autonomous workspace version is required', input.autonomousWorkspaceId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'AUTONOMOUS_WORKSPACE_CONTRACT_VERSION_REQUIRED', 'Autonomous workspace contractVersion is required', input.autonomousWorkspaceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkspaceConfiguration(input: WorkspaceConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.workspaceConfigurationId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_ID_REQUIRED', 'Workspace configuration workspaceConfigurationId is required'))
    }

    if (!input.autonomousWorkspaceId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_AUTONOMOUS_ID_REQUIRED', 'Workspace configuration autonomousWorkspaceId is required', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Workspace configuration workflow references must include workflowPlanIds array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_TASK_REFERENCES_INVALID', 'Workspace configuration task references must include taskIds array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Workspace configuration agent references must include agentIds array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.layout?.windowIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_LAYOUT_WINDOWS_INVALID', 'Workspace configuration layout windowIds must be an array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.layout?.terminalIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_LAYOUT_TERMINALS_INVALID', 'Workspace configuration layout terminalIds must be an array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.layout?.browserIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_LAYOUT_BROWSERS_INVALID', 'Workspace configuration layout browserIds must be an array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.resources)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_RESOURCES_INVALID', 'Workspace configuration resources must be an array', input.workspaceConfigurationId))
    }

    if (!Array.isArray(input.environment?.variables)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_ENVIRONMENT_INVALID', 'Workspace configuration environment variables must be an array', input.workspaceConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_CONFIGURATION_SUMMARY_REQUIRED', 'Workspace configuration summary synopsis is required', input.workspaceConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkspaceLifecycle(input: AutonomousWorkspaceLifecycleStage): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_WORKSPACE_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_LIFECYCLE_INVALID', `Workspace lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkspaceGovernance(input: AutonomousWorkspaceGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_GOVERNANCE_OWNER_REQUIRED', 'Workspace governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'warning', 'WORKSPACE_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Workspace governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_GOVERNANCE_VERSION_REQUIRED', 'Workspace governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_GOVERNANCE_TRACEABILITY_INVALID', 'Workspace governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_GOVERNANCE_PROVENANCE_REQUIRED', 'Workspace governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_GOVERNANCE_FRESHNESS_REQUIRED', 'Workspace governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateWorkspaceResource(input: WorkspaceResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.workspaceResourceId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_ID_REQUIRED', 'Workspace resource workspaceResourceId is required'))
    }

    if (!input.autonomousWorkspaceId) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_AUTONOMOUS_ID_REQUIRED', 'Workspace resource autonomousWorkspaceId is required', input.workspaceResourceId))
    }

    if (!Array.isArray(input.ideInstances)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_IDE_INSTANCES_INVALID', 'Workspace resource ideInstances must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.terminalInstances)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_TERMINAL_INSTANCES_INVALID', 'Workspace resource terminalInstances must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.browserInstances)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_BROWSER_INSTANCES_INVALID', 'Workspace resource browserInstances must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.applicationInstances)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_APPLICATION_INSTANCES_INVALID', 'Workspace resource applicationInstances must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.windowInstances)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_WINDOW_INSTANCES_INVALID', 'Workspace resource windowInstances must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.workspaceProcesses)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_PROCESSES_INVALID', 'Workspace resource workspaceProcesses must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.workspaceServices)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_SERVICES_INVALID', 'Workspace resource workspaceServices must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.workspaceConnections)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_CONNECTIONS_INVALID', 'Workspace resource workspaceConnections must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.workspaceDependencies)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_DEPENDENCIES_INVALID', 'Workspace resource workspaceDependencies must be an array', input.workspaceResourceId))
    }

    if (!Array.isArray(input.workspaceCheckpoints)) {
      diagnostics.push(createDiagnostic('autonomous-workspace', 'error', 'WORKSPACE_RESOURCE_CHECKPOINTS_INVALID', 'Workspace resource workspaceCheckpoints must be an array', input.workspaceResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class AutonomousRecoveryValidator {
  validateAutonomousRecovery(input: AutonomousRecoveryRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.autonomousRecoveryId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'AUTONOMOUS_RECOVERY_ID_REQUIRED', 'Autonomous recovery ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'AUTONOMOUS_RECOVERY_NAME_REQUIRED', 'Autonomous recovery name is required', input.autonomousRecoveryId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'AUTONOMOUS_RECOVERY_VERSION_REQUIRED', 'Autonomous recovery version is required', input.autonomousRecoveryId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'AUTONOMOUS_RECOVERY_CONTRACT_VERSION_REQUIRED', 'Autonomous recovery contractVersion is required', input.autonomousRecoveryId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRecoveryPlan(input: RecoveryPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.recoveryPlanId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_ID_REQUIRED', 'Recovery plan recoveryPlanId is required'))
    }

    if (!input.autonomousRecoveryId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_AUTONOMOUS_ID_REQUIRED', 'Recovery plan autonomousRecoveryId is required', input.recoveryPlanId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_WORKFLOW_REFERENCES_INVALID', 'Recovery plan workflow references must include workflowPlanIds array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_TASK_REFERENCES_INVALID', 'Recovery plan task references must include taskIds array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_AGENT_REFERENCES_INVALID', 'Recovery plan agent references must include agentIds array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_DEPENDENCIES_INVALID', 'Recovery plan dependencies must be an array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.strategies)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_STRATEGIES_INVALID', 'Recovery plan strategies must be an array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.checkpoints)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_CHECKPOINTS_INVALID', 'Recovery plan checkpoints must be an array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.recommendations)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_RECOMMENDATIONS_INVALID', 'Recovery plan recommendations must be an array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.outcomes)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_OUTCOMES_INVALID', 'Recovery plan outcomes must be an array', input.recoveryPlanId))
    }

    if (!Array.isArray(input.timeline?.events)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_TIMELINE_INVALID', 'Recovery plan timeline events must be an array', input.recoveryPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_PLAN_SUMMARY_REQUIRED', 'Recovery plan summary synopsis is required', input.recoveryPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRecoveryLifecycle(input: AutonomousRecoveryLifecycleStage | RecoveryStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!AUTONOMOUS_RECOVERY_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_LIFECYCLE_INVALID', `Recovery lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRecoveryGovernance(input: AutonomousRecoveryGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_GOVERNANCE_OWNER_REQUIRED', 'Recovery governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'warning', 'RECOVERY_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Recovery governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_GOVERNANCE_VERSION_REQUIRED', 'Recovery governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_GOVERNANCE_TRACEABILITY_INVALID', 'Recovery governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_GOVERNANCE_PROVENANCE_REQUIRED', 'Recovery governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'RECOVERY_GOVERNANCE_FRESHNESS_REQUIRED', 'Recovery governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSessionContinuity(input: SessionContinuityPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sessionContinuityPlanId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_PLAN_ID_REQUIRED', 'Session continuity plan sessionContinuityPlanId is required'))
    }

    if (!input.autonomousRecoveryId) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_AUTONOMOUS_ID_REQUIRED', 'Session continuity autonomousRecoveryId is required', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.sessionSnapshots)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_SNAPSHOTS_INVALID', 'Session continuity sessionSnapshots must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.sessionRestorePoints)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_RESTORE_POINTS_INVALID', 'Session continuity sessionRestorePoints must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.runtimeRestorePlan?.runtimeScope)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_RUNTIME_SCOPE_INVALID', 'Session continuity runtimeRestorePlan.runtimeScope must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.serviceRestorePlan?.serviceIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_SERVICE_IDS_INVALID', 'Session continuity serviceRestorePlan.serviceIds must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.executionResumePlan?.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_WORKFLOW_REFERENCES_INVALID', 'Session continuity executionResumePlan workflowPlanIds must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.executionResumePlan?.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_TASK_REFERENCES_INVALID', 'Session continuity executionResumePlan taskIds must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.executionResumePlan?.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_AGENT_REFERENCES_INVALID', 'Session continuity executionResumePlan agentIds must be an array', input.sessionContinuityPlanId))
    }

    if (!Array.isArray(input.continuityAudit?.records)) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_AUDIT_INVALID', 'Session continuity continuityAudit.records must be an array', input.sessionContinuityPlanId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('autonomous-recovery', 'error', 'SESSION_CONTINUITY_SUMMARY_REQUIRED', 'Session continuity summary synopsis is required', input.sessionContinuityPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class DesktopIntegrationValidator {
  validateDesktopIntegration(input: DesktopIntegrationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.desktopIntegrationId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_INTEGRATION_ID_REQUIRED', 'Desktop integration ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_INTEGRATION_NAME_REQUIRED', 'Desktop integration name is required', input.desktopIntegrationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_INTEGRATION_VERSION_REQUIRED', 'Desktop integration version is required', input.desktopIntegrationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_INTEGRATION_CONTRACT_VERSION_REQUIRED', 'Desktop integration contractVersion is required', input.desktopIntegrationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDesktopConfiguration(input: DesktopConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.desktopConfigurationId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_ID_REQUIRED', 'Desktop configuration desktopConfigurationId is required'))
    }

    if (!input.desktopIntegrationId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_INTEGRATION_ID_REQUIRED', 'Desktop configuration desktopIntegrationId is required', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Desktop configuration workflow references must include workflowPlanIds array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_TASK_REFERENCES_INVALID', 'Desktop configuration task references must include taskIds array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Desktop configuration agent references must include agentIds array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.environment?.variables)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_ENVIRONMENT_INVALID', 'Desktop configuration environment variables must be an array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.applications)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_APPLICATIONS_INVALID', 'Desktop configuration applications must be an array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.workspaces)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_WORKSPACES_INVALID', 'Desktop configuration workspaces must be an array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.windows)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_WINDOWS_INVALID', 'Desktop configuration windows must be an array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.processes)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_PROCESSES_INVALID', 'Desktop configuration processes must be an array', input.desktopConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_CAPABILITIES_INVALID', 'Desktop configuration capabilities must be an array', input.desktopConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_CONFIGURATION_SUMMARY_REQUIRED', 'Desktop configuration summary synopsis is required', input.desktopConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDesktopLifecycle(input: DesktopIntegrationLifecycleStage | DesktopIntegrationStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!DESKTOP_INTEGRATION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_LIFECYCLE_INVALID', `Desktop lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateDesktopGovernance(input: DesktopIntegrationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_GOVERNANCE_OWNER_REQUIRED', 'Desktop governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('desktop-integration', 'warning', 'DESKTOP_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Desktop governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_GOVERNANCE_VERSION_REQUIRED', 'Desktop governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_GOVERNANCE_TRACEABILITY_INVALID', 'Desktop governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_GOVERNANCE_PROVENANCE_REQUIRED', 'Desktop governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'DESKTOP_GOVERNANCE_FRESHNESS_REQUIRED', 'Desktop governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateIntegrationTarget(input: IntegrationTargetInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.integrationTargetId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_ID_REQUIRED', 'Integration target integrationTargetId is required'))
    }

    if (!input.desktopIntegrationId) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_INTEGRATION_ID_REQUIRED', 'Integration target desktopIntegrationId is required', input.integrationTargetId))
    }

    if (!Array.isArray(input.ideTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_IDE_TARGETS_INVALID', 'Integration target ideTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.browserTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_BROWSER_TARGETS_INVALID', 'Integration target browserTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.terminalTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_TERMINAL_TARGETS_INVALID', 'Integration target terminalTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.applicationTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_APPLICATION_TARGETS_INVALID', 'Integration target applicationTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.serviceTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_SERVICE_TARGETS_INVALID', 'Integration target serviceTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.processTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_PROCESS_TARGETS_INVALID', 'Integration target processTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.workspaceTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_WORKSPACE_TARGETS_INVALID', 'Integration target workspaceTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.windowTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_WINDOW_TARGETS_INVALID', 'Integration target windowTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.automationTargets)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_AUTOMATION_TARGETS_INVALID', 'Integration target automationTargets must be an array', input.integrationTargetId))
    }

    if (!Array.isArray(input.dependencies)) {
      diagnostics.push(createDiagnostic('desktop-integration', 'error', 'INTEGRATION_TARGET_DEPENDENCIES_INVALID', 'Integration target dependencies must be an array', input.integrationTargetId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class IDEIntegrationValidator {
  validateIDEIntegration(input: IDEIntegrationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ideIntegrationId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_INTEGRATION_ID_REQUIRED', 'IDE integration ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_INTEGRATION_NAME_REQUIRED', 'IDE integration name is required', input.ideIntegrationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_INTEGRATION_VERSION_REQUIRED', 'IDE integration version is required', input.ideIntegrationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_INTEGRATION_CONTRACT_VERSION_REQUIRED', 'IDE integration contractVersion is required', input.ideIntegrationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateIDEConfiguration(input: IDEConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ideConfigurationId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_ID_REQUIRED', 'IDE configuration ideConfigurationId is required'))
    }

    if (!input.ideIntegrationId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_INTEGRATION_ID_REQUIRED', 'IDE configuration ideIntegrationId is required', input.ideConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'IDE configuration workflow references must include workflowPlanIds array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_TASK_REFERENCES_INVALID', 'IDE configuration task references must include taskIds array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_AGENT_REFERENCES_INVALID', 'IDE configuration agent references must include agentIds array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.workspaces)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_WORKSPACES_INVALID', 'IDE configuration workspaces must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.projects)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_PROJECTS_INVALID', 'IDE configuration projects must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.windows)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_WINDOWS_INVALID', 'IDE configuration windows must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.editors)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_EDITORS_INVALID', 'IDE configuration editors must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.terminals)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_TERMINALS_INVALID', 'IDE configuration terminals must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.extensions)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_EXTENSIONS_INVALID', 'IDE configuration extensions must be an array', input.ideConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_CAPABILITIES_INVALID', 'IDE configuration capabilities must be an array', input.ideConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_CONFIGURATION_SUMMARY_REQUIRED', 'IDE configuration summary synopsis is required', input.ideConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateIDELifecycle(input: IDEIntegrationLifecycleStage | IDEStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!IDE_INTEGRATION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_LIFECYCLE_INVALID', `IDE lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateIDEGovernance(input: IDEIntegrationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_GOVERNANCE_OWNER_REQUIRED', 'IDE governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('ide-integration', 'warning', 'IDE_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'IDE governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_GOVERNANCE_VERSION_REQUIRED', 'IDE governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_GOVERNANCE_TRACEABILITY_INVALID', 'IDE governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_GOVERNANCE_PROVENANCE_REQUIRED', 'IDE governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_GOVERNANCE_FRESHNESS_REQUIRED', 'IDE governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateIDEResource(input: IDEResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ideResourceId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_ID_REQUIRED', 'IDE resource ideResourceId is required'))
    }

    if (!input.ideIntegrationId) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_INTEGRATION_ID_REQUIRED', 'IDE resource ideIntegrationId is required', input.ideResourceId))
    }

    if (!Array.isArray(input.workspaceFolders)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_WORKSPACE_FOLDERS_INVALID', 'IDE resource workspaceFolders must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.openFiles)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_OPEN_FILES_INVALID', 'IDE resource openFiles must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.editorGroups)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_EDITOR_GROUPS_INVALID', 'IDE resource editorGroups must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.cursorPositions)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_CURSOR_POSITIONS_INVALID', 'IDE resource cursorPositions must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.breakpoints)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_BREAKPOINTS_INVALID', 'IDE resource breakpoints must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.terminalSessions)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_TERMINAL_SESSIONS_INVALID', 'IDE resource terminalSessions must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.debugSessions)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_DEBUG_SESSIONS_INVALID', 'IDE resource debugSessions must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.taskRunners)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_TASK_RUNNERS_INVALID', 'IDE resource taskRunners must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.ideProcesses)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_PROCESSES_INVALID', 'IDE resource ideProcesses must be an array', input.ideResourceId))
    }

    if (!Array.isArray(input.ideCheckpoints)) {
      diagnostics.push(createDiagnostic('ide-integration', 'error', 'IDE_RESOURCE_CHECKPOINTS_INVALID', 'IDE resource ideCheckpoints must be an array', input.ideResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class TerminalIntegrationValidator {
  validateTerminalIntegration(input: TerminalIntegrationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.terminalIntegrationId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_INTEGRATION_ID_REQUIRED', 'Terminal integration ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_INTEGRATION_NAME_REQUIRED', 'Terminal integration name is required', input.terminalIntegrationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_INTEGRATION_VERSION_REQUIRED', 'Terminal integration version is required', input.terminalIntegrationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_INTEGRATION_CONTRACT_VERSION_REQUIRED', 'Terminal integration contractVersion is required', input.terminalIntegrationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTerminalConfiguration(input: TerminalConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.terminalConfigurationId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_ID_REQUIRED', 'Terminal configuration terminalConfigurationId is required'))
    }

    if (!input.terminalIntegrationId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_INTEGRATION_ID_REQUIRED', 'Terminal configuration terminalIntegrationId is required', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Terminal configuration workflow references must include workflowPlanIds array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_TASK_REFERENCES_INVALID', 'Terminal configuration task references must include taskIds array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Terminal configuration agent references must include agentIds array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.workspaces)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_WORKSPACES_INVALID', 'Terminal configuration workspaces must be an array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.windows)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_WINDOWS_INVALID', 'Terminal configuration windows must be an array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.terminalInstances)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_INSTANCES_INVALID', 'Terminal configuration terminalInstances must be an array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_CAPABILITIES_INVALID', 'Terminal configuration capabilities must be an array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.shells)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_SHELLS_INVALID', 'Terminal configuration shells must be an array', input.terminalConfigurationId))
    }

    if (!Array.isArray(input.commands)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_COMMANDS_INVALID', 'Terminal configuration commands must be an array', input.terminalConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_CONFIGURATION_SUMMARY_REQUIRED', 'Terminal configuration summary synopsis is required', input.terminalConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTerminalLifecycle(input: TerminalIntegrationLifecycleStage | TerminalStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!TERMINAL_INTEGRATION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_LIFECYCLE_INVALID', `Terminal lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTerminalGovernance(input: TerminalIntegrationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_GOVERNANCE_OWNER_REQUIRED', 'Terminal governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('terminal-integration', 'warning', 'TERMINAL_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Terminal governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_GOVERNANCE_VERSION_REQUIRED', 'Terminal governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_GOVERNANCE_TRACEABILITY_INVALID', 'Terminal governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_GOVERNANCE_PROVENANCE_REQUIRED', 'Terminal governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_GOVERNANCE_FRESHNESS_REQUIRED', 'Terminal governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateTerminalResource(input: TerminalResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.terminalResourceId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_ID_REQUIRED', 'Terminal resource terminalResourceId is required'))
    }

    if (!input.terminalIntegrationId) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_INTEGRATION_ID_REQUIRED', 'Terminal resource terminalIntegrationId is required', input.terminalResourceId))
    }

    if (!Array.isArray(input.shellSessions)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_SHELL_SESSIONS_INVALID', 'Terminal resource shellSessions must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.shellProfiles)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_SHELL_PROFILES_INVALID', 'Terminal resource shellProfiles must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.commandQueues)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_COMMAND_QUEUES_INVALID', 'Terminal resource commandQueues must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.commandHistories)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_COMMAND_HISTORY_INVALID', 'Terminal resource commandHistories must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.workingDirectories)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_WORKING_DIRECTORIES_INVALID', 'Terminal resource workingDirectories must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.environmentVariables)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_ENVIRONMENT_VARIABLES_INVALID', 'Terminal resource environmentVariables must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.processHandles)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_PROCESS_HANDLES_INVALID', 'Terminal resource processHandles must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.consoleBuffers)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_CONSOLE_BUFFERS_INVALID', 'Terminal resource consoleBuffers must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.terminalCheckpoints)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_CHECKPOINTS_INVALID', 'Terminal resource terminalCheckpoints must be an array', input.terminalResourceId))
    }

    if (!Array.isArray(input.terminalSnapshots)) {
      diagnostics.push(createDiagnostic('terminal-integration', 'error', 'TERMINAL_RESOURCE_SNAPSHOTS_INVALID', 'Terminal resource terminalSnapshots must be an array', input.terminalResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class BrowserIntegrationValidator {
  validateBrowserIntegration(input: BrowserIntegrationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.browserIntegrationId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_INTEGRATION_ID_REQUIRED', 'Browser integration ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_INTEGRATION_NAME_REQUIRED', 'Browser integration name is required', input.browserIntegrationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_INTEGRATION_VERSION_REQUIRED', 'Browser integration version is required', input.browserIntegrationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_INTEGRATION_CONTRACT_VERSION_REQUIRED', 'Browser integration contractVersion is required', input.browserIntegrationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateBrowserConfiguration(input: BrowserConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.browserConfigurationId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_ID_REQUIRED', 'Browser configuration browserConfigurationId is required'))
    }

    if (!input.browserIntegrationId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_INTEGRATION_ID_REQUIRED', 'Browser configuration browserIntegrationId is required', input.browserConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Browser configuration workflow references must include workflowPlanIds array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_TASK_REFERENCES_INVALID', 'Browser configuration task references must include taskIds array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Browser configuration agent references must include agentIds array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.browserWindows)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_WINDOWS_INVALID', 'Browser configuration browserWindows must be an array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.browserSessions)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_SESSIONS_INVALID', 'Browser configuration browserSessions must be an array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.browserTabs)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_TABS_INVALID', 'Browser configuration browserTabs must be an array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_CAPABILITIES_INVALID', 'Browser configuration capabilities must be an array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.browserExtensions)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_EXTENSIONS_INVALID', 'Browser configuration browserExtensions must be an array', input.browserConfigurationId))
    }

    if (!Array.isArray(input.browserBookmarks)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_BOOKMARKS_INVALID', 'Browser configuration browserBookmarks must be an array', input.browserConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_CONFIGURATION_SUMMARY_REQUIRED', 'Browser configuration summary synopsis is required', input.browserConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateBrowserLifecycle(input: BrowserIntegrationLifecycleStage | BrowserStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!BROWSER_INTEGRATION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_LIFECYCLE_INVALID', `Browser lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateBrowserGovernance(input: BrowserIntegrationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_GOVERNANCE_OWNER_REQUIRED', 'Browser governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('browser-integration', 'warning', 'BROWSER_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Browser governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_GOVERNANCE_VERSION_REQUIRED', 'Browser governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_GOVERNANCE_TRACEABILITY_INVALID', 'Browser governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_GOVERNANCE_PROVENANCE_REQUIRED', 'Browser governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_GOVERNANCE_FRESHNESS_REQUIRED', 'Browser governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateBrowserResource(input: BrowserResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.browserResourceId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_ID_REQUIRED', 'Browser resource browserResourceId is required'))
    }

    if (!input.browserIntegrationId) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_INTEGRATION_ID_REQUIRED', 'Browser resource browserIntegrationId is required', input.browserResourceId))
    }

    if (!Array.isArray(input.webPages)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_WEB_PAGES_INVALID', 'Browser resource webPages must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.urlReferences)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_URL_REFERENCES_INVALID', 'Browser resource urlReferences must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.navigationHistories)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_NAVIGATION_HISTORY_INVALID', 'Browser resource navigationHistories must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.cookieStores)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_COOKIE_STORES_INVALID', 'Browser resource cookieStores must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.localStorageReferences)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_LOCAL_STORAGE_INVALID', 'Browser resource localStorageReferences must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.sessionStorageReferences)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_SESSION_STORAGE_INVALID', 'Browser resource sessionStorageReferences must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.browserDeveloperTools)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_DEVELOPER_TOOLS_INVALID', 'Browser resource browserDeveloperTools must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.browserNetworkSessions)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_NETWORK_SESSIONS_INVALID', 'Browser resource browserNetworkSessions must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.browserCheckpoints)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_CHECKPOINTS_INVALID', 'Browser resource browserCheckpoints must be an array', input.browserResourceId))
    }

    if (!Array.isArray(input.browserSnapshots)) {
      diagnostics.push(createDiagnostic('browser-integration', 'error', 'BROWSER_RESOURCE_SNAPSHOTS_INVALID', 'Browser resource browserSnapshots must be an array', input.browserResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class GitIntegrationValidator {
  validateGitIntegration(input: GitIntegrationRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.gitIntegrationId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_INTEGRATION_ID_REQUIRED', 'Git integration ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_INTEGRATION_NAME_REQUIRED', 'Git integration name is required', input.gitIntegrationId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_INTEGRATION_VERSION_REQUIRED', 'Git integration version is required', input.gitIntegrationId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_INTEGRATION_CONTRACT_VERSION_REQUIRED', 'Git integration contractVersion is required', input.gitIntegrationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitConfiguration(input: GitConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.gitConfigurationId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_ID_REQUIRED', 'Git configuration gitConfigurationId is required'))
    }

    if (!input.gitIntegrationId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_INTEGRATION_ID_REQUIRED', 'Git configuration gitIntegrationId is required', input.gitConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Git configuration workflow references must include workflowPlanIds array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_TASK_REFERENCES_INVALID', 'Git configuration task references must include taskIds array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Git configuration agent references must include agentIds array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.repositories)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_REPOSITORIES_INVALID', 'Git configuration repositories must be an array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.branches)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_BRANCHES_INVALID', 'Git configuration branches must be an array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.commits)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_COMMITS_INVALID', 'Git configuration commits must be an array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.tags)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_TAGS_INVALID', 'Git configuration tags must be an array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.remotes)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_REMOTES_INVALID', 'Git configuration remotes must be an array', input.gitConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_CAPABILITIES_INVALID', 'Git configuration capabilities must be an array', input.gitConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_CONFIGURATION_SUMMARY_REQUIRED', 'Git configuration summary synopsis is required', input.gitConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitRepository(input: GitRepositoryInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_REPOSITORY_ID_REQUIRED', 'Git repository repositoryId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_REPOSITORY_NAME_REQUIRED', 'Git repository name is required', input.repositoryId))
    }

    if (!input.rootPath) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_REPOSITORY_ROOT_PATH_REQUIRED', 'Git repository rootPath is required', input.repositoryId))
    }

    if (!input.defaultBranch) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_REPOSITORY_DEFAULT_BRANCH_REQUIRED', 'Git repository defaultBranch is required', input.repositoryId))
    }

    const lifecycleValidation = this.validateGitLifecycle(input.state)
    diagnostics.push(...lifecycleValidation.diagnostics)

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitBranch(input: GitBranchInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.branchId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_BRANCH_ID_REQUIRED', 'Git branch branchId is required'))
    }

    if (!input.repositoryId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_BRANCH_REPOSITORY_ID_REQUIRED', 'Git branch repositoryId is required', input.branchId))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_BRANCH_NAME_REQUIRED', 'Git branch name is required', input.branchId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitLifecycle(input: GitIntegrationLifecycleStage | GitStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!GIT_INTEGRATION_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_LIFECYCLE_INVALID', `Git lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitGovernance(input: GitIntegrationGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_GOVERNANCE_OWNER_REQUIRED', 'Git governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('git-integration', 'warning', 'GIT_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Git governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_GOVERNANCE_VERSION_REQUIRED', 'Git governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_GOVERNANCE_TRACEABILITY_INVALID', 'Git governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_GOVERNANCE_PROVENANCE_REQUIRED', 'Git governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_GOVERNANCE_FRESHNESS_REQUIRED', 'Git governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateGitResource(input: GitResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.gitResourceId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_ID_REQUIRED', 'Git resource gitResourceId is required'))
    }

    if (!input.gitIntegrationId) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_INTEGRATION_ID_REQUIRED', 'Git resource gitIntegrationId is required', input.gitResourceId))
    }

    if (!Array.isArray(input.stagingAreas)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_STAGING_AREAS_INVALID', 'Git resource stagingAreas must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.commitHistories)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_COMMIT_HISTORIES_INVALID', 'Git resource commitHistories must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.branchGraphs)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_BRANCH_GRAPHS_INVALID', 'Git resource branchGraphs must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.mergeRequests)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_MERGE_REQUESTS_INVALID', 'Git resource mergeRequests must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.mergeConflicts)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_MERGE_CONFLICTS_INVALID', 'Git resource mergeConflicts must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.repositorySnapshots)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_REPOSITORY_SNAPSHOTS_INVALID', 'Git resource repositorySnapshots must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.workingTrees)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_WORKING_TREES_INVALID', 'Git resource workingTrees must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.gitCheckpoints)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_CHECKPOINTS_INVALID', 'Git resource gitCheckpoints must be an array', input.gitResourceId))
    }

    if (!Array.isArray(input.repositoryStates)) {
      diagnostics.push(createDiagnostic('git-integration', 'error', 'GIT_RESOURCE_REPOSITORY_STATES_INVALID', 'Git resource repositoryStates must be an array', input.gitResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class SourceControlValidator {
  validateSourceControl(input: SourceControlRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sourceControlId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_ID_REQUIRED', 'Source control ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_NAME_REQUIRED', 'Source control name is required', input.sourceControlId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_VERSION_REQUIRED', 'Source control version is required', input.sourceControlId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONTRACT_VERSION_REQUIRED', 'Source control contractVersion is required', input.sourceControlId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSourceControlConfiguration(input: SourceControlConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sourceControlConfigurationId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_ID_REQUIRED', 'Source control configuration sourceControlConfigurationId is required'))
    }

    if (!input.sourceControlId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_SOURCE_CONTROL_ID_REQUIRED', 'Source control configuration sourceControlId is required', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Source control configuration workflow references must include workflowPlanIds array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_TASK_REFERENCES_INVALID', 'Source control configuration task references must include taskIds array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Source control configuration agent references must include agentIds array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.repositoryWorkspaces)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_REPOSITORY_WORKSPACES_INVALID', 'Source control configuration repositoryWorkspaces must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.repositoryGroups)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_REPOSITORY_GROUPS_INVALID', 'Source control configuration repositoryGroups must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.branchStrategies)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_BRANCH_STRATEGIES_INVALID', 'Source control configuration branchStrategies must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.commitStrategies)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_COMMIT_STRATEGIES_INVALID', 'Source control configuration commitStrategies must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.mergeStrategies)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_MERGE_STRATEGIES_INVALID', 'Source control configuration mergeStrategies must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.releaseStrategies)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_RELEASE_STRATEGIES_INVALID', 'Source control configuration releaseStrategies must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.repositoryPolicies)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_REPOSITORY_POLICIES_INVALID', 'Source control configuration repositoryPolicies must be an array', input.sourceControlConfigurationId))
    }

    if (!Array.isArray(input.capabilities)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_CAPABILITIES_INVALID', 'Source control configuration capabilities must be an array', input.sourceControlConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_CONFIGURATION_SUMMARY_REQUIRED', 'Source control configuration summary synopsis is required', input.sourceControlConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryPlan(input: RepositoryPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryPlanId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'REPOSITORY_PLAN_ID_REQUIRED', 'Repository plan repositoryPlanId is required'))
    }

    if (!input.repositoryWorkspaceId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'REPOSITORY_PLAN_WORKSPACE_ID_REQUIRED', 'Repository plan repositoryWorkspaceId is required', input.repositoryPlanId))
    }

    if (!input.objective) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'REPOSITORY_PLAN_OBJECTIVE_REQUIRED', 'Repository plan objective is required', input.repositoryPlanId))
    }

    const lifecycleValidation = this.validateSourceControlLifecycle(input.state)
    diagnostics.push(...lifecycleValidation.diagnostics)

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateBranchPlan(input: BranchPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.branchPlanId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'BRANCH_PLAN_ID_REQUIRED', 'Branch plan branchPlanId is required'))
    }

    if (!input.repositoryPlanId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'BRANCH_PLAN_REPOSITORY_PLAN_ID_REQUIRED', 'Branch plan repositoryPlanId is required', input.branchPlanId))
    }

    if (!input.proposedName) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'BRANCH_PLAN_PROPOSED_NAME_REQUIRED', 'Branch plan proposedName is required', input.branchPlanId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSourceControlLifecycle(input: SourceControlLifecycleStage | SourceControlStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!SOURCE_CONTROL_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_LIFECYCLE_INVALID', `Source control lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSourceControlGovernance(input: SourceControlGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_GOVERNANCE_OWNER_REQUIRED', 'Source control governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('source-control', 'warning', 'SOURCE_CONTROL_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Source control governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_GOVERNANCE_VERSION_REQUIRED', 'Source control governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_GOVERNANCE_TRACEABILITY_INVALID', 'Source control governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_GOVERNANCE_PROVENANCE_REQUIRED', 'Source control governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_GOVERNANCE_FRESHNESS_REQUIRED', 'Source control governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateSourceControlResource(input: SourceControlResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.sourceControlResourceId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_ID_REQUIRED', 'Source control resource sourceControlResourceId is required'))
    }

    if (!input.sourceControlId) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_SOURCE_CONTROL_ID_REQUIRED', 'Source control resource sourceControlId is required', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.repositoryPlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_REPOSITORY_PLANS_INVALID', 'Source control resource repositoryPlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.branchPlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_BRANCH_PLANS_INVALID', 'Source control resource branchPlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.commitPlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_COMMIT_PLANS_INVALID', 'Source control resource commitPlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.mergePlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_MERGE_PLANS_INVALID', 'Source control resource mergePlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.releasePlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_RELEASE_PLANS_INVALID', 'Source control resource releasePlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.synchronizationPlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_SYNCHRONIZATION_PLANS_INVALID', 'Source control resource synchronizationPlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.conflictResolutionPlans)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_CONFLICT_RESOLUTION_PLANS_INVALID', 'Source control resource conflictResolutionPlans must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.repositoryCheckpoints)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_REPOSITORY_CHECKPOINTS_INVALID', 'Source control resource repositoryCheckpoints must be an array', input.sourceControlResourceId))
    }

    if (!Array.isArray(input.repositoryAudits)) {
      diagnostics.push(createDiagnostic('source-control', 'error', 'SOURCE_CONTROL_RESOURCE_REPOSITORY_AUDITS_INVALID', 'Source control resource repositoryAudits must be an array', input.sourceControlResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class RepositoryIntelligenceValidator {
  validateRepositoryIntelligence(input: RepositoryIntelligenceRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryIntelligenceId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_ID_REQUIRED', 'Repository intelligence ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_NAME_REQUIRED', 'Repository intelligence name is required', input.repositoryIntelligenceId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_VERSION_REQUIRED', 'Repository intelligence version is required', input.repositoryIntelligenceId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONTRACT_VERSION_REQUIRED', 'Repository intelligence contractVersion is required', input.repositoryIntelligenceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryIntelligenceConfiguration(input: RepositoryIntelligenceConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryIntelligenceConfigurationId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_ID_REQUIRED', 'Repository intelligence configuration repositoryIntelligenceConfigurationId is required'))
    }

    if (!input.repositoryIntelligenceId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_INTELLIGENCE_ID_REQUIRED', 'Repository intelligence configuration repositoryIntelligenceId is required', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Repository intelligence configuration workflow references must include workflowPlanIds array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_TASK_REFERENCES_INVALID', 'Repository intelligence configuration task references must include taskIds array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Repository intelligence configuration agent references must include agentIds array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryProfiles)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_PROFILES_INVALID', 'Repository intelligence configuration repositoryProfiles must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryTopologies)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_TOPOLOGIES_INVALID', 'Repository intelligence configuration repositoryTopologies must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryMetrics)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_METRICS_INVALID', 'Repository intelligence configuration repositoryMetrics must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryHealths)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_HEALTHS_INVALID', 'Repository intelligence configuration repositoryHealths must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryQualities)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_QUALITIES_INVALID', 'Repository intelligence configuration repositoryQualities must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryDependencyGraphs)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_DEPENDENCY_GRAPHS_INVALID', 'Repository intelligence configuration repositoryDependencyGraphs must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryKnowledgeMaps)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_KNOWLEDGE_MAPS_INVALID', 'Repository intelligence configuration repositoryKnowledgeMaps must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryRiskProfiles)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_RISK_PROFILES_INVALID', 'Repository intelligence configuration repositoryRiskProfiles must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!Array.isArray(input.repositoryEvolutions)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_EVOLUTIONS_INVALID', 'Repository intelligence configuration repositoryEvolutions must be an array', input.repositoryIntelligenceConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_CONFIGURATION_SUMMARY_REQUIRED', 'Repository intelligence configuration summary synopsis is required', input.repositoryIntelligenceConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryAnalysisPlan(input: RepositoryAnalysisPlanInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryAnalysisPlanId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_ANALYSIS_PLAN_ID_REQUIRED', 'Repository analysis plan repositoryAnalysisPlanId is required'))
    }

    if (!input.repositoryProfileId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_ANALYSIS_PLAN_PROFILE_ID_REQUIRED', 'Repository analysis plan repositoryProfileId is required', input.repositoryAnalysisPlanId))
    }

    if (!input.objective) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_ANALYSIS_PLAN_OBJECTIVE_REQUIRED', 'Repository analysis plan objective is required', input.repositoryAnalysisPlanId))
    }

    const lifecycleValidation = this.validateRepositoryIntelligenceLifecycle(input.state)
    diagnostics.push(...lifecycleValidation.diagnostics)

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateArchitectureAnalysis(input: ArchitectureAnalysisInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.architectureAnalysisId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'ARCHITECTURE_ANALYSIS_ID_REQUIRED', 'Architecture analysis architectureAnalysisId is required'))
    }

    if (!input.repositoryAnalysisPlanId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'ARCHITECTURE_ANALYSIS_PLAN_ID_REQUIRED', 'Architecture analysis repositoryAnalysisPlanId is required', input.architectureAnalysisId))
    }

    if (!Array.isArray(input.patternIds)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'ARCHITECTURE_ANALYSIS_PATTERN_IDS_INVALID', 'Architecture analysis patternIds must be an array', input.architectureAnalysisId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryIntelligenceLifecycle(input: RepositoryIntelligenceLifecycleStage | RepositoryIntelligenceStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!REPOSITORY_INTELLIGENCE_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_LIFECYCLE_INVALID', `Repository intelligence lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryIntelligenceGovernance(input: RepositoryIntelligenceGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_OWNER_REQUIRED', 'Repository intelligence governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'warning', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Repository intelligence governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_VERSION_REQUIRED', 'Repository intelligence governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_TRACEABILITY_INVALID', 'Repository intelligence governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_PROVENANCE_REQUIRED', 'Repository intelligence governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_GOVERNANCE_FRESHNESS_REQUIRED', 'Repository intelligence governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryIntelligenceResource(input: RepositoryIntelligenceResourceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryIntelligenceResourceId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_ID_REQUIRED', 'Repository intelligence resource repositoryIntelligenceResourceId is required'))
    }

    if (!input.repositoryIntelligenceId) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_INTELLIGENCE_ID_REQUIRED', 'Repository intelligence resource repositoryIntelligenceId is required', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.repositoryAnalysisPlans)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_ANALYSIS_PLANS_INVALID', 'Repository intelligence resource repositoryAnalysisPlans must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.architectureAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_ARCHITECTURE_ANALYSES_INVALID', 'Repository intelligence resource architectureAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.dependencyAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_DEPENDENCY_ANALYSES_INVALID', 'Repository intelligence resource dependencyAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.qualityAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_QUALITY_ANALYSES_INVALID', 'Repository intelligence resource qualityAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.complexityAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_COMPLEXITY_ANALYSES_INVALID', 'Repository intelligence resource complexityAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.technicalDebtAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_TECHNICAL_DEBT_ANALYSES_INVALID', 'Repository intelligence resource technicalDebtAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.changeAnalyses)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_CHANGE_ANALYSES_INVALID', 'Repository intelligence resource changeAnalyses must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.repositoryInsights)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_INSIGHTS_INVALID', 'Repository intelligence resource repositoryInsights must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.repositoryRecommendations)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_RECOMMENDATIONS_INVALID', 'Repository intelligence resource repositoryRecommendations must be an array', input.repositoryIntelligenceResourceId))
    }

    if (!Array.isArray(input.repositoryIntelligenceAudits)) {
      diagnostics.push(createDiagnostic('repository-intelligence', 'error', 'REPOSITORY_INTELLIGENCE_RESOURCE_AUDITS_INVALID', 'Repository intelligence resource repositoryIntelligenceAudits must be an array', input.repositoryIntelligenceResourceId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class RepositoryKnowledgeGraphValidator {
  validateRepositoryKnowledgeGraph(input: RepositoryKnowledgeGraphRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryKnowledgeGraphId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_ID_REQUIRED', 'Repository knowledge graph ID is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_NAME_REQUIRED', 'Repository knowledge graph name is required', input.repositoryKnowledgeGraphId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_VERSION_REQUIRED', 'Repository knowledge graph version is required', input.repositoryKnowledgeGraphId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONTRACT_VERSION_REQUIRED', 'Repository knowledge graph contractVersion is required', input.repositoryKnowledgeGraphId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryKnowledgeGraphConfiguration(input: RepositoryKnowledgeGraphConfigurationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryKnowledgeGraphConfigurationId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_ID_REQUIRED', 'Repository knowledge graph configuration repositoryKnowledgeGraphConfigurationId is required'))
    }

    if (!input.repositoryKnowledgeGraphId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_GRAPH_ID_REQUIRED', 'Repository knowledge graph configuration repositoryKnowledgeGraphId is required', input.repositoryKnowledgeGraphConfigurationId))
    }

    if (!Array.isArray(input.workflowReferences?.workflowPlanIds)) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_WORKFLOW_REFERENCES_INVALID', 'Repository knowledge graph configuration workflow references must include workflowPlanIds array', input.repositoryKnowledgeGraphConfigurationId))
    }

    if (!Array.isArray(input.taskReferences?.taskIds)) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_TASK_REFERENCES_INVALID', 'Repository knowledge graph configuration task references must include taskIds array', input.repositoryKnowledgeGraphConfigurationId))
    }

    if (!Array.isArray(input.agentReferences?.agentIds)) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_AGENT_REFERENCES_INVALID', 'Repository knowledge graph configuration agent references must include agentIds array', input.repositoryKnowledgeGraphConfigurationId))
    }

    if (!input.summary?.synopsis) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_CONFIGURATION_SUMMARY_REQUIRED', 'Repository knowledge graph configuration summary synopsis is required', input.repositoryKnowledgeGraphConfigurationId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgeNode(input: KnowledgeNodeInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.knowledgeNodeId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'KNOWLEDGE_NODE_ID_REQUIRED', 'Knowledge node knowledgeNodeId is required'))
    }

    if (!input.label) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'KNOWLEDGE_NODE_LABEL_REQUIRED', 'Knowledge node label is required', input.knowledgeNodeId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateKnowledgeRelationship(input: RepositoryKnowledgeRelationshipInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.repositoryKnowledgeRelationshipId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'KNOWLEDGE_RELATIONSHIP_ID_REQUIRED', 'Knowledge relationship repositoryKnowledgeRelationshipId is required'))
    }

    if (!input.sourceNodeId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'KNOWLEDGE_RELATIONSHIP_SOURCE_NODE_ID_REQUIRED', 'Knowledge relationship sourceNodeId is required', input.repositoryKnowledgeRelationshipId))
    }

    if (!input.targetNodeId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'KNOWLEDGE_RELATIONSHIP_TARGET_NODE_ID_REQUIRED', 'Knowledge relationship targetNodeId is required', input.repositoryKnowledgeRelationshipId))
    }

    if (input.strength < 0 || input.strength > 1) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'warning', 'KNOWLEDGE_RELATIONSHIP_STRENGTH_OUT_OF_RANGE', 'Knowledge relationship strength should be between 0 and 1', input.repositoryKnowledgeRelationshipId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryKnowledgeGraphLifecycle(input: RepositoryKnowledgeGraphLifecycleStage | RepositoryKnowledgeGraphStateInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!REPOSITORY_KNOWLEDGE_GRAPH_LIFECYCLE_STAGES.includes(input)) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_LIFECYCLE_INVALID', `Repository knowledge graph lifecycle stage is invalid: ${input}`))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateRepositoryKnowledgeGraphGovernance(input: RepositoryKnowledgeGraphGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_OWNER_REQUIRED', 'Repository knowledge graph governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'warning', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Repository knowledge graph governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_VERSION_REQUIRED', 'Repository knowledge graph governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_TRACEABILITY_INVALID', 'Repository knowledge graph governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_PROVENANCE_REQUIRED', 'Repository knowledge graph governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('repository-knowledge-graph', 'error', 'REPOSITORY_KNOWLEDGE_GRAPH_GOVERNANCE_FRESHNESS_REQUIRED', 'Repository knowledge graph governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class ExecutionReadinessValidator {
  validateExecutionReadiness(input: ExecutionReadinessRegistrationInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.executionReadinessId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_READINESS_ID_REQUIRED', 'Execution readinessId is required'))
    }

    if (!input.name) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_READINESS_NAME_REQUIRED', 'Execution readiness name is required', input.executionReadinessId))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_READINESS_VERSION_REQUIRED', 'Execution readiness version is required', input.executionReadinessId))
    }

    if (!input.contractVersion) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_READINESS_CONTRACT_VERSION_REQUIRED', 'Execution readiness contractVersion is required', input.executionReadinessId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateExecutionPackage(input: ExecutionPackageInput | ExecutionReadinessReportInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if ('reportId' in input) {
      if (!input.reportId) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_ID_REQUIRED', 'Execution readiness reportId is required'))
      }

      if (!input.executionReadinessId) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_READINESS_ID_REQUIRED', 'Execution readiness report executionReadinessId is required', input.reportId))
      }

      if (!Array.isArray(input.actionReferences?.actionItemIds)) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_ACTION_REFERENCES_INVALID', 'Execution readiness report action references must include actionItemIds array', input.reportId))
      }

      if (!Array.isArray(input.criteria)) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_CRITERIA_INVALID', 'Execution readiness report criteria must be an array', input.reportId))
      }

      if (!Array.isArray(input.recommendations)) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_RECOMMENDATIONS_INVALID', 'Execution readiness report recommendations must be an array', input.reportId))
      }

      if (!Array.isArray(input.evidence)) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_EVIDENCE_INVALID', 'Execution readiness report evidence must be an array', input.reportId))
      }

      if (!Array.isArray(input.traceability?.traceIds)) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_TRACEABILITY_INVALID', 'Execution readiness report traceability.traceIds must be an array', input.reportId))
      }

      if (!input.summary?.synopsis) {
        diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_REPORT_SUMMARY_REQUIRED', 'Execution readiness report summary synopsis is required', input.reportId))
      }

      return {
        valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
        diagnostics,
      }
    }

    if (!input.packageId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_ID_REQUIRED', 'Execution packageId is required'))
    }

    if (!input.executionReadinessId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_READINESS_ID_REQUIRED', 'Execution package executionReadinessId is required', input.packageId))
    }

    if (!Array.isArray(input.executableActionPackage?.actionItemIds)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_ACTION_INVALID', 'Execution package executable action package actionItemIds must be an array', input.packageId))
    }

    if (!input.executableWorkflowPackage?.workflowId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_WORKFLOW_INVALID', 'Execution package executable workflow package workflowId is required', input.packageId))
    }

    if (!Array.isArray(input.executableContextPackage?.scope)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_CONTEXT_INVALID', 'Execution package executable context package scope must be an array', input.packageId))
    }

    if (!Array.isArray(input.executableConstraintPackage?.constraints)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_CONSTRAINTS_INVALID', 'Execution package executable constraint package constraints must be an array', input.packageId))
    }

    if (!Array.isArray(input.executableValidationPackage?.validations)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_VALIDATION_INVALID', 'Execution package executable validation package validations must be an array', input.packageId))
    }

    if (!Array.isArray(input.executionApprovalPackage?.approverIds)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_APPROVAL_INVALID', 'Execution package approval package approverIds must be an array', input.packageId))
    }

    if (!Array.isArray(input.executionAuditPackage?.records)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_PACKAGE_AUDIT_INVALID', 'Execution package audit package records must be an array', input.packageId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateExecutionReadinessPolicy(input: ExecutionReadinessPolicyInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.actionCompletionPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_ACTION_REQUIRED', 'Execution readiness action completion policy is required'))
    }

    if (!input.dependencyCompletionPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_DEPENDENCY_REQUIRED', 'Execution readiness dependency completion policy is required'))
    }

    if (!input.validationCompletionPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_VALIDATION_REQUIRED', 'Execution readiness validation completion policy is required'))
    }

    if (!input.approvalCompletionPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_APPROVAL_REQUIRED', 'Execution readiness approval completion policy is required'))
    }

    if (!input.workflowReadinessPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_WORKFLOW_REQUIRED', 'Execution readiness workflow readiness policy is required'))
    }

    if (!input.executionSafetyPolicy?.policyId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_SAFETY_REQUIRED', 'Execution readiness safety policy is required'))
    }

    if (!Array.isArray(input.workflowReadinessPolicy?.allowedWorkflowStates)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_WORKFLOW_STATES_INVALID', 'Execution readiness workflow readiness policy allowedWorkflowStates must be an array'))
    }

    if (!Array.isArray(input.executionSafetyPolicy?.blockedConditions)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_POLICY_SAFETY_CONDITIONS_INVALID', 'Execution readiness safety policy blockedConditions must be an array'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateExecutionReadinessGovernance(input: ExecutionReadinessGovernanceInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.ownership?.ownerId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_GOVERNANCE_OWNER_REQUIRED', 'Execution governance ownerId is required'))
    }

    if (input.confidence < 0 || input.confidence > 1) {
      diagnostics.push(createDiagnostic('execution-readiness', 'warning', 'EXECUTION_GOVERNANCE_CONFIDENCE_OUT_OF_RANGE', 'Execution governance confidence should be between 0 and 1'))
    }

    if (!input.version) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_GOVERNANCE_VERSION_REQUIRED', 'Execution governance version is required'))
    }

    if (!Array.isArray(input.traceability?.traceIds)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_GOVERNANCE_TRACEABILITY_INVALID', 'Execution governance traceability.traceIds must be an array'))
    }

    if (!input.provenance?.source) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_GOVERNANCE_PROVENANCE_REQUIRED', 'Execution governance provenance.source is required'))
    }

    if (!input.freshness?.capturedAt) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_GOVERNANCE_FRESHNESS_REQUIRED', 'Execution governance freshness.capturedAt is required'))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }

  validateExecutionApproval(input: ExecutionApprovalInput): RegistrationValidationResult {
    const diagnostics: RegistrationDiagnostic[] = []

    if (!input.reportId) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_APPROVAL_REPORT_ID_REQUIRED', 'Execution approval reportId is required'))
    }

    if (!Array.isArray(input.approverIds)) {
      diagnostics.push(createDiagnostic('execution-readiness', 'error', 'EXECUTION_APPROVAL_APPROVERS_INVALID', 'Execution approval approverIds must be an array', input.reportId))
    }

    if (input.approvalStatus === 'approved' && input.approverIds.length === 0) {
      diagnostics.push(createDiagnostic('execution-readiness', 'warning', 'EXECUTION_APPROVAL_EMPTY_APPROVERS', 'Execution approval is approved but has no approverIds', input.reportId))
    }

    return {
      valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      diagnostics,
    }
  }
}

export class RegistrationValidationService {
  private serviceValidator = new ServiceRegistrationValidator()
  private providerValidator = new ProviderRegistrationValidator()
  private adapterValidator = new ProviderAdapterValidator()
  private skillValidator = new SkillRegistrationValidator()
  private aiTeamValidator = new AITeamValidator()
  private promptValidator = new PromptConstructionValidator()
  private executionValidator = new ExecutionOrchestratorValidator()
  private executionGatewayValidator = new ExecutionGatewayValidator()
  private knowledgeAssemblyValidator = new KnowledgeAssemblyValidator()
  private retrievalStrategyPlanningValidator = new RetrievalStrategyPlanningValidator()
  private knowledgeResolutionValidator = new KnowledgeResolutionValidator()
  private knowledgeSelectionValidator = new KnowledgeSelectionValidator()
  private knowledgeQualityValidator = new KnowledgeQualityValidator()
  private knowledgeReadinessValidator = new KnowledgeReadinessValidator()
  private knowledgeCertificationValidator = new KnowledgeCertificationValidator()
  private reasoningEngineValidator = new ReasoningEngineValidator()
  private strategicReasoningValidator = new StrategicReasoningValidator()
  private tacticalPlanningValidator = new TacticalPlanningValidator()
  private decisionIntelligenceValidator = new DecisionIntelligenceValidator()
  private actionIntelligenceValidator = new ActionIntelligenceValidator()
  private autonomousWorkflowValidator = new AutonomousWorkflowValidator()
  private autonomousTaskValidator = new AutonomousTaskValidator()
  private autonomousAgentValidator = new AutonomousAgentValidator()
  private autonomousProjectValidator = new AutonomousProjectValidator()
  private autonomousWorkspaceValidator = new AutonomousWorkspaceValidator()
  private autonomousRecoveryValidator = new AutonomousRecoveryValidator()
  private desktopIntegrationValidator = new DesktopIntegrationValidator()
  private ideIntegrationValidator = new IDEIntegrationValidator()
  private terminalIntegrationValidator = new TerminalIntegrationValidator()
  private browserIntegrationValidator = new BrowserIntegrationValidator()
  private gitIntegrationValidator = new GitIntegrationValidator()
  private sourceControlValidator = new SourceControlValidator()
  private repositoryIntelligenceValidator = new RepositoryIntelligenceValidator()
  private repositoryKnowledgeGraphValidator = new RepositoryKnowledgeGraphValidator()
  private executionReadinessValidator = new ExecutionReadinessValidator()
  private memoryValidator = new MemoryRegistrationValidator()
  private knowledgeValidator = new KnowledgeRegistrationValidator()
  private reasoningValidator = new ReasoningPipelineValidator()
  private workflowValidator = new WorkflowValidator()

  validateServiceRegistration(
    registration: ServiceRegistrationInput,
    existingServiceIds: Set<string>,
    existingImplementations: Set<string>
  ): RegistrationValidationResult {
    return this.serviceValidator.validate(registration, existingServiceIds, existingImplementations)
  }

  validateServiceLifetime(
    serviceId: string,
    declared: ServiceLifetime,
    registered: ServiceLifetime | undefined
  ): RegistrationValidationResult {
    return this.serviceValidator.validateLifetime(serviceId, declared, registered)
  }

  validateProviderRegistration(
    registration: ProviderRegistrationInput,
    existingProviderIds: Set<string>
  ): RegistrationValidationResult {
    return this.providerValidator.validate(registration, existingProviderIds)
  }

  validateProviderConfiguration(configuration: ProviderConfigurationInput): RegistrationValidationResult {
    return this.providerValidator.validateConfiguration(configuration)
  }

  validateProviderCapabilities(
    providerId: string,
    capabilities: Array<{
      capabilityId: string
      name: string
      supported: boolean
      metadata?: Metadata
    }>
  ): RegistrationValidationResult {
    return this.providerValidator.validateCapabilities(providerId, capabilities)
  }

  validateProviderLifecycle(
    providerId: string,
    currentState: ProviderRuntimeLifecycleState,
    nextState: ProviderRuntimeLifecycleState
  ): RegistrationValidationResult {
    return this.providerValidator.validateLifecycle(providerId, currentState, nextState)
  }

  validateAdapterRegistration(
    registration: ProviderAdapterRegistrationInput,
    existingAdapterIds: Set<string>
  ): RegistrationValidationResult {
    return this.adapterValidator.validateRegistration(registration, existingAdapterIds)
  }

  validateAdapterCapabilities(
    adapterId: string,
    capabilities: ProviderAdapterCapabilityInput[]
  ): RegistrationValidationResult {
    return this.adapterValidator.validateCapabilities(adapterId, capabilities)
  }

  validateAdapterConfiguration(
    configuration: ProviderAdapterConfigurationInput
  ): RegistrationValidationResult {
    return this.adapterValidator.validateConfiguration(configuration)
  }

  validateAdapterLifecycle(
    adapterId: string,
    currentState: AdapterLifecycleState,
    nextState: AdapterLifecycleState
  ): RegistrationValidationResult {
    return this.adapterValidator.validateLifecycle(adapterId, currentState, nextState)
  }

  validateSkillRegistration(
    registration: SkillRegistrationInput,
    existingSkillIds: Set<string>
  ): RegistrationValidationResult {
    return this.skillValidator.validate(registration, existingSkillIds)
  }

  validateAITeamRegistration(
    registration: AITeamRegistrationInput,
    existingTeamIds: Set<string>
  ): RegistrationValidationResult {
    return this.aiTeamValidator.validateTeamRegistration(registration, existingTeamIds)
  }

  validateAISpecialistRegistration(
    specialist: AISpecialistRegistrationInput,
    existingSpecialistIds: Set<string>
  ): RegistrationValidationResult {
    return this.aiTeamValidator.validateSpecialistRegistration(specialist, existingSpecialistIds)
  }

  validateAITeamCapabilities(teamId: string, capabilities: string[]): RegistrationValidationResult {
    return this.aiTeamValidator.validateCapabilities(teamId, capabilities)
  }

  validateAITeamAssignment(assignment: AITeamAssignmentInput): RegistrationValidationResult {
    return this.aiTeamValidator.validateAssignment(assignment)
  }

  validateAITeamGovernance(teamId: string, governance: AITeamGovernanceInput): RegistrationValidationResult {
    return this.aiTeamValidator.validateGovernance(teamId, governance)
  }

  validatePromptRegistration(
    registration: PromptRegistrationInput,
    existingPromptIds: Set<string>
  ): RegistrationValidationResult {
    return this.promptValidator.validateRegistration(registration, existingPromptIds)
  }

  validatePromptTemplateRegistration(
    template: PromptTemplateRegistrationInput,
    existingTemplateIds: Set<string>
  ): RegistrationValidationResult {
    return this.promptValidator.validateTemplateRegistration(template, existingTemplateIds)
  }

  validatePromptMetadata(metadata: PromptMetadataInput): RegistrationValidationResult {
    return this.promptValidator.validateMetadata(metadata)
  }

  validatePromptContextPackage(input: PromptContextPackageInput): RegistrationValidationResult {
    return this.promptValidator.validateContextPackage(input)
  }

  validatePromptPackage(input: PromptPackageInput): RegistrationValidationResult {
    return this.promptValidator.validatePackage(input)
  }

  validatePromptGovernance(promptId: string, governance: PromptGovernanceInput): RegistrationValidationResult {
    return this.promptValidator.validateGovernance(promptId, governance)
  }

  validateExecutionRegistration(
    registration: ExecutionRegistrationInput,
    existingExecutionIds: Set<string>
  ): RegistrationValidationResult {
    return this.executionValidator.validateRegistration(registration, existingExecutionIds)
  }

  validateExecutionPlan(plan: ExecutionPlanInput): RegistrationValidationResult {
    return this.executionValidator.validatePlan(plan)
  }

  validateExecutionStage(
    stage: ExecutionStageInput,
    existingStates: Set<ExecutionPipelineState>
  ): RegistrationValidationResult {
    return this.executionValidator.validateStage(stage, existingStates)
  }

  validateExecutionContext(context: ExecutionContextInput): RegistrationValidationResult {
    return this.executionValidator.validateContext(context)
  }

  validateExecutionGovernance(
    executionId: string,
    governance: ExecutionGovernanceInput
  ): RegistrationValidationResult {
    return this.executionValidator.validateGovernance(executionId, governance)
  }

  validateExecutionRequest(
    input: ExecutionGatewayRequestInput
  ): RegistrationValidationResult {
    return this.executionGatewayValidator.validateRequest(input)
  }

  validateExecutionDispatch(
    input: ExecutionDispatchInput
  ): RegistrationValidationResult {
    return this.executionGatewayValidator.validateDispatch(input)
  }

  validateExecutionProviderResolution(
    input: ProviderResolutionInput
  ): RegistrationValidationResult {
    return this.executionGatewayValidator.validateProviderResolution(input)
  }

  validateExecutionResponse(
    input: ExecutionGatewayResponseInput
  ): RegistrationValidationResult {
    return this.executionGatewayValidator.validateResponse(input)
  }

  validateExecutionAudit(
    input: ExecutionAuditRecordInput
  ): RegistrationValidationResult {
    return this.executionGatewayValidator.validateAudit(input)
  }

  validateRetrievalPlan(
    input: RetrievalPlanInput
  ): RegistrationValidationResult {
    return this.knowledgeAssemblyValidator.validateRetrievalPlan(input)
  }

  validateKnowledgePackage(
    input: KnowledgePackageInput
  ): RegistrationValidationResult {
    return this.knowledgeAssemblyValidator.validateKnowledgePackage(input)
  }

  validateKnowledgeSource(
    input: RetrievalSourceDescriptorInput
  ): RegistrationValidationResult {
    return this.knowledgeAssemblyValidator.validateSource(input)
  }

  validateKnowledgeReferenceAssembly(
    input: KnowledgeReferenceAssemblyInput
  ): RegistrationValidationResult {
    return this.knowledgeAssemblyValidator.validateKnowledgeReference(input)
  }

  validateKnowledgePrioritisation(
    input: KnowledgePrioritisationInput
  ): RegistrationValidationResult {
    return this.knowledgeAssemblyValidator.validatePrioritisation(input)
  }

  validateQueryPlan(input: QueryPlanInput): RegistrationValidationResult {
    return this.retrievalStrategyPlanningValidator.validateQueryPlan(input)
  }

  validateRetrievalStrategy(input: RetrievalStrategyDefinitionInput): RegistrationValidationResult {
    return this.retrievalStrategyPlanningValidator.validateRetrievalStrategy(input)
  }

  validateRetrievalPackage(input: RetrievalPackageInput): RegistrationValidationResult {
    return this.retrievalStrategyPlanningValidator.validateRetrievalPackage(input)
  }

  validateSourcePlanning(input: SourcePlanningInput): RegistrationValidationResult {
    return this.retrievalStrategyPlanningValidator.validateSourcePlanning(input)
  }

  validateStrategyGovernance(input: StrategyGovernanceInput): RegistrationValidationResult {
    return this.retrievalStrategyPlanningValidator.validateStrategyGovernance(input)
  }

  validateKnowledgeResolution(input: KnowledgeResolutionRegistrationInput): RegistrationValidationResult {
    return this.knowledgeResolutionValidator.validateKnowledgeResolution(input)
  }

  validateContextComposition(input: ContextCompositionInput): RegistrationValidationResult {
    return this.knowledgeResolutionValidator.validateContextComposition(input)
  }

  validateContextReference(input: ResolutionContextReferenceInput): RegistrationValidationResult {
    return this.knowledgeResolutionValidator.validateContextReference(input)
  }

  validateResolutionPolicy(input: ResolutionPolicyInput): RegistrationValidationResult {
    return this.knowledgeResolutionValidator.validateResolutionPolicy(input)
  }

  validateContextGovernance(input: ContextGovernanceInput): RegistrationValidationResult {
    return this.knowledgeResolutionValidator.validateContextGovernance(input)
  }

  validateKnowledgeSelectionRegistration(input: KnowledgeSelectionRegistrationInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateKnowledgeSelectionRegistration(input)
  }

  validateKnowledgeSelection(input: KnowledgeSelectionInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateKnowledgeSelection(input)
  }

  validateEvidencePackage(input: EvidencePackageInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateEvidencePackage(input)
  }

  validateSelectionPolicy(input: SelectionPolicyInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateSelectionPolicy(input)
  }

  validateEvidenceReference(input: EvidenceReferenceInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateEvidenceReference(input)
  }

  validateSelectionGovernance(input: SelectionGovernanceInput): RegistrationValidationResult {
    return this.knowledgeSelectionValidator.validateSelectionGovernance(input)
  }

  validateKnowledgeQuality(input: KnowledgeQualityRegistrationInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateKnowledgeQuality(input)
  }

  validateConflictAnalysis(input: ConflictAnalysisInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateConflictAnalysis(input)
  }

  validateGapAnalysis(input: GapAnalysisInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateGapAnalysis(input)
  }

  validateConflictReference(input: ConflictReferenceInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateConflictReference(input)
  }

  validateQualityGovernance(input: QualityGovernanceInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateQualityGovernance(input)
  }

  validateQualityReport(input: KnowledgeQualityReportInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateQualityReport(input)
  }

  validateKnowledgeReadiness(input: KnowledgeReadinessRegistrationInput): RegistrationValidationResult {
    return this.knowledgeReadinessValidator.validateKnowledgeReadiness(input)
  }

  validateReadinessReport(input: ReadinessReportInput): RegistrationValidationResult {
    return this.knowledgeReadinessValidator.validateReadinessReport(input)
  }

  validatePromptHandoff(input: PromptHandoffPackageInput): RegistrationValidationResult {
    return this.knowledgeReadinessValidator.validatePromptHandoff(input)
  }

  validateReadinessPolicy(input: ReadinessPolicyInput): RegistrationValidationResult {
    return this.knowledgeReadinessValidator.validateReadinessPolicy(input)
  }

  validateReadinessGovernance(input: ReadinessGovernanceInput): RegistrationValidationResult {
    return this.knowledgeReadinessValidator.validateReadinessGovernance(input)
  }

  validateKnowledgeCertification(input: KnowledgeCertificationRegistrationInput): RegistrationValidationResult {
    return this.knowledgeCertificationValidator.validateKnowledgeCertification(input)
  }

  validateCertificationReport(input: KnowledgeCertificationReportInput): RegistrationValidationResult {
    return this.knowledgeCertificationValidator.validateCertificationReport(input)
  }

  validatePromptDeliveryPackage(input: PromptDeliveryPackageInput): RegistrationValidationResult {
    return this.knowledgeCertificationValidator.validatePromptDeliveryPackage(input)
  }

  validateCertificationPolicy(input: CertificationPolicyInput): RegistrationValidationResult {
    return this.knowledgeCertificationValidator.validateCertificationPolicy(input)
  }

  validateCertificationGovernance(input: CertificationGovernanceInput): RegistrationValidationResult {
    return this.knowledgeCertificationValidator.validateCertificationGovernance(input)
  }

  validateReasoningEngine(input: ReasoningEngineRegistrationInput): RegistrationValidationResult {
    return this.reasoningEngineValidator.validateReasoningEngine(input)
  }

  validateReasoningPlan(input: ReasoningPlanInput): RegistrationValidationResult {
    return this.reasoningEngineValidator.validateReasoningPlan(input)
  }

  validateReasoningStage(input: ReasoningEngineStage): RegistrationValidationResult {
    return this.reasoningEngineValidator.validateReasoningStage(input)
  }

  validateReasoningEngineGovernance(input: ReasoningEngineGovernanceInput): RegistrationValidationResult {
    return this.reasoningEngineValidator.validateReasoningGovernance(input)
  }

  validateReasoningOutput(input: ReasoningOutputInput): RegistrationValidationResult {
    return this.reasoningEngineValidator.validateReasoningOutput(input)
  }

  validateStrategicReasoning(input: StrategicReasoningRegistrationInput): RegistrationValidationResult {
    return this.strategicReasoningValidator.validateStrategicReasoning(input)
  }

  validateStrategicPlanning(input: StrategicPlanningInput): RegistrationValidationResult {
    return this.strategicReasoningValidator.validateStrategicPlanning(input)
  }

  validateStrategicStage(input: StrategicThinkingStage): RegistrationValidationResult {
    return this.strategicReasoningValidator.validateStrategicStage(input)
  }

  validateStrategicGovernance(input: StrategicGovernanceInput): RegistrationValidationResult {
    return this.strategicReasoningValidator.validateStrategicGovernance(input)
  }

  validateStrategicRecommendation(input: StrategicRecommendationInput): RegistrationValidationResult {
    return this.strategicReasoningValidator.validateStrategicRecommendation(input)
  }

  validateTacticalPlanning(input: TacticalPlanningRegistrationInput): RegistrationValidationResult {
    return this.tacticalPlanningValidator.validateTacticalPlanning(input)
  }

  validateTacticalPlan(input: TacticalPlanInput): RegistrationValidationResult {
    return this.tacticalPlanningValidator.validateTacticalPlan(input)
  }

  validateTacticalStage(input: TacticalPlanningStage): RegistrationValidationResult {
    return this.tacticalPlanningValidator.validateTacticalStage(input)
  }

  validateTacticalGovernance(input: TacticalGovernanceInput): RegistrationValidationResult {
    return this.tacticalPlanningValidator.validateTacticalGovernance(input)
  }

  validateTacticalRecommendation(input: TacticalRecommendationInput): RegistrationValidationResult {
    return this.tacticalPlanningValidator.validateTacticalRecommendation(input)
  }

  validateDecisionIntelligence(input: DecisionIntelligenceRegistrationInput): RegistrationValidationResult {
    return this.decisionIntelligenceValidator.validateDecisionIntelligence(input)
  }

  validateDecisionPackage(input: DecisionPackageInput): RegistrationValidationResult {
    return this.decisionIntelligenceValidator.validateDecisionPackage(input)
  }

  validateDecisionLifecycle(input: DecisionLifecycleStage): RegistrationValidationResult {
    return this.decisionIntelligenceValidator.validateDecisionLifecycle(input)
  }

  validateDecisionGovernance(input: DecisionGovernanceInput): RegistrationValidationResult {
    return this.decisionIntelligenceValidator.validateDecisionGovernance(input)
  }

  validateDecisionRecommendation(input: DecisionRecommendationInput): RegistrationValidationResult {
    return this.decisionIntelligenceValidator.validateDecisionRecommendation(input)
  }

  validateActionIntelligence(input: ActionIntelligenceRegistrationInput): RegistrationValidationResult {
    return this.actionIntelligenceValidator.validateActionIntelligence(input)
  }

  validateActionPlan(input: ActionPlanInput): RegistrationValidationResult {
    return this.actionIntelligenceValidator.validateActionPlan(input)
  }

  validateActionLifecycle(input: ActionLifecycleStage): RegistrationValidationResult {
    return this.actionIntelligenceValidator.validateActionLifecycle(input)
  }

  validateActionGovernance(input: ActionGovernanceInput): RegistrationValidationResult {
    return this.actionIntelligenceValidator.validateActionGovernance(input)
  }

  validateActionReadiness(input: ActionReadinessInput): RegistrationValidationResult {
    return this.actionIntelligenceValidator.validateActionReadiness(input)
  }

  validateAutonomousWorkflow(input: AutonomousWorkflowRegistrationInput): RegistrationValidationResult {
    return this.autonomousWorkflowValidator.validateAutonomousWorkflow(input)
  }

  validateAutonomousWorkflowPlan(input: AutonomousWorkflowInput): RegistrationValidationResult {
    return this.autonomousWorkflowValidator.validateWorkflowPlan(input)
  }

  validateAutonomousWorkflowLifecycle(input: AutonomousWorkflowLifecycleStage): RegistrationValidationResult {
    return this.autonomousWorkflowValidator.validateWorkflowLifecycle(input)
  }

  validateAutonomousWorkflowGovernance(input: AutonomousWorkflowGovernanceInput): RegistrationValidationResult {
    return this.autonomousWorkflowValidator.validateWorkflowGovernance(input)
  }

  validateAutonomousWorkflowReadiness(input: AutonomousWorkflowReadinessInput): RegistrationValidationResult {
    return this.autonomousWorkflowValidator.validateWorkflowReadiness(input)
  }

  validateAutonomousTask(input: AutonomousTaskRegistrationInput): RegistrationValidationResult {
    return this.autonomousTaskValidator.validateAutonomousTask(input)
  }

  validateAutonomousTaskPlan(input: AutonomousTaskInput): RegistrationValidationResult {
    return this.autonomousTaskValidator.validateTaskPlan(input)
  }

  validateAutonomousTaskLifecycle(input: AutonomousTaskLifecycleStage): RegistrationValidationResult {
    return this.autonomousTaskValidator.validateTaskLifecycle(input)
  }

  validateAutonomousTaskGovernance(input: AutonomousTaskGovernanceInput): RegistrationValidationResult {
    return this.autonomousTaskValidator.validateTaskGovernance(input)
  }

  validateAutonomousTaskReadiness(input: AutonomousTaskReadinessInput): RegistrationValidationResult {
    return this.autonomousTaskValidator.validateTaskReadiness(input)
  }

  validateAutonomousAgent(input: AutonomousAgentRegistrationInput): RegistrationValidationResult {
    return this.autonomousAgentValidator.validateAutonomousAgent(input)
  }

  validateAutonomousAgentAssignment(input: AgentAssignmentInput): RegistrationValidationResult {
    return this.autonomousAgentValidator.validateAgentAssignment(input)
  }

  validateAutonomousAgentLifecycle(input: AutonomousAgentLifecycleStage): RegistrationValidationResult {
    return this.autonomousAgentValidator.validateAgentLifecycle(input)
  }

  validateAutonomousAgentGovernance(input: AutonomousAgentGovernanceInput): RegistrationValidationResult {
    return this.autonomousAgentValidator.validateAgentGovernance(input)
  }

  validateAutonomousAgentCoordination(input: CoordinationPlanInput): RegistrationValidationResult {
    return this.autonomousAgentValidator.validateCoordination(input)
  }

  validateAutonomousProject(input: AutonomousProjectRegistrationInput): RegistrationValidationResult {
    return this.autonomousProjectValidator.validateAutonomousProject(input)
  }

  validateProjectPlanning(input: AutonomousProjectInput): RegistrationValidationResult {
    return this.autonomousProjectValidator.validateProjectPlanning(input)
  }

  validateProjectLifecycle(input: AutonomousProjectLifecycleStage): RegistrationValidationResult {
    return this.autonomousProjectValidator.validateProjectLifecycle(input)
  }

  validateProjectGovernance(input: AutonomousProjectGovernanceInput): RegistrationValidationResult {
    return this.autonomousProjectValidator.validateProjectGovernance(input)
  }

  validateProjectCoordination(input: ProjectCoordinationInput): RegistrationValidationResult {
    return this.autonomousProjectValidator.validateProjectCoordination(input)
  }

  validateAutonomousWorkspace(input: AutonomousWorkspaceRegistrationInput): RegistrationValidationResult {
    return this.autonomousWorkspaceValidator.validateAutonomousWorkspace(input)
  }

  validateWorkspaceConfiguration(input: WorkspaceConfigurationInput): RegistrationValidationResult {
    return this.autonomousWorkspaceValidator.validateWorkspaceConfiguration(input)
  }

  validateWorkspaceLifecycle(input: AutonomousWorkspaceLifecycleStage): RegistrationValidationResult {
    return this.autonomousWorkspaceValidator.validateWorkspaceLifecycle(input)
  }

  validateWorkspaceGovernance(input: AutonomousWorkspaceGovernanceInput): RegistrationValidationResult {
    return this.autonomousWorkspaceValidator.validateWorkspaceGovernance(input)
  }

  validateWorkspaceResource(input: WorkspaceResourceInput): RegistrationValidationResult {
    return this.autonomousWorkspaceValidator.validateWorkspaceResource(input)
  }

  validateAutonomousRecovery(input: AutonomousRecoveryRegistrationInput): RegistrationValidationResult {
    return this.autonomousRecoveryValidator.validateAutonomousRecovery(input)
  }

  validateRecoveryPlan(input: RecoveryPlanInput): RegistrationValidationResult {
    return this.autonomousRecoveryValidator.validateRecoveryPlan(input)
  }

  validateRecoveryLifecycle(input: AutonomousRecoveryLifecycleStage | RecoveryStateInput): RegistrationValidationResult {
    return this.autonomousRecoveryValidator.validateRecoveryLifecycle(input)
  }

  validateRecoveryGovernance(input: AutonomousRecoveryGovernanceInput): RegistrationValidationResult {
    return this.autonomousRecoveryValidator.validateRecoveryGovernance(input)
  }

  validateSessionContinuity(input: SessionContinuityPlanInput): RegistrationValidationResult {
    return this.autonomousRecoveryValidator.validateSessionContinuity(input)
  }

  validateDesktopIntegration(input: DesktopIntegrationRegistrationInput): RegistrationValidationResult {
    return this.desktopIntegrationValidator.validateDesktopIntegration(input)
  }

  validateDesktopConfiguration(input: DesktopConfigurationInput): RegistrationValidationResult {
    return this.desktopIntegrationValidator.validateDesktopConfiguration(input)
  }

  validateDesktopLifecycle(input: DesktopIntegrationLifecycleStage | DesktopIntegrationStateInput): RegistrationValidationResult {
    return this.desktopIntegrationValidator.validateDesktopLifecycle(input)
  }

  validateDesktopGovernance(input: DesktopIntegrationGovernanceInput): RegistrationValidationResult {
    return this.desktopIntegrationValidator.validateDesktopGovernance(input)
  }

  validateIntegrationTarget(input: IntegrationTargetInput): RegistrationValidationResult {
    return this.desktopIntegrationValidator.validateIntegrationTarget(input)
  }

  validateIDEIntegration(input: IDEIntegrationRegistrationInput): RegistrationValidationResult {
    return this.ideIntegrationValidator.validateIDEIntegration(input)
  }

  validateIDEConfiguration(input: IDEConfigurationInput): RegistrationValidationResult {
    return this.ideIntegrationValidator.validateIDEConfiguration(input)
  }

  validateIDELifecycle(input: IDEIntegrationLifecycleStage | IDEStateInput): RegistrationValidationResult {
    return this.ideIntegrationValidator.validateIDELifecycle(input)
  }

  validateIDEGovernance(input: IDEIntegrationGovernanceInput): RegistrationValidationResult {
    return this.ideIntegrationValidator.validateIDEGovernance(input)
  }

  validateIDEResource(input: IDEResourceInput): RegistrationValidationResult {
    return this.ideIntegrationValidator.validateIDEResource(input)
  }

  validateTerminalIntegration(input: TerminalIntegrationRegistrationInput): RegistrationValidationResult {
    return this.terminalIntegrationValidator.validateTerminalIntegration(input)
  }

  validateTerminalConfiguration(input: TerminalConfigurationInput): RegistrationValidationResult {
    return this.terminalIntegrationValidator.validateTerminalConfiguration(input)
  }

  validateTerminalLifecycle(input: TerminalIntegrationLifecycleStage | TerminalStateInput): RegistrationValidationResult {
    return this.terminalIntegrationValidator.validateTerminalLifecycle(input)
  }

  validateTerminalGovernance(input: TerminalIntegrationGovernanceInput): RegistrationValidationResult {
    return this.terminalIntegrationValidator.validateTerminalGovernance(input)
  }

  validateTerminalResource(input: TerminalResourceInput): RegistrationValidationResult {
    return this.terminalIntegrationValidator.validateTerminalResource(input)
  }

  validateBrowserIntegration(input: BrowserIntegrationRegistrationInput): RegistrationValidationResult {
    return this.browserIntegrationValidator.validateBrowserIntegration(input)
  }

  validateBrowserIntegrationConfiguration(input: BrowserConfigurationInput): RegistrationValidationResult {
    return this.browserIntegrationValidator.validateBrowserConfiguration(input)
  }

  validateBrowserLifecycle(input: BrowserIntegrationLifecycleStage | BrowserStateInput): RegistrationValidationResult {
    return this.browserIntegrationValidator.validateBrowserLifecycle(input)
  }

  validateBrowserGovernance(input: BrowserIntegrationGovernanceInput): RegistrationValidationResult {
    return this.browserIntegrationValidator.validateBrowserGovernance(input)
  }

  validateBrowserResource(input: BrowserResourceInput): RegistrationValidationResult {
    return this.browserIntegrationValidator.validateBrowserResource(input)
  }

  validateGitIntegration(input: GitIntegrationRegistrationInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitIntegration(input)
  }

  validateGitConfiguration(input: GitConfigurationInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitConfiguration(input)
  }

  validateGitRepository(input: GitRepositoryInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitRepository(input)
  }

  validateGitBranch(input: GitBranchInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitBranch(input)
  }

  validateGitLifecycle(input: GitIntegrationLifecycleStage | GitStateInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitLifecycle(input)
  }

  validateGitGovernance(input: GitIntegrationGovernanceInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitGovernance(input)
  }

  validateGitResource(input: GitResourceInput): RegistrationValidationResult {
    return this.gitIntegrationValidator.validateGitResource(input)
  }

  validateSourceControl(input: SourceControlRegistrationInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateSourceControl(input)
  }

  validateSourceControlConfiguration(input: SourceControlConfigurationInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateSourceControlConfiguration(input)
  }

  validateRepositoryPlan(input: RepositoryPlanInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateRepositoryPlan(input)
  }

  validateBranchPlan(input: BranchPlanInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateBranchPlan(input)
  }

  validateSourceControlLifecycle(input: SourceControlLifecycleStage | SourceControlStateInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateSourceControlLifecycle(input)
  }

  validateSourceControlGovernance(input: SourceControlGovernanceInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateSourceControlGovernance(input)
  }

  validateSourceControlResource(input: SourceControlResourceInput): RegistrationValidationResult {
    return this.sourceControlValidator.validateSourceControlResource(input)
  }

  validateRepositoryIntelligence(input: RepositoryIntelligenceRegistrationInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryIntelligence(input)
  }

  validateRepositoryIntelligenceConfiguration(input: RepositoryIntelligenceConfigurationInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryIntelligenceConfiguration(input)
  }

  validateRepositoryAnalysisPlan(input: RepositoryAnalysisPlanInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryAnalysisPlan(input)
  }

  validateArchitectureAnalysis(input: ArchitectureAnalysisInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateArchitectureAnalysis(input)
  }

  validateRepositoryIntelligenceLifecycle(input: RepositoryIntelligenceLifecycleStage | RepositoryIntelligenceStateInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryIntelligenceLifecycle(input)
  }

  validateRepositoryIntelligenceGovernance(input: RepositoryIntelligenceGovernanceInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryIntelligenceGovernance(input)
  }

  validateRepositoryIntelligenceResource(input: RepositoryIntelligenceResourceInput): RegistrationValidationResult {
    return this.repositoryIntelligenceValidator.validateRepositoryIntelligenceResource(input)
  }

  validateRepositoryKnowledgeGraph(input: RepositoryKnowledgeGraphRegistrationInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateRepositoryKnowledgeGraph(input)
  }

  validateRepositoryKnowledgeGraphConfiguration(input: RepositoryKnowledgeGraphConfigurationInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateRepositoryKnowledgeGraphConfiguration(input)
  }

  validateKnowledgeNode(input: KnowledgeNodeInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateKnowledgeNode(input)
  }

  validateKnowledgeRelationship(input: RepositoryKnowledgeRelationshipInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateKnowledgeRelationship(input)
  }

  validateRepositoryKnowledgeGraphLifecycle(input: RepositoryKnowledgeGraphLifecycleStage | RepositoryKnowledgeGraphStateInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateRepositoryKnowledgeGraphLifecycle(input)
  }

  validateRepositoryKnowledgeGraphGovernance(input: RepositoryKnowledgeGraphGovernanceInput): RegistrationValidationResult {
    return this.repositoryKnowledgeGraphValidator.validateRepositoryKnowledgeGraphGovernance(input)
  }

  validateExecutionReadiness(input: ExecutionReadinessRegistrationInput): RegistrationValidationResult {
    return this.executionReadinessValidator.validateExecutionReadiness(input)
  }

  validateExecutionPackage(input: ExecutionPackageInput | ExecutionReadinessReportInput): RegistrationValidationResult {
    return this.executionReadinessValidator.validateExecutionPackage(input)
  }

  validateExecutionReadinessPolicy(input: ExecutionReadinessPolicyInput): RegistrationValidationResult {
    return this.executionReadinessValidator.validateExecutionReadinessPolicy(input)
  }

  validateExecutionReadinessGovernance(input: ExecutionReadinessGovernanceInput): RegistrationValidationResult {
    return this.executionReadinessValidator.validateExecutionReadinessGovernance(input)
  }

  validateExecutionApproval(input: ExecutionApprovalInput): RegistrationValidationResult {
    return this.executionReadinessValidator.validateExecutionApproval(input)
  }

  validateKnowledgeQualityPolicy(input: KnowledgeQualityPolicyInput): RegistrationValidationResult {
    return this.knowledgeQualityValidator.validateKnowledgeQualityPolicy(input)
  }

  validateMemoryRegistration(
    registration: MemoryRegistrationInput,
    existingMemoryIds: Set<string>
  ): RegistrationValidationResult {
    return this.memoryValidator.validateRegistration(registration, existingMemoryIds)
  }

  validateMemoryMetadata(metadata: MemoryMetadataInput): RegistrationValidationResult {
    return this.memoryValidator.validateMetadata(metadata)
  }

  validateMemoryDependencies(
    memoryId: string,
    dependencies: string[],
    availableMemoryIds: Set<string>
  ): RegistrationValidationResult {
    return this.memoryValidator.validateDependencies(memoryId, dependencies, availableMemoryIds)
  }

  validateMemoryLifecycle(
    memoryId: string,
    currentState: MemoryLifecycleState,
    nextState: MemoryLifecycleState
  ): RegistrationValidationResult {
    return this.memoryValidator.validateLifecycle(memoryId, currentState, nextState)
  }

  validateKnowledgeRegistration(
    registration: KnowledgeRegistrationInput,
    existingKnowledgeIds: Set<string>
  ): RegistrationValidationResult {
    return this.knowledgeValidator.validateRegistration(registration, existingKnowledgeIds)
  }

  validateKnowledgeMetadata(metadata: KnowledgeMetadataInput): RegistrationValidationResult {
    return this.knowledgeValidator.validateMetadata(metadata)
  }

  validateKnowledgeRelationships(
    knowledgeId: string,
    relationships: KnowledgeRelationshipInput[],
    availableKnowledgeIds: Set<string>
  ): RegistrationValidationResult {
    return this.knowledgeValidator.validateRelationships(knowledgeId, relationships, availableKnowledgeIds)
  }

  validateKnowledgeGovernance(
    knowledgeId: string,
    governance: KnowledgeGovernanceInput
  ): RegistrationValidationResult {
    return this.knowledgeValidator.validateGovernance(knowledgeId, governance)
  }

  validateReasoningRegistration(
    registration: ReasoningRegistrationInput,
    existingPipelineIds: Set<string>
  ): RegistrationValidationResult {
    return this.reasoningValidator.validateRegistration(registration, existingPipelineIds)
  }

  validateReasoningStageRegistration(
    stage: ReasoningStageRegistrationInput,
    existingStages: Set<ReasoningPipelineStage>
  ): RegistrationValidationResult {
    return this.reasoningValidator.validateStageRegistration(stage, existingStages)
  }

  validateReasoningStageTransition(
    from: ReasoningPipelineStage,
    to: ReasoningPipelineStage
  ): RegistrationValidationResult {
    return this.reasoningValidator.validateStageTransition(from, to)
  }

  validateReasoningArtifact(artifact: ReasoningArtifactInput): RegistrationValidationResult {
    return this.reasoningValidator.validateArtifact(artifact)
  }

  validateReasoningMetadata(metadata: ReasoningMetadataInput): RegistrationValidationResult {
    return this.reasoningValidator.validateMetadata(metadata)
  }

  validateReasoningGovernance(
    pipelineId: string,
    governance: ReasoningGovernanceInput
  ): RegistrationValidationResult {
    return this.reasoningValidator.validateGovernance(pipelineId, governance)
  }

  validateWorkflowRegistration(
    registration: WorkflowRegistrationInput,
    existingWorkflowIds: Set<string>
  ): RegistrationValidationResult {
    return this.workflowValidator.validateRegistration(registration, existingWorkflowIds)
  }

  validateWorkflowMetadata(metadata: WorkflowMetadataInput): RegistrationValidationResult {
    return this.workflowValidator.validateMetadata(metadata)
  }

  validateWorkflowStep(step: WorkflowStepInput, stepIds: Set<string>): RegistrationValidationResult {
    return this.workflowValidator.validateStep(step, stepIds)
  }

  validateWorkflowTransition(fromStepId: string, toStepId: string): RegistrationValidationResult {
    return this.workflowValidator.validateTransition(fromStepId, toStepId)
  }

  validateWorkflowArtifact(artifact: WorkflowArtifactInput): RegistrationValidationResult {
    return this.workflowValidator.validateArtifact(artifact)
  }

  validateWorkflowGovernance(workflowId: string, governance: WorkflowGovernanceInput): RegistrationValidationResult {
    return this.workflowValidator.validateGovernance(workflowId, governance)
  }
}
