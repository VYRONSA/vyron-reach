import type { EngineeringFinding } from '../intelligence/types'

/**
 * Shared types for the Engineering Assessment Engine. This engine is
 * strictly read-only: it observes state already computed by other
 * engines (Git/Build/Deployment/Engineering Intelligence, Project
 * Intelligence, the Initializer, Learning, DNA) and composes it into one
 * report. Nothing in this module ever writes to a project, a
 * repository, a milestone, a batch, or a task — see
 * assessmentEngine.ts's own comment for the enforcement of that.
 */

export type AssessmentStatus = 'Healthy' | 'Attention' | 'Critical' | 'Unknown' | 'Partial'

/** A category value with an honest source — never a bare number/label with no way to check where it came from. */
export type EvidencedValue<T> = {
  value: T
  /** The literal fact this value was read from — a file path, a count, a finding, "not implemented." Never a paraphrase standing in for evidence. */
  evidence: string
}

export type RepositoryAssessment = {
  connected: boolean
  branch: string
  lastCommit: string
  lastCommitDate: string
  repositorySize: EvidencedValue<string>
  languages: string[]
  frameworks: string[]
  packageManager: string
}

export type BuildAssessment = {
  lastBuild: string
  buildStatus: string
  typescriptStatus: string
  lintStatus: string
  testStatus: string
  coverage: string
}

export type ArchitectureAssessment = {
  framework: string
  architectureStyle: string
  moduleCount: number
  componentCount: number
  apiCount: number
  databaseLayer: string
  authentication: string
  caching: EvidencedValue<string>
  configuration: string
}

export type CodeHealthAssessment = {
  technicalDebt: number
  complexity: string
  duplicatedCode: number
  unusedCode: number
  deadRoutes: number
  largeFiles: number
  circularDependencies: string
  warnings: number
}

export type SecurityAssessment = {
  secrets: EvidencedValue<number>
  environmentConfiguration: string
  dependencyVulnerabilities: string
  authenticationReview: string
  authorizationReview: string
  securityRisks: number
}

export type DocumentationAssessment = {
  readme: boolean
  architectureDocumentation: boolean
  apiDocumentation: string
  developerNotes: boolean
  deploymentNotes: string
}

export type EngineeringProgressAssessment = {
  currentPhase: string
  currentMilestone: string
  currentBatch: string
  engineeringOrganization: 'Ready' | 'Not Initialized'
  completionPercent: number
}

export type ProjectIntelligenceAssessment = {
  technologyStack: string
  businessDomain: string
  targetIndustry: string
  integrations: string
  aiComponents: string
  platformComponents: string
}

export type ScoredMetric = {
  score: number
  /** Every score must explain WHY — the concrete counts/facts that produced it, never a bare number. */
  reasons: string[]
}

export type AssessmentScores = {
  engineeringHealth: ScoredMetric
  maintainability: ScoredMetric
  architecture: ScoredMetric
  documentation: ScoredMetric
  security: ScoredMetric
  overallConfidence: ScoredMetric
}

export type Recommendation = {
  text: string
  category: 'Repository' | 'Build' | 'Architecture' | 'Code Health' | 'Security' | 'Documentation' | 'Engineering Progress'
}

export type AssessmentReport = {
  projectSlug: string
  projectName: string
  generatedAt: string
  repository: RepositoryAssessment
  build: BuildAssessment
  architecture: ArchitectureAssessment
  codeHealth: CodeHealthAssessment
  security: SecurityAssessment
  documentation: DocumentationAssessment
  engineeringProgress: EngineeringProgressAssessment
  projectIntelligence: ProjectIntelligenceAssessment
  scores: AssessmentScores
  recommendations: Recommendation[]
  riskSummary: string
  /** Every finding the categories above were derived from — the drill-down evidence trail. */
  findings: EngineeringFinding[]
}

/** What lib/dev/learning/executionAnalytics.ts's summarizeExecutions already computes — passed in, never recomputed. */
export type LearningSummaryInput = {
  totalExecutions: number
  successRate: number | null
}

/** Historical record — one per assessment run, append-only, never overwritten. Trend analysis compares these over time. */
export type AssessmentSnapshot = {
  id: string
  timestamp: string
  projectSlug: string
  scores: AssessmentScores
  recommendations: Recommendation[]
  buildStatus: string
  technicalDebtCount: number
  engineeringState: EngineeringProgressAssessment
}

/** Exactly what the Engineering Director is meant to receive — never the full report, never anything that decides work on its own. */
export type DirectorAssessmentInput = {
  projectSlug: string
  generatedAt: string
  reportSummary: string
  recommendations: Recommendation[]
  riskSummary: string
  confidence: ScoredMetric
}
