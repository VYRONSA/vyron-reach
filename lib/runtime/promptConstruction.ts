import type { ConfidenceScore, IsoDateTime, Metadata, VersionString } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { RegistryHealthSummary } from './registries'
import {
  RegistrationValidationService,
  type PromptContextPackageInput,
  type PromptGovernanceInput,
  type PromptMetadataInput,
  type PromptPackageInput,
  type PromptRegistrationInput,
  type PromptTemplateRegistrationInput,
  type RegistrationDiagnostic,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export interface PromptOwnership {
  ownerType: 'system' | 'team' | 'user'
  ownerId: string
}

export interface PromptGovernance {
  ownership: PromptOwnership
  version: VersionString
  provenance: {
    source: string
    sourceType: 'system' | 'human' | 'external'
    capturedAt: IsoDateTime
  }
  confidence: ConfidenceScore
  trust: 'untrusted' | 'candidate' | 'trusted' | 'authoritative'
  reviewStatus: 'not-reviewed' | 'in-review' | 'reviewed'
  approvalStatus: 'not-required' | 'pending' | 'approved' | 'rejected'
  traceability: {
    enabled: boolean
    traceIds: string[]
  }
  classification:
    | 'general'
    | 'planning'
    | 'analysis'
    | 'generation'
    | 'validation'
    | 'governance'
    | 'system'
}

export interface PromptMetadata {
  promptId: string
  name: string
  version: VersionString
  contractVersion: VersionString
  classification: PromptGovernance['classification']
  tags: string[]
  governance: PromptGovernance
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  metadata?: Metadata
}

export interface PromptContextSection {
  sectionId: string
  source:
    | 'runtime-context'
    | 'memory-context'
    | 'business-brain-context'
    | 'workflow-context'
    | 'reasoning-context'
    | 'ai-team-context'
    | 'provider-context'
    | 'user-context'
    | 'tenant-context'
  title: string
  priority: number
  content: Metadata
  metadata?: Metadata
}

export interface RuntimeContextSourceModel {
  runtimeContext: Metadata
}

export interface MemoryContextSourceModel {
  memoryContext: Metadata
}

export interface BusinessBrainContextSourceModel {
  businessBrainContext: Metadata
}

export interface WorkflowContextSourceModel {
  workflowContext: Metadata
}

export interface ReasoningContextSourceModel {
  reasoningContext: Metadata
}

export interface AITeamContextSourceModel {
  aiTeamContext: Metadata
}

export interface ProviderContextSourceModel {
  providerContext: Metadata
}

export interface UserContextSourceModel {
  userContext: Metadata
}

export interface TenantContextSourceModel {
  tenantContext: Metadata
}

export interface PromptContext {
  contextId: string
  promptId: string
  sections: PromptContextSection[]
  sources: RuntimeContextSourceModel &
    MemoryContextSourceModel &
    BusinessBrainContextSourceModel &
    WorkflowContextSourceModel &
    ReasoningContextSourceModel &
    AITeamContextSourceModel &
    ProviderContextSourceModel &
    UserContextSourceModel &
    TenantContextSourceModel
  assembledAt: IsoDateTime
}

export interface PromptPackage {
  packageId: string
  promptId: string
  systemInstructions: string[]
  developerInstructions: string[]
  userInstructions: string[]
  contextSections: PromptContextSection[]
  constraints: string[]
  objectives: string[]
  evidence: string[]
  references: string[]
  expectedOutputSpecification: string[]
  validationRequirements: string[]
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface PromptDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface PromptTemplate {
  templateId: string
  name: string
  version: VersionString
  classification: PromptGovernance['classification']
  instructions: {
    system: string[]
    developer: string[]
    user: string[]
  }
  constraints: string[]
  objectives: string[]
  validationRequirements: string[]
  metadata?: Metadata
  registeredAt: IsoDateTime
}

export interface PromptRegistration extends PromptRegistrationInput {
  metadataModel: PromptMetadata
  registeredAt: IsoDateTime
}

export interface PromptAssemblyPipeline {
  contextCollection: {
    enabled: boolean
    sources: PromptContextSection['source'][]
  }
  contextOrdering: {
    enabled: boolean
    strategy: 'priority' | 'source' | 'custom'
  }
  contextPrioritisation: {
    enabled: boolean
    strategy: 'highest-first' | 'lowest-first' | 'balanced'
  }
  contextFiltering: {
    enabled: boolean
    mode: 'allow-all' | 'deny-empty' | 'custom'
  }
  promptComposition: {
    enabled: boolean
    mode: 'template-first' | 'instruction-first' | 'custom'
  }
  promptValidation: {
    enabled: boolean
    strict: boolean
  }
  promptPackaging: {
    enabled: boolean
    includeDiagnostics: boolean
  }
}

export interface PromptConstructionHealth {
  promptRegistryHealth: RegistryHealthSummary
  contextAssemblyHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    assembledCount: number
    invalidAssemblies: number
    lastAssembledAt?: IsoDateTime
  }
  promptValidationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalDiagnostics: number
    errorCount: number
    warningCount: number
    lastValidatedAt?: IsoDateTime
  }
  promptPackageHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    packageCount: number
    invalidPackages: number
    lastPackagedAt?: IsoDateTime
  }
}

function createRegistryHealth(
  registryId: string,
  name: string,
  registeredCount: number,
  duplicateRejected: number,
  validationRejected: number,
  diagnostics: RegistrationDiagnostic[],
  lastUpdatedAt: IsoDateTime
): RegistryHealthSummary {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

  return {
    registryId,
    name,
    status: errorCount > 0 ? 'degraded' : 'healthy',
    registeredCount,
    duplicateRejected,
    validationRejected,
    lastUpdatedAt,
    diagnostics: {
      total: diagnostics.length,
      errorCount,
      warningCount,
    },
  }
}

export class PromptTemplateRegistry {
  private templates: Map<string, PromptTemplate> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: PromptTemplateRegistrationInput): PromptTemplate {
    const validation = this.validation.validatePromptTemplateRegistration(
      input,
      new Set(this.templates.keys())
    )
    this.diagnostics.push(...validation.diagnostics)

    if (!validation.valid) {
      if (validation.diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.promptRegistration('Prompt template registration validation failed', {
        templateId: input.templateId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const template: PromptTemplate = {
      templateId: input.templateId,
      name: input.name,
      version: input.version,
      classification: input.classification,
      instructions: {
        system: input.systemInstructions,
        developer: input.developerInstructions,
        user: input.userInstructions,
      },
      constraints: input.constraints,
      objectives: input.objectives,
      validationRequirements: input.validationRequirements,
      metadata: input.metadata,
      registeredAt: now(),
    }

    this.templates.set(template.templateId, template)
    this.lastUpdatedAt = now()
    return template
  }

  get(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId)
  }

  list(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'prompt-template-registry',
      'Prompt Template Registry',
      this.templates.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class PromptRegistry {
  private prompts: Map<string, PromptRegistration> = new Map()
  private diagnostics: RegistrationDiagnostic[] = []
  private duplicateRejected = 0
  private validationRejected = 0
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  register(input: PromptRegistrationInput): PromptRegistration {
    const registrationValidation = this.validation.validatePromptRegistration(
      input,
      new Set(this.prompts.keys())
    )
    const governanceValidation = this.validation.validatePromptGovernance(input.promptId, input.governance)

    const diagnostics = [...registrationValidation.diagnostics, ...governanceValidation.diagnostics]
    this.diagnostics.push(...diagnostics)

    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      if (diagnostics.some((diagnostic) => diagnostic.code.includes('DUPLICATE'))) {
        this.duplicateRejected += 1
      }
      this.validationRejected += 1
      throw RuntimeError.promptRegistration('Prompt registration validation failed', {
        promptId: input.promptId,
        diagnosticsCount: diagnostics.length,
      })
    }

    const registration: PromptRegistration = {
      ...input,
      metadataModel: {
        promptId: input.promptId,
        name: input.name,
        version: input.version,
        contractVersion: input.contractVersion,
        classification: input.governance.classification,
        tags: input.tags,
        governance: input.governance,
        createdAt: now(),
        metadata: input.metadata,
      },
      registeredAt: now(),
    }

    this.prompts.set(registration.promptId, registration)
    this.lastUpdatedAt = now()
    return registration
  }

  get(promptId: string): PromptRegistration | undefined {
    return this.prompts.get(promptId)
  }

  list(): PromptRegistration[] {
    return Array.from(this.prompts.values())
  }

  getDiagnostics(): RegistrationDiagnostic[] {
    return [...this.diagnostics]
  }

  getHealthSummary(): RegistryHealthSummary {
    return createRegistryHealth(
      'prompt-registry',
      'Prompt Registry',
      this.prompts.size,
      this.duplicateRejected,
      this.validationRejected,
      this.diagnostics,
      this.lastUpdatedAt
    )
  }
}

export class PromptConstructionManager {
  private contexts: Map<string, PromptContext> = new Map()
  private packages: Map<string, PromptPackage> = new Map()
  private diagnostics: PromptDiagnostics[] = []
  private invalidAssemblies = 0
  private invalidPackages = 0
  private lastAssembledAt?: IsoDateTime
  private lastPackagedAt?: IsoDateTime

  constructor(
    private promptRegistry: PromptRegistry,
    private templateRegistry: PromptTemplateRegistry,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  registerPrompt(input: PromptRegistrationInput): PromptRegistration {
    const prompt = this.promptRegistry.register(input)
    this.recordDiagnostic('PROMPT_REGISTERED', `Prompt registered: ${prompt.promptId}`, 'info', prompt.promptId)
    return prompt
  }

  registerTemplate(input: PromptTemplateRegistrationInput): PromptTemplate {
    const template = this.templateRegistry.register(input)
    this.recordDiagnostic('PROMPT_TEMPLATE_REGISTERED', `Prompt template registered: ${template.templateId}`, 'info', template.templateId)
    return template
  }

  assembleContext(input: PromptContextPackageInput): PromptContext {
    const validation = this.validation.validatePromptContextPackage(input)
    if (!validation.valid) {
      this.invalidAssemblies += 1
      throw RuntimeError.contextAssembly('Prompt context assembly validation failed', {
        promptId: input.promptId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const prompt = this.promptRegistry.get(input.promptId)
    if (!prompt) {
      this.invalidAssemblies += 1
      throw RuntimeError.contextAssembly('Prompt not found for context assembly', {
        promptId: input.promptId,
      })
    }

    const sections: PromptContextSection[] = input.sections
      .map((section) => ({
        sectionId: section.sectionId,
        source: section.source,
        title: section.title,
        priority: section.priority,
        content: section.content,
        metadata: section.metadata,
      }))
      .sort((a, b) => b.priority - a.priority)

    const context: PromptContext = {
      contextId: `prompt-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      promptId: prompt.promptId,
      sections,
      sources: {
        runtimeContext: input.runtimeContext,
        memoryContext: input.memoryContext,
        businessBrainContext: input.businessBrainContext,
        workflowContext: input.workflowContext,
        reasoningContext: input.reasoningContext,
        aiTeamContext: input.aiTeamContext,
        providerContext: input.providerContext,
        userContext: input.userContext,
        tenantContext: input.tenantContext,
      },
      assembledAt: now(),
    }

    this.contexts.set(context.contextId, context)
    this.lastAssembledAt = now()
    this.recordDiagnostic('PROMPT_CONTEXT_ASSEMBLED', `Prompt context assembled for ${prompt.promptId}`, 'info', context.contextId)
    return context
  }

  packagePrompt(input: PromptPackageInput): PromptPackage {
    const validation = this.validation.validatePromptPackage(input)
    if (!validation.valid) {
      this.invalidPackages += 1
      throw RuntimeError.promptPackaging('Prompt package validation failed', {
        promptId: input.promptId,
        diagnosticsCount: validation.diagnostics.length,
      })
    }

    const prompt = this.promptRegistry.get(input.promptId)
    if (!prompt) {
      this.invalidPackages += 1
      throw RuntimeError.promptPackaging('Prompt not found for packaging', {
        promptId: input.promptId,
      })
    }

    const packageModel: PromptPackage = {
      packageId: `prompt-package-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      promptId: input.promptId,
      systemInstructions: input.systemInstructions,
      developerInstructions: input.developerInstructions,
      userInstructions: input.userInstructions,
      contextSections: input.contextSections,
      constraints: input.constraints,
      objectives: input.objectives,
      evidence: input.evidence,
      references: input.references,
      expectedOutputSpecification: input.expectedOutputSpecification,
      validationRequirements: input.validationRequirements,
      createdAt: now(),
      metadata: input.metadata,
    }

    this.packages.set(packageModel.packageId, packageModel)
    this.lastPackagedAt = now()
    this.recordDiagnostic('PROMPT_PACKAGED', `Prompt package created for ${prompt.promptId}`, 'info', packageModel.packageId)
    return packageModel
  }

  composeFromTemplate(promptId: string, templateId: string, contextId: string): PromptPackage {
    const prompt = this.promptRegistry.get(promptId)
    if (!prompt) {
      throw RuntimeError.promptConfiguration('Prompt not found for template composition', { promptId })
    }

    const template = this.templateRegistry.get(templateId)
    if (!template) {
      throw RuntimeError.promptConfiguration('Prompt template not found for composition', { templateId })
    }

    const context = this.contexts.get(contextId)
    if (!context) {
      throw RuntimeError.contextAssembly('Prompt context not found for composition', { contextId })
    }

    const packageInput: PromptPackageInput = {
      promptId,
      systemInstructions: template.instructions.system,
      developerInstructions: template.instructions.developer,
      userInstructions: template.instructions.user,
      contextSections: context.sections,
      constraints: template.constraints,
      objectives: template.objectives,
      evidence: [],
      references: [],
      expectedOutputSpecification: ['structured-output'],
      validationRequirements: template.validationRequirements,
    }

    return this.packagePrompt(packageInput)
  }

  getContext(contextId: string): PromptContext | undefined {
    return this.contexts.get(contextId)
  }

  getPackage(packageId: string): PromptPackage | undefined {
    return this.packages.get(packageId)
  }

  listPrompts(): PromptRegistration[] {
    return this.promptRegistry.list()
  }

  listTemplates(): PromptTemplate[] {
    return this.templateRegistry.list()
  }

  listPackages(): PromptPackage[] {
    return Array.from(this.packages.values())
  }

  getAssemblyPipelineModel(): PromptAssemblyPipeline {
    return {
      contextCollection: {
        enabled: true,
        sources: [
          'runtime-context',
          'memory-context',
          'business-brain-context',
          'workflow-context',
          'reasoning-context',
          'ai-team-context',
          'provider-context',
          'user-context',
          'tenant-context',
        ],
      },
      contextOrdering: {
        enabled: true,
        strategy: 'priority',
      },
      contextPrioritisation: {
        enabled: true,
        strategy: 'highest-first',
      },
      contextFiltering: {
        enabled: true,
        mode: 'deny-empty',
      },
      promptComposition: {
        enabled: true,
        mode: 'template-first',
      },
      promptValidation: {
        enabled: true,
        strict: true,
      },
      promptPackaging: {
        enabled: true,
        includeDiagnostics: true,
      },
    }
  }

  getDiagnostics(): PromptDiagnostics[] {
    return [...this.diagnostics]
  }

  getHealth(): PromptConstructionHealth {
    const diagnostics = [
      ...this.promptRegistry.getDiagnostics(),
      ...this.templateRegistry.getDiagnostics(),
    ]
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length

    return {
      promptRegistryHealth: this.promptRegistry.getHealthSummary(),
      contextAssemblyHealth: {
        status: this.invalidAssemblies > 0 ? 'degraded' : 'healthy',
        assembledCount: this.contexts.size,
        invalidAssemblies: this.invalidAssemblies,
        lastAssembledAt: this.lastAssembledAt,
      },
      promptValidationHealth: {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        totalDiagnostics: diagnostics.length,
        errorCount,
        warningCount,
        lastValidatedAt: diagnostics[diagnostics.length - 1]?.createdAt,
      },
      promptPackageHealth: {
        status: this.invalidPackages > 0 ? 'degraded' : 'healthy',
        packageCount: this.packages.size,
        invalidPackages: this.invalidPackages,
        lastPackagedAt: this.lastPackagedAt,
      },
    }
  }

  private recordDiagnostic(
    code: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    entityId?: string
  ): void {
    this.diagnostics.push({
      diagnosticId: `prompt-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      message,
      severity,
      entityId,
      createdAt: now(),
    })
  }
}
