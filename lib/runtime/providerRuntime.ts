import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
  ChatProvider,
  ChatProviderRequest,
  ChatProviderResponse,
  EmbeddingProvider,
  EmbeddingProviderRequest,
  EmbeddingProviderResponse,
  ImageProvider,
  ImageProviderRequest,
  ImageProviderResponse,
  ModerationProvider,
  ModerationProviderRequest,
  ModerationProviderResponse,
  ProviderAvailabilityStatus,
  ProviderCapabilityMetadata,
  ProviderHealthSnapshot,
  ProviderRegistration,
  ProviderType,
  SpeechProvider,
  SpeechProviderRequest,
  SpeechProviderResponse,
} from './providers'
import type { RegistryHealthSummary } from './registries'
import { ProviderRegistry } from './registries'
import {
  RegistrationValidationService,
  type ProviderConfigurationInput,
  type ProviderRegistrationInput,
  type ProviderRuntimeLifecycleState,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export interface ProviderRuntimeConfiguration extends ProviderConfigurationInput {
  configuredAt: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface ProviderSelectionRequest {
  type: ProviderType
  capabilityId?: string
  preferredProviderId?: string
  allowDegraded?: boolean
  requiredModel?: string
  minVersion?: string
}

export interface ProviderSelectionResult {
  providerId: string
  reason: string
  score: number
}

export interface ProviderRuntimeDescriptor {
  providerId: string
  name: string
  type: ProviderType
  version: string
  availability: ProviderAvailabilityStatus
  lifecycle: ProviderRuntimeLifecycleState
  capabilities: ProviderCapabilityMetadata[]
  configured: boolean
  initialized: boolean
}

export interface ProviderAvailabilityHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  availableCount: number
  degradedCount: number
  unavailableCount: number
  maintenanceCount: number
  lastUpdatedAt: IsoDateTime
}

export interface ProviderConfigurationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  configuredCount: number
  missingConfigurationCount: number
  lastUpdatedAt: IsoDateTime
}

export interface ProviderLifecycleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  byState: Record<ProviderRuntimeLifecycleState, number>
  invalidTransitions: number
  lastTransitionAt?: IsoDateTime
}

export interface ProviderRuntimeHealth {
  registry: RegistryHealthSummary
  providerAvailability: ProviderAvailabilityHealth
  providerConfigurationHealth: ProviderConfigurationHealth
  providerLifecycleHealth: ProviderLifecycleHealth
}

export interface ChatCompletionRuntime {
  chatCompletion(
    request: ChatProviderRequest,
    selection?: Omit<ProviderSelectionRequest, 'type'>
  ): Promise<ChatProviderResponse>
}

export interface EmbeddingsRuntime {
  embeddings(
    request: EmbeddingProviderRequest,
    selection?: Omit<ProviderSelectionRequest, 'type'>
  ): Promise<EmbeddingProviderResponse>
}

export interface ImageGenerationRuntime {
  imageGeneration(
    request: ImageProviderRequest,
    selection?: Omit<ProviderSelectionRequest, 'type'>
  ): Promise<ImageProviderResponse>
}

export interface SpeechRuntime {
  speech(
    request: SpeechProviderRequest,
    selection?: Omit<ProviderSelectionRequest, 'type'>
  ): Promise<SpeechProviderResponse>
}

export interface ModerationRuntime {
  moderation(
    request: ModerationProviderRequest,
    selection?: Omit<ProviderSelectionRequest, 'type'>
  ): Promise<ModerationProviderResponse>
}

type RuntimeProviderContract =
  | AIProvider
  | ChatProvider
  | EmbeddingProvider
  | ImageProvider
  | SpeechProvider
  | ModerationProvider

class RuntimeAIProvider implements AIProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    return {
      output: `Placeholder provider runtime response for prompt: ${request.prompt}`,
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
      },
    }
  }
}

class RuntimeChatProvider implements ChatProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async chat(request: ChatProviderRequest): Promise<ChatProviderResponse> {
    const lastMessage = request.messages[request.messages.length - 1]
    return {
      message: `Placeholder chat response for: ${lastMessage?.content ?? 'empty request'}`,
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
      },
    }
  }
}

class RuntimeEmbeddingProvider implements EmbeddingProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async embed(request: EmbeddingProviderRequest): Promise<EmbeddingProviderResponse> {
    return {
      vectors: request.input.map((value) => [value.length, 0, 1]),
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
      },
    }
  }
}

class RuntimeImageProvider implements ImageProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async render(request: ImageProviderRequest): Promise<ImageProviderResponse> {
    return {
      images: [
        {
          mimeType: 'text/plain',
          data: `placeholder-image:${request.prompt}`,
        },
      ],
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
      },
    }
  }
}

class RuntimeSpeechProvider implements SpeechProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async process(request: SpeechProviderRequest): Promise<SpeechProviderResponse> {
    return {
      output: `placeholder-speech-${request.mode}:${request.input}`,
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
      },
    }
  }
}

class RuntimeModerationProvider implements ModerationProvider {
  readonly metadata

  constructor(registration: ProviderRegistration) {
    this.metadata = {
      providerId: registration.providerId,
      name: registration.name,
      type: registration.type,
      version: {
        providerVersion: registration.version,
        contractVersion: registration.contractVersion,
      },
      capabilities: registration.capabilities,
      availability: registration.availability,
      metadata: registration.metadata,
    }
  }

  async moderate(request: ModerationProviderRequest): Promise<ModerationProviderResponse> {
    return {
      flagged: false,
      categories: [],
      metadata: {
        mode: 'placeholder-runtime',
        providerId: this.metadata.providerId,
        inspectedLength: request.input.length,
      },
    }
  }
}

export class ProviderFactory {
  create(registration: ProviderRegistration): RuntimeProviderContract {
    switch (registration.type) {
      case 'ai':
        return new RuntimeAIProvider(registration)
      case 'chat':
        return new RuntimeChatProvider(registration)
      case 'embedding':
        return new RuntimeEmbeddingProvider(registration)
      case 'image':
        return new RuntimeImageProvider(registration)
      case 'speech':
        return new RuntimeSpeechProvider(registration)
      case 'moderation':
        return new RuntimeModerationProvider(registration)
      default:
        throw RuntimeError.providerCapability('Unsupported provider type for runtime factory', {
          providerId: registration.providerId,
          type: registration.type,
        })
    }
  }
}

export class ProviderCapabilityResolver {
  constructor(private registry: ProviderRegistry) {}

  getCapabilities(providerId: string): ProviderCapabilityMetadata[] {
    const provider = this.registry.get(providerId)
    if (!provider) {
      throw RuntimeError.providerResolution('Provider not found for capability resolution', {
        providerId,
      })
    }
    return provider.capabilities
  }

  hasCapability(providerId: string, capabilityId: string): boolean {
    return this.getCapabilities(providerId).some(
      (capability) => capability.capabilityId === capabilityId && capability.supported
    )
  }

  resolveProvidersForCapability(capabilityId: string): ProviderRegistration[] {
    return this.registry.findByCapability(capabilityId)
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

export class ProviderSelectionEngine {
  select(
    candidates: ProviderRegistration[],
    request: ProviderSelectionRequest,
    configurationManager: ProviderConfigurationManager
  ): ProviderSelectionResult | undefined {
    const ranked = candidates
      .filter((candidate) => {
        if (request.preferredProviderId && candidate.providerId !== request.preferredProviderId) {
          return false
        }

        if (!request.allowDegraded && candidate.availability !== 'available') {
          return false
        }

        if (request.capabilityId) {
          const hasCapability = candidate.capabilities.some(
            (capability) => capability.capabilityId === request.capabilityId && capability.supported
          )
          if (!hasCapability) return false
        }

        if (request.minVersion && !isVersionAtLeast(candidate.version, request.minVersion)) {
          return false
        }

        if (request.requiredModel) {
          const config = configurationManager.get(candidate.providerId)
          if (!config || !config.supportedModels.includes(request.requiredModel)) {
            return false
          }
        }

        return true
      })
      .map((candidate) => {
        let score = 0
        if (candidate.availability === 'available') score += 100
        if (candidate.availability === 'degraded') score += 60
        if (candidate.availability === 'maintenance') score += 20

        if (request.capabilityId) {
          const capabilityScore = candidate.capabilities.some(
            (capability) => capability.capabilityId === request.capabilityId && capability.supported
          )
          if (capabilityScore) score += 30
        }

        if (request.preferredProviderId && candidate.providerId === request.preferredProviderId) {
          score += 50
        }

        return {
          providerId: candidate.providerId,
          score,
          reason: 'selected-by-availability-capability-and-version',
        }
      })
      .sort((a, b) => b.score - a.score)

    return ranked[0]
  }
}

export class ProviderConfigurationManager {
  private configurations: Map<string, ProviderRuntimeConfiguration> = new Map()
  private lastUpdatedAt: IsoDateTime = now()

  constructor(private validation: RegistrationValidationService = new RegistrationValidationService()) {}

  configure(configuration: ProviderConfigurationInput): ProviderRuntimeConfiguration {
    const validation = this.validation.validateProviderConfiguration(configuration)
    if (!validation.valid) {
      throw RuntimeError.providerConfiguration('Provider configuration validation failed', {
        providerId: configuration.providerId,
        diagnosticsCount: validation.diagnostics.length,
        firstDiagnosticCode: validation.diagnostics[0]?.code ?? null,
      })
    }

    const capabilityValidation = this.validation.validateProviderCapabilities(
      configuration.providerId,
      configuration.capabilityDeclaration
    )
    if (!capabilityValidation.valid) {
      throw RuntimeError.providerCapability('Provider capability declaration validation failed', {
        providerId: configuration.providerId,
        diagnosticsCount: capabilityValidation.diagnostics.length,
        firstDiagnosticCode: capabilityValidation.diagnostics[0]?.code ?? null,
      })
    }

    const existing = this.configurations.get(configuration.providerId)
    const runtimeConfiguration: ProviderRuntimeConfiguration = {
      ...configuration,
      configuredAt: existing?.configuredAt ?? now(),
      updatedAt: existing ? now() : undefined,
    }

    this.configurations.set(configuration.providerId, runtimeConfiguration)
    this.lastUpdatedAt = now()
    return runtimeConfiguration
  }

  get(providerId: string): ProviderRuntimeConfiguration | undefined {
    return this.configurations.get(providerId)
  }

  isConfigured(providerId: string): boolean {
    return this.configurations.has(providerId)
  }

  list(): ProviderRuntimeConfiguration[] {
    return Array.from(this.configurations.values())
  }

  getHealth(totalProviders: number): ProviderConfigurationHealth {
    const configuredCount = this.configurations.size
    const missingConfigurationCount = Math.max(0, totalProviders - configuredCount)

    return {
      status: missingConfigurationCount > 0 ? 'degraded' : 'healthy',
      configuredCount,
      missingConfigurationCount,
      lastUpdatedAt: this.lastUpdatedAt,
    }
  }
}

export class ProviderResolver {
  constructor(
    private registry: ProviderRegistry,
    private selectionEngine: ProviderSelectionEngine,
    private configurationManager: ProviderConfigurationManager,
    private runtimeContracts: Map<string, RuntimeProviderContract>
  ) {}

  resolve(request: ProviderSelectionRequest): RuntimeProviderContract {
    if (request.preferredProviderId) {
      const preferred = this.runtimeContracts.get(request.preferredProviderId)
      if (preferred) return preferred
    }

    const candidates = this.registry.findByType(request.type)
    const selected = this.selectionEngine.select(candidates, request, this.configurationManager)

    if (!selected) {
      throw RuntimeError.providerResolution('No provider matched resolution request', {
        type: request.type,
        capabilityId: request.capabilityId ?? null,
      })
    }

    const provider = this.runtimeContracts.get(selected.providerId)
    if (!provider) {
      throw RuntimeError.providerResolution('Resolved provider has no runtime contract', {
        providerId: selected.providerId,
      })
    }

    return provider
  }
}

export class ProviderHealthMonitor {
  private snapshots: Map<string, ProviderHealthSnapshot> = new Map()
  private lastUpdatedAt: IsoDateTime = now()

  constructor(private registry: ProviderRegistry) {}

  setSnapshot(providerId: string, snapshot: ProviderHealthSnapshot): void {
    this.snapshots.set(providerId, snapshot)
    this.registry.updateHealth(providerId, snapshot)
    this.lastUpdatedAt = now()
  }

  getSnapshot(providerId: string): ProviderHealthSnapshot | undefined {
    return this.snapshots.get(providerId)
  }

  getAvailabilityHealth(): ProviderAvailabilityHealth {
    const providers = this.registry.list()
    const availableCount = providers.filter((provider) => provider.availability === 'available').length
    const degradedCount = providers.filter((provider) => provider.availability === 'degraded').length
    const unavailableCount = providers.filter((provider) => provider.availability === 'unavailable').length
    const maintenanceCount = providers.filter((provider) => provider.availability === 'maintenance').length

    const status: ProviderAvailabilityHealth['status'] = unavailableCount > 0
      ? 'degraded'
      : availableCount > 0
      ? 'healthy'
      : 'unhealthy'

    return {
      status,
      availableCount,
      degradedCount,
      unavailableCount,
      maintenanceCount,
      lastUpdatedAt: this.lastUpdatedAt,
    }
  }
}

export class ProviderManager
  implements
    ChatCompletionRuntime,
    EmbeddingsRuntime,
    ImageGenerationRuntime,
    SpeechRuntime,
    ModerationRuntime
{
  private runtimeContracts: Map<string, RuntimeProviderContract> = new Map()
  private lifecycleStates: Map<string, ProviderRuntimeLifecycleState> = new Map()
  private invalidTransitions = 0
  private lastTransitionAt?: IsoDateTime

  private providerResolver: ProviderResolver

  constructor(
    private registry: ProviderRegistry,
    private configurationManager: ProviderConfigurationManager,
    private capabilityResolver: ProviderCapabilityResolver,
    private selectionEngine: ProviderSelectionEngine,
    private factory: ProviderFactory,
    private healthMonitor: ProviderHealthMonitor,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {
    this.providerResolver = new ProviderResolver(
      this.registry,
      this.selectionEngine,
      this.configurationManager,
      this.runtimeContracts
    )
  }

  register(registration: ProviderRegistrationInput): ProviderRegistration {
    const runtimeRegistration: ProviderRegistration = {
      ...registration,
      registeredAt: now(),
      availability: 'maintenance',
      health: {
        status: 'maintenance',
        message: 'Provider registered but not initialized',
        checkedAt: now(),
      },
    }

    const created = this.registry.register(runtimeRegistration)
    this.registry.registerRuntime(created.providerId)
    this.setLifecycleState(created.providerId, 'registered')
    return created
  }

  configure(providerId: string, configuration: ProviderConfigurationInput): ProviderRuntimeConfiguration {
    this.assertLifecycle(providerId, 'configured')
    const configured = this.configurationManager.configure({
      ...configuration,
      providerId,
    })

    this.registry.markRuntimeConfigured(providerId)
    this.setLifecycleState(providerId, 'configured')
    return configured
  }

  validate(providerId: string): void {
    this.assertLifecycle(providerId, 'validated')
    const registration = this.registry.get(providerId)
    if (!registration) {
      throw RuntimeError.providerResolution('Cannot validate unregistered provider', { providerId })
    }

    const capabilityValidation = this.validation.validateProviderCapabilities(
      providerId,
      registration.capabilities
    )
    if (!capabilityValidation.valid) {
      throw RuntimeError.providerCapability('Provider capability validation failed', {
        providerId,
        diagnosticsCount: capabilityValidation.diagnostics.length,
        firstDiagnosticCode: capabilityValidation.diagnostics[0]?.code ?? null,
      })
    }

    if (!this.configurationManager.isConfigured(providerId)) {
      throw RuntimeError.providerConfiguration('Provider configuration missing during validate phase', {
        providerId,
      })
    }

    this.setLifecycleState(providerId, 'validated')
  }

  initialize(providerId: string): void {
    this.assertLifecycle(providerId, 'initialized')
    const registration = this.registry.get(providerId)
    if (!registration) {
      throw RuntimeError.providerInitialization('Cannot initialize unregistered provider', { providerId })
    }

    const contract = this.factory.create(registration)
    this.runtimeContracts.set(providerId, contract)

    this.registry.updateAvailability(providerId, 'degraded')
    this.healthMonitor.setSnapshot(providerId, {
      status: 'degraded',
      message: 'Provider initialized with placeholder runtime contract',
      checkedAt: now(),
    })

    this.setLifecycleState(providerId, 'initialized')
  }

  ready(providerId: string): void {
    this.assertLifecycle(providerId, 'ready')
    if (!this.runtimeContracts.has(providerId)) {
      throw RuntimeError.providerInitialization('Provider runtime contract is missing in ready phase', {
        providerId,
      })
    }

    this.registry.updateAvailability(providerId, 'available')
    this.healthMonitor.setSnapshot(providerId, {
      status: 'available',
      message: 'Provider runtime contract ready',
      checkedAt: now(),
    })
    this.setLifecycleState(providerId, 'ready')
  }

  suspend(providerId: string): void {
    this.assertLifecycle(providerId, 'suspended')
    this.registry.updateAvailability(providerId, 'maintenance')
    this.healthMonitor.setSnapshot(providerId, {
      status: 'maintenance',
      message: 'Provider suspended',
      checkedAt: now(),
    })
    this.setLifecycleState(providerId, 'suspended')
  }

  resume(providerId: string): void {
    this.assertLifecycle(providerId, 'ready')
    this.registry.updateAvailability(providerId, 'available')
    this.healthMonitor.setSnapshot(providerId, {
      status: 'available',
      message: 'Provider resumed',
      checkedAt: now(),
    })
    this.setLifecycleState(providerId, 'ready')
  }

  shutdown(providerId: string): void {
    this.assertLifecycle(providerId, 'shutdown')
    this.registry.updateAvailability(providerId, 'unavailable')
    this.healthMonitor.setSnapshot(providerId, {
      status: 'unavailable',
      message: 'Provider shut down',
      checkedAt: now(),
    })
    this.setLifecycleState(providerId, 'shutdown')
  }

  dispose(providerId: string): void {
    this.assertLifecycle(providerId, 'disposed')
    this.runtimeContracts.delete(providerId)
    this.registry.unregisterRuntime(providerId)
    this.registry.unregister(providerId)
    this.setLifecycleState(providerId, 'disposed')
  }

  getDescriptor(providerId: string): ProviderRuntimeDescriptor {
    const provider = this.registry.get(providerId)
    if (!provider) {
      throw RuntimeError.providerResolution('Provider runtime descriptor not found', { providerId })
    }

    return {
      providerId: provider.providerId,
      name: provider.name,
      type: provider.type,
      version: provider.version,
      availability: provider.availability,
      lifecycle: this.lifecycleStates.get(provider.providerId) ?? 'registered',
      capabilities: provider.capabilities,
      configured: this.configurationManager.isConfigured(provider.providerId),
      initialized: this.runtimeContracts.has(provider.providerId),
    }
  }

  discover(): ProviderRuntimeDescriptor[] {
    return this.registry.discoverRuntime().map((provider) => this.getDescriptor(provider.providerId))
  }

  resolve(selection: ProviderSelectionRequest): RuntimeProviderContract {
    return this.providerResolver.resolve(selection)
  }

  async chatCompletion(
    request: ChatProviderRequest,
    selection: Omit<ProviderSelectionRequest, 'type'> = {}
  ): Promise<ChatProviderResponse> {
    const provider = this.resolve({ ...selection, type: 'chat' })
    if ('chat' in provider) {
      return provider.chat(request)
    }

    if ('generate' in provider) {
      const prompt = request.messages.map((entry) => `${entry.role}: ${entry.content}`).join('\n')
      const result = await provider.generate({ prompt, metadata: request.metadata })
      return {
        message: result.output,
        metadata: result.metadata,
      }
    }

    throw RuntimeError.providerCapability('Resolved provider does not support chat completion')
  }

  async embeddings(
    request: EmbeddingProviderRequest,
    selection: Omit<ProviderSelectionRequest, 'type'> = {}
  ): Promise<EmbeddingProviderResponse> {
    const provider = this.resolve({ ...selection, type: 'embedding' })
    if ('embed' in provider) {
      return provider.embed(request)
    }

    throw RuntimeError.providerCapability('Resolved provider does not support embeddings')
  }

  async imageGeneration(
    request: ImageProviderRequest,
    selection: Omit<ProviderSelectionRequest, 'type'> = {}
  ): Promise<ImageProviderResponse> {
    const provider = this.resolve({ ...selection, type: 'image' })
    if ('render' in provider) {
      return provider.render(request)
    }

    throw RuntimeError.providerCapability('Resolved provider does not support image generation')
  }

  async speech(
    request: SpeechProviderRequest,
    selection: Omit<ProviderSelectionRequest, 'type'> = {}
  ): Promise<SpeechProviderResponse> {
    const provider = this.resolve({ ...selection, type: 'speech' })
    if ('process' in provider) {
      return provider.process(request)
    }

    throw RuntimeError.providerCapability('Resolved provider does not support speech')
  }

  async moderation(
    request: ModerationProviderRequest,
    selection: Omit<ProviderSelectionRequest, 'type'> = {}
  ): Promise<ModerationProviderResponse> {
    const provider = this.resolve({ ...selection, type: 'moderation' })
    if ('moderate' in provider) {
      return provider.moderate(request)
    }

    throw RuntimeError.providerCapability('Resolved provider does not support moderation')
  }

  getHealth(): ProviderRuntimeHealth {
    const byState: Record<ProviderRuntimeLifecycleState, number> = {
      registered: 0,
      configured: 0,
      validated: 0,
      initialized: 0,
      ready: 0,
      suspended: 0,
      shutdown: 0,
      disposed: 0,
    }

    for (const state of this.lifecycleStates.values()) {
      byState[state] += 1
    }

    return {
      registry: this.registry.getHealthSummary(),
      providerAvailability: this.healthMonitor.getAvailabilityHealth(),
      providerConfigurationHealth: this.configurationManager.getHealth(this.registry.list().length),
      providerLifecycleHealth: {
        status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
        byState,
        invalidTransitions: this.invalidTransitions,
        lastTransitionAt: this.lastTransitionAt,
      },
    }
  }

  private assertLifecycle(providerId: string, next: ProviderRuntimeLifecycleState): void {
    const current = this.lifecycleStates.get(providerId) ?? 'registered'
    const validation = this.validation.validateProviderLifecycle(providerId, current, next)
    if (!validation.valid) {
      this.invalidTransitions += 1
      throw RuntimeError.providerLifecycle('Provider lifecycle transition is invalid', {
        providerId,
        current,
        next,
        diagnosticsCount: validation.diagnostics.length,
        firstDiagnosticCode: validation.diagnostics[0]?.code ?? null,
      })
    }
  }

  private setLifecycleState(providerId: string, state: ProviderRuntimeLifecycleState): void {
    this.lifecycleStates.set(providerId, state)
    this.lastTransitionAt = now()
  }
}
