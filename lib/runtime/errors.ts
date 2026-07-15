import type { VaiosError, VaiosErrorCode, VaiosErrorDomain } from '@/lib/ai-framework/errors/taxonomy'
import type { Metadata, Severity } from '@/lib/ai-framework/types/base'

/**
 * Runtime error factory for creating VaiosError instances
 * All runtime errors flow through this factory to ensure consistency
 */
export class RuntimeError implements VaiosError {
  code: VaiosErrorCode
  domain: VaiosErrorDomain
  message: string
  severity: Severity
  retryable: boolean
  details?: Metadata
  cause?: string

  constructor(
    code: VaiosErrorCode,
    domain: VaiosErrorDomain,
    message: string,
    severity: Severity = 'error',
    retryable: boolean = false,
    details?: Metadata,
    cause?: string
  ) {
    this.code = code
    this.domain = domain
    this.message = message
    this.severity = severity
    this.retryable = retryable
    this.details = details
    this.cause = cause
  }

  static config(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static security(message: string, details?: Metadata): RuntimeError {
    return new RuntimeError(
      'VAIOS_SECURITY_FORBIDDEN',
      'security',
      message,
      'critical',
      false,
      details
    )
  }

  static tenantBreach(message: string, tenantId?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_TENANT_ISOLATION_BREACH',
      'security',
      message,
      'critical',
      false,
      tenantId ? { tenantId } : undefined
    )
  }

  static validation(message: string, details?: Metadata): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      true,
      details
    )
  }

  static notFound(message: string, details?: Metadata): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      `Not found: ${message}`,
      'warning',
      false,
      details
    )
  }

  static dependency(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      true,
      details,
      cause
    )
  }

  static incompatible(message: string, details?: Metadata): RuntimeError {
    return new RuntimeError(
      'VAIOS_DOMAIN_PACK_INCOMPATIBLE',
      'domain-pack',
      message,
      'error',
      false,
      details
    )
  }

  static providerRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      true,
      details,
      cause
    )
  }

  static providerInitialization(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      true,
      details,
      cause
    )
  }

  static providerResolution(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'warning',
      true,
      details,
      cause
    )
  }

  static providerConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static providerLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static providerCapability(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static adapterRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static adapterConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static adapterLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static adapterResolution(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static adapterCapability(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static skillRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static registryValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static memoryRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_MEMORY_ACCESS_DENIED',
      'memory',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static memoryValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static memoryLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_MEMORY_ACCESS_DENIED',
      'memory',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static memoryConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static knowledgeRelationship(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static pipelineRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_REASONING_INCOMPLETE',
      'reasoning',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static stageValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static transition(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_REASONING_INCOMPLETE',
      'reasoning',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static artifactValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_WORKFLOW_TRANSITION_INVALID',
      'workflow',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowTransition(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_WORKFLOW_TRANSITION_INVALID',
      'workflow',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static workflowConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_WORKFLOW_TRANSITION_INVALID',
      'workflow',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static autonomousWorkflow(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workflowReadiness(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static autonomousTask(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static taskPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static taskLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static taskGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static taskReadiness(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static autonomousAgent(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static agentAssignment(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static agentLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static agentGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static coordination(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static autonomousProject(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static projectPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static projectLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static projectGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static projectCoordination(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static autonomousWorkspace(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workspaceConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workspaceLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workspaceGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static workspaceResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static autonomousRecovery(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static recoveryPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static recoveryLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static recoveryGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static sessionContinuity(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static desktopIntegration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static desktopConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static desktopLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static desktopGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static integrationTarget(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static ideIntegration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static ideConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static ideLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static ideGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static ideResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static terminalIntegration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static terminalConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static terminalLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static terminalGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static terminalResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static browserIntegration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static browserConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static browserLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static browserGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static browserResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static gitIntegration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static gitRepository(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static gitLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static gitGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static gitResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static sourceControl(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static repositoryPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static sourceControlLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static sourceControlGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static sourceControlResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static repositoryIntelligence(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static repositoryAnalysis(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static repositoryLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static repositoryGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static repositoryResource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static repositoryKnowledgeGraph(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeGraph(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static teamRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static specialistRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static teamAssignment(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static teamCapability(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static teamLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_REASONING_INCOMPLETE',
      'reasoning',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static promptRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static promptValidation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static contextAssembly(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static promptPackaging(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static promptConfiguration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_CONFIG_INVALID',
      'config',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionRegistration(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static executionContext(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static executionStage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static dispatch(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_PROVIDER_UNAVAILABLE',
      'provider',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static routing(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_WORKFLOW_TRANSITION_INVALID',
      'workflow',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static executionRequest(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionResponse(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static executionAudit(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static retrievalPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgePackage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeSource(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static knowledgeAssembly(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static prioritisation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static queryPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static retrievalStrategy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static retrievalPackage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static sourcePlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static strategyGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeResolution(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static contextComposition(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static resolutionPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static contextReference(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static contextGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeSelection(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static evidenceAssembly(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static selectionPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static evidenceReference(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static selectionGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeQuality(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static conflictAnalysis(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static gapAnalysis(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static qualityGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static qualityReport(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static conflictDetection(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static conflictReference(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static knowledgeQualityPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeQualityGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeReadiness(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static readinessReport(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static promptHandoff(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static readinessPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static readinessGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static knowledgeCertification(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static certificationReport(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static promptDelivery(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static certificationPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static certificationGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningEngine(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningStage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static reasoningOutput(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static strategicReasoning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static strategicPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static strategicStage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static strategicGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static strategicRecommendation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static tacticalPlanning(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static tacticalPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static tacticalStage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static tacticalGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static tacticalRecommendation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static decisionIntelligence(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static decisionPackage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static decisionLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static decisionGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static decisionRecommendation(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static actionIntelligence(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static actionPlan(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static actionLifecycle(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static actionGovernance(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static actionReadiness(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  static executionReadiness(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionPackage(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionReadinessPolicy(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'error',
      false,
      details,
      cause
    )
  }

  static executionApproval(message: string, details?: Metadata, cause?: string): RuntimeError {
    return new RuntimeError(
      'VAIOS_VALIDATION_FAILED',
      'validation',
      message,
      'warning',
      false,
      details,
      cause
    )
  }

  toJSON(): VaiosError {
    return {
      code: this.code,
      domain: this.domain,
      message: this.message,
      severity: this.severity,
      retryable: this.retryable,
      details: this.details,
      cause: this.cause,
    }
  }

  toString(): string {
    return `[${this.code}] ${this.message}${this.cause ? ` (caused by: ${this.cause})` : ''}`
  }
}
