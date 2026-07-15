import type { ConfidenceScore, IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type RegistrationDiagnostic,
  type AITeamAssignmentInput,
  type AITeamGovernanceInput,
  type AITeamRegistrationInput,
  type AISpecialistRegistrationInput,
  type AISpecialistRole,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export interface AISpecialist {
  specialistId: string
  name: string
  role: AISpecialistRole
  capabilities: string[]
  responsibilities: string[]
  metadata?: Metadata
  registeredAt: IsoDateTime
}

export interface AITeamGovernance {
  ownership: {
    ownerType: 'system' | 'team' | 'user'
    ownerId: string
  }
  responsibilities: string[]
  confidence: ConfidenceScore
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
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

export interface AITeamMetadata {
  teamId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  specialistIds: string[]
  capabilities: string[]
  responsibilities: string[]
  governance: AITeamGovernance
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface AITeamContext {
  contextId: string
  teamId: string
  sessionId: string
  activeWorkItemId?: string
  metadata: Metadata
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface AITeamSession {
  sessionId: string
  teamId: string
  contextId: string
  status: 'created' | 'active' | 'suspended' | 'closed'
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface AITeamDiagnostic {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  entityId?: string
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface AITeamRegistration extends AITeamRegistrationInput {
  metadataModel: AITeamMetadata
  registeredAt: IsoDateTime
}

export interface TeamWorkItem {
  workItemId: string
  title: string
  description: string
  ownerSpecialistId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  status: 'proposed' | 'assigned' | 'in-progress' | 'review' | 'blocked' | 'completed' | 'cancelled'
  reviewChain: string[]
  approvalChain: string[]
  metadata?: Metadata
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface TeamAssignment {
  assignmentId: string
  teamId: string
  workItem: TeamWorkItem
  assignedTo: string
  assignedBy: string
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ResponsibilityMapping {
  teamId: string
  responsibilities: Array<{
    responsibility: string
    specialistIds: string[]
  }>
}

export interface RoleAssignment {
  teamId: string
  assignments: Array<{
    specialistId: string
    role: AISpecialistRole
  }>
}

export interface TeamComposition {
  teamId: string
  name: string
  specialists: AISpecialist[]
  capabilities: string[]
  responsibilities: string[]
}

export interface AITeamHealth {
  aiTeamHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    teamCount: number
    activeSessionCount: number
    lastUpdatedAt: IsoDateTime
  }
  specialistRegistryHealth: RegistryHealthSummary
  assignmentHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalAssignments: number
    blockedAssignments: number
    overdueAssignments: number
    lastUpdatedAt: IsoDateTime
  }
  teamValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
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

export class AISpecialistRegistry {
  private specialists: Map<string, AISpecialist> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AISpecialistRegistrationInput): AISpecialist {
    const validation = this.validation.validateAISpecialistRegistration(input, new Set(this.specialists.keys()))
    this.diagnostics.push(...validation.diagnostics)
    if (!validation.valid) {
      if (validation.diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.specialistRegistration('AI specialist registration validation failed', {
        specialistId: input.specialistId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const specialist: AISpecialist = {
      specialistId: input.specialistId,
      name: input.name,
      role: input.role,
      capabilities: input.capabilities,
      responsibilities: input.responsibilities,
      metadata: input.metadata,
      registeredAt: now(),
    }

    this.specialists.set(specialist.specialistId, specialist)
    this.lastUpdatedAt = now()
    return specialist
  }

  get(specialistId: string): AISpecialist | undefined {
    return this.specialists.get(specialistId)
  }

  list(): AISpecialist[] {
    return Array.from(this.specialists.values())
  }

  findByRole(role: AISpecialistRole): AISpecialist[] {
    return this.list().filter((specialist) => specialist.role === role)
  }

  findByCapability(capability: string): AISpecialist[] {
    return this.list().filter((specialist) => specialist.capabilities.includes(capability))
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'ai-specialist-registry',
      'AI Specialist Registry',
      this.specialists.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class AITeamRegistry {
  private teams: Map<string, AITeamRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: AITeamRegistrationInput): AITeamRegistration {
    const registrationValidation = this.validation.validateAITeamRegistration(input, new Set(this.teams.keys()))
    const governanceValidation = this.validation.validateAITeamGovernance(input.teamId, input.governance)
    const capabilityValidation = this.validation.validateAITeamCapabilities(input.teamId, input.capabilities)

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...governanceValidation.diagnostics,
      ...capabilityValidation.diagnostics,
    ]

    this.diagnostics.push(...diagnostics)
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.teamRegistration('AI team registration validation failed', {
        teamId: input.teamId,
        diagnosticsCount: diagnostics.length,
      })
    }

    const registration: AITeamRegistration = {
      ...input,
      metadataModel: {
        teamId: input.teamId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        specialistIds: input.specialistIds,
        capabilities: input.capabilities,
        responsibilities: input.responsibilities,
        governance: input.governance,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.teams.set(registration.teamId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(teamId: string): AITeamRegistration | undefined {
    return this.teams.get(teamId)
  }

  list(): AITeamRegistration[] {
    return Array.from(this.teams.values())
  }

  findByCapability(capability: string): AITeamRegistration[] {
    return this.list().filter((team) => team.capabilities.includes(capability))
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'ai-team-registry',
      'AI Team Registry',
      this.teams.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class AITeamManager {
  private sessions: Map<string, AITeamSession> = new Map()
  private contexts: Map<string, AITeamContext> = new Map()
  private assignments: Map<string, TeamAssignment> = new Map()
  private diagnostics: AITeamDiagnostic[] = []
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private teamRegistry: AITeamRegistry,
    private specialistRegistry: AISpecialistRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerTeam(input: AITeamRegistrationInput): AITeamRegistration {
    const team = this.teamRegistry.register(input)
    this.recordDiagnostic('TEAM_REGISTERED', `AI team registered: ${team.teamId}`, 'info', team.teamId)
    this.lastUpdatedAt = now()
    return team
  }

  registerSpecialist(input: AISpecialistRegistrationInput): AISpecialist {
    const specialist = this.specialistRegistry.register(input)
    this.recordDiagnostic('SPECIALIST_REGISTERED', `AI specialist registered: ${specialist.specialistId}`, 'info', specialist.specialistId)
    this.lastUpdatedAt = now()
    return specialist
  }

  createSession(teamId: string, metadata: Metadata = {}): AITeamSession {
    const team = this.teamRegistry.get(teamId)
    if (!team) {
      throw RuntimeError.teamLifecycle('Cannot create session for unregistered AI team', {
        teamId,
      })
    }

    const context: AITeamContext = {
      contextId: `ai-team-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teamId,
      sessionId: `ai-team-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      metadata,
      createdAt: now(),
    }

    const session: AITeamSession = {
      sessionId: context.sessionId,
      teamId,
      contextId: context.contextId,
      status: 'created',
      createdAt: now(),
    }

    this.contexts.set(context.contextId, context)
    this.sessions.set(session.sessionId, session)
    this.lastUpdatedAt = now()
    return session
  }

  assignWork(input: AITeamAssignmentInput): TeamAssignment {
    const validation = this.validation.validateAITeamAssignment(input)
    if (!validation.valid) {
      throw RuntimeError.teamAssignment('AI team assignment validation failed', {
        assignmentId: input.assignmentId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const team = this.teamRegistry.get(input.teamId)
    if (!team) {
      throw RuntimeError.teamAssignment('Assignment team not found', {
        teamId: input.teamId,
      })
    }

    const specialist = this.specialistRegistry.get(input.assignedTo)
    if (!specialist) {
      throw RuntimeError.teamAssignment('Assignment specialist not found', {
        specialistId: input.assignedTo,
      })
    }

    const assignment: TeamAssignment = {
      assignmentId: input.assignmentId,
      teamId: input.teamId,
      assignedTo: input.assignedTo,
      assignedBy: input.assignedBy,
      workItem: {
        workItemId: input.workItemId,
        title: input.title,
        description: input.description,
        ownerSpecialistId: input.ownerSpecialistId,
        priority: input.priority,
        dependencies: input.dependencies,
        status: input.status,
        reviewChain: input.reviewChain,
        approvalChain: input.approvalChain,
        metadata: input.metadata,
        createdAt: now(),
      },
      createdAt: now(),
      metadata: input.metadata,
    }

    this.assignments.set(assignment.assignmentId, assignment)
    this.recordDiagnostic(
      'ASSIGNMENT_CREATED',
      `Work assignment created for team ${team.teamId} and specialist ${specialist.specialistId}`,
      'info',
      assignment.assignmentId
    )
    this.lastUpdatedAt = now()
    return assignment
  }

  discoverTeams(): AITeamRegistration[] {
    return this.teamRegistry.list()
  }

  discoverSpecialists(): AISpecialist[] {
    return this.specialistRegistry.list()
  }

  lookupCapability(capability: string): {
    teams: AITeamRegistration[]
    specialists: AISpecialist[]
  } {
    return {
      teams: this.teamRegistry.findByCapability(capability),
      specialists: this.specialistRegistry.findByCapability(capability),
    }
  }

  mapResponsibilities(teamId: string): ResponsibilityMapping {
    const team = this.teamRegistry.get(teamId)
    if (!team) {
      throw RuntimeError.teamCapability('Team not found for responsibility mapping', {
        teamId,
      })
    }

    return {
      teamId,
      responsibilities: team.responsibilities.map((responsibility) => ({
        responsibility,
        specialistIds: team.specialistIds.filter((specialistId) => {
          const specialist = this.specialistRegistry.get(specialistId)
          return specialist?.responsibilities.includes(responsibility) ?? false
        }),
      })),
    }
  }

  getRoleAssignment(teamId: string): RoleAssignment {
    const team = this.teamRegistry.get(teamId)
    if (!team) {
      throw RuntimeError.teamCapability('Team not found for role assignment', {
        teamId,
      })
    }

    return {
      teamId,
      assignments: team.specialistIds
        .map((specialistId) => this.specialistRegistry.get(specialistId))
        .filter((specialist): specialist is AISpecialist => !!specialist)
        .map((specialist) => ({
          specialistId: specialist.specialistId,
          role: specialist.role,
        })),
    }
  }

  composeTeam(teamId: string): TeamComposition {
    const team = this.teamRegistry.get(teamId)
    if (!team) {
      throw RuntimeError.teamLifecycle('Team not found for composition', {
        teamId,
      })
    }

    const specialists = team.specialistIds
      .map((specialistId) => this.specialistRegistry.get(specialistId))
      .filter((specialist): specialist is AISpecialist => !!specialist)

    return {
      teamId: team.teamId,
      name: team.name,
      specialists,
      capabilities: team.capabilities,
      responsibilities: team.responsibilities,
    }
  }

  getDiagnostics(): AITeamDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealth(): AITeamHealth {
    const diagnostics = [
      ...this.teamRegistry.getDiagnostics(),
      ...this.specialistRegistry.getDiagnostics(),
    ]

    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
    const blockedAssignments = Array.from(this.assignments.values()).filter(
      (assignment) => assignment.workItem.status === 'blocked'
    ).length

    return {
      aiTeamHealth: {
        status: this.teamRegistry.list().length > 0 ? 'healthy' : 'degraded',
        teamCount: this.teamRegistry.list().length,
        activeSessionCount: Array.from(this.sessions.values()).filter((session) => session.status === 'active').length,
        lastUpdatedAt: this.lastUpdatedAt,
      },
      specialistRegistryHealth: this.specialistRegistry.getHealthSummary(),
      assignmentHealth: {
        status: blockedAssignments > 0 ? 'degraded' : 'healthy',
        totalAssignments: this.assignments.size,
        blockedAssignments,
        overdueAssignments: 0,
        lastUpdatedAt: this.lastUpdatedAt,
      },
      teamValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
    }
  }

  private recordDiagnostic(
    code: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    entityId?: string
  ): void {
    this.diagnostics.push({
      diagnosticId: `ai-team-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      message,
      severity,
      entityId,
      createdAt: now(),
    })
  }
}
