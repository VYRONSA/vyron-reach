import { RuntimeError } from './errors'

export type ServiceFactory<T> = (container: DIContainer) => T
export type ServiceLifetime = 'singleton' | 'scoped' | 'transient'

interface ServiceDescriptor<T> {
  key: string
  factory: ServiceFactory<T>
  lifetime: ServiceLifetime
  instance?: T
}

export interface DIServiceRegistrationInfo {
  key: string
  lifetime: ServiceLifetime
}

/**
 * Lightweight Dependency Injection Container
 * Supports singleton, scoped, and transient lifetimes
 * Includes circular dependency detection
 */
export class DIContainer {
  private services: Map<string, ServiceDescriptor<any>> = new Map()
  private singletonInstances: Map<string, any> = new Map()
  private scopedInstances: Map<string, any> = new Map()
  private resolutionStack: Set<string> = new Set()

  /**
   * Register a service with singleton lifetime
   */
  registerSingleton<T>(key: string, factory: ServiceFactory<T>): void {
    if (this.services.has(key)) {
      throw RuntimeError.config(`Service already registered: ${key}`)
    }
    this.services.set(key, { key, factory, lifetime: 'singleton' })
  }

  /**
   * Register a service with scoped lifetime
   */
  registerScoped<T>(key: string, factory: ServiceFactory<T>): void {
    if (this.services.has(key)) {
      throw RuntimeError.config(`Service already registered: ${key}`)
    }
    this.services.set(key, { key, factory, lifetime: 'scoped' })
  }

  /**
   * Register a service with transient lifetime
   */
  registerTransient<T>(key: string, factory: ServiceFactory<T>): void {
    if (this.services.has(key)) {
      throw RuntimeError.config(`Service already registered: ${key}`)
    }
    this.services.set(key, { key, factory, lifetime: 'transient' })
  }

  /**
   * Register an instance as a singleton
   */
  registerInstance<T>(key: string, instance: T): void {
    if (this.services.has(key)) {
      throw RuntimeError.config(`Service already registered: ${key}`)
    }
    this.services.set(key, { key, factory: () => instance, lifetime: 'singleton' })
    this.singletonInstances.set(key, instance)
  }

  /**
   * Resolve a service
   */
  resolve<T>(key: string): T {
    // Detect circular dependencies
    if (this.resolutionStack.has(key)) {
      const chain = Array.from(this.resolutionStack).join(' -> ')
      throw RuntimeError.dependency(`Circular dependency detected: ${chain} -> ${key}`)
    }

    const descriptor = this.services.get(key)
    if (!descriptor) {
      throw RuntimeError.notFound(`Service not registered: ${key}`)
    }

    // Check singleton cache
    if (descriptor.lifetime === 'singleton' && this.singletonInstances.has(key)) {
      return this.singletonInstances.get(key)
    }

    // Check scoped cache
    if (descriptor.lifetime === 'scoped' && this.scopedInstances.has(key)) {
      return this.scopedInstances.get(key)
    }

    // Create instance
    this.resolutionStack.add(key)
    try {
      const instance = descriptor.factory(this)

      // Cache based on lifetime
      if (descriptor.lifetime === 'singleton') {
        this.singletonInstances.set(key, instance)
      } else if (descriptor.lifetime === 'scoped') {
        this.scopedInstances.set(key, instance)
      }

      return instance
    } finally {
      this.resolutionStack.delete(key)
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered(key: string): boolean {
    return this.services.has(key)
  }

  /**
   * Get registration info for a service
   */
  getRegistrationInfo(key: string): DIServiceRegistrationInfo | undefined {
    const descriptor = this.services.get(key)
    if (!descriptor) return undefined

    return {
      key: descriptor.key,
      lifetime: descriptor.lifetime,
    }
  }

  /**
   * List all registered services with lifetimes
   */
  listRegistrations(): DIServiceRegistrationInfo[] {
    return Array.from(this.services.values()).map((descriptor) => ({
      key: descriptor.key,
      lifetime: descriptor.lifetime,
    }))
  }

  /**
   * Clear scoped instances (typically done between requests)
   */
  clearScope(): void {
    this.scopedInstances.clear()
  }

  /**
   * Clear all registrations and instances (for testing)
   */
  clear(): void {
    this.services.clear()
    this.singletonInstances.clear()
    this.scopedInstances.clear()
  }
}
