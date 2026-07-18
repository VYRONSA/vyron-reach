import type { ScannedFile } from './repositoryScanner'
import type { EngineeringFinding } from './types'

/**
 * Server-only, fs-based half of Documentation Intelligence. "Undocumented
 * modules" is a literal check — does the file open with a comment block —
 * not a judgment of whether the existing comment is any good.
 * "Outdated documentation" and "missing architecture decisions" need
 * localStorage data (Knowledge Base notes, Decision records) this
 * server-side scan has no access to; those live in
 * lib/dev/intelligence/documentationIntelligenceClient.ts instead.
 */
export function scanDocumentationIntelligence(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const engineFiles = files.filter(f => f.relativePath.startsWith('lib/dev/') && f.relativePath.endsWith('.ts'))

  for (const file of engineFiles) {
    const trimmed = file.content.trimStart()
    const hasLeadingComment = trimmed.startsWith('/**') || trimmed.startsWith('//') || trimmed.startsWith('/*')
    const hasAnyBlockComment = /\/\*\*[\s\S]*?\*\//.test(file.content)
    if (!hasLeadingComment && !hasAnyBlockComment) {
      findings.push({
        module: 'Documentation',
        category: 'Undocumented Module',
        severity: 'Low',
        title: `${file.relativePath} has no documentation comments`,
        evidence: `No leading comment or /** */ block found anywhere in ${file.relativePath}.`,
        location: file.relativePath,
        recommendation: `Add a short comment explaining ${file.relativePath}'s purpose, especially any non-obvious constraints.`,
      })
    }
  }

  return findings
}
