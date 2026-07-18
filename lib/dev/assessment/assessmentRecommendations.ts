import type {
  ArchitectureAssessment,
  BuildAssessment,
  CodeHealthAssessment,
  DocumentationAssessment,
  Recommendation,
  SecurityAssessment,
} from './assessmentTypes'

/**
 * Recommendations only — never tasks. Each rule fires strictly off a
 * count or fact already present on the assessed categories (never
 * invented), and only when that count is actually non-zero/negative —
 * a category with nothing wrong produces zero recommendations for it,
 * never a recommendation "to have something to say." Nothing here
 * creates a Task, Batch, or Milestone; the caller is the Engineering
 * Director, which decides what (if anything) becomes real work.
 */
export function generateRecommendations(input: {
  build: BuildAssessment
  architecture: ArchitectureAssessment
  codeHealth: CodeHealthAssessment
  security: SecurityAssessment
  documentation: DocumentationAssessment
}): Recommendation[] {
  const recommendations: Recommendation[] = []
  const { build, architecture, codeHealth, security, documentation } = input

  if (build.buildStatus === 'Failing') recommendations.push({ text: 'Fix the failing build before starting new work.', category: 'Build' })
  if (build.typescriptStatus === 'Failing') recommendations.push({ text: 'Resolve outstanding TypeScript errors.', category: 'Build' })
  if (build.testStatus.startsWith('Not configured')) recommendations.push({ text: 'Add unit tests — none exist today.', category: 'Build' })

  if (codeHealth.technicalDebt > 0) recommendations.push({ text: `Reduce technical debt (${codeHealth.technicalDebt} outstanding item(s)).`, category: 'Code Health' })
  if (codeHealth.duplicatedCode > 0) recommendations.push({ text: `Refactor duplicate code (${codeHealth.duplicatedCode} duplicated block(s) found).`, category: 'Code Health' })
  if (codeHealth.unusedCode > 0) recommendations.push({ text: `Remove unused files (${codeHealth.unusedCode} appear unreferenced).`, category: 'Code Health' })
  if (codeHealth.deadRoutes > 0) recommendations.push({ text: `Remove or re-link dead routes (${codeHealth.deadRoutes} found).`, category: 'Code Health' })
  if (codeHealth.largeFiles > 0) recommendations.push({ text: `Split ${codeHealth.largeFiles} oversized file(s) into smaller components.`, category: 'Code Health' })
  if (codeHealth.warnings > 0) recommendations.push({ text: `Resolve ${codeHealth.warnings} outstanding TODO/FIXME/HACK marker(s).`, category: 'Code Health' })

  if (security.secrets.value > 0) recommendations.push({ text: `Remove and rotate ${security.secrets.value} possible committed secret(s) immediately.`, category: 'Security' })
  if (security.dependencyVulnerabilities.startsWith('Not scanned')) {
    recommendations.push({ text: 'Review dependency versions — no vulnerability scan is run automatically.', category: 'Security' })
  }

  if (architecture.databaseLayer === 'Not detected') recommendations.push({ text: 'Document the database layer, or confirm none is configured.', category: 'Architecture' })

  if (!documentation.readme) recommendations.push({ text: 'Add a README.', category: 'Documentation' })
  if (!documentation.architectureDocumentation) recommendations.push({ text: 'Improve documentation — architecture notes are empty.', category: 'Documentation' })
  if (!documentation.developerNotes) recommendations.push({ text: 'Record developer/coding-standards notes.', category: 'Documentation' })
  if (documentation.apiDocumentation.startsWith('Not tracked')) recommendations.push({ text: 'Document the API surface.', category: 'Documentation' })

  return recommendations
}
