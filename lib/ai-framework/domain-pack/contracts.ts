import type {
  ConfidenceScore,
  IsoDateTime,
  LifecycleState,
  Metadata,
  RiskLevel,
  TenantId,
  VersionString,
} from '@/lib/ai-framework/types/base'

export type DomainPackLifecycleState = LifecycleState

export const DOMAIN_PACK_LIFECYCLE_STATES = [
  'proposed',
  'registered',
  'certified',
  'active',
  'deprecated',
  'retired',
] as const

/**
 * Domain Pack Identity - Core identification and versioning
 */
export interface DomainPackIdentity {
  id: string
  name: string
  product: string
  owner: string
  version: VersionString
  compatibleCoreVersions: string[]
  state: DomainPackLifecycleState
  description?: string
  maintainer?: string
  homepage?: string
  repository?: string
}

/**
 * Domain Pack Manifest - Extension points and dependencies
 */
export interface DomainPackManifest {
  identity: DomainPackIdentity
  requiredContextSources: string[]
  optionalContextSources: string[]
  skillKeys: string[]
  validationExtensions: string[]
  complianceExtensions: string[]
  workflowExtensions: string[]
  memoryExtensions: string[]
  assetExtensions: string[]
  dependencies: string[]
}

/**
 * Domain Pack Registration - Discovery and metadata
 */
export interface DomainPackRegistration {
  domainPackId: string
  tenantId: TenantId
  manifest: DomainPackManifest
  registeredAt: IsoDateTime
  registeredBy: string
  metadata: Metadata
  tags: string[]
}

/**
 * Compatibility Rule - Version and feature compatibility checks
 */
export interface DomainPackCompatibilityRule {
  ruleId: string
  description: string
  severity: RiskLevel
  blocking: boolean
}

/**
 * Compatibility Matrix - Multi-version compatibility specification
 */
export interface DomainPackCompatibilityMatrix {
  domainPackId: string
  version: VersionString
  minimumCoreVersion: VersionString
  maximumCoreVersion?: VersionString
  supportedDomainPackVersions: VersionString[]
  breakingChanges: string[]
  migrationRequired: boolean
  downgradePolicy: 'unsupported' | 'best-effort' | 'supported'
  rules: DomainPackCompatibilityRule[]
}

/**
 * Test Requirement - Certification test gates
 */
export interface DomainPackTestRequirement {
  requirementId: string
  description: string
  required: boolean
  gateName:
    | 'contract-conformance'
    | 'tenant-isolation'
    | 'security'
    | 'compliance'
    | 'workflow'
    | 'performance'
    | 'cost-envelope'
}

/**
 * Certification Result - Individual test gate result
 */
export interface DomainPackCertificationResult {
  resultId: string
  testRequirement: DomainPackTestRequirement
  passed: boolean
  evidence?: string
  details?: string
  testedAt: IsoDateTime
  testedBy: string
}

/**
 * Certification Contract - Full certification evidence and approval
 */
export interface DomainPackCertification {
  certificationId: string
  domainPackId: string
  version: VersionString
  contractConformance: boolean
  compatibilityValidation: boolean
  securityValidation: boolean
  performanceEnvelope: boolean
  costEnvelope: boolean
  testingCompletion: boolean
  documentationCompletion: boolean
  governanceCompliance: boolean
  results: DomainPackCertificationResult[]
  approvedBy?: string
  approvedAt?: IsoDateTime
  certifiedAt: IsoDateTime
  expiresAt?: IsoDateTime
  status: 'pending' | 'approved' | 'rejected' | 'expired'
}

/**
 * Migration Plan - Version upgrade/downgrade specifications
 */
export interface DomainPackMigrationPlan {
  planId: string
  fromVersion: VersionString
  toVersion: VersionString
  stateTransitions: DomainPackLifecycleState[]
  dataRequirements: string[]
  workflowRequirements: string[]
  compatibilityValidation: string
  acceptanceCriteria: string[]
  risks: DomainPackMigrationRisk[]
  rollbackPlan?: DomainPackRollbackPlan
  estimatedDuration: number
}

/**
 * Migration Risk - Identified risk during migration
 */
export interface DomainPackMigrationRisk {
  riskId: string
  severity: RiskLevel
  description: string
  mitigationStrategy: string
}

/**
 * Rollback Plan - Rollback procedures and requirements
 */
export interface DomainPackRollbackPlan {
  stateTransitions: DomainPackLifecycleState[]
  dataRestoreRequirements: string[]
  workflowRevert: string[]
  validationSteps: string[]
  estimatedDuration: number
}

/**
 * Dependency Specification - Single dependency requirement
 */
export interface DomainPackDependency {
  packageId: string
  minVersion?: VersionString
  maxVersion?: VersionString
  optional: boolean
  conflictingPackages?: string[]
}

/**
 * Dependency Health - Dependency graph validation
 */
export interface DomainPackDependencyHealth {
  domainPackId: string
  version: VersionString
  hasCyclicDependencies: boolean
  cyclicDependencies?: string[][]
  allDependenciesResolvable: boolean
  unresolvedDependencies?: string[]
  versionConflicts?: string[]
  orphanedDependencies?: string[]
  lastValidatedAt: IsoDateTime
}

/**
 * Domain Pack Lifecycle Transition Rule
 */
export interface DomainPackLifecycleTransitionRule {
  from: DomainPackLifecycleState
  to: DomainPackLifecycleState
  allowed: boolean
  requiresApproval: boolean
  requiresCertification: boolean
  requiresCompatibilityValidation: boolean
  requiresMigrationPlan: boolean
  notes?: string
}

/**
 * Standard Domain Pack Lifecycle Transition Rules
 */
export const DOMAIN_PACK_LIFECYCLE_TRANSITIONS: DomainPackLifecycleTransitionRule[] = [
  {
    from: 'proposed',
    to: 'registered',
    allowed: true,
    requiresApproval: true,
    requiresCertification: false,
    requiresCompatibilityValidation: true,
    requiresMigrationPlan: false,
    notes: 'Manifest reviewed and compatibility validated',
  },
  {
    from: 'registered',
    to: 'certified',
    allowed: true,
    requiresApproval: true,
    requiresCertification: true,
    requiresCompatibilityValidation: true,
    requiresMigrationPlan: false,
    notes: 'All test gates passed and certified',
  },
  {
    from: 'registered',
    to: 'proposed',
    allowed: true,
    requiresApproval: false,
    requiresCertification: false,
    requiresCompatibilityValidation: false,
    requiresMigrationPlan: false,
    notes: 'Return to proposed for revisions',
  },
  {
    from: 'certified',
    to: 'active',
    allowed: true,
    requiresApproval: true,
    requiresCertification: false,
    requiresCompatibilityValidation: false,
    requiresMigrationPlan: false,
    notes: 'Ready for production deployment',
  },
  {
    from: 'active',
    to: 'deprecated',
    allowed: true,
    requiresApproval: true,
    requiresCertification: false,
    requiresCompatibilityValidation: false,
    requiresMigrationPlan: true,
    notes: 'Migration plan required for active users',
  },
  {
    from: 'deprecated',
    to: 'retired',
    allowed: true,
    requiresApproval: true,
    requiresCertification: false,
    requiresCompatibilityValidation: false,
    requiresMigrationPlan: false,
    notes: 'Remove from all tenants before retirement',
  },
  {
    from: 'active',
    to: 'retired',
    allowed: true,
    requiresApproval: true,
    requiresCertification: false,
    requiresCompatibilityValidation: false,
    requiresMigrationPlan: true,
    notes: 'Direct retirement requires emergency approval and migration',
  },
]

/**
 * Domain Pack Health Report - Comprehensive health status
 */
export interface DomainPackHealth {
  domainPackId: string
  version: VersionString
  registrationStatus: 'unregistered' | 'registered' | 'active' | 'deprecated'
  certificationStatus: 'not-certified' | 'certified' | 'expired'
  compatibilityStatus: 'compatible' | 'incompatible' | 'unknown'
  securityStatus: 'pass' | 'warning' | 'fail'
  documentationStatus: 'complete' | 'incomplete' | 'outdated'
  testingStatus: 'all-pass' | 'some-fail' | 'untested'
  versionHealth: 'current' | 'outdated' | 'unsupported'
  dependencyHealth: DomainPackDependencyHealth
  governanceHealth: 'compliant' | 'warning' | 'non-compliant'
  overallHealthScore: number
  lastAssessedAt: IsoDateTime
  assessedBy: string
}

/**
 * Manifest Metadata - Consistency with Batch 3 PublicContractMetadata
 */
export interface DomainPackMetadata {
  domainPackId: string
  owner: string
  responsibility: string
  primaryConsumers: string[]
  dependencies: string[]
  stabilityLevel: 'experimental' | 'internal' | 'stable' | 'frozen' | 'deprecated'
  version: VersionString
  reviewFrequencyDays: number
  lastReviewedAt?: IsoDateTime
}

/**
 * Governance Contract - Unified governance rules for domain packs
 */
export interface DomainPackGovernanceContract {
  lifecycleRules: DomainPackLifecycleTransitionRule[]
  certificationRequirements: {
    minimumTestCoverage: number
    requiredGates: string[]
    requiresSecurityScan: boolean
    requiresPerformanceTest: boolean
    requiresCostAnalysis: boolean
  }
  compatibilityPolicy: {
    minimumCoreVersionRequired: VersionString
    supportedVersions: VersionString[]
    breakingChangePolicy: 'deprecated-first' | 'migration-required' | 'immediate'
  }
  migrationPolicy: {
    requiresPlannedMigration: boolean
    maxDowntimeDays: number
    requiresRollbackPlan: boolean
  }
}
