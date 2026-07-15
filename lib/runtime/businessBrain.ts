import type { ConfidenceScore, IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type KnowledgeDomain,
  type KnowledgeLifecycleStatus,
  type KnowledgeRegistrationInput,
  type KnowledgeRelationshipInput,
  type RegistrationDiagnostic,
} from './validation'

export type RuntimeKnowledgeTrustLevel = 'untrusted' | 'candidate' | 'trusted' | 'authoritative'

export interface KnowledgeOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface KnowledgeStewardship {
  stewardId: string
  stewardType: 'team' | 'role' | 'individual'
}

export interface RuntimeKnowledgeProvenance {
  source: string
  sourceType: 'system' | 'human' | 'external'
  capturedAt: IsoDateTime
  confidence: ConfidenceScore
}

export interface KnowledgeFreshness {
  updatedAt: IsoDateTime
  staleAfterMs: number
}

export interface RuntimeKnowledgeGovernance {
  ownership: KnowledgeOwnership
  stewardship: KnowledgeStewardship
  provenance: RuntimeKnowledgeProvenance
  confidence: ConfidenceScore
  freshness: KnowledgeFreshness
  trustLevel: RuntimeKnowledgeTrustLevel
  version: VersionString
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  lifecycleStatus: KnowledgeLifecycleStatus
}

export interface KnowledgeReference {
  referenceId: string
  type: 'document' | 'asset' | 'record' | 'decision' | 'external'
  label: string
  target: string
  metadata?: Metadata
}

export interface KnowledgeRelationship {
  relationshipId: string
  type: 'parent' | 'child' | 'dependency' | 'reference' | 'traceability' | 'decision' | 'domain'
  sourceKnowledgeId: string
  targetKnowledgeId: string
  metadata?: Metadata
}

export interface KnowledgeMetadata {
  knowledgeId: string
  title: string
  domain: KnowledgeDomain
  classification: string
  version: VersionString
  contractVersion: VersionString
  references: KnowledgeReference[]
  relationships: KnowledgeRelationship[]
  governance: RuntimeKnowledgeGovernance
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface KnowledgeRegistration extends KnowledgeRegistrationInput {
  metadataModel: KnowledgeMetadata
  registeredAt: IsoDateTime
}

export interface KnowledgeDomainDescriptor {
  domainId: KnowledgeDomain
  name: string
  description: string
  metadata?: Metadata
}

export interface BusinessKnowledgeModel {
  modelId: string
  version: VersionString
  domains: KnowledgeDomainDescriptor[]
  entries: KnowledgeRegistration[]
  createdAt: IsoDateTime
}

export interface KnowledgeCatalogEntry {
  knowledgeId: string
  title: string
  domain: KnowledgeDomain
  classification: string
  version: VersionString
  trustLevel: RuntimeKnowledgeTrustLevel
}

export interface KnowledgeCatalog {
  entries: KnowledgeCatalogEntry[]
  generatedAt: IsoDateTime
  version: VersionString
}

export interface BusinessBrainValidationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalDiagnostics: number
  errorCount: number
  warningCount: number
  lastValidatedAt?: IsoDateTime
}

export interface KnowledgeLifecycleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  trackedCount: number
  byStatus: Record<KnowledgeLifecycleStatus, number>
  invalidTransitions: number
  lastTransitionAt?: IsoDateTime
}

export interface BusinessBrainHealth {
  registry: RegistryHealthSummary
  validation: BusinessBrainValidationHealth
  lifecycle: KnowledgeLifecycleHealth
}

export interface KnowledgeLookup {
  byId(knowledgeId: string): KnowledgeRegistration | undefined
  byDomain(domain: KnowledgeDomain): KnowledgeRegistration[]
  byClassification(classification: string): KnowledgeRegistration[]
  byVersion(version: VersionString): KnowledgeRegistration[]
}

const DEFAULT_DOMAINS: KnowledgeDomainDescriptor[] = [
  { domainId: 'company-identity', name: 'Company Identity', description: 'Enterprise identity and profile knowledge' },
  { domainId: 'mission', name: 'Mission', description: 'Mission statements and intent knowledge' },
  { domainId: 'vision', name: 'Vision', description: 'Long-term vision knowledge' },
  { domainId: 'values', name: 'Values', description: 'Core values and principles' },
  { domainId: 'products', name: 'Products', description: 'Product portfolio knowledge' },
  { domainId: 'services', name: 'Services', description: 'Service catalog knowledge' },
  { domainId: 'customers', name: 'Customers', description: 'Customer and account knowledge' },
  { domainId: 'personas', name: 'Personas', description: 'Persona and audience knowledge' },
  { domainId: 'competitors', name: 'Competitors', description: 'Competitor intelligence knowledge' },
  { domainId: 'pricing', name: 'Pricing', description: 'Pricing and packaging knowledge' },
  { domainId: 'marketing', name: 'Marketing', description: 'Marketing knowledge and strategy' },
  { domainId: 'sales', name: 'Sales', description: 'Sales process and intelligence knowledge' },
  { domainId: 'operations', name: 'Operations', description: 'Operational models and procedures' },
  { domainId: 'finance', name: 'Finance', description: 'Financial context and metrics' },
  { domainId: 'policies', name: 'Policies', description: 'Policy and compliance knowledge' },
  { domainId: 'constraints', name: 'Constraints', description: 'Business and operating constraints' },
  { domainId: 'strategic-objectives', name: 'Strategic Objectives', description: 'Strategic objective definitions' },
  { domainId: 'kpis', name: 'KPIs', description: 'KPI definitions and targets' },
  { domainId: 'documents', name: 'Documents', description: 'Document references and metadata' },
  { domainId: 'assets', name: 'Assets', description: 'Asset inventory and references' },
  { domainId: 'historical-decisions', name: 'Historical Decisions', description: 'Decision history and rationale' },
]

function now(): IsoDateTime {
  return new Date().toISOString()
}

function createMetadata(input: KnowledgeRegistrationInput): KnowledgeMetadata {
  return {
    knowledgeId: input.knowledgeId,
    title: input.title,
    domain: input.domain,
    classification: input.classification,
    version: input.version,
    contractVersion: input.contractVersion,
    references: input.references,
    relationships: input.relationships,
    governance: input.governance,
    createdAt: now(),
    metadata: input.metadata,
  }
}

export class KnowledgeDomainRegistry {
  private domains: Map<KnowledgeDomain, KnowledgeDomainDescriptor> = new Map(
    DEFAULT_DOMAINS.map((domain) => [domain.domainId, domain])
  )

  registerDomain(domain: KnowledgeDomainDescriptor): void {
    this.domains.set(domain.domainId, domain)
  }

  getDomain(domainId: KnowledgeDomain): KnowledgeDomainDescriptor | undefined {
    return this.domains.get(domainId)
  }

  listDomains(): KnowledgeDomainDescriptor[] {
    return Array.from(this.domains.values())
  }
}

export class BusinessBrainRegistry implements KnowledgeLookup {
  private knowledge: Map<string, KnowledgeRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(registration: KnowledgeRegistration): KnowledgeRegistration {
    const registrationValidation = this.validation.validateKnowledgeRegistration(
      registration,
      new Set(this.knowledge.keys())
    )
    const metadataValidation = this.validation.validateKnowledgeMetadata(registration.metadataModel)
    const relationshipValidation = this.validation.validateKnowledgeRelationships(
      registration.knowledgeId,
      registration.relationships,
      new Set(this.knowledge.keys())
    )
    const governanceValidation = this.validation.validateKnowledgeGovernance(
      registration.knowledgeId,
      registration.governance
    )

    const diagnostics = [
      ...registrationValidation.diagnostics,
      ...metadataValidation.diagnostics,
      ...relationshipValidation.diagnostics,
      ...governanceValidation.diagnostics,
    ]

    this.diagnostics.push(...diagnostics)

    const valid = diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
    if (!valid) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.knowledgeRegistration('Knowledge registration validation failed', {
        knowledgeId: registration.knowledgeId,
      })
    }

    this.knowledge.set(registration.knowledgeId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  byId(knowledgeId: string): KnowledgeRegistration | undefined {
    return this.knowledge.get(knowledgeId)
  }

  byDomain(domain: KnowledgeDomain): KnowledgeRegistration[] {
    return this.list().filter((record) => record.domain === domain)
  }

  byClassification(classification: string): KnowledgeRegistration[] {
    return this.list().filter((record) => record.classification === classification)
  }

  byVersion(version: VersionString): KnowledgeRegistration[] {
    return this.list().filter((record) => record.version === version)
  }

  list(): KnowledgeRegistration[] {
    return Array.from(this.knowledge.values())
  }

  getRelationships(knowledgeId: string): KnowledgeRelationship[] {
    return this.byId(knowledgeId)?.relationships ?? []
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    const errorCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = this.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registryId: 'business-brain-registry',
      name: 'Business Brain Registry',
      status: errorCount > 0 ? 'degraded' : 'healthy',
      registeredCount: this.knowledge.size,
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

export class KnowledgeLifecycleRegistry {
  private statuses: Map<string, KnowledgeLifecycleStatus> = new Map()
  private invalidTransitions = 0
  private lastTransitionAt?: IsoDateTime

  private transitions: Record<KnowledgeLifecycleStatus, KnowledgeLifecycleStatus[]> = {
    draft: ['review', 'retired'],
    review: ['approved', 'draft', 'retired'],
    approved: ['active', 'retired'],
    active: ['archived', 'retired'],
    archived: ['retired'],
    retired: [],
  }

  transition(knowledgeId: string, to: KnowledgeLifecycleStatus): void {
    const current = this.getStatus(knowledgeId)
    if (!this.transitions[current].includes(to)) {
      this.invalidTransitions += 1
      throw RuntimeError.knowledgeValidation('Invalid knowledge lifecycle transition', {
        knowledgeId,
        from: current,
        to,
      })
    }

    this.statuses.set(knowledgeId, to)
    this.lastTransitionAt = now()
  }

  getStatus(knowledgeId: string): KnowledgeLifecycleStatus {
    return this.statuses.get(knowledgeId) ?? 'draft'
  }

  getHealth(): KnowledgeLifecycleHealth {
    const byStatus: Record<KnowledgeLifecycleStatus, number> = {
      draft: 0,
      review: 0,
      approved: 0,
      active: 0,
      archived: 0,
      retired: 0,
    }

    for (const status of this.statuses.values()) {
      byStatus[status] += 1
    }

    return {
      status: this.invalidTransitions > 0 ? 'degraded' : 'healthy',
      trackedCount: this.statuses.size,
      byStatus,
      invalidTransitions: this.invalidTransitions,
      lastTransitionAt: this.lastTransitionAt,
    }
  }
}

export class BusinessBrainManager {
  constructor(
    private registry: BusinessBrainRegistry,
    private domainRegistry: KnowledgeDomainRegistry,
    private lifecycleRegistry: KnowledgeLifecycleRegistry
  ) {}

  registerKnowledge(input: KnowledgeRegistrationInput): KnowledgeRegistration {
    const registration: KnowledgeRegistration = {
      ...input,
      metadataModel: createMetadata(input),
      registeredAt: now(),
    }

    const saved = this.registry.register(registration)
    this.lifecycleRegistry.transition(saved.knowledgeId, saved.governance.lifecycleStatus)
    return saved
  }

  discoverKnowledgeByDomain(domain: KnowledgeDomain): KnowledgeRegistration[] {
    return this.registry.byDomain(domain)
  }

  discoverKnowledgeByClassification(classification: string): KnowledgeRegistration[] {
    return this.registry.byClassification(classification)
  }

  lookupKnowledge(knowledgeId: string): KnowledgeRegistration | undefined {
    return this.registry.byId(knowledgeId)
  }

  lookupByVersion(version: VersionString): KnowledgeRegistration[] {
    return this.registry.byVersion(version)
  }

  catalog(): KnowledgeCatalog {
    return {
      entries: this.registry.list().map((knowledge) => ({
        knowledgeId: knowledge.knowledgeId,
        title: knowledge.title,
        domain: knowledge.domain,
        classification: knowledge.classification,
        version: knowledge.version,
        trustLevel: knowledge.governance.trustLevel,
      })),
      generatedAt: now(),
      version: '1.0.0',
    }
  }

  knowledgeModel(): BusinessKnowledgeModel {
    return {
      modelId: 'business-brain-model',
      version: '1.0.0',
      domains: this.domainRegistry.listDomains(),
      entries: this.registry.list(),
      createdAt: now(),
    }
  }

  getHealth(): BusinessBrainHealth {
    const registryHealth = this.registry.getHealthSummary()
    const diagnostics = this.registry.getDiagnostics()
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      registry: registryHealth,
      validation: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
      lifecycle: this.lifecycleRegistry.getHealth(),
    }
  }
}
