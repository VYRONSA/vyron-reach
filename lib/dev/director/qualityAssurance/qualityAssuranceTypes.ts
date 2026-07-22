/**
 * Autonomous Quality Assurance — the modular verification pipeline that
 * runs after every batch's Claude Code execution and before the
 * worker-review gate. Replaces "compiles" as the bar for "good": a
 * batch is only judged Passed once every applicable activity is,
 * structured evidence in hand, never console output alone.
 *
 * Mirrors the Engineering Intelligence pipeline's own shape
 * (lib/dev/director/engineeringIntelligence/) — a modular registry of
 * independent activity runners, each returning a real result or an
 * honest Skipped/Not Applicable status, never a fabricated Pass.
 */

export type VerificationActivityType =
  | 'Unit Tests'
  | 'Integration Tests'
  | 'End-to-End Tests'
  | 'TypeScript Compilation'
  | 'Production Build'
  | 'Static Analysis'
  | 'Linting'
  | 'Security Scanning'
  | 'Dependency Health'
  | 'Coverage Reporting'

/**
 * Passed/Failed are real outcomes. Not Applicable means this activity
 * genuinely doesn't apply to what this batch changed (e.g. a dependency
 * scan when no dependency file changed). Skipped means the activity
 * would apply in principle but the tool it depends on isn't available
 * in this environment (e.g. Linting — configured but not installed).
 * The distinction matters: Not Applicable and Skipped both never block
 * a batch, but only Skipped should ever prompt "go install this tool."
 */
export type VerificationActivityStatus = 'Passed' | 'Failed' | 'Not Applicable' | 'Skipped'

export type VerificationActivityResult = {
  activity: VerificationActivityType
  status: VerificationActivityStatus
  /** One line — what a CEO scanning a list of activities needs to see. */
  summary: string
  /** The real, structured evidence behind the summary — a count, an exit code, the actual findings/vulnerabilities/output, never a paraphrase standing in for it. */
  detail: string
  /** Null for Not Applicable/Skipped activities that never actually ran anything. */
  durationMs: number | null
}

export type VerificationRunContext = {
  project: string
  batchId: string | null
  cwd: string
  /** Real, ground-truth file paths this batch changed (git diff --name-only) — never the AI worker's self-reported file list. */
  changedFiles: string[]
}

export type VerificationReport = {
  project: string
  batchId: string | null
  runAt: string
  durationMs: number
  activities: VerificationActivityResult[]
  /** True only when every activity that actually ran (Passed or Failed) is Passed — Not Applicable/Skipped activities never block this. */
  passed: boolean
  /**
   * Kept in the exact shape lib/dev/director/serverExecutionLoop.ts's
   * existing consumers already expect (patchDirectorStatus,
   * validateWorkerOutput) — derived directly from the TypeScript
   * Compilation / Production Build activities above, not a second,
   * independent computation.
   */
  buildStatus: 'Passing' | 'Failing'
  typescriptStatus: 'Passing' | 'Failing'
}
