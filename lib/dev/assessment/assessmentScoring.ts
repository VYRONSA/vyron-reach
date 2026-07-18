import type { ArchitectureAssessment, AssessmentScores, CodeHealthAssessment, DocumentationAssessment, ScoredMetric, SecurityAssessment } from './assessmentTypes'
import type { EngineeringFinding } from '../intelligence/types'

/**
 * Every score here is 100 minus a deterministic penalty computed from
 * counts already present on the assessed categories (or the
 * Engineering Intelligence Engine's own score, for Engineering Health) —
 * never an LLM judgment, never invented. `reasons` always lists the
 * literal counts the score was built from, so "every score must explain
 * WHY" holds structurally, not just in prose.
 */

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function scoreFromPenalty(penalty: number, reasons: string[]): ScoredMetric {
  return { score: clampScore(100 - penalty), reasons }
}

/** Engineering Health is read directly from the Engineering Intelligence Engine's own score — never recomputed, since that score already IS this. */
export function scoreEngineeringHealth(engineeringScore: number, findingCount: number): ScoredMetric {
  return {
    score: clampScore(engineeringScore),
    reasons: [`Engineering Intelligence score: ${engineeringScore}/100, derived from ${findingCount} finding(s).`],
  }
}

export function scoreMaintainability(codeHealth: CodeHealthAssessment): ScoredMetric {
  const penalty =
    codeHealth.technicalDebt * 3 +
    codeHealth.duplicatedCode * 4 +
    codeHealth.unusedCode * 2 +
    codeHealth.deadRoutes * 2 +
    codeHealth.largeFiles * 3 +
    codeHealth.warnings * 1
  return scoreFromPenalty(penalty, [
    `${codeHealth.technicalDebt} outstanding technical debt item(s).`,
    `${codeHealth.duplicatedCode} duplicated code block(s).`,
    `${codeHealth.unusedCode} unused file(s), ${codeHealth.deadRoutes} dead route(s).`,
    `${codeHealth.largeFiles} oversized file(s), ${codeHealth.warnings} TODO/FIXME/HACK marker(s).`,
    `Complexity and circular dependencies are not factored in — ${codeHealth.complexity.toLowerCase()}.`,
  ])
}

export function scoreArchitecture(architecture: ArchitectureAssessment, findings: EngineeringFinding[]): ScoredMetric {
  const violations = findings.filter(f => f.category === 'Architecture Violation').length
  const penalty = violations * 15 + (architecture.databaseLayer === 'Not detected' ? 5 : 0)
  return scoreFromPenalty(penalty, [
    `${violations} architecture-violation finding(s) (server-only module imported from a 'use client' file).`,
    `Database layer: ${architecture.databaseLayer}.`,
    `${architecture.moduleCount} engine module(s), ${architecture.componentCount} component(s), ${architecture.apiCount} API route(s).`,
  ])
}

export function scoreDocumentation(documentation: DocumentationAssessment, findings: EngineeringFinding[]): ScoredMetric {
  const missingDocFindings = findings.filter(f => f.module === 'Documentation').length
  const penalty =
    (documentation.readme ? 0 : 15) +
    (documentation.architectureDocumentation ? 0 : 15) +
    (documentation.developerNotes ? 0 : 10) +
    missingDocFindings * 3
  return scoreFromPenalty(penalty, [
    `README present: ${documentation.readme}.`,
    `Architecture documentation recorded: ${documentation.architectureDocumentation}.`,
    `Developer notes recorded: ${documentation.developerNotes}.`,
    `${missingDocFindings} Documentation-module finding(s) (undocumented modules, empty knowledge base sections).`,
  ])
}

export function scoreSecurity(security: SecurityAssessment): ScoredMetric {
  const penalty = security.secrets.value * 40 + security.securityRisks * 15
  return scoreFromPenalty(penalty, [
    `${security.secrets.value} literal secret-pattern match(es).`,
    `${security.securityRisks} Critical/High Quality-module security finding(s).`,
    `Dependency vulnerabilities: ${security.dependencyVulnerabilities.toLowerCase()}.`,
  ])
}

export function scoreOverallConfidence(scores: Omit<AssessmentScores, 'overallConfidence'>): ScoredMetric {
  const values = [scores.engineeringHealth.score, scores.maintainability.score, scores.architecture.score, scores.documentation.score, scores.security.score]
  const average = values.reduce((sum, v) => sum + v, 0) / values.length
  return {
    score: clampScore(average),
    reasons: [
      `Average of Engineering Health (${scores.engineeringHealth.score}), Maintainability (${scores.maintainability.score}), Architecture (${scores.architecture.score}), Documentation (${scores.documentation.score}), and Security (${scores.security.score}).`,
    ],
  }
}
