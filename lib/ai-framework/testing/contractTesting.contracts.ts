import type { IsoDateTime, VersionString } from '@/lib/ai-framework/types/base'

/**
 * Contract Test Case - Individual contract conformance test
 */
export interface ContractTestCase {
  id: string
  contract: string
  description: string
  required: boolean
  validatesConformance: boolean
  validatesBackwardCompatibility?: boolean
  validatesBreakingChanges?: boolean
}

/**
 * Contract Test Suite - Collection of contract tests
 */
export interface ContractTestSuite {
  suiteId: string
  contracts: string[]
  cases: ContractTestCase[]
  version: VersionString
}

/**
 * Public Contract Conformance Test - Validates public contract adherence
 */
export interface PublicContractConformanceTest {
  testId: string
  contractId: string
  contractPath: string
  validatesMetadata: boolean
  validatesStability: boolean
  validatesOwnership: boolean
  validatesDependencies: boolean
  validatesVersioning: boolean
  validatesReviewCycle: boolean
}

/**
 * Interface Compatibility Test - Validates interface compatibility across versions
 */
export interface InterfaceCompatibilityTest {
  testId: string
  interfaceName: string
  currentVersion: VersionString
  previousVersion: VersionString
  validatesMethods: boolean
  validatesProperties: boolean
  validatesReturnTypes: boolean
  validatesParameterTypes: boolean
}

/**
 * Backward Compatibility Test - Validates backward compatibility
 */
export interface BackwardCompatibilityTest {
  testId: string
  fromVersion: VersionString
  toVersion: VersionString
  validatesMigrationPath: boolean
  validatesDataFormat: boolean
  validatesApiSignature: boolean
  validatesDeprecationNotice: boolean
}

/**
 * Breaking Change Detection Test - Detects breaking changes
 */
export interface BreakingChangeDetectionTest {
  testId: string
  fromVersion: VersionString
  toVersion: VersionString
  detectedBreakingChanges: string[]
  requiredMigration: boolean
  migrationPathDocumented: boolean
  deprecationRequired: boolean
}

/**
 * Schema Validation Test - Validates schema conformance
 */
export interface SchemaValidationTest {
  testId: string
  schemaName: string
  schemaPath: string
  validatesStructure: boolean
  validatesFields: boolean
  validatesTypes: boolean
  validatesConstraints: boolean
  validatesDefaults: boolean
}

/**
 * API Contract Validation Test - Validates API contract adherence
 */
export interface ApiContractValidationTest {
  testId: string
  apiName: string
  validatesEndpoints: boolean
  validatesParameters: boolean
  validatesResponses: boolean
  validatesStatusCodes: boolean
  validatesErrorHandling: boolean
  validatesRateLimits: boolean
  validatesAuthentication: boolean
}

/**
 * Domain Pack Contract Validation Test - Validates domain pack manifest compliance
 */
export interface DomainPackContractValidationTest {
  testId: string
  domainPackId: string
  version: VersionString
  validatesManifest: boolean
  validatesExtensionPoints: boolean
  validatesDependencies: boolean
  validatesCompatibilityMatrix: boolean
  validatesMetadata: boolean
  validatesLifecycleTransitions: boolean
}

/**
 * Contract Test Result - Aggregated result of contract testing
 */
export interface ContractTestResult {
  resultId: string
  testCase: ContractTestCase
  passed: boolean
  message: string
  violations?: string[]
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Contract Test Report - Complete contract testing report
 */
export interface ContractTestReport {
  reportId: string
  suiteId: string
  timestamp: IsoDateTime
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  results: ContractTestResult[]
  overallStatus: 'pass' | 'fail'
}
