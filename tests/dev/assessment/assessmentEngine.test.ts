import { describe, it, expect } from 'vitest'
import { buildAssessmentSnapshot } from '../../../lib/dev/assessment/assessmentEngine'
import type { AssessmentReport, ScoredMetric } from '../../../lib/dev/assessment/assessmentTypes'

function metric(score: number): ScoredMetric {
  return { score, reasons: [`score ${score}`] }
}

function makeReport(overrides: Partial<AssessmentReport> = {}): AssessmentReport {
  return {
    projectSlug: 'reach',
    projectName: 'Reach',
    generatedAt: '2026-01-01T00:00:00.000Z',
    repository: {
      connected: true,
      branch: 'master',
      lastCommit: 'abc123',
      lastCommitDate: '2026-01-01T00:00:00.000Z',
      repositorySize: { value: '100 files', evidence: 'scanned' },
      languages: ['TypeScript'],
      frameworks: ['Next.js'],
      packageManager: 'npm',
    },
    build: { lastBuild: '2026-01-01T00:00:00.000Z', buildStatus: 'Passing', typescriptStatus: 'Passing', lintStatus: 'Configured', testStatus: '10 tests', coverage: 'Unavailable' },
    architecture: {
      framework: 'Next.js',
      architectureStyle: 'Monolith',
      moduleCount: 10,
      componentCount: 10,
      apiCount: 10,
      databaseLayer: 'Supabase',
      authentication: 'Custom',
      caching: { value: 'Framework default', evidence: 'none found' },
      configuration: 'next.config present',
    },
    codeHealth: { technicalDebt: 0, complexity: 'Not measured', duplicatedCode: 0, unusedCode: 0, deadRoutes: 0, largeFiles: 0, circularDependencies: 'Not measured', warnings: 0 },
    security: {
      secrets: { value: 0, evidence: 'none found' },
      environmentConfiguration: '.env.local present',
      dependencyVulnerabilities: 'Not scanned',
      authenticationReview: 'Reviewed',
      authorizationReview: 'Reviewed',
      securityRisks: 0,
    },
    documentation: { readme: true, architectureDocumentation: true, apiDocumentation: 'Not tracked', developerNotes: true, deploymentNotes: 'Not tracked' },
    engineeringProgress: { currentPhase: 'Phase 1', currentMilestone: 'M1', currentBatch: 'B1', engineeringOrganization: 'Ready', completionPercent: 50 },
    projectIntelligence: { technologyStack: 'Next.js', businessDomain: 'SaaS', targetIndustry: 'Not documented', integrations: 'None', aiComponents: 'None', platformComponents: 'None' },
    scores: {
      engineeringHealth: metric(80),
      maintainability: metric(80),
      architecture: metric(80),
      documentation: metric(80),
      security: metric(80),
      overallConfidence: metric(80),
    },
    recommendations: [],
    riskSummary: 'Low',
    findings: [],
    ...overrides,
  }
}

describe('buildAssessmentSnapshot — PRA-P1-005 id collision remediation', () => {
  it('produces a distinct id on every call, even for the exact same report (same projectSlug + same generatedAt)', () => {
    const report = makeReport()

    const first = buildAssessmentSnapshot(report)
    const second = buildAssessmentSnapshot(report)

    // Before this fix, the id was purely `assessment_{slug}_{Date.parse(generatedAt)}`
    // — deterministic from report content alone, so two distinct runs completing
    // within the same millisecond would collide and the second would be silently
    // dropped by appendAssessmentSnapshot's idempotent-on-id dedup.
    expect(first.id).not.toBe(second.id)
    expect(first.id).toContain('reach')
    expect(second.id).toContain('reach')
  })

  it('still derives every other field identically from the same report — only the id gained entropy', () => {
    const report = makeReport()
    const snapshot = buildAssessmentSnapshot(report)

    expect(snapshot.projectSlug).toBe('reach')
    expect(snapshot.timestamp).toBe(report.generatedAt)
    expect(snapshot.buildStatus).toBe('Passing')
    expect(snapshot.scores.overallConfidence.score).toBe(80)
  })
})
