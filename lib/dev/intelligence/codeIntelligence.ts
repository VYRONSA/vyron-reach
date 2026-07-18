import type { ScannedFile } from './repositoryScanner'
import type { EngineeringFinding } from './types'

const LARGE_COMPONENT_LINE_THRESHOLD = 400
const DUPLICATE_BLOCK_LINE_COUNT = 8
/** Requires an actual comment opener (// or /*) directly before the marker — otherwise this would also match the word appearing in a string literal or object key (e.g. a category name like 'TODO Comment'). */
const MARKER_PATTERN = /(?:\/\/|\/\*)\s*(TODO|FIXME|HACK)\b:?\s*(.*)/

/**
 * Server-only — reads this repo's own source tree via repositoryScanner.
 * Every detector here is a plain, literal text/structure check: nothing
 * claims semantic understanding of what the code does. Where a genuine
 * check isn't feasible without real static-analysis tooling (true
 * duplicate-code AST comparison, real dead-code elimination), the
 * detector is a clearly-scoped heuristic, documented as such, rather than
 * a claim of full coverage.
 */
export function scanCodeIntelligence(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  findings.push(...detectMarkerComments(files))
  findings.push(...detectLargeComponents(files))
  findings.push(...detectDuplicatedBlocks(files))
  findings.push(...detectUnusedDevFiles(files))
  findings.push(...detectDeadRoutes(files))
  findings.push(...detectArchitectureViolations(files))

  return findings
}

function detectMarkerComments(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  for (const file of files) {
    const lines = file.content.split('\n')
    lines.forEach((line, i) => {
      const match = line.match(MARKER_PATTERN)
      if (!match) return
      const marker = match[1]
      findings.push({
        module: 'Code',
        category: `${marker} Comment`,
        severity: marker === 'FIXME' || marker === 'HACK' ? 'Medium' : 'Low',
        title: `${marker} comment in ${file.relativePath}`,
        evidence: `Line ${i + 1}: ${line.trim().slice(0, 160)}`,
        location: `${file.relativePath}:${i + 1}`,
        recommendation: `Resolve or remove the ${marker} comment at ${file.relativePath}:${i + 1}.`,
      })
    })
  }
  return findings
}

/** A crude but honest size signal — no complexity/coupling analysis, just line count against a fixed threshold. */
function detectLargeComponents(files: ScannedFile[]): EngineeringFinding[] {
  return files
    .filter(f => f.relativePath.endsWith('.tsx') && f.lineCount > LARGE_COMPONENT_LINE_THRESHOLD)
    .map(f => ({
      module: 'Code' as const,
      category: 'Large Component',
      severity: (f.lineCount > LARGE_COMPONENT_LINE_THRESHOLD * 1.5 ? 'Medium' : 'Low') as 'Medium' | 'Low',
      title: `${f.relativePath} is ${f.lineCount} lines`,
      evidence: `${f.lineCount} lines, exceeding the ${LARGE_COMPONENT_LINE_THRESHOLD}-line threshold.`,
      location: f.relativePath,
      recommendation: `Consider splitting ${f.relativePath} into smaller components.`,
    }))
}

/**
 * Heuristic duplicate detection: hashes every consecutive
 * DUPLICATE_BLOCK_LINE_COUNT-line window (whitespace-normalized) and flags
 * identical windows appearing in two different files. This catches
 * verbatim copy-paste, not renamed/restructured duplication — a real, if
 * narrow, signal, not a claim of full clone detection.
 *
 * A single N-line duplicate run produces N-DUPLICATE_BLOCK_LINE_COUNT+1
 * overlapping windows if scanned naively — each one technically true but
 * all describing the same underlying duplication. Once a match is found,
 * scanning skips past the matched window instead of re-checking every
 * offset inside it, so one real duplicate block is reported once.
 */
function detectDuplicatedBlocks(files: ScannedFile[]): EngineeringFinding[] {
  const seen = new Map<string, string>() // normalized block -> first file:line seen
  const findings: EngineeringFinding[] = []

  for (const file of files) {
    const lines = file.content.split('\n')
    let skipUntil = -1
    for (let i = 0; i + DUPLICATE_BLOCK_LINE_COUNT <= lines.length; i++) {
      if (i <= skipUntil) continue
      const block = lines
        .slice(i, i + DUPLICATE_BLOCK_LINE_COUNT)
        .map(l => l.trim())
        .join('\n')
      if (block.replace(/\s/g, '').length < 60) continue // skip near-empty/trivial blocks
      const location = `${file.relativePath}:${i + 1}`
      const existing = seen.get(block)
      if (existing && existing.split(':')[0] !== file.relativePath) {
        findings.push({
          module: 'Code',
          category: 'Duplicated Code',
          severity: 'Medium',
          title: `Duplicated block between ${existing.split(':')[0]} and ${file.relativePath}`,
          evidence: `Identical ${DUPLICATE_BLOCK_LINE_COUNT}-line block at ${existing} and ${location}.`,
          location,
          recommendation: `Extract the shared logic between ${existing.split(':')[0]} and ${file.relativePath} into one place.`,
        })
        skipUntil = i + DUPLICATE_BLOCK_LINE_COUNT - 1
      } else if (!existing) {
        seen.set(block, location)
      }
    }
  }
  return findings
}

/**
 * lib/dev/*.ts modules whose basename is never referenced (as an import
 * specifier or string) anywhere else in the scanned tree. Scoped to
 * lib/dev specifically — VYRON DEV's own engines — since that's the one
 * area where "unused" is both meaningful and cheaply checkable; a false
 * positive is possible for a module only referenced dynamically, so this
 * is reported at Low severity as a lead to check, not a certainty.
 */
function detectUnusedDevFiles(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const devLibFiles = files.filter(f => f.relativePath.startsWith('lib/dev/') && !f.relativePath.endsWith('.test.ts'))

  for (const candidate of devLibFiles) {
    const basename = candidate.relativePath.replace(/^lib\/dev\//, '').replace(/\.tsx?$/, '')
    if (basename === 'index') continue
    const moduleName = basename.split('/').pop()!
    const referenced = files.some(f => {
      if (f.relativePath === candidate.relativePath) return false
      return f.content.includes(moduleName)
    })
    if (!referenced) {
      findings.push({
        module: 'Code',
        category: 'Unused File',
        severity: 'Low',
        title: `${candidate.relativePath} appears unreferenced`,
        evidence: `No other scanned file contains the string "${moduleName}".`,
        location: candidate.relativePath,
        recommendation: `Confirm ${candidate.relativePath} is genuinely unused before removing it.`,
      })
    }
  }
  return findings
}

/**
 * app/dev/**\/page.tsx routes with zero inbound href/Link references
 * anywhere in the scanned tree. Entry points (the bare /dev routes) are
 * excluded since they're reached via navigation/URL, not an internal link.
 */
function detectDeadRoutes(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const routeFiles = files.filter(f => f.relativePath.startsWith('app/dev/') && f.relativePath.endsWith('page.tsx'))

  for (const routeFile of routeFiles) {
    const routePath = routeFile.relativePath
      .replace(/^app/, '')
      .replace(/\/page\.tsx$/, '')
      .replace(/\([^/]+\)\//g, '') // strip route groups like (portal)
    if (routePath === '/dev' || routePath === '') continue
    if (routePath.includes('[')) continue // dynamic segments aren't literally greppable

    const referenced = files.some(f => f.relativePath !== routeFile.relativePath && f.content.includes(routePath))
    if (!referenced) {
      findings.push({
        module: 'Code',
        category: 'Dead Route',
        severity: 'Low',
        title: `${routePath} has no internal links to it`,
        evidence: `No scanned file contains the literal path "${routePath}".`,
        location: routeFile.relativePath,
        recommendation: `Confirm ${routePath} is still reachable (e.g. via the sidebar) before treating it as dead.`,
      })
    }
  }
  return findings
}

/**
 * One concrete, this-codebase-specific rule: server-only modules (those
 * importing node:fs or node:child_process) must never be imported by a
 * 'use client' file — a real architectural boundary this project has
 * deliberately maintained since Batch 6/Phase 4. Checked by name matching
 * import specifiers against known server-only lib/dev modules, one hop.
 */
function detectArchitectureViolations(files: ScannedFile[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const serverOnlyModules = new Set(
    files
      .filter(f => f.relativePath.startsWith('lib/dev/') && /require\(['"]node:(fs|child_process)|from ['"]node:(fs|child_process)/.test(f.content))
      .map(f => f.relativePath.replace(/^lib\/dev\//, '').replace(/\.ts$/, ''))
  )
  if (serverOnlyModules.size === 0) return findings

  for (const file of files) {
    if (!file.content.startsWith("'use client'") && !file.content.startsWith('"use client"')) continue
    for (const serverModule of serverOnlyModules) {
      const importPattern = new RegExp(`from ['"]@?/?lib/dev/${serverModule}['"]`)
      if (importPattern.test(file.content)) {
        findings.push({
          module: 'Code',
          category: 'Architecture Violation',
          severity: 'High',
          title: `${file.relativePath} imports the server-only module ${serverModule}`,
          evidence: `'use client' file ${file.relativePath} imports lib/dev/${serverModule}, which uses node:fs or node:child_process.`,
          location: file.relativePath,
          recommendation: `Move server-only logic out of ${serverModule} into an API route, or stop importing it from ${file.relativePath}.`,
        })
      }
    }
  }
  return findings
}
