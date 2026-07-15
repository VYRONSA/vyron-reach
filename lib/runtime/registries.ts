import type { IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import type { ServiceLifetime } from './di'
import { RuntimeError } from './errors'
import type {
  RegistrationDiagnostic,
  RegistrationValidationResult,
  ServiceRegistrationInput,
} from './validation'
import { RegistrationValidationService } from './validation'
import type {
  ProviderAvailabilityStatus,
  ProviderCapabilityMetadata,
  ProviderHealthSnapshot,
  ProviderRegistration,
  ProviderType,
} from './providers'
import type {
  SkillCapabilityDeclaration,
  SkillCategory,
  SkillRegistration,
} from './skills'

export interface RegistryHealthSummary {
  registryId: string
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  registeredCount: number
  duplicateRejected: number
  validationRejected: number
  lastUpdatedAt: IsoDateTime
  diagnostics: {
    total: number
    errorCount: number
    warningCount: number
  }
}

/**
 * Service Registration - Metadata about a registered service
 */
export interface ServiceRegistration extends ServiceRegistrationInput {
  version: VersionString
  lifetime: ServiceLifetime
  registeredAt: IsoDateTime
  lifetimeVerified?: boolean
}

export interface ServiceBatchRegistrationResult {
  registered: string[]
  rejected: string[]
  diagnostics: RegistrationDiagnostic[]
}

/**
 * Component Registration - Metadata about a registered component
 */
export interface ComponentRegistration {
  componentId: string
  name: string
  type: 'provider' | 'skill' | 'validator' | 'context-source' | 'memory-adapter' | 'workflow' | 'other'
  version: VersionString
  registeredAt: IsoDateTime
  dependencies: string[]
  contractVersion: VersionString
  metadata?: Metadata
}

/**
 * Service Registry - Central registry of all runtime services
 */
export class ServiceRegistry {
  private services: Map<string, ServiceRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = new Date().toISOString()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  private addDiagnostics(diagnostics: RegistrationDiagnostic[]): void {
    this.diagnostics.push(...diagnostics)
  }

  private assertValid(result: RegistrationValidationResult): void {
    this.addDiagnostics(result.diagnostics)
    if (!result.valid) {
      const hasDuplicate = result.diagnostics.some((diagnostic) =>
        diagnostic.code.includes('DUPLICATE')
      )
      if (hasDuplicate) this.duplicateRejected += 1
      this.validationRejected += 1
      throw RuntimeError.registryValidation('Service registration validation failed', {
        diagnosticsCount: result.diagnostics.length,
      })
    }
  }

  private getImplementationKeys(): Set<string> {
    return new Set(
      Array.from(this.services.values()).map(
        (service) => `${service.interface}::${service.implementation}`
      )
    )
  }

  /**
   * Register a service
   */
  register(registration: ServiceRegistration): ServiceRegistration {
    const validation = this.validation.validateServiceRegistration(
      registration,
      new Set(this.services.keys()),
      this.getImplementationKeys()
    )
    this.assertValid(validation)

    this.services.set(registration.serviceId, registration)
    this.lastUpdatedAt = new Date().toISOString()
    return registration
  }

  /**
   * Register multiple framework services as a pipeline
   */
  registerBatch(registrations: ServiceRegistration[]): ServiceBatchRegistrationResult {
    const result: ServiceBatchRegistrationResult = {
      registered: [],
      rejected: [],
      diagnostics: [],
    }

    for (const registration of registrations) {
      try {
        this.register(registration)
        result.registered.push(registration.serviceId)
      } catch (error) {
        result.rejected.push(registration.serviceId)
        const message = error instanceof Error ? error.message : String(error)
        result.diagnostics.push({
          scope: 'service',
          code: 'SERVICE_PIPELINE_REJECTED',
          message,
          severity: 'error',
          entityId: registration.serviceId,
          createdAt: new Date().toISOString(),
        })
      }
    }

    this.addDiagnostics(result.diagnostics)
    return result
  }

  /**
   * Verify registered service lifetime against runtime DI registration
   */
  verifyLifetime(serviceId: string, lifetime: ServiceLifetime | undefined): boolean {
    const registration = this.services.get(serviceId)
    if (!registration) {
      throw RuntimeError.notFound(`Service not registered: ${serviceId}`)
    }

    const validation = this.validation.validateServiceLifetime(
      serviceId,
      registration.lifetime,
      lifetime
    )

    this.addDiagnostics(validation.diagnostics)
    if (!validation.valid) {
      this.validationRejected += 1
      registration.lifetimeVerified = false
      this.services.set(serviceId, registration)
      return false
    }

    registration.lifetimeVerified = true
    this.services.set(serviceId, registration)
    this.lastUpdatedAt = new Date().toISOString()
    return true
  }

  /**
   * Unregister a service
   */
  unregister(serviceId: string): void {
    this.services.delete(serviceId)
  }

  /**
   * Get a service registration
   */
  get(serviceId: string): ServiceRegistration | undefined {
    return this.services.get(serviceId)
  }

  /**
   * List all service registrations
   */
  list(): ServiceRegistration[] {
    return Array.from(this.services.values())
  }

  /**
   * Find services by interface
   */
  findByInterface(interfaceName: string): ServiceRegistration[] {
    return Array.from(this.services.values()).filter(
      (s) => s.interface === interfaceName
    )
  }

  /**
   * Check if service is registered
   */
  isRegistered(serviceId: string): boolean {
    return this.services.has(serviceId)
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear()
    this.diagnostics = []
    this.duplicateRejected = 0
    this.validationRejected = 0
    this.lastUpdatedAt = new Date().toISOString()
  }

  /**
   * Get registration diagnostics for service operations
   */
  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  /**
   * Health snapshot for service registry reporting
   */
  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'service-registry',
      name: 'Service Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.services.size,
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

/**
 * Component Registry - Central registry of all runtime components (providers, skills, etc.)
 */
export class ComponentRegistry {
  private components: Map<string, ComponentRegistration> = new Map()

  /**
   * Register a component
   */
  register(registration: ComponentRegistration): void {
    if (this.components.has(registration.componentId)) {
      throw RuntimeError.config(
        `Component already registered: ${registration.componentId}`
      )
    }
    this.components.set(registration.componentId, registration)
  }

  /**
   * Unregister a component
   */
  unregister(componentId: string): void {
    this.components.delete(componentId)
  }

  /**
   * Get a component registration
   */
  get(componentId: string): ComponentRegistration | undefined {
    return this.components.get(componentId)
  }

  /**
   * List all component registrations
   */
  list(): ComponentRegistration[] {
    return Array.from(this.components.values())
  }

  /**
   * Find components by type
   */
  findByType(type: string): ComponentRegistration[] {
    return Array.from(this.components.values()).filter(
      (c) => c.type === type
    )
  }

  /**
   * Check if component is registered
   */
  isRegistered(componentId: string): boolean {
    return this.components.has(componentId)
  }

  /**
   * Clear all components
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * Get all components by version (for compatibility checking)
   */
  getByVersion(version: VersionString): ComponentRegistration[] {
    return Array.from(this.components.values()).filter(
      (c) => c.version === version
    )
  }
}

/**
 * Provider Registry - Runtime registration, discovery, and health tracking for providers
 */
export class ProviderRegistry {
  private providers: Map<string, ProviderRegistration> = new Map()
  private runtimeProviders: Set<string> = new Set()
  private runtimeConfiguredProviders: Set<string> = new Set()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = new Date().toISOString()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(registration: ProviderRegistration): ProviderRegistration {
    const validation = this.validation.validateProviderRegistration(
      registration,
      new Set(this.providers.keys())
    )

    this.diagnostics.push(...validation.diagnostics)
    if (!validation.valid) {
      if (validation.diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.providerRegistration('Provider registration validation failed', {
        providerId: registration.providerId,
      })
    }

    this.providers.set(registration.providerId, registration)
    this.lastUpdatedAt = new Date().toISOString()
    return registration
  }

  unregister(providerId: string): void {
    this.providers.delete(providerId)
    this.runtimeProviders.delete(providerId)
    this.runtimeConfiguredProviders.delete(providerId)
    this.lastUpdatedAt = new Date().toISOString()
  }

  get(providerId: string): ProviderRegistration | undefined {
    return this.providers.get(providerId)
  }

  list(): ProviderRegistration[] {
    return Array.from(this.providers.values())
  }

  findByType(type: ProviderType): ProviderRegistration[] {
    return this.list().filter((provider) => provider.type === type)
  }

  findByCapability(capabilityId: string): ProviderRegistration[] {
    return this.list().filter((provider) =>
      provider.capabilities.some(
        (capability: ProviderCapabilityMetadata) =>
          capability.capabilityId === capabilityId && capability.supported
      )
    )
  }

  findAvailable(): ProviderRegistration[] {
    return this.list().filter((provider) => provider.availability === 'available')
  }

  updateAvailability(providerId: string, availability: ProviderAvailabilityStatus): void {
    const registration = this.providers.get(providerId)
    if (!registration) {
      throw RuntimeError.notFound(`Provider not registered: ${providerId}`)
    }

    registration.availability = availability
    this.providers.set(providerId, registration)
    this.lastUpdatedAt = new Date().toISOString()
  }

  updateHealth(providerId: string, health: ProviderHealthSnapshot): void {
    const registration = this.providers.get(providerId)
    if (!registration) {
      throw RuntimeError.notFound(`Provider not registered: ${providerId}`)
    }

    registration.health = health
    registration.availability = health.status
    this.providers.set(providerId, registration)
    this.lastUpdatedAt = new Date().toISOString()
  }

  registerRuntime(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw RuntimeError.notFound(`Provider not registered: ${providerId}`)
    }

    this.runtimeProviders.add(providerId)
    this.lastUpdatedAt = new Date().toISOString()
  }

  unregisterRuntime(providerId: string): void {
    this.runtimeProviders.delete(providerId)
    this.runtimeConfiguredProviders.delete(providerId)
    this.lastUpdatedAt = new Date().toISOString()
  }

  markRuntimeConfigured(providerId: string): void {
    if (!this.runtimeProviders.has(providerId)) {
      throw RuntimeError.providerRegistration('Runtime provider is not registered', {
        providerId,
      })
    }

    this.runtimeConfiguredProviders.add(providerId)
    this.lastUpdatedAt = new Date().toISOString()
  }

  discoverRuntime(): ProviderRegistration[] {
    return Array.from(this.runtimeProviders)
      .map((providerId) => this.providers.get(providerId))
      .filter((provider): provider is ProviderRegistration => !!provider)
  }

  resolveRuntime(providerId: string, version?: string): ProviderRegistration | undefined {
    const provider = this.providers.get(providerId)
    if (!provider || !this.runtimeProviders.has(providerId)) {
      return undefined
    }

    if (version && provider.version !== version) {
      return undefined
    }

    return provider
  }

  lookupRuntimeCapability(capabilityId: string): {
    capabilityId: string
    providers: Array<{ providerId: string; version: string; availability: ProviderAvailabilityStatus }>
  } {
    const providers = this.discoverRuntime()
      .filter((provider) =>
        provider.capabilities.some(
          (capability: ProviderCapabilityMetadata) =>
            capability.capabilityId === capabilityId && capability.supported
        )
      )
      .map((provider) => ({
        providerId: provider.providerId,
        version: provider.version,
        availability: provider.availability,
      }))

    return {
      capabilityId,
      providers,
    }
  }

  resolveRuntimeVersion(type: ProviderType, version?: string): ProviderRegistration[] {
    const candidates = this.discoverRuntime().filter((provider) => provider.type === type)
    if (!version) {
      return candidates
    }

    return candidates.filter((provider) => provider.version === version)
  }

  getAvailabilitySnapshot(): Array<{
    providerId: string
    availability: ProviderAvailabilityStatus
    configured: boolean
  }> {
    return this.discoverRuntime().map((provider) => ({
      providerId: provider.providerId,
      availability: provider.availability,
      configured: this.runtimeConfiguredProviders.has(provider.providerId),
    }))
  }

  isRegistered(providerId: string): boolean {
    return this.providers.has(providerId)
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  clear(): void {
    this.providers.clear()
    this.runtimeProviders.clear()
    this.runtimeConfiguredProviders.clear()
    this.diagnostics = []
    this.duplicateRejected = 0
    this.validationRejected = 0
    this.lastUpdatedAt = new Date().toISOString()
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
    const unavailableCount = this.list().filter(
      (provider) => provider.availability === 'unavailable'
    ).length

    const status = unavailableCount > 0 ? 'degraded' : 'healthy'

    return {
      registryId: 'provider-registry',
      name: 'Provider Registry',
      status,
      registeredCount: this.providers.size,
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

/**
 * Skill Registry - Runtime registration, validation, and discovery for skills
 */
export class SkillRegistry {
  private skills: Map<string, SkillRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = new Date().toISOString()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(registration: SkillRegistration): SkillRegistration {
    const validation = this.validation.validateSkillRegistration(
      registration,
      new Set(this.skills.keys())
    )

    this.diagnostics.push(...validation.diagnostics)
    if (!validation.valid) {
      if (validation.diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.skillRegistration('Skill registration validation failed', {
        skillId: registration.skillId,
      })
    }

    this.skills.set(registration.skillId, registration)
    this.lastUpdatedAt = new Date().toISOString()
    return registration
  }

  unregister(skillId: string): void {
    this.skills.delete(skillId)
    this.lastUpdatedAt = new Date().toISOString()
  }

  get(skillId: string): SkillRegistration | undefined {
    return this.skills.get(skillId)
  }

  list(): SkillRegistration[] {
    return Array.from(this.skills.values())
  }

  findByCategory(category: SkillCategory | string): SkillRegistration[] {
    return this.list().filter((skill) => skill.category === category)
  }

  findByCapability(capabilityId: string): SkillRegistration[] {
    return this.list().filter((skill) =>
      skill.capabilities.some(
        (capability: SkillCapabilityDeclaration) =>
          capability.capabilityId === capabilityId && capability.declared
      )
    )
  }

  findWithDependency(dependencyId: string): SkillRegistration[] {
    return this.list().filter((skill) => skill.dependencies.includes(dependencyId))
  }

  isRegistered(skillId: string): boolean {
    return this.skills.has(skillId)
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  clear(): void {
    this.skills.clear()
    this.diagnostics = []
    this.duplicateRejected = 0
    this.validationRejected = 0
    this.lastUpdatedAt = new Date().toISOString()
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'skill-registry',
      name: 'Skill Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.skills.size,
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
