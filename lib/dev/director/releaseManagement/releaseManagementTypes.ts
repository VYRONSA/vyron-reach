/**
 * Autonomous Release Management — real release preparation and
 * execution (git commits/branches, pull requests, deployment) sitting
 * behind a dedicated Release Go/Hold governance gate. Mirrors the
 * Autonomous Quality Assurance pipeline's exact shape (modular activity
 * registry, real-or-honest-gap results, structured evidence) and
 * Initiation's Executive Go/Hold pattern (an append-only decision store
 * gating the one function that actually performs the consequential
 * action).
 */

export type ReleaseActivityType =
  | 'Release Preparation'
  | 'Version Management'
  | 'Release Notes'
  | 'Git Commit Validation'
  | 'Branch Validation'
  | 'Pull Request Creation'
  | 'Merge Readiness'
  | 'CI/CD Triggering'
  | 'Deployment Execution'
  | 'Deployment Verification'

export type ReleaseActivityStatus = 'Passed' | 'Failed' | 'Not Applicable' | 'Skipped'

export type ReleaseActivityResult = {
  activity: ReleaseActivityType
  status: ReleaseActivityStatus
  summary: string
  detail: string
  durationMs: number | null
}

/**
 * One pass through a set of activities — Preparation runs the six
 * read-only/local activities automatically; Execution (only reachable
 * after a verified Go decision) runs the remaining mutating ones. Two
 * separate ReleaseReports on one ReleaseRequest rather than one combined
 * report, so "what was prepared" and "what was actually done" are never
 * conflated.
 */
export type ReleaseReport = {
  activities: ReleaseActivityResult[]
  passed: boolean
  runAt: string
  durationMs: number
}

export type ReleaseRequestStatus = 'Prepared' | 'Releasing' | 'Released' | 'ReleaseFailed' | 'Held'

export type ReleaseRequest = {
  id: string
  project: string
  status: ReleaseRequestStatus
  version: string
  notes: string
  branchName: string
  commitSha: string | null
  prUrl: string | null
  deploymentUrl: string | null
  preparationReport: ReleaseReport
  /** Null until a Go decision actually triggers executeRelease. */
  executionReport: ReleaseReport | null
  createdAt: string
  updatedAt: string
}

export type ReleaseControlDecisionType = 'Go' | 'Hold'

/** Append-only, mirrors ExecutiveControlDecision (lib/dev/initiation/initiationTypes.ts) exactly — never mutated or deleted, the permanent record of who decided what and why for one specific release. */
export type ReleaseControlDecision = {
  id: string
  releaseId: string
  project: string
  executive: string
  decidedAt: string
  decision: ReleaseControlDecisionType
  reason: string
  /** PRA-P1-026: true only for the decision that actually won the Prepared->Releasing/Held transition. A concurrent submission that lost that race is still recorded (never dropped) with this set to false, so the permanent audit trail always shows why a submitted decision had no effect instead of leaving that ambiguous. */
  effective: boolean
}

export type ExecResult = { code: number; stdout: string; stderr: string }

/**
 * The seam every mutating runner (git push, gh pr create, vercel deploy)
 * calls through instead of invoking child_process directly — production
 * binds this to a real execFile-based implementation; tests bind a fake
 * that returns canned output, so Pull Request Creation/Deployment
 * Execution's own logic can be verified without ever calling `gh`/
 * `vercel` for real or touching any real infrastructure.
 */
export type ExecImpl = (cmd: string, args: string[], cwd: string) => Promise<ExecResult>

export type ReleaseRunContext = {
  project: string
  releaseId: string
  cwd: string
  version: string
  branchName: string
  notes: string
  exec: ExecImpl
}
