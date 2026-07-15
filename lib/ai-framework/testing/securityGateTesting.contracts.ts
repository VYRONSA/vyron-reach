import type {
  IsoDateTime,
  RiskLevel,
  VersionString,
} from '@/lib/ai-framework/types/base'

/**
 * Prompt Injection Test - Validates prompt injection attack prevention
 */
export interface PromptInjectionTest {
  testId: string
  description: string
  injectionPayloads: string[]
  validatesInputSanitization: boolean
  validatesOutputValidation: boolean
  validatesContextConfinement: boolean
}

/**
 * Asset Poisoning Test - Validates asset poisoning attack prevention
 */
export interface AssetPoisoningTest {
  testId: string
  description: string
  assetType: string
  validatesAssetSignature: boolean
  validatesAssetContent: boolean
  validatesAssetVersioning: boolean
  validatesAssetSource: boolean
}

/**
 * Permission Escalation Test - Validates permission escalation prevention
 */
export interface PermissionEscalationTest {
  testId: string
  description: string
  validatesRoleBasedAccess: boolean
  validatesAttributeBasedAccess: boolean
  validatesTenantBoundaries: boolean
  validatesPrivilegeNonRepudiation: boolean
}

/**
 * Workflow Authorization Test - Validates workflow authorization
 */
export interface WorkflowAuthorizationTest {
  testId: string
  description: string
  workflowName: string
  validatesExecutionAuthorization: boolean
  validatesTransitionAuthorization: boolean
  validatesContextAccess: boolean
}

/**
 * Provider Isolation Test - Validates provider isolation and sandboxing
 */
export interface ProviderIsolationTest {
  testId: string
  description: string
  providerType: string
  validatesProviderSandboxing: boolean
  validatesRequestIsolation: boolean
  validatesResponseIsolation: boolean
  validatesStateIsolation: boolean
}

/**
 * Audit Integrity Test - Validates audit trail integrity
 */
export interface AuditIntegrityTest {
  testId: string
  description: string
  validatesAuditTrailCompleteness: boolean
  validatesAuditTrailImmutability: boolean
  validatesAuditTrailTamperDetection: boolean
  validatesAuditTrailRetention: boolean
}

/**
 * Cost Protection Test - Validates cost protection mechanisms
 */
export interface CostProtectionTest {
  testId: string
  description: string
  validatesRequestThrottling: boolean
  validatesUsageQuotas: boolean
  validatesCostAlerts: boolean
  validatesCostCaps: boolean
}

/**
 * Secrets Validation Test - Validates secrets handling and protection
 */
export interface SecretsValidationTest {
  testId: string
  description: string
  secretType: string
  validatesSecretEncryption: boolean
  validatesSecretAccess: boolean
  validatesSecretRotation: boolean
  validatesSecretAudit: boolean
  validatesSecretNeverLogged: boolean
}

/**
 * Compliance Validation Test - Validates compliance controls
 */
export interface ComplianceValidationTest {
  testId: string
  description: string
  complianceFramework: string
  validatesDataProtection: boolean
  validatesPrivacy: boolean
  validatesRetention: boolean
  validatesConsent: boolean
}

/**
 * Security Gate Test Result - Result of individual security gate test
 */
export interface SecurityGateTestResult {
  resultId: string
  gateId: string
  gateName: string
  passed: boolean
  severity: RiskLevel
  vulnerabilitiesFound?: string[]
  remediationRequired: boolean
  recordedAt: IsoDateTime
  recordedBy: string
}

/**
 * Security Vulnerability - Identified security vulnerability
 */
export interface SecurityVulnerability {
  vulnerabilityId: string
  description: string
  severity: RiskLevel
  cveId?: string
  affectedComponents: string[]
  remediationStrategy: string
  targetRemediationDate?: IsoDateTime
  status: 'open' | 'mitigated' | 'resolved'
}

/**
 * Security Test Report - Complete security testing report
 */
export interface SecurityTestReport {
  reportId: string
  timestamp: IsoDateTime
  testedBy: string
  version: VersionString
  totalTests: number
  passedTests: number
  failedTests: number
  vulnerabilitiesDetected: number
  criticalVulnerabilities: number
  highRiskVulnerabilities: number
  vulnerabilities: SecurityVulnerability[]
  overallStatus: 'pass' | 'fail'
  clearanceRequired: boolean
}
