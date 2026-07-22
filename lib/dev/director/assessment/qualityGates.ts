import type { AssessmentInput, QualityGateResult, QualityGateReport, GateStatus } from './assessmentTypes'

/**
 * Quality Gates — pure, deterministic evaluation of seven objective
 * signals, entirely from the gathered AssessmentInput (never re-running
 * a build/typecheck itself; buildStatus/typescriptStatus are read as
 * already-computed facts). Same input in, same QualityGateReport out,
 * every time.
 */
export function evaluateQualityGates(input: AssessmentInput): QualityGateReport {
  const gates: QualityGateResult[] = [
    {
      gate: 'Build Status',
      status: input.buildStatus,
      detail: `Last recorded build status: ${input.buildStatus}.`,
    },
    {
      gate: 'TypeScript Status',
      status: input.typescriptStatus,
      detail: `Last recorded TypeScript status: ${input.typescriptStatus}.`,
    },
    {
      // No test runner is wired into any part of this codebase yet (see
      // AGENTS.md's own project docs) — reporting anything but Unknown
      // here would be a fabricated signal.
      gate: 'Test Status',
      status: 'Unknown',
      detail: 'No automated test signal is available for this project.',
    },
    planningConsistencyGate(input),
    dependencyConsistencyGate(input),
    completionConsistencyGate(input),
    executionHealthGate(input),
  ]

  return {
    gates,
    passing: gates.filter(g => g.status === 'Passing').length,
    failing: gates.filter(g => g.status === 'Failing').length,
    unknown: gates.filter(g => g.status === 'Unknown').length,
  }
}

/** Passes when the Planning Service's own "exactly one Active batch" invariant holds and no batch references a milestone that no longer exists — both are supposed to be impossible given enforcePlanningStateFor, so a failure here means the invariant itself broke, not routine business state. */
function planningConsistencyGate(input: AssessmentInput): QualityGateResult {
  const activeCount = input.activeBatchIds.length
  const orphanCount = input.orphanedBatchIds.length
  const status: GateStatus = activeCount === 1 && orphanCount === 0 ? 'Passing' : 'Failing'
  return {
    gate: 'Planning Consistency',
    status,
    detail: `${activeCount} Active batch(es) (expected exactly 1); ${orphanCount} batch(es) reference a missing milestone.`,
  }
}

/** Passes when every dependency edge still resolves to an existing milestone/batch — an edge left dangling by a since-deleted entity is exactly the inconsistency this gate exists to catch. */
function dependencyConsistencyGate(input: AssessmentInput): QualityGateResult {
  const danglingCount = input.danglingDependencyIds.length
  return {
    gate: 'Dependency Consistency',
    status: danglingCount === 0 ? 'Passing' : 'Failing',
    detail: danglingCount === 0 ? 'No dependency edges reference a deleted milestone or batch.' : `${danglingCount} dependency edge(s) reference a deleted milestone or batch.`,
  }
}

/** Passes when every batch/milestone the Planning Service currently marks Complete also has a corresponding permanent record in the Knowledge Service — catches completion that bypassed the Knowledge Service (e.g. a manual status edit) rather than going through recordBatchCompletion/recordMilestoneCompletion. */
function completionConsistencyGate(input: AssessmentInput): QualityGateResult {
  const missingBatchRecords = input.completedBatchIds.filter(id => !input.batchCompletionRecordedIds.includes(id))
  const missingMilestoneRecords = input.completedMilestoneIds.filter(id => !input.milestoneCompletionRecordedIds.includes(id))
  const missing = missingBatchRecords.length + missingMilestoneRecords.length
  return {
    gate: 'Completion Consistency',
    status: missing === 0 ? 'Passing' : 'Failing',
    detail:
      missing === 0
        ? `All ${input.completedBatchIds.length} completed batch(es) and ${input.completedMilestoneIds.length} completed milestone(s) have a matching Knowledge Service record.`
        : `${missingBatchRecords.length} completed batch(es) and ${missingMilestoneRecords.length} completed milestone(s) have no matching Knowledge Service completion record.`,
  }
}

/** Passes when the Director isn't stuck: not Blocked, and the currently Active batch's last attempt (if any) didn't fail outright. */
function executionHealthGate(input: AssessmentInput): QualityGateResult {
  const blocked = input.directorState === 'Blocked'
  const status: GateStatus = blocked || input.activeBatchLastJobFailed ? 'Failing' : 'Passing'
  const reasons: string[] = []
  if (blocked) reasons.push('Director is Blocked')
  if (input.activeBatchLastJobFailed) reasons.push("the Active batch's most recent job ended Failed/Cancelled")
  return {
    gate: 'Execution Health',
    status,
    detail: reasons.length > 0 ? `Execution is unhealthy: ${reasons.join(', ')}.` : 'Director is progressing normally.',
  }
}
