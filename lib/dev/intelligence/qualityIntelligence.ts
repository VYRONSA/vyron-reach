import type { ScannedFile } from './repositoryScanner'
import type { EngineeringFinding } from './types'

/** Patterns for real, obviously-visible source keys/tokens — not env var references (those are expected and gitignored), only literal-looking secrets committed to source. */
const SECRET_PATTERNS = [/sk-[a-zA-Z0-9]{20,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/]

/**
 * Server-only. Every detector here is a literal, narrow text pattern —
 * this is NOT a static analysis engine and doesn't claim to catch
 * "performance" or "security" issues in any general sense. Where no real
 * signal exists (this repo has zero test files, confirmed directly),
 * that's reported as a hard fact, not estimated.
 */
export function scanQualityIntelligence(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  findings.push(...detectMissingTests(files))
  findings.push(...detectSecurityConcerns(files))
  findings.push(...detectApiErrorHandlingGaps(files))
  findings.push(...detectDebugStatements(files))

  return findings
}

function detectMissingTests(files: ScannedFile[]): EngineeringFinding[] {
  const testFiles = files.filter(f => /\.(test|spec)\.tsx?$/.test(f.relativePath))
  if (testFiles.length > 0) return []
  return [
    {
      module: 'Quality',
      category: 'Missing Tests',
      severity: 'Medium',
      title: 'No test files found in app/, components/, or lib/',
      evidence: `0 of ${files.length} scanned files match *.test.ts(x)/*.spec.ts(x).`,
      location: null,
      recommendation: 'Introduce a test setup and cover the highest-risk logic first (parsers, completion/apply flows).',
    },
  ]
}

function detectSecurityConcerns(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  for (const file of files) {
    if (file.relativePath.includes('.env')) continue
    for (const pattern of SECRET_PATTERNS) {
      const match = file.content.match(pattern)
      if (match) {
        findings.push({
          module: 'Quality',
          category: 'Security Concern',
          severity: 'Critical',
          title: `Possible committed secret in ${file.relativePath}`,
          evidence: `Matched pattern ${pattern} in ${file.relativePath}.`,
          location: file.relativePath,
          recommendation: `Remove the credential from ${file.relativePath} and rotate it — it may already be exposed in git history.`,
        })
      }
    }
    // Matches actual JSX/object usage (always followed by "={" or ": {" for the __html object)
    // rather than the bare identifier, which this detector's own source also contains as a string literal.
    if (/dangerouslySetInnerHTML\s*[=:]\s*\{/.test(file.content)) {
      findings.push({
        module: 'Quality',
        category: 'Security Concern',
        severity: 'Medium',
        title: `dangerouslySetInnerHTML used in ${file.relativePath}`,
        evidence: `${file.relativePath} contains "dangerouslySetInnerHTML".`,
        location: file.relativePath,
        recommendation: `Confirm the HTML rendered in ${file.relativePath} is trusted/sanitized.`,
      })
    }
  }
  return findings
}

/** API routes that call request.json() without a .catch() alongside it — every runtime route this project has built follows the .catch(() => null) convention; a route missing it can throw on malformed input instead of returning a clean 400. */
function detectApiErrorHandlingGaps(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const apiRoutes = files.filter(f => f.relativePath.startsWith('app/api/') && f.relativePath.endsWith('route.ts'))
  for (const route of apiRoutes) {
    if (route.content.includes('request.json()') && !route.content.includes('.catch(')) {
      findings.push({
        module: 'Quality',
        category: 'Inconsistent Error Handling',
        severity: 'Low',
        title: `${route.relativePath} calls request.json() without a .catch()`,
        evidence: `request.json() present, ".catch(" absent, in ${route.relativePath}.`,
        location: route.relativePath,
        recommendation: `Wrap request.json() in ${route.relativePath} with .catch(() => null) and validate before use.`,
      })
    }
  }
  return findings
}

function detectDebugStatements(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  for (const file of files) {
    // Requires the line to BE a debugger statement (trimmed to exactly "debugger" or "debugger;"),
    // not just contain the word — a detector describing what it looks for would otherwise match itself.
    const hasDebuggerStatement = file.content.split('\n').some(line => {
      const trimmed = line.trim()
      return trimmed === 'debugger' || trimmed === 'debugger;'
    })
    if (hasDebuggerStatement) {
      findings.push({
        module: 'Quality',
        category: 'Performance Concern',
        severity: 'Low',
        title: `debugger statement left in ${file.relativePath}`,
        evidence: `${file.relativePath} contains a "debugger" statement.`,
        location: file.relativePath,
        recommendation: `Remove the debugger statement from ${file.relativePath}.`,
      })
    }
  }
  return findings
}
