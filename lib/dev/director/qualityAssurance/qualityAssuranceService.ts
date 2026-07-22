import { SINGLE_RUNNERS, runTypeScriptAndBuild } from './qualityAssuranceRunners'
import type { VerificationActivityResult, VerificationActivityType, VerificationRunContext, VerificationReport } from './qualityAssuranceTypes'

/**
 * Orchestrates the Autonomous Quality Assurance pipeline — determines
 * which of the 10 verification activities apply to this batch
 * (requirement 3), runs every applicable one, and returns a single
 * structured VerificationReport (requirement 4) rather than raw
 * console output. Never throws: any runner failing unexpectedly is
 * caught and turned into a Failed result naming the error, so one
 * broken tool can never silently skip verification.
 */

const PACKAGE_FILES = new Set(['package.json', 'package-lock.json'])

const ALWAYS_APPLICABLE: VerificationActivityType[] = ['TypeScript Compilation', 'Production Build', 'Unit Tests', 'Static Analysis']

/** Requirement 3 — Security Scanning/Dependency Health only apply when this batch actually touched a dependency manifest (real git diff, not the AI worker's self-report); every other real activity is unconditional, matching this loop's existing unconditional build+typecheck behavior. Linting/Coverage/Integration/End-to-End are gap-only regardless of what changed — no file change makes an uninstalled tool available. */
export function determineApplicability(changedFiles: string[]): Set<VerificationActivityType> {
  const applicable = new Set<VerificationActivityType>(ALWAYS_APPLICABLE)
  if (changedFiles.some(f => PACKAGE_FILES.has(f))) {
    applicable.add('Security Scanning')
    applicable.add('Dependency Health')
  }
  return applicable
}

function notApplicableResult(activity: VerificationActivityType): VerificationActivityResult {
  return {
    activity,
    status: 'Not Applicable',
    summary: 'This batch did not change anything this activity evaluates.',
    detail: 'No dependency manifest (package.json/package-lock.json) was touched by this batch.',
    durationMs: null,
  }
}

export async function runVerification(ctx: VerificationRunContext): Promise<VerificationReport> {
  const start = Date.now()
  const applicable = determineApplicability(ctx.changedFiles)
  const activities: VerificationActivityResult[] = []

  // TypeScript Compilation + Production Build are always applicable and always run together (one subprocess pass produces both).
  activities.push(...(await runTypeScriptAndBuild(ctx)))

  for (const { activity, run: runActivity } of SINGLE_RUNNERS) {
    if (activity === 'Security Scanning' || activity === 'Dependency Health') {
      if (!applicable.has(activity)) {
        activities.push(notApplicableResult(activity))
        continue
      }
    }
    try {
      activities.push(await runActivity(ctx))
    } catch (err) {
      activities.push({
        activity,
        status: 'Failed',
        summary: 'This verification activity failed to run.',
        detail: err instanceof Error ? err.message : String(err),
        durationMs: null,
      })
    }
  }

  const durationMs = Date.now() - start
  const passed = activities.every(a => a.status !== 'Failed')

  const build = activities.find(a => a.activity === 'Production Build')
  const typescript = activities.find(a => a.activity === 'TypeScript Compilation')

  return {
    project: ctx.project,
    batchId: ctx.batchId,
    runAt: new Date().toISOString(),
    durationMs,
    activities,
    passed,
    buildStatus: build?.status === 'Passed' ? 'Passing' : 'Failing',
    typescriptStatus: typescript?.status === 'Passed' ? 'Passing' : 'Failing',
  }
}

/** Requirement 5 — structured failure information for the Director to pause with; the full VerificationReport itself (not just this string) is what gets durably recorded. */
export function describeVerificationFailure(report: VerificationReport): string | null {
  if (report.passed) return null
  const failed = report.activities.filter(a => a.status === 'Failed')
  return failed.map(a => `${a.activity}: ${a.summary}`).join(' | ')
}
