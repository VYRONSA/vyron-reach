import { execFile } from 'node:child_process'
import { runContinuousValidation } from '../../operations/continuousValidationEngine'
import { scanRepositoryFiles } from '../../intelligence/repositoryScanner'
import { scanCodeIntelligence } from '../../intelligence/codeIntelligence'
import { scanQualityIntelligence } from '../../intelligence/qualityIntelligence'
import type { VerificationActivityResult, VerificationActivityType, VerificationRunContext } from './qualityAssuranceTypes'

/**
 * The modular verification runner registry — one function per activity,
 * mirroring lib/dev/director/engineeringIntelligence/engineeringIntelligenceRetrievers.ts's
 * exact pattern (a real result or an honest Skipped/Not Applicable
 * status, never fabricated). Adding a new verification tool means
 * writing one more runner and appending it to RUNNERS — nothing in
 * qualityAssuranceService.ts or serverExecutionLoop.ts needs to change.
 */

export type Runner = (ctx: VerificationRunContext) => Promise<VerificationActivityResult>

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    // shell: true required for npm/npx to resolve on Windows — safe: cmd/args are fixed literals below, never interpolated user input.
    execFile(cmd, args, { cwd, timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024, shell: true }, (err, stdout, stderr) => {
      const code = typeof err?.code === 'number' ? err.code : err ? 1 : 0
      resolve({ code, stdout: stdout ?? '', stderr: stderr ?? '' })
    })
  })
}

/** TypeScript Compilation + Production Build — reuses the existing, already-real subprocess runner rather than duplicating it; one call produces both activity results. */
async function runTypeScriptAndBuild(ctx: VerificationRunContext): Promise<[VerificationActivityResult, VerificationActivityResult]> {
  const start = Date.now()
  const validation = await runContinuousValidation(ctx.cwd)
  const durationMs = Date.now() - start

  const build: VerificationActivityResult = {
    activity: 'Production Build',
    status: validation.buildStatus === 'Passing' ? 'Passed' : 'Failed',
    summary: `${validation.buildStatus}${validation.buildWarningCount > 0 ? ` (${validation.buildWarningCount} warning(s))` : ''}`,
    detail: validation.buildOutput || 'No build output captured.',
    durationMs,
  }
  const typescript: VerificationActivityResult = {
    activity: 'TypeScript Compilation',
    status: validation.typescriptStatus === 'Passing' ? 'Passed' : 'Failed',
    summary: validation.typescriptStatus,
    detail: validation.typescriptOutput || 'No TypeScript output captured.',
    durationMs,
  }
  return [typescript, build]
}

async function runUnitTests(ctx: VerificationRunContext): Promise<VerificationActivityResult> {
  const start = Date.now()
  const result = await run('npx', ['vitest', 'run'], ctx.cwd)
  const durationMs = Date.now() - start
  const output = result.stdout + result.stderr
  const passMatch = output.match(/Tests\s+(\d+)\s+passed(?:\s*\((\d+)\))?/i)
  const failMatch = output.match(/(\d+)\s+failed/i)
  const passedCount = passMatch ? Number(passMatch[1]) : null
  const failedCount = failMatch ? Number(failMatch[1]) : result.code === 0 ? 0 : null
  return {
    activity: 'Unit Tests',
    status: result.code === 0 ? 'Passed' : 'Failed',
    summary:
      passedCount !== null
        ? `${passedCount} passed${failedCount ? `, ${failedCount} failed` : ''}`
        : result.code === 0
          ? 'All tests passed.'
          : 'One or more tests failed.',
    detail: output.slice(-4000) || 'No test output captured.',
    durationMs,
  }
}

/**
 * In-process — the existing Code + Quality Intelligence scanners, one
 * shared repository walk. Deliberately excludes the 'Missing Tests'
 * finding category: repositoryScanner.ts's SCAN_ROOTS (app/components/lib)
 * never include tests/, so that category would always report "0 test
 * files found" even though the Unit Tests activity above just ran 786
 * real ones — a known scan-root gap, not a real finding, and left in
 * would silently contradict this same report's own Unit Tests result.
 */
async function runStaticAnalysis(): Promise<VerificationActivityResult> {
  const start = Date.now()
  const files = scanRepositoryFiles()
  const findings = [...scanCodeIntelligence(files), ...scanQualityIntelligence(files)].filter(f => f.category !== 'Missing Tests')
  const durationMs = Date.now() - start
  const blocking = findings.filter(f => f.severity === 'Critical' || f.severity === 'High')
  return {
    activity: 'Static Analysis',
    status: blocking.length > 0 ? 'Failed' : 'Passed',
    summary: `${findings.length} finding(s) (${blocking.length} Critical/High).`,
    detail: findings.length > 0 ? findings.map(f => `[${f.severity}] ${f.category}: ${f.title} — ${f.evidence}`).join('\n') : 'No findings.',
    durationMs,
  }
}

type NpmAuditReport = { metadata?: { vulnerabilities?: Record<string, number> }; vulnerabilities?: Record<string, { severity: string }> }

async function runSecurityScanning(ctx: VerificationRunContext): Promise<VerificationActivityResult> {
  const start = Date.now()
  const result = await run('npm', ['audit', '--json'], ctx.cwd)
  const durationMs = Date.now() - start
  let parsed: NpmAuditReport | null = null
  try {
    parsed = JSON.parse(result.stdout) as NpmAuditReport
  } catch {
    return {
      activity: 'Security Scanning',
      status: 'Skipped',
      summary: 'npm audit did not return parseable output.',
      detail: (result.stdout + result.stderr).slice(-2000) || 'No output captured.',
      durationMs,
    }
  }

  const bySeverity =
    parsed.metadata?.vulnerabilities ??
    Object.values(parsed.vulnerabilities ?? {}).reduce<Record<string, number>>((acc, v) => {
      acc[v.severity] = (acc[v.severity] ?? 0) + 1
      return acc
    }, {})

  const critical = bySeverity.critical ?? 0
  const high = bySeverity.high ?? 0
  const total = Object.values(bySeverity).reduce((a, b) => a + b, 0)

  return {
    activity: 'Security Scanning',
    status: critical + high > 0 ? 'Failed' : 'Passed',
    summary: `${total} total vulnerabilit${total === 1 ? 'y' : 'ies'} (${critical} critical, ${high} high).`,
    detail: JSON.stringify(bySeverity, null, 2),
    durationMs,
  }
}

async function runDependencyHealth(ctx: VerificationRunContext): Promise<VerificationActivityResult> {
  const start = Date.now()
  const result = await run('npm', ['outdated', '--json'], ctx.cwd)
  const durationMs = Date.now() - start
  let parsed: Record<string, unknown> = {}
  try {
    parsed = result.stdout.trim() ? (JSON.parse(result.stdout) as Record<string, unknown>) : {}
  } catch {
    return {
      activity: 'Dependency Health',
      status: 'Skipped',
      summary: 'npm outdated did not return parseable output.',
      detail: (result.stdout + result.stderr).slice(-2000) || 'No output captured.',
      durationMs,
    }
  }
  const outdatedCount = Object.keys(parsed).length
  // Informational only — an outdated (but not vulnerable) dependency is never a reason to block a batch; Security Scanning above is what actually gates on risk.
  return {
    activity: 'Dependency Health',
    status: 'Passed',
    summary: `${outdatedCount} package(s) outdated.`,
    detail: outdatedCount > 0 ? JSON.stringify(Object.keys(parsed), null, 2) : 'All dependencies at their wanted version.',
    durationMs,
  }
}

async function runLinting(): Promise<VerificationActivityResult> {
  return {
    activity: 'Linting',
    status: 'Skipped',
    summary: 'eslint is configured but not installed.',
    detail: 'eslint.config.mjs exists and references eslint-config-next, but neither eslint nor eslint-config-next is an installed dependency in this project — running it would require a network install this environment does not permit unattended.',
    durationMs: null,
  }
}

async function runCoverageReporting(): Promise<VerificationActivityResult> {
  return {
    activity: 'Coverage Reporting',
    status: 'Skipped',
    summary: 'No coverage provider is installed.',
    detail: 'Vitest requires a coverage provider package (@vitest/coverage-v8 or @vitest/coverage-istanbul) to report coverage; neither is installed in this project today.',
    durationMs: null,
  }
}

async function runIntegrationTests(): Promise<VerificationActivityResult> {
  return {
    activity: 'Integration Tests',
    status: 'Not Applicable',
    summary: 'No distinct Integration Test suite exists.',
    detail: 'This project maintains one test suite (tests/dev/**/*.test.ts, run above under Unit Tests) with no separate integration-tier tooling or convention.',
    durationMs: null,
  }
}

async function runEndToEndTests(): Promise<VerificationActivityResult> {
  return {
    activity: 'End-to-End Tests',
    status: 'Not Applicable',
    summary: 'No end-to-end testing tool is configured.',
    detail: 'No Playwright, Cypress, or other end-to-end testing configuration exists anywhere in this project today.',
    durationMs: null,
  }
}

/**
 * Every activity this pipeline knows how to run, keyed by its own
 * result's `activity` field — the registry `qualityAssuranceService.ts`
 * iterates. Activities not in `applicability` for a given batch are
 * synthesized as 'Not Applicable' by the service, not by skipping a
 * call here, so every activity in `VerificationActivityType` always has
 * exactly one result per report.
 */
export const SINGLE_RUNNERS: { activity: VerificationActivityType; run: Runner }[] = [
  { activity: 'Unit Tests', run: runUnitTests },
  { activity: 'Static Analysis', run: runStaticAnalysis },
  { activity: 'Security Scanning', run: runSecurityScanning },
  { activity: 'Dependency Health', run: runDependencyHealth },
  { activity: 'Linting', run: runLinting },
  { activity: 'Coverage Reporting', run: runCoverageReporting },
  { activity: 'Integration Tests', run: runIntegrationTests },
  { activity: 'End-to-End Tests', run: runEndToEndTests },
]

export { runTypeScriptAndBuild }
