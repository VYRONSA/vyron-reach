import fs from 'node:fs'
import path from 'node:path'
import type { BuildIntelligence } from '../buildIntelligence'
import type { EngineeringFinding } from './types'

/**
 * Server-only. Extends Build Intelligence with findings, reusing its
 * already-computed status rather than re-reading lastValidation.json.
 * "Increasing build time" and "lint regressions" are NOT implemented —
 * this repo persists no build-duration history and no lint-status record
 * at all (confirmed: lastValidation.json holds only the latest
 * build/typescript/checkedAt snapshot). Rather than fabricate a trend
 * from a single data point, those two sub-detectors are simply omitted.
 */
export function scanBuildIntelligence(build: BuildIntelligence): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []

  if (build.lastBuildStatus === 'Failing') {
    findings.push({
      module: 'Build',
      category: 'Failed Build',
      severity: 'Critical',
      title: 'The last recorded build failed',
      evidence: `Build Status: Failing (checked ${build.buildTimestamp}).`,
      location: null,
      recommendation: 'Run npm run build locally and fix the reported errors.',
    })
  }

  if (build.lastTypeScriptStatus === 'Failing') {
    findings.push({
      module: 'Build',
      category: 'TypeScript Failing',
      severity: 'Critical',
      title: 'The last recorded TypeScript check failed',
      evidence: `TypeScript Status: Failing (checked ${build.buildTimestamp}).`,
      location: null,
      recommendation: 'Run npx tsc --noEmit locally and fix the reported errors.',
    })
  }

  findings.push(...detectDependencyProblems())

  return findings
}

/** Package present in both dependencies and devDependencies — a real, narrow, structural signal; not a full outdated-package audit (that would require a network call this engine deliberately doesn't make). */
function detectDependencyProblems(): EngineeringFinding[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    const deps = Object.keys(pkg.dependencies ?? {})
    const devDeps = new Set(Object.keys(pkg.devDependencies ?? {}))
    const overlap = deps.filter(d => devDeps.has(d))
    if (overlap.length === 0) return []
    return [
      {
        module: 'Build',
        category: 'Dependency Problem',
        severity: 'Low',
        title: `${overlap.length} package(s) listed in both dependencies and devDependencies`,
        evidence: overlap.join(', '),
        location: 'package.json',
        recommendation: 'Keep each package in exactly one of dependencies/devDependencies.',
      },
    ]
  } catch {
    return []
  }
}
