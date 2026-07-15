import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type {
  ChatProviderRequest,
  ChatProviderResponse,
  EmbeddingProviderRequest,
  EmbeddingProviderResponse,
  ImageProviderRequest,
  ImageProviderResponse,
  ModerationProviderRequest,
  ModerationProviderResponse,
  SpeechProviderRequest,
  SpeechProviderResponse,
} from './providers'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type AdapterLifecycleState,
  type ProviderAdapterCapabilityInput,
  type ProviderAdapterConfigurationInput,
  type ProviderAdapterRegistrationInput,
  type RegistrationDiagnostic,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export type ProviderAdapterType = 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'

export interface ProviderAdapterMetadata {
  adapterId: string
  providerId: string
  name: string
  type: ProviderAdapterType
  version: string
  contractVersion: string
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

export interface ProviderAdapterDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  adapterId?: string
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ProviderAdapterRegistration extends ProviderAdapterRegistrationInput {
  registeredAt: IsoDateTime
}

export interface ProviderAdapterConfiguration extends ProviderAdapterConfigurationInput {
  configuredAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface ProviderAdapterRuntimeDescriptor {
  adapterId: string
  providerId: string
  type: ProviderAdapterType
  version: string
  lifecycle: AdapterLifecycleState
  configured: boolean
  initialized: boolean
  active: boolean
}

export interface ProviderAdapterRegistryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  summary: RegistryHealthSummary
}

export interface ProviderAdapterConfigurationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  configuredCount: number
  missingConfigurationCount: number
  lastUpdatedAt: IsoDateTime
}

export interface ProviderAdapterLifecycleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  byState: Record<AdapterLifecycleState, number>
  invalidTransitions: number
  lastTransitionAt?: IsoDateTime
}

export interface ProviderAdapterValidationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalDiagnostics: number
  errorCount: number
  warningCount: number
}

export interface ProviderAdapterFrameworkHealth {
  adapterRegistryHealth: ProviderAdapterRegistryHealth
  adapterConfigurationHealth: ProviderAdapterConfigurationHealth
  adapterLifecycleHealth: ProviderAdapterLifecycleHealth
  adapterValidationHealth: ProviderAdapterValidationHealth
}

export interface ChatProviderAdapter {
  readonly metadata: ProviderAdapterMetadata
  execute(request: ChatProviderRequest): Promise<ChatProviderResponse>
}

export interface EmbeddingProviderAdapter {
  readonly metadata: ProviderAdapterMetadata
  execute(request: EmbeddingProviderRequest): Promise<EmbeddingProviderResponse>
}

export interface ImageProviderAdapter {
  readonly metadata: ProviderAdapterMetadata
  execute(request: ImageProviderRequest): Promise<ImageProviderResponse>
}

export interface SpeechProviderAdapter {
  readonly metadata: ProviderAdapterMetadata
  execute(request: SpeechProviderRequest): Promise<SpeechProviderResponse>
}

export interface ModerationProviderAdapter {
  readonly metadata: ProviderAdapterMetadata
  execute(request: ModerationProviderRequest): Promise<ModerationProviderResponse>
}

export type ProviderAdapterContract =
  | ChatProviderAdapter
  | EmbeddingProviderAdapter
  | ImageProviderAdapter
  | SpeechProviderAdapter
  | ModerationProviderAdapter

class PlaceholderChatAdapter implements ChatProviderAdapter {
  readonly metadata: ProviderAdapterMetadata

  constructor(metadata: ProviderAdapterMetadata) {
    this.metadata = metadata
  }

  async execute(request: ChatProviderRequest): Promise<ChatProviderResponse> {
    const lastMessage = request.messages[request.messages.length - 1]
    return {
      message: `placeholder-adapter-chat:${lastMessage?.content ?? 'empty-message'}`,
      metadata: {
        mode: 'placeholder-adapter',
        adapterId: this.metadata.adapterId,
      },
    }
  }
}

class PlaceholderEmbeddingAdapter implements EmbeddingProviderAdapter {
  readonly metadata: ProviderAdapterMetadata

  constructor(metadata: ProviderAdapterMetadata) {
    this.metadata = metadata
  }

  async execute(request: EmbeddingProviderRequest): Promise<EmbeddingProviderResponse> {
    return {
      vectors: request.input.map((item) => [item.length, 1, 0]),
      metadata: {
        mode: 'placeholder-adapter',
        adapterId: this.metadata.adapterId,
      },
    }
  }
}

class PlaceholderImageAdapter implements ImageProviderAdapter {
  readonly metadata: ProviderAdapterMetadata

  constructor(metadata: ProviderAdapterMetadata) {
    this.metadata = metadata
  }

  async execute(request: ImageProviderRequest): Promise<ImageProviderResponse> {
    return {
      images: [{ mimeType: 'text/plain', data: `placeholder-adapter-image:${request.prompt}` }],
      metadata: {
        mode: 'placeholder-adapter',
        adapterId: this.metadata.adapterId,
      },
    }
  }
}

class PlaceholderSpeechAdapter implements SpeechProviderAdapter {
  readonly metadata: ProviderAdapterMetadata

  constructor(metadata: ProviderAdapterMetadata) {
    this.metadata = metadata
  }

  async execute(request: SpeechProviderRequest): Promise<SpeechProviderResponse> {
    return {
      output: `placeholder-adapter-speech:${request.mode}:${request.input}`,
      metadata: {
        mode: 'placeholder-adapter',
        adapterId: this.metadata.adapterId,
      },
    }
  }
}

class PlaceholderModerationAdapter implements ModerationProviderAdapter {
  readonly metadata: ProviderAdapterMetadata

  constructor(metadata: ProviderAdapterMetadata) {
    this.metadata = metadata
  }

  async execute(request: ModerationProviderRequest): Promise<ModerationProviderResponse> {
    return {
      flagged: false,
      categories: [],
      metadata: {
        mode: 'placeholder-adapter',
        adapterId: this.metadata.adapterId,
        inspectedLength: request.input.length,
      },
    }
  }
}

function parseVersion(version: string): number[] {
  return version
    .split('.')
    .map((value) => Number.parseInt(value, 10))
    .map((value) => (Number.isNaN(value) ? 0 : value))
}

function isVersionAtLeast(version: string, minimum: string): boolean {
  const left = parseVersion(version)
  const right = parseVersion(minimum)
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0
    const b = right[index] ?? 0
    if (a > b) return true
    if (a < b) return false
  }

  return true
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

export class ProviderAdapterFactory {
  create(registration: ProviderAdapterRegistration): ProviderAdapterContract {
    const metadata: ProviderAdapterMetadata = {
      adapterId: registration.adapterId,
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: registration.version,
      contractVersion: registration.contractVersion,
      supportedModels: registration.supportedModels,
      capabilityMatrix: registration.capabilities,
      timeoutPolicy: registration.timeoutPolicy,
      retryPolicy: registration.retryPolicy,
      costMetadata: registration.costMetadata,
      availabilityMetadata: registration.availabilityMetadata,
      metadata: registration.metadata,
    }

    switch (registration.type) {
      case 'chat':
        return new PlaceholderChatAdapter(metadata)
      case 'embedding':
        return new PlaceholderEmbeddingAdapter(metadata)
      case 'image':
        return new PlaceholderImageAdapter(metadata)
      case 'speech':
        return new PlaceholderSpeechAdapter(metadata)
      case 'moderation':
        return new PlaceholderModerationAdapter(metadata)
      default:
        throw RuntimeError.adapterCapability('Unsupported adapter type for adapter factory', {
          adapterId: registration.adapterId,
          type: registration.type,
        })
    }
  }
}

export class ProviderAdapterRegistry {
  private adapters: Map<string, ProviderAdapterRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ProviderAdapterRegistrationInput): ProviderAdapterRegistration {
    const registrationValidation = this.validation.validateAdapterRegistration(
      input,
      new Set(this.adapters.keys())
    )
    const capabilitiesValidation = this.validation.validateAdapterCapabilities(
      input.adapterId,
      input.capabilities
    )

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...capabilitiesValidation.diagnostics,
    ]
    this.diagnostics.push(...diagnostics)

    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.adapterRegistration('Provider adapter registration validation failed', {
        adapterId: input.adapterId,
        diagnosticsCount: diagnostics.length,
      })
    }

    const registration: ProviderAdapterRegistration = {
      ...input,
      registeredAt: now(),
    }

    this.adapters.set(registration.adapterId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(adapterId: string): ProviderAdapterRegistration | undefined {
    return this.adapters.get(adapterId)
  }

  list(): ProviderAdapterRegistration[] {
    return Array.from(this.adapters.values())
  }

  listByType(type: ProviderAdapterType): ProviderAdapterRegistration[] {
    return this.list().filter((adapter) => adapter.type === type)
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'provider-adapter-registry',
      'Provider Adapter Registry',
      this.adapters.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class ProviderAdapterResolver {
  constructor(
    private registry: ProviderAdapterRegistry,
    private configurationManager: ProviderAdapterManager
  ) {}

  discoverCapabilities(adapterId: string): ProviderAdapterCapabilityInput[] {
    const adapter = this.registry.get(adapterId)
    if (!adapter) {
      throw RuntimeError.adapterResolution('Adapter not found for capability discovery', {
        adapterId,
      })
    }

    return adapter.capabilities
  }

  resolveCapabilities(
    type: ProviderAdapterType,
    capabilityId: string
  ): ProviderAdapterRegistration[] {
    return this.registry
      .listByType(type)
      .filter((adapter) =>
        adapter.capabilities.some(
          (capability) => capability.capabilityId === capabilityId && capability.supported
        )
      )
  }

  resolveModel(adapterId: string, requestedModel: string): string | undefined {
    const configuration = this.configurationManager.getConfiguration(adapterId)
    if (!configuration) {
      return undefined
    }

    if (configuration.supportedModels.includes(requestedModel)) {
      return requestedModel
    }

    return configuration.supportedModels[0]
  }

  isFeatureAvailable(adapterId: string, capabilityId: string): boolean {
    const adapter = this.registry.get(adapterId)
    if (!adapter) {
      return false
    }

    return adapter.capabilities.some(
      (capability) => capability.capabilityId === capabilityId && capability.supported
    )
  }

  isVersionCompatible(adapterId: string, minVersion: string): boolean {
    const adapter = this.registry.get(adapterId)
    if (!adapter) {
      return false
    }

    return isVersionAtLeast(adapter.version, minVersion)
  }

  selectAdapter(input: {
    type: ProviderAdapterType
    requiredCapabilityId?: string
    preferredAdapterId?: string
    requiredModel?: string
    minVersion?: string
    allowDegraded?: boolean
  }): ProviderAdapterRegistration | undefined {
    const candidates = this.registry.listByType(input.type)

    const filtered = candidates.filter((adapter) => {
      if (input.preferredAdapterId && adapter.adapterId !== input.preferredAdapterId) {
        return false
      }

      if (input.requiredCapabilityId && !this.isFeatureAvailable(adapter.adapterId, input.requiredCapabilityId)) {
        return false
      }

      if (input.minVersion && !this.isVersionCompatible(adapter.adapterId, input.minVersion)) {
        return false
      }

      if (input.requiredModel) {
        const configuration = this.configurationManager.getConfiguration(adapter.adapterId)
        if (!configuration?.supportedModels.includes(input.requiredModel)) {
          return false
        }
      }

      if (!input.allowDegraded) {
        const configuration = this.configurationManager.getConfiguration(adapter.adapterId)
        if (!configuration || configuration.availabilityMetadata.status !== 'available') {
          return false
        }
      }

      return true
    })

    return filtered.sort((a, b) => a.availabilityMetadata.priority - b.availabilityMetadata.priority)[0]
  }
}

export class ProviderAdapterManager {
  private configurations: Map<string, ProviderAdapterConfiguration> = new Map()
  private lifecycleState: Map<string, AdapterLifecycleState> = new Map()
  private adapterContracts: Map<string, ProviderAdapterContract> = new Map()
  private diagnostics: ProviderAdapterDiagnostics[] = []
  private invalidLifecycleTransitions = 0
  private lastTransitionAt?: IsoDateTime
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private registry: ProviderAdapterRegistry,
    private factory: ProviderAdapterFactory,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: ProviderAdapterRegistrationInput): ProviderAdapterRegistration {
    const registration = this.registry.register(input)
    this.lifecycleState.set(registration.adapterId, 'registered')
    this.recordDiagnostic('ADAPTER_REGISTERED', `Adapter registered: ${registration.adapterId}`, 'info', registration.adapterId)
    this.lastUpdatedAt = now()
    return registration
  }

  validate(adapterId: string): void {
    const registration = this.registry.get(adapterId)
    if (!registration) {
      throw RuntimeError.adapterRegistration('Adapter not found for validation', { adapterId })
    }

    const validationResult = this.validation.validateAdapterCapabilities(adapterId, registration.capabilities)
    if (!validationResult.valid) {
      throw RuntimeError.adapterCapability('Adapter capability validation failed', {
        adapterId,
        diagnosticsCount: validationResult.diagnostics.length,
      })
    }

    this.transitionLifecycle(adapterId, 'validated')
  }

  configure(input: ProviderAdapterConfigurationInput): ProviderAdapterConfiguration {
    if (!this.registry.get(input.adapterId)) {
      throw RuntimeError.adapterConfiguration('Adapter must be registered before configuration', {
        adapterId: input.adapterId,
      })
    }

    const result = this.validation.validateAdapterConfiguration(input)
    if (!result.valid) {
      throw RuntimeError.adapterConfiguration('Adapter configuration validation failed', {
        adapterId: input.adapterId,
        diagnosticsCount: result.diagnostics.length,
      })
    }

    const existing = this.configurations.get(input.adapterId)
    const configuration: ProviderAdapterConfiguration = {
      ...input,
      configuredAt: existing?.configuredAt ?? now(),
      updatedAt: existing ? now() : undefined,
    }

    this.configurations.set(input.adapterId, configuration)
    this.transitionLifecycle(input.adapterId, 'validated')
    this.lastUpdatedAt = now()
    return configuration
  }

  initialize(adapterId: string): void {
    const registration = this.registry.get(adapterId)
    if (!registration) {
      throw RuntimeError.adapterLifecycle('Adapter not found for initialize', { adapterId })
    }

    if (!this.configurations.get(adapterId)) {
      throw RuntimeError.adapterConfiguration('Adapter configuration is required before initialize', { adapterId })
    }

    const adapter = this.factory.create(registration)
    this.adapterContracts.set(adapterId, adapter)
    this.transitionLifecycle(adapterId, 'initialized')
  }

  activate(adapterId: string): void {
    this.transitionLifecycle(adapterId, 'active')
  }

  suspend(adapterId: string): void {
    this.transitionLifecycle(adapterId, 'suspended')
  }

  resume(adapterId: string): void {
    this.transitionLifecycle(adapterId, 'active')
  }

  deactivate(adapterId: string): void {
    this.transitionLifecycle(adapterId, 'inactive')
  }

  dispose(adapterId: string): void {
    this.adapterContracts.delete(adapterId)
    this.transitionLifecycle(adapterId, 'disposed')
  }

  getConfiguration(adapterId: string): ProviderAdapterConfiguration | undefined {
    return this.configurations.get(adapterId)
  }

  getLifecycleState(adapterId: string): AdapterLifecycleState | undefined {
    return this.lifecycleState.get(adapterId)
  }

  getRuntimeDescriptor(adapterId: string): ProviderAdapterRuntimeDescriptor | undefined {
    const registration = this.registry.get(adapterId)
    if (!registration) return undefined

    const state = this.lifecycleState.get(adapterId) ?? 'registered'
    return {
      adapterId,
      providerId: registration.providerId,
      type: registration.type,
      version: registration.version,
      lifecycle: state,
      configured: this.configurations.has(adapterId),
      initialized: this.adapterContracts.has(adapterId),
      active: state === 'active',
    }
  }

  listRuntimeDescriptors(): ProviderAdapterRuntimeDescriptor[] {
    return this.registry.list().map((registration) => {
      const state = this.lifecycleState.get(registration.adapterId) ?? 'registered'
      return {
        adapterId: registration.adapterId,
        providerId: registration.providerId,
        type: registration.type,
        version: registration.version,
        lifecycle: state,
        configured: this.configurations.has(registration.adapterId),
        initialized: this.adapterContracts.has(registration.adapterId),
        active: state === 'active',
      }
    })
  }

  getHealth(): ProviderAdapterFrameworkHealth {
    const registryDiagnostics = this.registry.getDiagnostics()
    const warningCount = registryDiagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
    const errorCount = registryDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length

    const byState: Record<AdapterLifecycleState, number> = {
      registered: 0,
      validated: 0,
      initialized: 0,
      active: 0,
      suspended: 0,
      inactive: 0,
      disposed: 0,
    }

    for (const state of this.lifecycleState.values()) {
      byState[state] += 1
    }

    const configuredCount = this.configurations.size
    const registeredCount = this.registry.list().length

    return {
      adapterRegistryHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        summary: this.registry.getHealthSummary(),
      },
      adapterConfigurationHealth: {
        status: configuredCount === registeredCount ? 'healthy' : 'degraded',
        configuredCount,
        missingConfigurationCount: Math.max(registeredCount - configuredCount, 0),
        lastUpdatedAt: this.lastUpdatedAt,
      },
      adapterLifecycleHealth: {
        status: this.invalidLifecycleTransitions > 0 ? 'degraded' : 'healthy',
        byState,
        invalidTransitions: this.invalidLifecycleTransitions,
        lastTransitionAt: this.lastTransitionAt,
      },
      adapterValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: registryDiagnostics.length,
        errorCount,
        warningCount,
      },
    }
  }

  private transitionLifecycle(adapterId: string, nextState: AdapterLifecycleState): void {
    const currentState = this.lifecycleState.get(adapterId) ?? 'registered'

    const result = this.validation.validateAdapterLifecycle(adapterId, currentState, nextState)
    if (!result.valid) {
      this.invalidLifecycleTransitions += 1
      throw RuntimeError.adapterLifecycle('Adapter lifecycle transition validation failed', {
        adapterId,
        currentState,
        nextState,
        diagnosticsCount: result.diagnostics.length,
      })
    }

    this.lifecycleState.set(adapterId, nextState)
    this.lastTransitionAt = now()
    this.lastUpdatedAt = now()
  }

  private recordDiagnostic(
    code: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    adapterId?: string,
    metadata?: Metadata
  ): void {
    this.diagnostics.push({
      diagnosticId: `adapter-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      message,
      severity,
      adapterId,
      createdAt: now(),
      metadata,
    })
  }
}
