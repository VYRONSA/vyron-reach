import type { GitIntelligence } from '../gitIntelligence'
import type { BuildIntelligence } from '../buildIntelligence'
import type { EngineeringFinding } from '../intelligence/types'
import type { DNAProfileFields } from '../initializer/initializerTypes'
import type { Project } from '../projectsData'
import type {
  ArchitectureAssessment,
  BuildAssessment,
  CodeHealthAssessment,
  DocumentationAssessment,
  EngineeringProgressAssessment,
  ProjectIntelligenceAssessment,
  RepositoryAssessment,
  SecurityAssessment,
} from './assessmentTypes'

const NOT_DOCUMENTED = 'Not documented'
const NOT_TRACKED = 'Not tracked — no dedicated source exists yet'
const NOT_MEASURED = 'Not measured — no tool configured for this'

/**
 * Repository facts that need filesystem access and aren't already
 * computed by any existing engine (package manager, declared
 * languages/frameworks, README/config presence, caching usage). This
 * type is deliberately just a data shape with no fs-reading code in
 * this file — the pure `build*Assessment` functions below are imported
 * by assessmentEngine.ts, which a 'use client' panel also imports, and
 * a `node:fs` import anywhere in that chain breaks the client bundle.
 * The actual scan (scanRepositoryFacts) lives server-only in
 * app/api/dev/assessment/route.ts, the one place this data is produced.
 */
export type RepositoryFacts = {
  readmeExists: boolean
  agentsFileExists: boolean
  authFileExists: boolean
  nextConfigExists: boolean
  envLocalExists: boolean
  packageManager: string
  frameworks: string[]
  languages: string[]
  filesScanned: number
  totalLines: number
  moduleCount: number
  componentCount: number
  apiCount: number
  cachingUsageCount: number
  supabaseConfigured: boolean
  openaiDependency: boolean
  hasLintScript: boolean
  testFileCount: number
}

export function buildRepositoryAssessment(facts: RepositoryFacts, git: GitIntelligence): RepositoryAssessment {
  return {
    connected: git.repositoryAvailable,
    branch: git.branch,
    lastCommit: git.commitMessage,
    lastCommitDate: git.commitDate,
    repositorySize: {
      value: `${facts.filesScanned} files, ${facts.totalLines.toLocaleString()} lines`,
      evidence: `Scanned app/, components/, lib/ (.ts/.tsx only) — ${facts.filesScanned} files, ${facts.totalLines} total lines.`,
    },
    languages: facts.languages,
    frameworks: facts.frameworks,
    packageManager: facts.packageManager,
  }
}

const NO_SCRIPT_STATUS = 'Not configured'

export function buildBuildAssessment(build: BuildIntelligence, hasLintScript: boolean, testFileCount: number): BuildAssessment {
  return {
    lastBuild: build.buildTimestamp,
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    lintStatus: hasLintScript ? 'Configured (not run by the Assessment Engine)' : NO_SCRIPT_STATUS,
    testStatus: testFileCount > 0 ? `${testFileCount} test file(s) found` : `${NO_SCRIPT_STATUS} — 0 test files found`,
    coverage: testFileCount > 0 ? 'Unavailable — no coverage tool configured' : 'Unavailable — no tests exist to measure',
  }
}

export function buildArchitectureAssessment(facts: RepositoryFacts): ArchitectureAssessment {
  return {
    framework: facts.frameworks[0] ?? 'Unknown',
    architectureStyle: 'Single Next.js App Router monolith (server routes + client components in one deployable)',
    moduleCount: facts.moduleCount,
    componentCount: facts.componentCount,
    apiCount: facts.apiCount,
    databaseLayer: facts.supabaseConfigured ? 'Supabase (PostgreSQL)' : 'Not detected',
    authentication: facts.authFileExists ? 'Custom HMAC session auth (lib/dev/auth.ts)' : 'Not detected',
    caching: {
      value: facts.cachingUsageCount > 0 ? `${facts.cachingUsageCount} file(s) use explicit caching APIs` : 'Framework default only',
      evidence:
        facts.cachingUsageCount > 0
          ? `${facts.cachingUsageCount} scanned file(s) reference unstable_cache/revalidateTag/revalidatePath/export const revalidate.`
          : 'No scanned file references unstable_cache/revalidateTag/revalidatePath/export const revalidate.',
    },
    configuration: facts.nextConfigExists ? 'next.config present' : 'No next.config file found',
  }
}

function countByCategory(findings: EngineeringFinding[], category: string): number {
  return findings.filter(f => f.category === category).length
}

export function buildCodeHealthAssessment(findings: EngineeringFinding[]): CodeHealthAssessment {
  const warnings = findings.filter(f => f.category === 'TODO Comment' || f.category === 'FIXME Comment' || f.category === 'HACK Comment').length
  return {
    technicalDebt: findings.filter(f => f.module === 'Technical Debt').length,
    complexity: NOT_MEASURED,
    duplicatedCode: countByCategory(findings, 'Duplicated Code'),
    unusedCode: countByCategory(findings, 'Unused File'),
    deadRoutes: countByCategory(findings, 'Dead Route'),
    largeFiles: countByCategory(findings, 'Large Component'),
    circularDependencies: NOT_MEASURED,
    warnings,
  }
}

export function buildSecurityAssessment(findings: EngineeringFinding[], facts: RepositoryFacts): SecurityAssessment {
  const secretFindings = findings.filter(f => f.category === 'Security Concern' && f.severity === 'Critical')
  const qualityRisks = findings.filter(f => f.module === 'Quality' && (f.severity === 'Critical' || f.severity === 'High')).length

  return {
    secrets: {
      value: secretFindings.length,
      evidence:
        secretFindings.length > 0
          ? `${secretFindings.length} literal secret-pattern match(es): ${secretFindings.map(f => f.location).join(', ')}.`
          : 'No literal secret pattern (API key/private key format) matched in the scanned source tree.',
    },
    environmentConfiguration: facts.envLocalExists ? '.env.local present (gitignored, not committed)' : 'No .env.local file detected',
    dependencyVulnerabilities: 'Not scanned — no dependency audit tool is run automatically (this engine never shells out)',
    authenticationReview: facts.authFileExists
      ? 'Session token verified via HMAC-SHA256 with timing-safe comparison (lib/dev/auth.ts:isValidDevToken).'
      : 'No authentication module detected at lib/dev/auth.ts.',
    authorizationReview: facts.authFileExists
      ? 'Owner-gated routes require an authenticated session AND the DEV_OWNER/DEV_RUNTIME_ENABLED flags (lib/dev/runtime/runtimeAccess.ts).'
      : 'No authorization gate detected.',
    securityRisks: qualityRisks,
  }
}

export function buildDocumentationAssessment(
  facts: RepositoryFacts,
  knowledgeNotes: { architecture: boolean; codingStandards: boolean }
): DocumentationAssessment {
  return {
    readme: facts.readmeExists,
    architectureDocumentation: knowledgeNotes.architecture,
    apiDocumentation: NOT_TRACKED,
    developerNotes: knowledgeNotes.codingStandards || facts.agentsFileExists,
    deploymentNotes: NOT_TRACKED,
  }
}

export function buildEngineeringProgressAssessment(input: {
  currentPhase: string
  currentMilestoneTitle: string | null
  currentBatchNumber: string | null
  engineeringReady: boolean
  completionPercent: number
}): EngineeringProgressAssessment {
  return {
    currentPhase: input.currentPhase,
    currentMilestone: input.currentMilestoneTitle ?? 'None set',
    currentBatch: input.currentBatchNumber ? `Batch ${input.currentBatchNumber}` : 'None active',
    engineeringOrganization: input.engineeringReady ? 'Ready' : 'Not Initialized',
    completionPercent: input.completionPercent,
  }
}

export function buildProjectIntelligenceAssessment(
  project: Project | undefined,
  dna: DNAProfileFields | null,
  facts: RepositoryFacts
): ProjectIntelligenceAssessment {
  return {
    technologyStack: dna?.technologyStack || NOT_DOCUMENTED,
    businessDomain: dna?.businessDomain || project?.category || NOT_DOCUMENTED,
    targetIndustry: NOT_DOCUMENTED,
    integrations: dna?.knownIntegrations || 'None recorded',
    aiComponents: facts.openaiDependency ? 'openai package present in repository dependencies' : NOT_DOCUMENTED,
    platformComponents: NOT_DOCUMENTED,
  }
}
