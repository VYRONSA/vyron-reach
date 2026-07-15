import type { VaiosCoreConfig, TenantPolicyConfig, FeatureFlagConfig } from '@/lib/ai-framework/config/contracts'
import { RuntimeError } from './errors'

/**
 * Runtime Configuration - Aggregated configuration for the runtime
 */
export interface RuntimeConfiguration {
  core: VaiosCoreConfig
  tenantPolicies: Map<string, TenantPolicyConfig>
  featureFlags: Map<string, FeatureFlagConfig>
}

/**
 * Runtime Configuration Loader - Loads and validates configuration
 */
export class RuntimeConfigurationLoader {
  /**
   * Validate core configuration
   */
  private validateCoreConfig(config: VaiosCoreConfig): void {
    if (!config.version) throw RuntimeError.config('Core config version is required')
    if (!config.environment) throw RuntimeError.config('Environment is required')
    if (!config.serviceName) throw RuntimeError.config('Service name is required')
    if (!config.defaultEventVersion) throw RuntimeError.config('Default event version is required')
    if (!config.defaultDecisionLedgerVersion) throw RuntimeError.config('Default decision ledger version is required')
  }

  /**
   * Validate tenant policy configuration
   */
  private validateTenantPolicy(config: TenantPolicyConfig): void {
    if (!config.version) throw RuntimeError.config('Tenant policy version is required')
    if (!config.tenantId) throw RuntimeError.config('Tenant ID is required')
    if (config.monthlyCostLimitUsd < 0) throw RuntimeError.config('Monthly cost limit cannot be negative')
    if (!Array.isArray(config.allowedProviders)) throw RuntimeError.config('Allowed providers must be an array')
    if (!Array.isArray(config.requiredSecurityGates)) throw RuntimeError.config('Required security gates must be an array')
  }

  /**
   * Validate feature flag configuration
   */
  private validateFeatureFlag(config: FeatureFlagConfig): void {
    if (!config.version) throw RuntimeError.config('Feature flag version is required')
    if (!config.key) throw RuntimeError.config('Feature flag key is required')
    if (!config.owner) throw RuntimeError.config('Feature flag owner is required')
    if (config.description && typeof config.description !== 'string') throw RuntimeError.config('Description must be a string')
  }

  /**
   * Load core configuration
   */
  loadCoreConfig(config: VaiosCoreConfig): VaiosCoreConfig {
    this.validateCoreConfig(config)
    return config
  }

  /**
   * Load tenant policy configuration
   */
  loadTenantPolicy(config: TenantPolicyConfig): TenantPolicyConfig {
    this.validateTenantPolicy(config)
    return config
  }

  /**
   * Load feature flag configuration
   */
  loadFeatureFlag(config: FeatureFlagConfig): FeatureFlagConfig {
    this.validateFeatureFlag(config)
    return config
  }

  /**
   * Load complete runtime configuration
   */
  loadConfiguration(
    coreConfig: VaiosCoreConfig,
    tenantPolicies: TenantPolicyConfig[] = [],
    featureFlags: FeatureFlagConfig[] = []
  ): RuntimeConfiguration {
    const core = this.loadCoreConfig(coreConfig)

    const tenantPoliciesMap = new Map<string, TenantPolicyConfig>()
    for (const policy of tenantPolicies) {
      this.validateTenantPolicy(policy)
      tenantPoliciesMap.set(policy.tenantId, policy)
    }

    const featureFlagsMap = new Map<string, FeatureFlagConfig>()
    for (const flag of featureFlags) {
      this.validateFeatureFlag(flag)
      featureFlagsMap.set(flag.key, flag)
    }

    return {
      core,
      tenantPolicies: tenantPoliciesMap,
      featureFlags: featureFlagsMap,
    }
  }

  /**
   * Get tenant policy (returns default if not found)
   */
  getTenantPolicy(
    config: RuntimeConfiguration,
    tenantId: string,
    defaultPolicy?: TenantPolicyConfig
  ): TenantPolicyConfig {
    const policy = config.tenantPolicies.get(tenantId)
    if (policy) return policy

    if (defaultPolicy) return defaultPolicy

    throw RuntimeError.notFound(`No policy found for tenant ${tenantId}`)
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(config: RuntimeConfiguration, featureKey: string): boolean {
    const flag = config.featureFlags.get(featureKey)
    if (!flag) return false

    // Check if expired
    if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
      return false
    }

    return flag.defaultEnabled
  }
}
