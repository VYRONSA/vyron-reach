import type { ExecutiveEngineeringReport } from '../intelligence/engineeringIntelligenceEngine'
import type { DevelopmentJob } from '../runtime/runtimeTypes'
import type { QualityGateResult, QualityGateReport } from './operationsTypes'

export type QualityGateConfig = {
  minEngineeringScore: number
  maxTechnicalDebtFindings: number
  maxSecurityFindings: number
  maxArchitectureViolations: number
  minDocumentationHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
}

/** Configurable, per the batch spec — callers may pass a stricter or looser config; these are this project's own defaults, not a claim of industry standard. */
export const DEFAULT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  minEngineeringScore: 50,
  maxTechnicalDebtFindings: 5,
  maxSecurityFindings: 0,
  maxArchitectureViolations: 0,
  minDocumentationHealth: 'Poor',
}

const HEALTH_RANK = ['Critical', 'Poor', 'Fair', 'Good', 'Excellent']

/**
 * Configurable gates evaluated against the already-computed Engineering
 * Intelligence Report and the current job's own parsed validation status —
 * nothing here re-derives build/typescript status or re-scans the
 * repository. "Lint Pass" is explicitly Skipped, never fabricated as
 * passing or failing: this repository persists no lint-status record
 * anywhere.
 */
export function runQualityGates(
  job: DevelopmentJob,
  report: ExecutiveEngineeringReport,
  config: QualityGateConfig = DEFAULT_QUALITY_GATE_CONFIG
): QualityGateReport {
  const results: QualityGateResult[] = []

  results.push({
    gate: 'Build Pass',
    status: job.buildStatus === 'Passing' ? 'Passed' : job.buildStatus === 'Failing' ? 'Failed' : 'Skipped',
    evidence: `Job buildStatus: ${job.buildStatus}.`,
    remediation: job.buildStatus === 'Failing' ? 'Fix the reported build errors before continuing.' : null,
  })

  results.push({
    gate: 'TypeScript Pass',
    status: job.typescriptStatus === 'Passing' ? 'Passed' : job.typescriptStatus === 'Failing' ? 'Failed' : 'Skipped',
    evidence: `Job typescriptStatus: ${job.typescriptStatus}.`,
    remediation: job.typescriptStatus === 'Failing' ? 'Fix the reported TypeScript errors before continuing.' : null,
  })

  results.push({
    gate: 'Lint Pass',
    status: 'Skipped',
    evidence: 'No lint status is tracked by this system.',
    remediation: null,
  })

  results.push({
    gate: 'Engineering Score',
    status: report.engineeringScore >= config.minEngineeringScore ? 'Passed' : 'Failed',
    evidence: `Engineering Score: ${report.engineeringScore}/100 (threshold: ${config.minEngineeringScore}).`,
    remediation:
      report.engineeringScore < config.minEngineeringScore
        ? `Resolve outstanding findings to raise the Engineering Score above ${config.minEngineeringScore}.`
        : null,
  })

  const debtFindings = report.findings.filter(f => f.module === 'Technical Debt').length
  results.push({
    gate: 'Technical Debt Threshold',
    status: debtFindings <= config.maxTechnicalDebtFindings ? 'Passed' : 'Failed',
    evidence: `${debtFindings} outstanding Technical Debt finding(s) (threshold: ${config.maxTechnicalDebtFindings}).`,
    remediation: debtFindings > config.maxTechnicalDebtFindings ? 'Resolve outstanding technical debt before continuing.' : null,
  })

  const securityFindings = report.findings.filter(f => f.category === 'Security Concern').length
  results.push({
    gate: 'Security Threshold',
    status: securityFindings <= config.maxSecurityFindings ? 'Passed' : 'Failed',
    evidence: `${securityFindings} Security Concern finding(s) (threshold: ${config.maxSecurityFindings}).`,
    remediation: securityFindings > config.maxSecurityFindings ? 'Resolve all Security Concern findings before continuing.' : null,
  })

  const architectureFindings = report.findings.filter(f => f.category === 'Architecture Violation').length
  results.push({
    gate: 'Architecture Threshold',
    status: architectureFindings <= config.maxArchitectureViolations ? 'Passed' : 'Failed',
    evidence: `${architectureFindings} Architecture Violation finding(s) (threshold: ${config.maxArchitectureViolations}).`,
    remediation: architectureFindings > config.maxArchitectureViolations ? 'Resolve architecture violations before continuing.' : null,
  })

  const docHealthOk = HEALTH_RANK.indexOf(report.documentationHealth) >= HEALTH_RANK.indexOf(config.minDocumentationHealth)
  results.push({
    gate: 'Documentation Threshold',
    status: docHealthOk ? 'Passed' : 'Failed',
    evidence: `Documentation Health: ${report.documentationHealth} (minimum: ${config.minDocumentationHealth}).`,
    remediation: docHealthOk ? null : 'Improve documentation coverage before continuing.',
  })

  const failedGates = results.filter(r => r.status === 'Failed')
  return { results, allPassed: failedGates.length === 0, failedGates }
}
