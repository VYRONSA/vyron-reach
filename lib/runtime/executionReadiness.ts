import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type ExecutableActionPackageInput,
  type ExecutionApprovalInput,
  type ExecutionReadinessGovernanceInput,
  type ExecutionPackageInput,
  type ExecutionReadinessContextInput,
  type ExecutionReadinessPolicyInput,
  type ExecutionReadinessRegistrationInput,
  type ExecutionReadinessReportInput,
  type ExecutionReadinessSessionInput,
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

export interface ExecutionReadinessMetadata {
  executionReadinessId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionReadinessDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface ExecutionReadinessSession {
  sessionId: string
  executionReadinessId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface ExecutionProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface ExecutionFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface ExecutionReadinessGovernance {
  ownership: ExecutionOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: ExecutionProvenance
  freshness: ExecutionFreshness
}

export interface ExecutionReadinessContext {
  contextId: string
  executionReadinessId: string
  sessionId?: string
  governance: ExecutionReadinessGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export type ExecutionReadinessStatus = 'not-ready' | 'in-review' | 'ready' | 'blocked'
export type ExecutionReadinessDecision = 'pending' | 'approved' | 'rejected' | 'deferred'

export interface ExecutionReadinessCriteria {
  criteriaId: string
  name: string
  required: boolean
  status: 'met' | 'not-met' | 'unknown'
  rationale?: string
  metadata?: Metadata
}

export interface ExecutionReadinessRecommendation {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface ExecutionReadinessEvidence {
  evidenceId: string
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
  notes?: string
  metadata?: Metadata
}

export interface ExecutionReadinessTraceability {
  enabled: boolean
  traceIds: string[]
  references: string[]
  metadata?: Metadata
}

export interface ExecutionReadinessSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface ExecutionReadinessReport {
  reportId: string
  executionReadinessId: string
  actionReferences: {
    actionIntelligenceId?: string
    actionPlanId?: string
    actionItemIds: string[]
  }
  status: ExecutionReadinessStatus
  decision: ExecutionReadinessDecision
  criteria: ExecutionReadinessCriteria[]
  recommendations: ExecutionReadinessRecommendation[]
  evidence: ExecutionReadinessEvidence[]
  traceability: ExecutionReadinessTraceability
  summary: ExecutionReadinessSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ExecutableActionPackage {
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

export interface ExecutableWorkflowPackage {
  workflowId: string
  workflowVersion: string
  workflowState: 'draft' | 'registered' | 'ready'
  metadata?: Metadata
}

export interface ExecutableContextPackage {
  contextId: string
  scope: string[]
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  metadata?: Metadata
}

export interface ExecutableConstraintPackage {
  constraints: Array<{
    constraintId: string
    description: string
    required: boolean
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ExecutableValidationPackage {
  validations: Array<{
    validationId: string
    status: 'passed' | 'failed' | 'warning'
    message: string
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ExecutionApprovalPackage {
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  approverIds: string[]
  approvedAt?: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionAuditPackage {
  auditId: string
  records: Array<{
    recordId: string
    event: string
    createdAt: IsoDateTime
    metadata?: Metadata
  }>
  metadata?: Metadata
}

export interface ExecutionReadyPackage {
  packageId: string
  executionReadinessId: string
  executableActionPackage: ExecutableActionPackage
  executableWorkflowPackage: ExecutableWorkflowPackage
  executableContextPackage: ExecutableContextPackage
  executableConstraintPackage: ExecutableConstraintPackage
  executableValidationPackage: ExecutableValidationPackage
  executionApprovalPackage: ExecutionApprovalPackage
  executionAuditPackage: ExecutionAuditPackage
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ActionCompletionPolicy {
  policyId: string
  requireAllActionsCompleted: boolean
  minimumCompletionRatio?: number
  metadata?: Metadata
}

export interface DependencyCompletionPolicy {
  policyId: string
  requireHardDependenciesCompleted: boolean
  allowSoftDependencyBypass: boolean
  metadata?: Metadata
}

export interface ValidationCompletionPolicy {
  policyId: string
  requireAllCriticalValidationsPassed: boolean
  allowWarnings: boolean
  metadata?: Metadata
}

export interface ApprovalCompletionPolicy {
  policyId: string
  requireApproval: boolean
  minimumApproverCount?: number
  metadata?: Metadata
}

export interface WorkflowReadinessPolicy {
  policyId: string
  requireWorkflowStateReady: boolean
  allowedWorkflowStates: Array<'draft' | 'registered' | 'ready'>
  metadata?: Metadata
}

export interface ExecutionSafetyPolicy {
  policyId: string
  requireSafetyChecksPassed: boolean
  blockedConditions: string[]
  metadata?: Metadata
}

export interface ExecutionReadinessPolicy {
  actionCompletionPolicy: ActionCompletionPolicy
  dependencyCompletionPolicy: DependencyCompletionPolicy
  validationCompletionPolicy: ValidationCompletionPolicy
  approvalCompletionPolicy: ApprovalCompletionPolicy
  workflowReadinessPolicy: WorkflowReadinessPolicy
  executionSafetyPolicy: ExecutionSafetyPolicy
  metadata?: Metadata
}

export interface ExecutionReadinessRegistration extends ExecutionReadinessRegistrationInput {
  metadataModel: ExecutionReadinessMetadata
  registeredAt: IsoDateTime
}

export interface ExecutionReadinessRuntimeHealth {
  executionReadinessHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredExecutionReadinessEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidExecutionReadinessEntries: number
    lastUpdatedAt: IsoDateTime
  }
  executionPackageHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    reportsTracked: number
    readyPackagesTracked: number
    invalidPackages: number
    lastPackagedAt?: IsoDateTime
  }
  executionReadinessValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class ExecutionReadinessRegistry {
  private registrations: Map<string, ExecutionReadinessRegistration> = new Map()
  private sessions: Map<string, ExecutionReadinessSession> = new Map()
  private contexts: Map<string, ExecutionReadinessContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidExecutionReadinessEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ExecutionReadinessRegistrationInput): ExecutionReadinessRegistration {
    const validationResult = this.validation.validateExecutionReadiness(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.executionReadinessId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.executionReadiness('Duplicate execution readiness ID detected', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    if (!validationResult.valid) {
      this.invalidExecutionReadinessEntries += 1
      this.validationRejected += 1
      throw RuntimeError.executionReadiness('Execution readiness registration validation failed', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    const registration: ExecutionReadinessRegistration = {
      ...input,
      metadataModel: {
        executionReadinessId: input.executionReadinessId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.executionReadinessId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: ExecutionReadinessSessionInput): ExecutionReadinessSession {
    if (!this.registrations.has(input.executionReadinessId)) {
      throw RuntimeError.executionReadiness('Execution readiness registration not found', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.executionReadiness('Duplicate execution readiness session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: ExecutionReadinessSession = {
      sessionId: input.sessionId,
      executionReadinessId: input.executionReadinessId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: ExecutionReadinessContextInput): ExecutionReadinessContext {
    if (!this.registrations.has(input.executionReadinessId)) {
      throw RuntimeError.executionReadiness('Execution readiness registration not found for context', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.executionReadiness('Execution readiness session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.executionReadiness('Duplicate execution readiness context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateExecutionReadinessGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidExecutionReadinessEntries += 1
      this.validationRejected += 1
      throw RuntimeError.executionGovernance('Execution governance validation failed', {
        contextId: input.contextId,
        executionReadinessId: input.executionReadinessId,
      })
    }

    const context: ExecutionReadinessContext = {
      contextId: input.contextId,
      executionReadinessId: input.executionReadinessId,
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

  get(executionReadinessId: string): ExecutionReadinessRegistration | undefined {
    return this.registrations.get(executionReadinessId)
  }

  getSession(sessionId: string): ExecutionReadinessSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): ExecutionReadinessContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): ExecutionReadinessRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): ExecutionReadinessSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): ExecutionReadinessContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidExecutionReadinessCount(): number {
    return this.invalidExecutionReadinessEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'execution-readiness-registry',
      'Execution Readiness Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class ExecutionReadinessManager {
  private reports: Map<string, ExecutionReadinessReport> = new Map()
  private readyPackages: Map<string, ExecutionReadyPackage> = new Map()
  private diagnostics: ExecutionReadinessDiagnostics[] = []
  private invalidPackages = 0
  private lastPackagedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: ExecutionReadinessRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerExecutionReadiness(input: ExecutionReadinessRegistrationInput): ExecutionReadinessRegistration {
    return this.registry.register(input)
  }

  startSession(input: ExecutionReadinessSessionInput): ExecutionReadinessSession {
    return this.registry.createSession(input)
  }

  createContext(input: ExecutionReadinessContextInput): ExecutionReadinessContext {
    return this.registry.createContext(input)
  }

  createExecutionReadinessReport(input: ExecutionReadinessReportInput): ExecutionReadinessReport {
    if (!this.registry.get(input.executionReadinessId)) {
      throw RuntimeError.executionReadiness('Execution readiness registration not found for report', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    const reportValidation = this.validation.validateExecutionPackage(input)
    const approvalDiagnostics = this.validation.validateExecutionApproval({
      reportId: input.reportId,
      approvalStatus: input.decision === 'approved' ? 'approved' : input.decision === 'rejected' ? 'rejected' : 'pending',
      approverIds: [],
    }).diagnostics

    const diagnostics = [...reportValidation.diagnostics, ...approvalDiagnostics]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `execution-readiness-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasApprovalErrors = approvalDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (!reportValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.executionPackage('Execution package validation failed', {
        reportId: input.reportId,
        executionReadinessId: input.executionReadinessId,
      })
    }

    if (hasApprovalErrors) {
      this.invalidPackages += 1
      throw RuntimeError.executionApproval('Execution approval validation failed', {
        reportId: input.reportId,
      })
    }

    const report: ExecutionReadinessReport = {
      ...input,
      createdAt: now(),
    }

    this.reports.set(report.reportId, report)
    this.lastPackagedAt = now()
    this.lastUpdatedAt = now()
    return report
  }

  createExecutionReadyPackage(input: ExecutionPackageInput): ExecutionReadyPackage {
    if (!this.registry.get(input.executionReadinessId)) {
      throw RuntimeError.executionReadiness('Execution readiness registration not found for execution package', {
        executionReadinessId: input.executionReadinessId,
      })
    }

    const packageValidation = this.validation.validateExecutionPackage(input)
    const policyValidation = this.validation.validateExecutionReadinessPolicy(input.readinessPolicy)

    if (!packageValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.executionPackage('Execution ready package validation failed', {
        packageId: input.packageId,
      })
    }

    if (!policyValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.executionReadinessPolicy('Execution readiness policy validation failed', {
        packageId: input.packageId,
      })
    }

    const readyPackage: ExecutionReadyPackage = {
      packageId: input.packageId,
      executionReadinessId: input.executionReadinessId,
      executableActionPackage: input.executableActionPackage,
      executableWorkflowPackage: input.executableWorkflowPackage,
      executableContextPackage: input.executableContextPackage,
      executableConstraintPackage: input.executableConstraintPackage,
      executableValidationPackage: input.executableValidationPackage,
      executionApprovalPackage: input.executionApprovalPackage,
      executionAuditPackage: input.executionAuditPackage,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.readyPackages.set(readyPackage.packageId, readyPackage)
    this.lastPackagedAt = now()
    this.lastUpdatedAt = now()
    return readyPackage
  }

  getExecutionReadinessReport(reportId: string): ExecutionReadinessReport | undefined {
    return this.reports.get(reportId)
  }

  listExecutionReadinessReports(): ExecutionReadinessReport[] {
    return Array.from(this.reports.values())
  }

  getExecutionReadyPackage(packageId: string): ExecutionReadyPackage | undefined {
    return this.readyPackages.get(packageId)
  }

  listExecutionReadyPackages(): ExecutionReadyPackage[] {
    return Array.from(this.readyPackages.values())
  }

  getHealth(): ExecutionReadinessRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      executionReadinessHealth: {
        status: this.registry.getInvalidExecutionReadinessCount() > 0 ? 'degraded' : 'healthy',
        registeredExecutionReadinessEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidExecutionReadinessEntries: this.registry.getInvalidExecutionReadinessCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      executionPackageHealth: {
        status: this.invalidPackages > 0 ? 'degraded' : 'healthy',
        reportsTracked: this.reports.size,
        readyPackagesTracked: this.readyPackages.size,
        invalidPackages: this.invalidPackages,
        lastPackagedAt: this.lastPackagedAt,
      },
      executionReadinessValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
