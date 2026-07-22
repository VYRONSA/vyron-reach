import { splitReportItems, type ParsedClaudeReport } from '../../developmentCompletionEngine'
import type { WorkerRole, WorkerTaskResult, WorkerReviewOutcome } from './workforceTypes'
import type { GateStatus } from '../assessment/assessmentTypes'

/**
 * Builds the worker's return payload — exactly the six fields Milestone
 * 3.1 requires (Summary/Files changed/Engineering findings/Risks
 * discovered/Technical debt introduced/Recommendations) — directly from
 * the same ParsedClaudeReport the headless loop already produces
 * (lib/dev/developmentCompletionEngine.ts's parseClaudeReport). No new
 * report parsing: "Engineering findings" maps to the report's Architecture
 * Decisions section (the closest thing to a structural observation a
 * completed batch reports on itself), "Risks discovered"/"Technical debt
 * introduced"/"Recommendations" map 1:1 to their same-named sections.
 */
export function buildWorkerTaskResult(taskId: string, role: WorkerRole, parsed: ParsedClaudeReport): WorkerTaskResult {
  return {
    taskId,
    role,
    summary: parsed.executiveSummary,
    filesChanged: { created: parsed.filesCreated, modified: parsed.filesModified, deleted: parsed.filesDeleted },
    engineeringFindings: splitReportItems(parsed.architectureDecisions),
    risksDiscovered: splitReportItems(parsed.risksIdentified),
    technicalDebtIntroduced: splitReportItems(parsed.technicalDebtIdentified),
    recommendations: splitReportItems(parsed.recommendations),
  }
}

/**
 * The Director's validation gate — "Only validated work updates Planning
 * or Knowledge." A worker's output is rejected (never partially applied)
 * when it fails any of these objective checks: no executive summary
 * (nothing to trust as a record of what happened), a failing build or
 * TypeScript status (self-contained here rather than assuming the
 * caller already checked, so this function is correct in isolation), or
 * zero reported file changes (a batch that changed nothing produced no
 * work to validate). Deterministic — no timestamps, no randomness.
 */
export function validateWorkerOutput(result: WorkerTaskResult, buildStatus: GateStatus, typescriptStatus: GateStatus): WorkerReviewOutcome {
  const reasons: string[] = []

  if (!result.summary.trim()) reasons.push('No executive summary was reported.')
  if (buildStatus === 'Failing') reasons.push('Build is failing.')
  if (typescriptStatus === 'Failing') reasons.push('TypeScript is failing.')
  const { created, modified, deleted } = result.filesChanged
  if (created.length === 0 && modified.length === 0 && deleted.length === 0) reasons.push('No files were reported as changed.')

  return { decision: reasons.length === 0 ? 'Approved' : 'Rejected', reasons }
}
