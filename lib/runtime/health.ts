import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import type { RegistryHealthSummary } from './registries'
import type { MemoryEngineHealth } from './memory'
import type { BusinessBrainHealth } from './businessBrain'
import type { ReasoningPipelineHealth } from './reasoning'
import type { WorkflowEngineHealth } from './workflow'
import type { ProviderRuntimeHealth } from './providerRuntime'
import type { AITeamHealth } from './aiTeam'
import type { PromptConstructionHealth } from './promptConstruction'
import type { ExecutionOrchestratorHealth } from './executionOrchestrator'
import type { ProviderAdapterFrameworkHealth } from './providerAdapter'
import type { ExecutionGatewayFrameworkHealth } from './executionGateway'
import type { KnowledgeAssemblyHealth } from './knowledgeAssembly'
import type { RetrievalStrategyRuntimeHealth } from './retrievalStrategy'
import type { KnowledgeResolutionRuntimeHealth } from './knowledgeResolution'
import type { KnowledgeSelectionRuntimeHealth } from './knowledgeSelection'
import type { KnowledgeQualityRuntimeHealth } from './knowledgeQuality'
import type { KnowledgeReadinessRuntimeHealth } from './knowledgeReadiness'
import type { KnowledgeCertificationRuntimeHealth } from './knowledgeCertification'
import type { ReasoningEngineRuntimeHealth } from './reasoning'
import type { StrategicReasoningRuntimeHealth } from './strategicReasoning'
import type { TacticalPlanningRuntimeHealth } from './tacticalPlanning'
import type { DecisionIntelligenceRuntimeHealth } from './decisionIntelligence'
import type { ActionIntelligenceRuntimeHealth } from './actionIntelligence'
import type { ExecutionReadinessRuntimeHealth } from './executionReadiness'
import type { AutonomousWorkflowRuntimeHealth } from './autonomousWorkflow'
import type { AutonomousTaskRuntimeHealth } from './autonomousTask'
import type { AutonomousAgentRuntimeHealth } from './autonomousAgent'
import type { AutonomousProjectRuntimeHealth } from './autonomousProject'
import type { AutonomousWorkspaceRuntimeHealth } from './autonomousWorkspace'
import type { AutonomousRecoveryRuntimeHealth } from './autonomousRecovery'
import type { DesktopIntegrationRuntimeHealth } from './desktopIntegration'
import type { IDEIntegrationRuntimeHealth } from './ideIntegration'
import type { TerminalIntegrationRuntimeHealth } from './terminalIntegration'
import type { BrowserIntegrationRuntimeHealth } from './browserIntegration'
import type { GitIntegrationRuntimeHealth } from './gitIntegration'
import type { SourceControlRuntimeHealth } from './sourceControl'
import type { RepositoryIntelligenceRuntimeHealth } from './repositoryIntelligence'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

/**
 * Health Check Result - Result of a single health check
 */
export interface HealthCheckResult {
  checkId: string
  name: string
  status: HealthStatus
  message: string
  details?: Metadata
  checkedAt: IsoDateTime
  responseTimeMs: number
}

/**
 * Component Health - Health status of a component
 */
export interface ComponentHealth {
  componentId: string
  name: string
  status: HealthStatus
  checks: HealthCheckResult[]
  lastCheckedAt: IsoDateTime
  uptime: number
}

/**
 * Runtime Health Report - Complete health status of runtime
 */
export interface RuntimeHealthReport {
  reportId: string
  timestamp: IsoDateTime
  overallStatus: HealthStatus
  kernel: ComponentHealth
  services: ComponentHealth[]
  components: ComponentHealth[]
  registries: RegistryHealthSummary[]
  providerRuntime?: ProviderRuntimeHealth
  aiTeam?: AITeamHealth
  promptConstruction?: PromptConstructionHealth
  executionOrchestrator?: ExecutionOrchestratorHealth
  providerAdapterFramework?: ProviderAdapterFrameworkHealth
  executionGateway?: ExecutionGatewayFrameworkHealth
  knowledgeAssembly?: KnowledgeAssemblyHealth
  retrievalStrategyRuntime?: RetrievalStrategyRuntimeHealth
  knowledgeResolutionRuntime?: KnowledgeResolutionRuntimeHealth
  knowledgeSelectionRuntime?: KnowledgeSelectionRuntimeHealth
  knowledgeQualityRuntime?: KnowledgeQualityRuntimeHealth
  knowledgeReadinessRuntime?: KnowledgeReadinessRuntimeHealth
  knowledgeCertificationRuntime?: KnowledgeCertificationRuntimeHealth
  promptDeliveryRuntime?: KnowledgeCertificationRuntimeHealth['promptDeliveryHealth']
  certificationValidationRuntime?: KnowledgeCertificationRuntimeHealth['certificationValidationHealth']
  reasoningEngine?: ReasoningEngineRuntimeHealth
  strategicReasoningRuntime?: StrategicReasoningRuntimeHealth
  strategicPlanningRuntime?: StrategicReasoningRuntimeHealth['strategicPlanningHealth']
  strategicValidationRuntime?: StrategicReasoningRuntimeHealth['strategicValidationHealth']
  tacticalPlanningRuntime?: TacticalPlanningRuntimeHealth
  tacticalPlanRuntime?: TacticalPlanningRuntimeHealth['tacticalPlanHealth']
  tacticalValidationRuntime?: TacticalPlanningRuntimeHealth['tacticalValidationHealth']
  decisionIntelligenceRuntime?: DecisionIntelligenceRuntimeHealth
  decisionPackageRuntime?: DecisionIntelligenceRuntimeHealth['decisionPackageHealth']
  decisionValidationRuntime?: DecisionIntelligenceRuntimeHealth['decisionValidationHealth']
  actionIntelligenceRuntime?: ActionIntelligenceRuntimeHealth
  actionPlanRuntime?: ActionIntelligenceRuntimeHealth['actionPlanHealth']
  actionValidationRuntime?: ActionIntelligenceRuntimeHealth['actionValidationHealth']
  executionReadinessRuntime?: ExecutionReadinessRuntimeHealth
  executionPackageRuntime?: ExecutionReadinessRuntimeHealth['executionPackageHealth']
  executionReadinessValidationRuntime?: ExecutionReadinessRuntimeHealth['executionReadinessValidationHealth']
  autonomousWorkflowRuntime?: AutonomousWorkflowRuntimeHealth
  workflowLifecycleRuntime?: AutonomousWorkflowRuntimeHealth['workflowLifecycleHealth']
  workflowValidationRuntime?: AutonomousWorkflowRuntimeHealth['workflowValidationHealth']
  autonomousTaskRuntime?: AutonomousTaskRuntimeHealth
  taskLifecycleRuntime?: AutonomousTaskRuntimeHealth['taskLifecycleHealth']
  taskValidationRuntime?: AutonomousTaskRuntimeHealth['taskValidationHealth']
  autonomousAgentRuntime?: AutonomousAgentRuntimeHealth
  coordinationRuntime?: AutonomousAgentRuntimeHealth['coordinationHealth']
  agentValidationRuntime?: AutonomousAgentRuntimeHealth['agentValidationHealth']
  autonomousProjectRuntime?: AutonomousProjectRuntimeHealth
  projectCoordinationRuntime?: AutonomousProjectRuntimeHealth['projectCoordinationHealth']
  projectValidationRuntime?: AutonomousProjectRuntimeHealth['projectValidationHealth']
  autonomousWorkspaceRuntime?: AutonomousWorkspaceRuntimeHealth
  workspaceResourceRuntime?: AutonomousWorkspaceRuntimeHealth['workspaceResourceHealth']
  workspaceValidationRuntime?: AutonomousWorkspaceRuntimeHealth['workspaceValidationHealth']
  autonomousRecoveryRuntime?: AutonomousRecoveryRuntimeHealth
  sessionContinuityRuntime?: AutonomousRecoveryRuntimeHealth['sessionContinuityHealth']
  recoveryValidationRuntime?: AutonomousRecoveryRuntimeHealth['recoveryValidationHealth']
  desktopIntegrationRuntime?: DesktopIntegrationRuntimeHealth
  desktopTargetRuntime?: DesktopIntegrationRuntimeHealth['desktopTargetHealth']
  desktopValidationRuntime?: DesktopIntegrationRuntimeHealth['desktopValidationHealth']
  ideIntegrationRuntime?: IDEIntegrationRuntimeHealth
  ideResourceRuntime?: IDEIntegrationRuntimeHealth['ideResourceHealth']
  ideValidationRuntime?: IDEIntegrationRuntimeHealth['ideValidationHealth']
  terminalIntegrationRuntime?: TerminalIntegrationRuntimeHealth
  terminalResourceRuntime?: TerminalIntegrationRuntimeHealth['terminalResourceHealth']
  terminalValidationRuntime?: TerminalIntegrationRuntimeHealth['terminalValidationHealth']
  browserIntegrationRuntime?: BrowserIntegrationRuntimeHealth
  browserResourceRuntime?: BrowserIntegrationRuntimeHealth['browserResourceHealth']
  browserValidationRuntime?: BrowserIntegrationRuntimeHealth['browserValidationHealth']
  gitIntegrationRuntime?: GitIntegrationRuntimeHealth
  repositoryRuntime?: GitIntegrationRuntimeHealth['repositoryHealth']
  gitValidationRuntime?: GitIntegrationRuntimeHealth['gitValidationHealth']
  sourceControlRuntime?: SourceControlRuntimeHealth
  repositoryPlanningRuntime?: SourceControlRuntimeHealth['repositoryPlanningHealth']
  sourceControlValidationRuntime?: SourceControlRuntimeHealth['sourceControlValidationHealth']
  repositoryIntelligenceRuntime?: RepositoryIntelligenceRuntimeHealth
  repositoryAnalysisRuntime?: RepositoryIntelligenceRuntimeHealth['repositoryAnalysisHealth']
  repositoryValidationRuntime?: RepositoryIntelligenceRuntimeHealth['repositoryValidationHealth']
  memory?: MemoryEngineHealth
  businessBrain?: BusinessBrainHealth
  reasoning?: ReasoningPipelineHealth
  workflow?: WorkflowEngineHealth
  uptime: number
  checkDuration: number
}

/**
 * Health Check - Function that performs a health check
 */
export type HealthCheck = () => Promise<HealthCheckResult>

/**
 * Health Framework - Monitors and reports runtime health
 */
export class HealthFramework {
  private checks: Map<string, HealthCheck> = new Map()
  private lastReport: RuntimeHealthReport | null = null

  /**
   * Register a health check
   */
  registerCheck(checkId: string, check: HealthCheck): void {
    this.checks.set(checkId, check)
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(checkId: string): void {
    this.checks.delete(checkId)
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []

    for (const [checkId, check] of this.checks) {
      try {
        const result = await check()
        results.push(result)
      } catch (error) {
        results.push({
          checkId,
          name: checkId,
          status: 'unhealthy',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          checkedAt: new Date().toISOString(),
          responseTimeMs: 0,
        })
      }
    }

    return results
  }

  /**
   * Compute overall health status
   */
  private computeOverallStatus(checks: HealthCheckResult[]): HealthStatus {
    if (checks.some((c) => c.status === 'unhealthy')) return 'unhealthy'
    if (checks.some((c) => c.status === 'degraded')) return 'degraded'
    return 'healthy'
  }

  /**
   * Generate health report
   */
  async generateReport(
    kernelHealth: ComponentHealth,
    serviceHealth: ComponentHealth[],
    componentHealth: ComponentHealth[],
    uptime: number,
    registryHealth: RegistryHealthSummary[] = [],
    providerRuntimeHealth?: ProviderRuntimeHealth,
    aiTeamHealth?: AITeamHealth,
    promptConstructionHealth?: PromptConstructionHealth,
    executionOrchestratorHealth?: ExecutionOrchestratorHealth,
    providerAdapterFrameworkHealth?: ProviderAdapterFrameworkHealth,
    executionGatewayHealth?: ExecutionGatewayFrameworkHealth,
    knowledgeAssemblyHealth?: KnowledgeAssemblyHealth,
    retrievalStrategyRuntimeHealth?: RetrievalStrategyRuntimeHealth,
    knowledgeResolutionRuntimeHealth?: KnowledgeResolutionRuntimeHealth,
    knowledgeSelectionRuntimeHealth?: KnowledgeSelectionRuntimeHealth,
    knowledgeQualityRuntimeHealth?: KnowledgeQualityRuntimeHealth,
    knowledgeReadinessRuntimeHealth?: KnowledgeReadinessRuntimeHealth,
    knowledgeCertificationRuntimeHealth?: KnowledgeCertificationRuntimeHealth,
    reasoningEngineHealth?: ReasoningEngineRuntimeHealth,
    strategicReasoningRuntimeHealth?: StrategicReasoningRuntimeHealth,
    tacticalPlanningRuntimeHealth?: TacticalPlanningRuntimeHealth,
    decisionIntelligenceRuntimeHealth?: DecisionIntelligenceRuntimeHealth,
    actionIntelligenceRuntimeHealth?: ActionIntelligenceRuntimeHealth,
    executionReadinessRuntimeHealth?: ExecutionReadinessRuntimeHealth,
    autonomousWorkflowRuntimeHealth?: AutonomousWorkflowRuntimeHealth,
    autonomousTaskRuntimeHealth?: AutonomousTaskRuntimeHealth,
    autonomousAgentRuntimeHealth?: AutonomousAgentRuntimeHealth,
    autonomousProjectRuntimeHealth?: AutonomousProjectRuntimeHealth,
    memoryHealth?: MemoryEngineHealth,
    businessBrainHealth?: BusinessBrainHealth,
    reasoningHealth?: ReasoningPipelineHealth,
    workflowHealth?: WorkflowEngineHealth,
    autonomousWorkspaceRuntimeHealth?: AutonomousWorkspaceRuntimeHealth,
    autonomousRecoveryRuntimeHealth?: AutonomousRecoveryRuntimeHealth,
    desktopIntegrationRuntimeHealth?: DesktopIntegrationRuntimeHealth,
    ideIntegrationRuntimeHealth?: IDEIntegrationRuntimeHealth,
    terminalIntegrationRuntimeHealth?: TerminalIntegrationRuntimeHealth,
    browserIntegrationRuntimeHealth?: BrowserIntegrationRuntimeHealth,
    gitIntegrationRuntimeHealth?: GitIntegrationRuntimeHealth,
    sourceControlRuntimeHealth?: SourceControlRuntimeHealth,
    repositoryIntelligenceRuntimeHealth?: RepositoryIntelligenceRuntimeHealth
  ): Promise<RuntimeHealthReport> {
    const start = Date.now()
    const checks = await this.runChecks()
    const duration = Date.now() - start

    const report: RuntimeHealthReport = {
      reportId: `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      overallStatus: this.computeOverallStatus([
        ...kernelHealth.checks,
        ...serviceHealth.flatMap((s) => s.checks),
        ...componentHealth.flatMap((c) => c.checks),
        ...checks,
      ]),
      kernel: kernelHealth,
      services: serviceHealth,
      components: componentHealth,
      registries: registryHealth,
      providerRuntime: providerRuntimeHealth,
      aiTeam: aiTeamHealth,
      promptConstruction: promptConstructionHealth,
      executionOrchestrator: executionOrchestratorHealth,
      providerAdapterFramework: providerAdapterFrameworkHealth,
      executionGateway: executionGatewayHealth,
      knowledgeAssembly: knowledgeAssemblyHealth,
      retrievalStrategyRuntime: retrievalStrategyRuntimeHealth,
      knowledgeResolutionRuntime: knowledgeResolutionRuntimeHealth,
      knowledgeSelectionRuntime: knowledgeSelectionRuntimeHealth,
      knowledgeQualityRuntime: knowledgeQualityRuntimeHealth,
      knowledgeReadinessRuntime: knowledgeReadinessRuntimeHealth,
      knowledgeCertificationRuntime: knowledgeCertificationRuntimeHealth,
      promptDeliveryRuntime: knowledgeCertificationRuntimeHealth?.promptDeliveryHealth,
      certificationValidationRuntime: knowledgeCertificationRuntimeHealth?.certificationValidationHealth,
      reasoningEngine: reasoningEngineHealth,
      strategicReasoningRuntime: strategicReasoningRuntimeHealth,
      strategicPlanningRuntime: strategicReasoningRuntimeHealth?.strategicPlanningHealth,
      strategicValidationRuntime: strategicReasoningRuntimeHealth?.strategicValidationHealth,
      tacticalPlanningRuntime: tacticalPlanningRuntimeHealth,
      tacticalPlanRuntime: tacticalPlanningRuntimeHealth?.tacticalPlanHealth,
      tacticalValidationRuntime: tacticalPlanningRuntimeHealth?.tacticalValidationHealth,
      decisionIntelligenceRuntime: decisionIntelligenceRuntimeHealth,
      decisionPackageRuntime: decisionIntelligenceRuntimeHealth?.decisionPackageHealth,
      decisionValidationRuntime: decisionIntelligenceRuntimeHealth?.decisionValidationHealth,
      actionIntelligenceRuntime: actionIntelligenceRuntimeHealth,
      actionPlanRuntime: actionIntelligenceRuntimeHealth?.actionPlanHealth,
      actionValidationRuntime: actionIntelligenceRuntimeHealth?.actionValidationHealth,
      executionReadinessRuntime: executionReadinessRuntimeHealth,
      executionPackageRuntime: executionReadinessRuntimeHealth?.executionPackageHealth,
      executionReadinessValidationRuntime: executionReadinessRuntimeHealth?.executionReadinessValidationHealth,
      autonomousWorkflowRuntime: autonomousWorkflowRuntimeHealth,
      workflowLifecycleRuntime: autonomousWorkflowRuntimeHealth?.workflowLifecycleHealth,
      workflowValidationRuntime: autonomousWorkflowRuntimeHealth?.workflowValidationHealth,
      autonomousTaskRuntime: autonomousTaskRuntimeHealth,
      taskLifecycleRuntime: autonomousTaskRuntimeHealth?.taskLifecycleHealth,
      taskValidationRuntime: autonomousTaskRuntimeHealth?.taskValidationHealth,
      autonomousAgentRuntime: autonomousAgentRuntimeHealth,
      coordinationRuntime: autonomousAgentRuntimeHealth?.coordinationHealth,
      agentValidationRuntime: autonomousAgentRuntimeHealth?.agentValidationHealth,
      autonomousProjectRuntime: autonomousProjectRuntimeHealth,
      projectCoordinationRuntime: autonomousProjectRuntimeHealth?.projectCoordinationHealth,
      projectValidationRuntime: autonomousProjectRuntimeHealth?.projectValidationHealth,
      autonomousWorkspaceRuntime: autonomousWorkspaceRuntimeHealth,
      workspaceResourceRuntime: autonomousWorkspaceRuntimeHealth?.workspaceResourceHealth,
      workspaceValidationRuntime: autonomousWorkspaceRuntimeHealth?.workspaceValidationHealth,
      autonomousRecoveryRuntime: autonomousRecoveryRuntimeHealth,
      sessionContinuityRuntime: autonomousRecoveryRuntimeHealth?.sessionContinuityHealth,
      recoveryValidationRuntime: autonomousRecoveryRuntimeHealth?.recoveryValidationHealth,
      desktopIntegrationRuntime: desktopIntegrationRuntimeHealth,
      desktopTargetRuntime: desktopIntegrationRuntimeHealth?.desktopTargetHealth,
      desktopValidationRuntime: desktopIntegrationRuntimeHealth?.desktopValidationHealth,
      ideIntegrationRuntime: ideIntegrationRuntimeHealth,
      ideResourceRuntime: ideIntegrationRuntimeHealth?.ideResourceHealth,
      ideValidationRuntime: ideIntegrationRuntimeHealth?.ideValidationHealth,
      terminalIntegrationRuntime: terminalIntegrationRuntimeHealth,
      terminalResourceRuntime: terminalIntegrationRuntimeHealth?.terminalResourceHealth,
      terminalValidationRuntime: terminalIntegrationRuntimeHealth?.terminalValidationHealth,
      browserIntegrationRuntime: browserIntegrationRuntimeHealth,
      browserResourceRuntime: browserIntegrationRuntimeHealth?.browserResourceHealth,
      browserValidationRuntime: browserIntegrationRuntimeHealth?.browserValidationHealth,
      gitIntegrationRuntime: gitIntegrationRuntimeHealth,
      repositoryRuntime: gitIntegrationRuntimeHealth?.repositoryHealth,
      gitValidationRuntime: gitIntegrationRuntimeHealth?.gitValidationHealth,
      sourceControlRuntime: sourceControlRuntimeHealth,
      repositoryPlanningRuntime: sourceControlRuntimeHealth?.repositoryPlanningHealth,
      sourceControlValidationRuntime: sourceControlRuntimeHealth?.sourceControlValidationHealth,
      repositoryIntelligenceRuntime: repositoryIntelligenceRuntimeHealth,
      repositoryAnalysisRuntime: repositoryIntelligenceRuntimeHealth?.repositoryAnalysisHealth,
      repositoryValidationRuntime: repositoryIntelligenceRuntimeHealth?.repositoryValidationHealth,
      memory: memoryHealth,
      businessBrain: businessBrainHealth,
      reasoning: reasoningHealth,
      workflow: workflowHealth,
      uptime,
      checkDuration: duration,
    }

    this.lastReport = report
    return report
  }

  /**
   * Get last health report
   */
  getLastReport(): RuntimeHealthReport | null {
    return this.lastReport
  }

  /**
   * Clear all checks
   */
  clear(): void {
    this.checks.clear()
  }
}

/**
 * Standard health checks
 */
export const StandardHealthChecks = {
  /**
   * Check if process is responding
   */
  processCheck: (): HealthCheck => {
    return async () => {
      const start = Date.now()
      const responseTimeMs = Date.now() - start
      return {
        checkId: 'process',
        name: 'Process Health',
        status: 'healthy',
        message: 'Process is responding',
        checkedAt: new Date().toISOString(),
        responseTimeMs,
      }
    }
  },

  /**
   * Check memory usage
   */
  memoryCheck: (thresholdPercent: number = 90): HealthCheck => {
    return async () => {
      const start = Date.now()
      const memUsage = process.memoryUsage()
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
      const responseTimeMs = Date.now() - start

      return {
        checkId: 'memory',
        name: 'Memory Health',
        status: heapUsedPercent > thresholdPercent ? 'unhealthy' : 'healthy',
        message: `Heap usage: ${heapUsedPercent.toFixed(2)}%`,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          heapUsedPercent: heapUsedPercent.toFixed(2),
        },
        checkedAt: new Date().toISOString(),
        responseTimeMs,
      }
    }
  },

  /**
   * Check uptime
   */
  uptimeCheck: (maxUptimeMs?: number): HealthCheck => {
    return async () => {
      const start = Date.now()
      const uptime = process.uptime() * 1000
      const responseTimeMs = Date.now() - start

      return {
        checkId: 'uptime',
        name: 'Uptime Check',
        status: maxUptimeMs && uptime > maxUptimeMs ? 'degraded' : 'healthy',
        message: `Uptime: ${(uptime / 1000 / 60).toFixed(2)} minutes`,
        details: { uptimeMs: uptime },
        checkedAt: new Date().toISOString(),
        responseTimeMs,
      }
    }
  },
}
