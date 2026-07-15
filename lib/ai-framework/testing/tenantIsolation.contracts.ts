import type { IsoDateTime, TenantId } from '@/lib/ai-framework/types/base'

/**
 * Tenant Boundary Verification Test - Validates tenant boundary integrity
 */
export interface TenantBoundaryVerificationTest {
  testId: string
  tenantA: TenantId
  tenantB: TenantId
  description: string
  validatesContextIsolation: boolean
  validatesSkillIsolation: boolean
  validatesMemoryIsolation: boolean
  validatesEventIsolation: boolean
}

/**
 * Cross-Tenant Access Validation Test - Verifies cross-tenant access is prevented
 */
export interface CrossTenantAccessValidationTest {
  testId: string
  sourceTenanId: TenantId
  targetTenantId: TenantId
  attemptedAccessType:
    | 'context'
    | 'skill'
    | 'memory'
    | 'asset'
    | 'event'
    | 'workflow'
  expectedBlocked: boolean
  validatesAuthenticationCheck: boolean
  validatesAuthorizationCheck: boolean
}

/**
 * Tenant Data Leakage Detection Test - Detects potential data leakage
 */
export interface TenantDataLeakageDetectionTest {
  testId: string
  tenantA: TenantId
  tenantB: TenantId
  description: string
  validatesContextLeakage: boolean
  validatesMemoryLeakage: boolean
  validatesAssetLeakage: boolean
  validatesEventLeakage: boolean
  validatesMetadataLeakage: boolean
}

/**
 * Tenant Identity Validation Test - Validates tenant identity throughout lifecycle
 */
export interface TenantIdentityValidationTest {
  testId: string
  tenantId: TenantId
  description: string
  validatesIdentityHeaderPresence: boolean
  validatesIdentityHeaderImmutability: boolean
  validatesIdentityPropagation: boolean
  validatesIdentityValidationOnEntry: boolean
  validatesIdentityValidationOnExit: boolean
}

/**
 * Tenant Event Isolation Test - Validates event isolation between tenants
 */
export interface TenantEventIsolationTest {
  testId: string
  publishingTenant: TenantId
  otherTenant: TenantId
  eventType: string
  description: string
  validatesEventFiltering: boolean
  validatesEventClassification: boolean
  validatesEventSubscriptionIsolation: boolean
}

/**
 * Tenant Memory Isolation Test - Validates memory isolation between tenants
 */
export interface TenantMemoryIsolationTest {
  testId: string
  tenantA: TenantId
  tenantB: TenantId
  memoryType: 'short-term' | 'long-term' | 'episodic' | 'semantic'
  description: string
  validatesMemoryStoreIsolation: boolean
  validatesMemoryRetrievalIsolation: boolean
  validatesMemoryUpdateIsolation: boolean
}

/**
 * Tenant Asset Isolation Test - Validates asset isolation between tenants
 */
export interface TenantAssetIsolationTest {
  testId: string
  tenantA: TenantId
  tenantB: TenantId
  assetType: string
  description: string
  validatesAssetStoreIsolation: boolean
  validatesAssetRetrievalIsolation: boolean
  validatesAssetPermissions: boolean
}

/**
 * Tenant Isolation Test Case - Individual tenant isolation test
 */
export interface TenantIsolationTestCase {
  id: string
  description: string
  tenantA: TenantId
  tenantB: TenantId
  expectedIsolation: true
  testType:
    | 'boundary'
    | 'cross-access'
    | 'leakage'
    | 'identity'
    | 'event'
    | 'memory'
    | 'asset'
}

/**
 * Tenant Isolation Test Result - Result of individual tenant isolation test
 */
export interface TenantIsolationTestResult {
  resultId: string
  testCase: TenantIsolationTestCase
  passed: boolean
  isolationBreaches?: string[]
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Tenant Isolation Suite - Complete tenant isolation test suite
 */
export interface TenantIsolationSuite {
  suiteId: 'tenant-isolation-core'
  required: true
  version: string
  cases: TenantIsolationTestCase[]
  results: TenantIsolationTestResult[]
  overallStatus: 'pass' | 'fail'
  lastExecutedAt?: IsoDateTime
}

/**
 * Tenant Isolation Health - Health status of tenant isolation
 */
export interface TenantIsolationHealth {
  healthCheckId: string
  lastCheckedAt: IsoDateTime
  checkedBy: string
  totalTestCases: number
  passedTestCases: number
  failedTestCases: number
  isolationBreaches: number
  isolationBreachDetailsDetected: string[]
  overallStatus: 'healthy' | 'degraded' | 'compromised'
}
