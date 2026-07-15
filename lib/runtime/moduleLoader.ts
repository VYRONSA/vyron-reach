import type { VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import { ComponentRegistry } from './registries'

/**
 * Runtime Module Metadata - Required metadata for all runtime modules
 */
export interface RuntimeModuleMetadata {
  id: string
  name: string
  version: VersionString
  contractVersion: VersionString
  dependencies: string[]
  author?: string
  description?: string
}

/**
 * Runtime Module - Standard interface for all runtime modules
 */
export interface RuntimeModule {
  metadata: RuntimeModuleMetadata
  validate(): Promise<void>
  initialize?(): Promise<void>
  start?(): Promise<void>
  stop?(): Promise<void>
}

/**
 * Runtime Module Loader - Discovers, validates, and registers modules
 */
export class RuntimeModuleLoader {
  constructor(private componentRegistry: ComponentRegistry) {}

  /**
   * Validate module metadata
   */
  private validateMetadata(metadata: RuntimeModuleMetadata): void {
    if (!metadata.id) throw RuntimeError.validation('Module ID is required')
    if (!metadata.name) throw RuntimeError.validation('Module name is required')
    if (!metadata.version) throw RuntimeError.validation('Module version is required')
    if (!metadata.contractVersion) throw RuntimeError.validation('Module contract version is required')
    if (!Array.isArray(metadata.dependencies)) throw RuntimeError.validation('Module dependencies must be an array')
  }

  /**
   * Validate contract compatibility
   */
  private validateContractCompatibility(
    moduleContractVersion: VersionString,
    expectedContractVersion: VersionString
  ): void {
    // Simple semver-like check: major version must match
    const [moduleMajor] = moduleContractVersion.split('.')
    const [expectedMajor] = expectedContractVersion.split('.')

    if (moduleMajor !== expectedMajor) {
      throw RuntimeError.incompatible(
        `Module contract version ${moduleContractVersion} incompatible with expected ${expectedContractVersion}`,
        { moduleVersion: moduleContractVersion, expectedVersion: expectedContractVersion }
      )
    }
  }

  /**
   * Check dependencies are resolvable
   */
  private validateDependencies(
    moduleId: string,
    dependencies: string[],
    loadedModules: Map<string, RuntimeModule>
  ): void {
    for (const dep of dependencies) {
      if (!loadedModules.has(dep) && !this.componentRegistry.isRegistered(dep)) {
        throw RuntimeError.dependency(
          `Module ${moduleId} depends on ${dep} which is not available`,
          { moduleId, missingDependency: dep }
        )
      }
    }
  }

  /**
   * Load a module
   */
  async loadModule(
    module: RuntimeModule,
    expectedContractVersion: VersionString,
    loadedModules: Map<string, RuntimeModule> = new Map()
  ): Promise<void> {
    const { metadata } = module

    // Validate metadata
    this.validateMetadata(metadata)

    // Check if already loaded
    if (loadedModules.has(metadata.id)) {
      throw RuntimeError.config(`Module already loaded: ${metadata.id}`)
    }

    // Validate contract compatibility
    this.validateContractCompatibility(metadata.contractVersion, expectedContractVersion)

    // Validate dependencies
    this.validateDependencies(metadata.id, metadata.dependencies, loadedModules)

    // Run module validation
    try {
      await module.validate()
    } catch (error) {
      throw RuntimeError.config(
        `Module validation failed for ${metadata.id}: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Mark as loaded
    loadedModules.set(metadata.id, module)

    // Initialize if provided
    if (module.initialize) {
      try {
        await module.initialize()
      } catch (error) {
        throw RuntimeError.config(
          `Module initialization failed for ${metadata.id}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  /**
   * Load multiple modules
   */
  async loadModules(
    modules: RuntimeModule[],
    expectedContractVersion: VersionString
  ): Promise<Map<string, RuntimeModule>> {
    const loadedModules: Map<string, RuntimeModule> = new Map()

    // Load modules in order (simple approach - no topological sorting)
    for (const module of modules) {
      await this.loadModule(module, expectedContractVersion, loadedModules)
    }

    return loadedModules
  }

  /**
   * Start all loaded modules
   */
  async startModules(modules: Map<string, RuntimeModule>): Promise<void> {
    for (const [moduleId, module] of modules) {
      if (module.start) {
        try {
          await module.start()
        } catch (error) {
          throw RuntimeError.config(
            `Module start failed for ${moduleId}: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
    }
  }

  /**
   * Stop all loaded modules (in reverse order)
   */
  async stopModules(modules: Map<string, RuntimeModule>): Promise<void> {
    const moduleArray = Array.from(modules.values()).reverse()
    for (const module of moduleArray) {
      if (module.stop) {
        try {
          await module.stop()
        } catch (error) {
          // Log error but continue stopping other modules
          console.error(`Module stop failed for ${module.metadata.id}:`, error)
        }
      }
    }
  }
}
