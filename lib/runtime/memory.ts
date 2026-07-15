import type {
  ConfidenceScore,
  IsoDateTime,
  Metadata,
  Provenance,
  TenantId,
  VersionString,
} from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type MemoryClassification,
  type MemoryLifecycleState,
  type MemoryRegistrationInput,
  type RegistrationDiagnostic,
} from './validation'

export type MemoryVisibility = 'private' | 'tenant' | 'platform'
export type MemoryAccessScope = 'session' | 'project' | 'domain' | 'tenant' | 'global'
export type MemoryTrustLevel = 'untrusted' | 'provisional' | 'trusted' | 'verified'

export interface MemoryOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
  tenantId: TenantId
}

export interface MemoryRetentionPolicy {
  retainForDays: number
  archiveAfterDays?: number
}

export interface MemoryExpirationPolicy {
  expiresAt?: IsoDateTime
  autoDispose: boolean
}

export interface MemoryFreshness {
  updatedAt: IsoDateTime
  staleAfterMs: number
}

export interface MemoryGovernance {
  ownership: MemoryOwnership
  visibility: MemoryVisibility
  accessScope: MemoryAccessScope
  tenantIsolation: {
    tenantId: TenantId
    isolated: boolean
  }
  trustLevel: MemoryTrustLevel
  confidence: ConfidenceScore
  freshness: MemoryFreshness
  provenance: Provenance
  retentionPolicy: MemoryRetentionPolicy
  expirationPolicy: MemoryExpirationPolicy
}

export interface MemoryCapability {
  capabilityId: string
  name: string
  declared: boolean
  metadata?: Metadata
}

export interface MemorySession {
  sessionId: string
  tenantId: TenantId
  startedAt: IsoDateTime
  lastAccessedAt: IsoDateTime
  state: 'active' | 'suspended' | 'archived'
  metadata?: Metadata
}

export interface MemoryContext {
  memoryId: string
  sessionId?: string
  scope: MemoryAccessScope
  tags: string[]
  metadata?: Metadata
}

export interface MemoryMetadata {
  memoryId: string
  name: string
  classification: MemoryClassification
  version: VersionString
  contractVersion: VersionString
  dependencies: string[]
  capabilities: MemoryCapability[]
  governance: MemoryGovernance
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  session?: MemorySession
  context?: MemoryContext
  metadata?: Metadata
}

export interface MemoryStoreContract {
  memoryId: string
  payload: Metadata
  context?: MemoryContext
}

export interface MemoryStoreResult {
  accepted: boolean
  storedAt: IsoDateTime
  metadata?: Metadata
}

export interface MemoryRetrievalContract {
  memoryId: string
  query: string
  limit?: number
  context?: MemoryContext
}

export interface MemoryRetrievalResult {
  records: Metadata[]
  retrievedAt: IsoDateTime
  metadata?: Metadata
}

export interface MemoryIndexContract {
  memoryId: string
  keys: string[]
  metadata?: Metadata
}

export interface MemoryIndexResult {
  indexed: boolean
  indexedAt: IsoDateTime
  metadata?: Metadata
}

export interface MemoryProvider {
  readonly providerId: string
  readonly name: string
  readonly version: VersionString
  readonly contractVersion: VersionString
  store(contract: MemoryStoreContract): Promise<MemoryStoreResult>
  retrieve(contract: MemoryRetrievalContract): Promise<MemoryRetrievalResult>
  index(contract: MemoryIndexContract): Promise<MemoryIndexResult>
}

export interface MemoryRegistration extends MemoryRegistrationInput {
  metadataModel: MemoryMetadata
  state: MemoryLifecycleState
  registeredAt: IsoDateTime
}

export interface MemoryDraft extends MemoryRegistrationInput {
  metadataModel: MemoryMetadata
  state: 'created'
  createdAt: IsoDateTime
}

export interface MemoryLifecycleEvent {
  memoryId: string
  from: MemoryLifecycleState
  to: MemoryLifecycleState
  transition: MemoryLifecycleTransition
  at: IsoDateTime
}

export type MemoryLifecycleTransition =
  | 'create'
  | 'register'
  | 'load'
  | 'activate'
  | 'suspend'
  | 'archive'
  | 'dispose'

export interface MemoryLifecycleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalTracked: number
  byState: Record<MemoryLifecycleState, number>
  invalidTransitions: number
  lastTransitionAt?: IsoDateTime
}

export interface MemoryValidationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalDiagnostics: number
  errorCount: number
  warningCount: number
  lastValidatedAt?: IsoDateTime
}

export interface MemoryEngineHealth {
  registry: RegistryHealthSummary
  lifecycle: MemoryLifecycleHealth
  validation: MemoryValidationHealth
}

function now(): IsoDateTime {
  return new Date().toISOString()
}

function createMemoryMetadata(input: MemoryRegistrationInput): MemoryMetadata {
  return {
    memoryId: input.memoryId,
    name: input.name,
    classification: input.classification,
    version: input.version,
    contractVersion: input.contractVersion,
    dependencies: input.dependencies,
    capabilities: input.capabilities,
    governance: input.governance,
    createdAt: now(),
    metadata: input.metadata,
  }
}

export class MemoryRegistry {
  private registrations: Map<string, MemoryRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(registration: MemoryRegistration): MemoryRegistration {
    const registrationValidation = this.validation.validateMemoryRegistration(
      registration,
      new Set(this.registrations.keys())
    )
    const metadataValidation = this.validation.validateMemoryMetadata(registration.metadataModel)
    const dependencyValidation = this.validation.validateMemoryDependencies(
      registration.memoryId,
      registration.dependencies,
      new Set(this.registrations.keys())
    )

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...metadataValidation.diagnostics,
      ...dependencyValidation.diagnostics,
    ]
    this.diagnostics.push(...diagnostics)

    const valid = diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
    if (!valid) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.memoryRegistration('Memory registration validation failed', {
        memoryId: registration.memoryId,
      })
    }

    this.registrations.set(registration.memoryId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(memoryId: string): MemoryRegistration | undefined {
    return this.registrations.get(memoryId)
  }

  list(): MemoryRegistration[] {
    return Array.from(this.registrations.values())
  }

  discoverByClassification(classification: MemoryClassification): MemoryRegistration[] {
    return this.list().filter((registration) => registration.classification === classification)
  }

  discoverByOwner(ownerId: string): MemoryRegistration[] {
    return this.list().filter((registration) => registration.governance.ownership.ownerId === ownerId)
  }

  discoverByDependency(memoryId: string): MemoryRegistration[] {
    return this.list().filter((registration) => registration.dependencies.includes(memoryId))
  }

  isRegistered(memoryId: string): boolean {
    return this.registrations.has(memoryId)
  }

  updateState(memoryId: string, state: MemoryLifecycleState): void {
    const registration = this.registrations.get(memoryId)
    if (!registration) {
      throw RuntimeError.notFound(`Memory is not registered: ${memoryId}`)
    }

    registration.state = state
    registration.metadataModel.updatedAt = now()
    this.registrations.set(memoryId, registration)
    this.lastUpdatedAt = now()
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  clear(): void {
    this.registrations.clear()
    this.diagnostics = []
    this.duplicateRejected = 0
    this.validationRejected = 0
    this.lastUpdatedAt = now()
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'memory-registry',
      name: 'Memory Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.registrations.size,
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

export class MemoryLifecycleManager {
  private states: Map<string, MemoryLifecycleState> = new Map()
  private events: MemoryLifecycleEvent[] = []
  private invalidTransitions = 0

  private transitions: Record<MemoryLifecycleState, MemoryLifecycleState[]> = {
    uninitialized: ['created'],
    created: ['registered', 'disposed'],
    registered: ['loaded', 'disposed'],
    loaded: ['active', 'suspended', 'disposed'],
    active: ['suspended', 'archived', 'disposed'],
    suspended: ['active', 'archived', 'disposed'],
    archived: ['disposed'],
    disposed: [],
  }

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  getState(memoryId: string): MemoryLifecycleState {
    return this.states.get(memoryId) ?? 'uninitialized'
  }

  getEvents(): MemoryLifecycleEvent[] {
    return [...this.events]
  }

  transition(memoryId: string, transition: MemoryLifecycleTransition): MemoryLifecycleState {
    const current = this.getState(memoryId)
    const next = this.resolveState(transition)

    const lifecycleValidation = this.validation.validateMemoryLifecycle(memoryId, current, next)
    if (!lifecycleValidation.valid) {
      this.invalidTransitions += 1
      throw RuntimeError.memoryLifecycle('Invalid memory lifecycle transition', {
        memoryId,
        from: current,
        to: next,
      })
    }

    if (!this.transitions[current].includes(next)) {
      this.invalidTransitions += 1
      throw RuntimeError.memoryLifecycle('Memory lifecycle transition is not allowed', {
        memoryId,
        from: current,
        to: next,
      })
    }

    this.states.set(memoryId, next)
    this.events.push({
      memoryId,
      from: current,
      to: next,
      transition,
      at: now(),
    })

    return next
  }

  clear(): void {
    this.states.clear()
    this.events = []
    this.invalidTransitions = 0
  }

  getHealth(): MemoryLifecycleHealth {
    const byState: Record<MemoryLifecycleState, number> = {
      uninitialized: 0,
      created: 0,
      registered: 0,
      loaded: 0,
      active: 0,
      suspended: 0,
      archived: 0,
      disposed: 0,
    }

    for (const state of this.states.values()) {
      byState[state] += 1
    }

    return {
      status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
      totalTracked: this.states.size,
      byState,
      invalidTransitions: this.invalidTransitions,
      lastTransitionAt: this.events[this.events.length - 1]?.at,
    }
  }

  private resolveState(transition: MemoryLifecycleTransition): MemoryLifecycleState {
    if (transition === 'create') return 'created'
    if (transition === 'register') return 'registered'
    if (transition === 'load') return 'loaded'
    if (transition === 'activate') return 'active'
    if (transition === 'suspend') return 'suspended'
    if (transition === 'archive') return 'archived'
    return 'disposed'
  }
}

export class MemoryManager {
  private drafts: Map<string, MemoryDraft> = new Map()

  constructor(
    private registry: MemoryRegistry,
    private lifecycle: MemoryLifecycleManager,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  createMemory(input: MemoryRegistrationInput): MemoryDraft {
    const draft: MemoryDraft = {
      ...input,
      metadataModel: createMemoryMetadata(input),
      state: 'created',
      createdAt: now(),
    }

    this.lifecycle.transition(input.memoryId, 'create')
    this.drafts.set(input.memoryId, draft)
    return draft
  }

  registerMemory(memoryId: string): MemoryRegistration {
    const draft = this.drafts.get(memoryId)
    if (!draft) {
      throw RuntimeError.memoryRegistration(`Memory draft not found: ${memoryId}`)
    }

    const registration: MemoryRegistration = {
      ...draft,
      state: 'registered',
      registeredAt: now(),
    }

    const saved = this.registry.register(registration)
    this.lifecycle.transition(memoryId, 'register')
    this.registry.updateState(memoryId, 'registered')
    return saved
  }

  loadMemory(memoryId: string): void {
    this.assertRegistered(memoryId)
    this.lifecycle.transition(memoryId, 'load')
    this.registry.updateState(memoryId, 'loaded')
  }

  activateMemory(memoryId: string): void {
    this.assertRegistered(memoryId)
    this.lifecycle.transition(memoryId, 'activate')
    this.registry.updateState(memoryId, 'active')
  }

  suspendMemory(memoryId: string): void {
    this.assertRegistered(memoryId)
    this.lifecycle.transition(memoryId, 'suspend')
    this.registry.updateState(memoryId, 'suspended')
  }

  archiveMemory(memoryId: string): void {
    this.assertRegistered(memoryId)
    this.lifecycle.transition(memoryId, 'archive')
    this.registry.updateState(memoryId, 'archived')
  }

  disposeMemory(memoryId: string): void {
    this.assertRegistered(memoryId)
    this.lifecycle.transition(memoryId, 'dispose')
    this.registry.updateState(memoryId, 'disposed')
    this.drafts.delete(memoryId)
  }

  getMemoryRegistry(): MemoryRegistry {
    return this.registry
  }

  getLifecycleManager(): MemoryLifecycleManager {
    return this.lifecycle
  }

  getHealth(): MemoryEngineHealth {
    const registryHealth = this.registry.getHealthSummary()
    const lifecycleHealth = this.lifecycle.getHealth()
    const diagnostics = this.registry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registry: registryHealth,
      lifecycle: lifecycleHealth,
      validation: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
    }
  }

  private assertRegistered(memoryId: string): void {
    if (!this.registry.isRegistered(memoryId)) {
      throw RuntimeError.notFound(`Memory is not registered: ${memoryId}`)
    }
  }
}
