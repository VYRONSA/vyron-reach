import type { GitIntelligence } from '../gitIntelligence'
import type { BuildIntelligence } from '../buildIntelligence'
import type { EngineeringFinding } from '../intelligence/types'
import type { DNAProfileFields } from '../initializer/initializerTypes'
import type { Project } from '../projectsData'
import {
  buildArchitectureAssessment,
  buildBuildAssessment,
  buildCodeHealthAssessment,
  buildDocumentationAssessment,
  buildEngineeringProgressAssessment,
  buildProjectIntelligenceAssessment,
  buildRepositoryAssessment,
  buildSecurityAssessment,
  type RepositoryFacts,
} from './assessmentModels'
import {
  scoreArchitecture,
  scoreDocumentation,
  scoreEngineeringHealth,
  scoreMaintainability,
  scoreOverallConfidence,
  scoreSecurity,
} from './assessmentScoring'
import { generateRecommendations } from './assessmentRecommendations'
import type { AssessmentReport, AssessmentScores, AssessmentSnapshot, DirectorAssessmentInput } from './assessmentTypes'

/**
 * The Engineering Assessment Engine — observation, analysis, and
 * recommendation ONLY. Every function in this file is pure: it takes
 * already-computed intelligence (findings, Git/Build Intelligence,
 * repository facts, DNA, project/milestone/batch state) and composes it
 * into one report. Nothing here calls fs.writeFileSync, runs a shell
 * command, or touches milestonesStorage/batchesStorage/queueStorage —
 * the only write path in this whole engine is assessmentRepository.ts's
 * append-only historical snapshot, which records what was observed, and
 * never edits a project, a repository, a milestone, a batch, or a task.
 */
export type AssessmentInput = {
  projectSlug: string
  projectName: string
  project: Project | undefined
  findings: EngineeringFinding[]
  engineeringScore: number
  git: GitIntelligence
  build: BuildIntelligence
  facts: RepositoryFacts
  dnaProfile: DNAProfileFields | null
  knowledgeNotes: { architecture: boolean; codingStandards: boolean }
  engineeringProgress: {
    currentPhase: string
    currentMilestoneTitle: string | null
    currentBatchNumber: string | null
    engineeringReady: boolean
    completionPercent: number
  }
}

function buildRiskSummary(scores: AssessmentScores, secretsFound: number, buildStatus: string): string {
  if (secretsFound > 0) return `Critical — ${secretsFound} possible committed secret(s) detected, requires immediate attention.`
  if (buildStatus === 'Failing') return 'High — the last recorded build is failing.'
  if (scores.overallConfidence.score < 55) return `Elevated — overall engineering confidence is ${scores.overallConfidence.score}/100.`
  if (scores.overallConfidence.score < 80) return `Moderate — overall engineering confidence is ${scores.overallConfidence.score}/100.`
  return `Low — overall engineering confidence is ${scores.overallConfidence.score}/100.`
}

export function buildEngineeringAssessment(input: AssessmentInput): AssessmentReport {
  const repository = buildRepositoryAssessment(input.facts, input.git)
  const build = buildBuildAssessment(input.build, input.facts.hasLintScript, input.facts.testFileCount)
  const architecture = buildArchitectureAssessment(input.facts)
  const codeHealth = buildCodeHealthAssessment(input.findings)
  const security = buildSecurityAssessment(input.findings, input.facts)
  const documentation = buildDocumentationAssessment(input.facts, input.knowledgeNotes)
  const engineeringProgress = buildEngineeringProgressAssessment(input.engineeringProgress)
  const projectIntelligence = buildProjectIntelligenceAssessment(input.project, input.dnaProfile, input.facts)

  const engineeringHealth = scoreEngineeringHealth(input.engineeringScore, input.findings.length)
  const maintainability = scoreMaintainability(codeHealth)
  const architectureScore = scoreArchitecture(architecture, input.findings)
  const documentationScore = scoreDocumentation(documentation, input.findings)
  const securityScore = scoreSecurity(security)
  const overallConfidence = scoreOverallConfidence({
    engineeringHealth,
    maintainability,
    architecture: architectureScore,
    documentation: documentationScore,
    security: securityScore,
  })
  const scores: AssessmentScores = {
    engineeringHealth,
    maintainability,
    architecture: architectureScore,
    documentation: documentationScore,
    security: securityScore,
    overallConfidence,
  }

  const recommendations = generateRecommendations({ build, architecture, codeHealth, security, documentation })
  const riskSummary = buildRiskSummary(scores, security.secrets.value, build.buildStatus)

  return {
    projectSlug: input.projectSlug,
    projectName: input.projectName,
    generatedAt: new Date().toISOString(),
    repository,
    build,
    architecture,
    codeHealth,
    security,
    documentation,
    engineeringProgress,
    projectIntelligence,
    scores,
    recommendations,
    riskSummary,
    findings: input.findings,
  }
}

/** The historical record for one run — everything Learning needs for trend analysis, nothing more. */
export function buildAssessmentSnapshot(report: AssessmentReport): AssessmentSnapshot {
  return {
    id: `assessment_${report.projectSlug}_${Date.parse(report.generatedAt)}`,
    timestamp: report.generatedAt,
    projectSlug: report.projectSlug,
    scores: report.scores,
    recommendations: report.recommendations,
    buildStatus: report.build.buildStatus,
    technicalDebtCount: report.codeHealth.technicalDebt,
    engineeringState: report.engineeringProgress,
  }
}

/**
 * Exactly what the Engineering Director is meant to receive — Assessment
 * Report (summarized to one sentence, not the full object), Recommendations,
 * Risk Summary, Confidence. The Director decides what work should happen
 * next from this; this function only shapes the handoff, it never decides
 * anything itself.
 */
export function buildDirectorAssessmentInput(report: AssessmentReport): DirectorAssessmentInput {
  return {
    projectSlug: report.projectSlug,
    generatedAt: report.generatedAt,
    reportSummary: `${report.projectName}: Engineering Health ${report.scores.engineeringHealth.score}/100, ${report.recommendations.length} recommendation(s), Engineering Organization ${report.engineeringProgress.engineeringOrganization}.`,
    recommendations: report.recommendations,
    riskSummary: report.riskSummary,
    confidence: report.scores.overallConfidence,
  }
}

/** Compares two snapshots for the same project — the trend analysis the Learning system is meant to support. Positive delta = improvement. */
export function compareAssessmentSnapshots(current: AssessmentSnapshot, previous: AssessmentSnapshot | null) {
  if (!previous) return null
  return {
    engineeringHealthDelta: current.scores.engineeringHealth.score - previous.scores.engineeringHealth.score,
    maintainabilityDelta: current.scores.maintainability.score - previous.scores.maintainability.score,
    architectureDelta: current.scores.architecture.score - previous.scores.architecture.score,
    documentationDelta: current.scores.documentation.score - previous.scores.documentation.score,
    securityDelta: current.scores.security.score - previous.scores.security.score,
    overallConfidenceDelta: current.scores.overallConfidence.score - previous.scores.overallConfidence.score,
    technicalDebtDelta: current.technicalDebtCount - previous.technicalDebtCount,
    since: previous.timestamp,
  }
}
