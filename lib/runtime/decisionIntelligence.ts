import type { IsoDateTime, Metadata, Severity, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type DecisionGovernanceInput,
  type DecisionIntelligenceContextInput,
  type DecisionIntelligenceRegistrationInput,
  type DecisionIntelligenceSessionInput,
  type DecisionLifecycleStage,
  type DecisionPackageInput,
  type DecisionRecommendationInput,
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

export interface DecisionIntelligenceMetadata {
  decisionIntelligenceId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DecisionIntelligenceDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: Severity
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface DecisionIntelligenceSession {
  sessionId: string
  decisionIntelligenceId: string
  status: 'created' | 'active' | 'completed' | 'failed' | 'cancelled'
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DecisionOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface DecisionProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
}

export interface DecisionFreshness {
  capturedAt: IsoDateTime
  lastVerifiedAt?: IsoDateTime
  maxAgeMs?: number
}

export interface DecisionGovernance {
  ownership: DecisionOwnership
  confidence: number
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  provenance: DecisionProvenance
  freshness: DecisionFreshness
}

export interface DecisionIntelligenceContext {
  contextId: string
  decisionIntelligenceId: string
  sessionId?: string
  governance: DecisionGovernance
  scope: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface DecisionCandidate {
  candidateId: string
  title: string
  description: string
  confidence: number
  metadata?: Metadata
}

export interface DecisionOption {
  optionId: string
  title: string
  description: string
  status: 'considered' | 'recommended' | 'deferred' | 'rejected'
  confidence: number
  metadata?: Metadata
}

export interface DecisionConstraint {
  constraintId: string
  description: string
  required: boolean
  metadata?: Metadata
}

export interface DecisionRisk {
  riskId: string
  title: string
  description: string
  likelihood: number
  impact: number
  mitigation?: string
  metadata?: Metadata
}

export interface DecisionTradeoff {
  tradeoffId: string
  title: string
  description: string
  comparedOptions: string[]
  rationale: string
  metadata?: Metadata
}

export interface DecisionImpact {
  impactId: string
  area: string
  description: string
  magnitude: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface DecisionRecommendation {
  recommendationId: string
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  metadata?: Metadata
}

export interface DecisionOutcome {
  outcomeId: string
  statement: string
  status: 'accepted' | 'rejected' | 'pending'
  metadata?: Metadata
}

export interface DecisionSummary {
  synopsis: string
  highlights: string[]
  risks: string[]
  nextActions: string[]
}

export interface DecisionLifecycleState {
  stage: DecisionLifecycleStage
  status: 'pending' | 'active' | 'completed' | 'blocked'
  enteredAt?: IsoDateTime
  exitedAt?: IsoDateTime
  metadata?: Metadata
}

export interface DecisionPackage {
  packageId: string
  decisionIntelligenceId: string
  tacticalReferences: {
    tacticalPlanningId?: string
    tacticalPlanId?: string
    tacticalRecommendationIds: string[]
  }
  candidates: DecisionCandidate[]
  options: DecisionOption[]
  constraints: DecisionConstraint[]
  risks: DecisionRisk[]
  tradeoffs: DecisionTradeoff[]
  impacts: DecisionImpact[]
  recommendations: DecisionRecommendation[]
  outcomes: DecisionOutcome[]
  lifecycleStates: DecisionLifecycleState[]
  summary: DecisionSummary
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface DecisionIntelligenceRegistration extends DecisionIntelligenceRegistrationInput {
  metadataModel: DecisionIntelligenceMetadata
  registeredAt: IsoDateTime
}

export interface DecisionIntelligenceRuntimeHealth {
  decisionIntelligenceHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredDecisionIntelligenceEntries: number
    sessionsTracked: number
    contextsTracked: number
    invalidDecisionIntelligenceEntries: number
    lastUpdatedAt: IsoDateTime
  }
  decisionPackageHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    packagesTracked: number
    recommendationsTracked: number
    invalidPackages: number
    lastPackagedAt?: IsoDateTime
  }
  decisionValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
}

export class DecisionIntelligenceRegistry {
  private registrations: Map<string, DecisionIntelligenceRegistration> = new Map()
  private sessions: Map<string, DecisionIntelligenceSession> = new Map()
  private contexts: Map<string, DecisionIntelligenceContext> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private invalidDecisionIntelligenceEntries = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: DecisionIntelligenceRegistrationInput): DecisionIntelligenceRegistration {
    const validationResult = this.validation.validateDecisionIntelligence(input)
    this.diagnostics.push(...validationResult.diagnostics)

    if (this.registrations.has(input.decisionIntelligenceId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.decisionIntelligence('Duplicate decision intelligence ID detected', {
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    if (!validationResult.valid) {
      this.invalidDecisionIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.decisionIntelligence('Decision intelligence registration validation failed', {
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    const registration: DecisionIntelligenceRegistration = {
      ...input,
      metadataModel: {
        decisionIntelligenceId: input.decisionIntelligenceId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.registrations.set(input.decisionIntelligenceId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  createSession(input: DecisionIntelligenceSessionInput): DecisionIntelligenceSession {
    if (!this.registrations.has(input.decisionIntelligenceId)) {
      throw RuntimeError.decisionIntelligence('Decision intelligence registration not found', {
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    if (this.sessions.has(input.sessionId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.decisionIntelligence('Duplicate decision intelligence session ID detected', {
        sessionId: input.sessionId,
      })
    }

    const session: DecisionIntelligenceSession = {
      sessionId: input.sessionId,
      decisionIntelligenceId: input.decisionIntelligenceId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      metadata: input.metadata,
    }

    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  createContext(input: DecisionIntelligenceContextInput): DecisionIntelligenceContext {
    if (!this.registrations.has(input.decisionIntelligenceId)) {
      throw RuntimeError.decisionIntelligence('Decision intelligence registration not found for context', {
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    if (input.sessionId && !this.sessions.has(input.sessionId)) {
      throw RuntimeError.decisionIntelligence('Decision intelligence session not found for context', {
        sessionId: input.sessionId,
      })
    }

    if (this.contexts.has(input.contextId)) {
      this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.decisionIntelligence('Duplicate decision intelligence context ID detected', {
        contextId: input.contextId,
      })
    }

    const governanceValidation = this.validation.validateDecisionGovernance(input.governance)
    this.diagnostics.push(...governanceValidation.diagnostics)

    if (!governanceValidation.valid) {
      this.invalidDecisionIntelligenceEntries += 1
      this.validationRejected += 1
      throw RuntimeError.decisionGovernance('Decision governance validation failed', {
        contextId: input.contextId,
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    const context: DecisionIntelligenceContext = {
      contextId: input.contextId,
      decisionIntelligenceId: input.decisionIntelligenceId,
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

  get(decisionIntelligenceId: string): DecisionIntelligenceRegistration | undefined {
    return this.registrations.get(decisionIntelligenceId)
  }

  getSession(sessionId: string): DecisionIntelligenceSession | undefined {
    return this.sessions.get(sessionId)
  }

  getContext(contextId: string): DecisionIntelligenceContext | undefined {
    return this.contexts.get(contextId)
  }

  list(): DecisionIntelligenceRegistration[] {
    return Array.from(this.registrations.values())
  }

  listSessions(): DecisionIntelligenceSession[] {
    return Array.from(this.sessions.values())
  }

  listContexts(): DecisionIntelligenceContext[] {
    return Array.from(this.contexts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getInvalidDecisionIntelligenceCount(): number {
    return this.invalidDecisionIntelligenceEntries
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'decision-intelligence-registry',
      'Decision Intelligence Registry',
      this.registrations.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class DecisionIntelligenceManager {
  private packages: Map<string, DecisionPackage> = new Map()
  private diagnostics: DecisionIntelligenceDiagnostics[] = []
  private invalidPackages = 0
  private lastPackagedAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: DecisionIntelligenceRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerDecisionIntelligence(input: DecisionIntelligenceRegistrationInput): DecisionIntelligenceRegistration {
    return this.registry.register(input)
  }

  startSession(input: DecisionIntelligenceSessionInput): DecisionIntelligenceSession {
    return this.registry.createSession(input)
  }

  createContext(input: DecisionIntelligenceContextInput): DecisionIntelligenceContext {
    return this.registry.createContext(input)
  }

  createDecisionPackage(input: DecisionPackageInput): DecisionPackage {
    if (!this.registry.get(input.decisionIntelligenceId)) {
      throw RuntimeError.decisionIntelligence('Decision intelligence registration not found for decision package', {
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    const packageValidation = this.validation.validateDecisionPackage(input)
    const lifecycleDiagnostics = input.lifecycleStates.flatMap((state) =>
      this.validation.validateDecisionLifecycle(state.stage).diagnostics
    )
    const recommendationDiagnostics = input.recommendations.flatMap((recommendation) =>
      this.validation.validateDecisionRecommendation(recommendation).diagnostics
    )

    const diagnostics = [
      ...packageValidation.diagnostics,
      ...lifecycleDiagnostics,
      ...recommendationDiagnostics,
    ]

    this.diagnostics.push(
      ...diagnostics.map((diagnostic) => ({
        diagnosticId: `decision-intelligence-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        createdAt: diagnostic.createdAt,
        entityId: diagnostic.entityId,
        metadata: diagnostic.details,
      }))
    )

    const hasLifecycleErrors = lifecycleDiagnostics.some((diagnostic) => diagnostic.severity === 'error')
    const hasRecommendationErrors = recommendationDiagnostics.some((diagnostic) => diagnostic.severity === 'error')

    if (hasLifecycleErrors) {
      this.invalidPackages += 1
      throw RuntimeError.decisionLifecycle('Decision lifecycle validation failed', {
        packageId: input.packageId,
      })
    }

    if (!packageValidation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.decisionPackage('Decision package validation failed', {
        packageId: input.packageId,
        decisionIntelligenceId: input.decisionIntelligenceId,
      })
    }

    if (hasRecommendationErrors) {
      this.invalidPackages += 1
      throw RuntimeError.decisionRecommendation('Decision recommendation validation failed', {
        packageId: input.packageId,
      })
    }

    const decisionPackage: DecisionPackage = {
      ...input,
      createdAt: now(),
    }

    this.packages.set(decisionPackage.packageId, decisionPackage)
    this.lastPackagedAt = now()
    this.lastUpdatedAt = now()
    return decisionPackage
  }

  getDecisionPackage(packageId: string): DecisionPackage | undefined {
    return this.packages.get(packageId)
  }

  listDecisionPackages(): DecisionPackage[] {
    return Array.from(this.packages.values())
  }

  getHealth(): DecisionIntelligenceRuntimeHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const managerDiagnostics = this.diagnostics
    const allDiagnostics = [...registryDiagnostics, ...managerDiagnostics]
    const errorCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = allDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    const recommendationsTracked = this.listDecisionPackages().reduce((count, decisionPackage) => {
      return count + decisionPackage.recommendations.length
    }, 0)

    return {
      decisionIntelligenceHealth: {
        status: this.registry.getInvalidDecisionIntelligenceCount() > 0 ? 'degraded' : 'healthy',
        registeredDecisionIntelligenceEntries: this.registry.list().length,
        sessionsTracked: this.registry.listSessions().length,
        contextsTracked: this.registry.listContexts().length,
        invalidDecisionIntelligenceEntries: this.registry.getInvalidDecisionIntelligenceCount(),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      decisionPackageHealth: {
        status: this.invalidPackages > 0 ? 'degraded' : 'healthy',
        packagesTracked: this.packages.size,
        recommendationsTracked,
        invalidPackages: this.invalidPackages,
        lastPackagedAt: this.lastPackagedAt,
      },
      decisionValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: allDiagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: allDiagnostics[allDiagnostics.length - 1]?.createdAt,
      },
    }
  }
}
