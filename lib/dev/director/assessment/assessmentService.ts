import { gatherAssessmentInput } from './assessmentGather'
import { evaluateQualityGates } from './qualityGates'
import { evaluateRiskAssessment } from './riskAssessment'
import { evaluateEngineeringHealth } from './engineeringHealth'
import { appendAssessment, latestAssessment, type AssessmentHistoryEntry } from './assessmentStore'
import { publish } from '../../events/eventBus'
import type { AssessmentInput, EngineeringAssessment } from './assessmentTypes'

/**
 * The Assessment Service (Version 2.0, Milestone 2.3) — the ONLY
 * producer of Quality Gates, Risk Assessment, and Engineering Health.
 * Two halves, deliberately separated:
 *
 *   computeAssessment(input) — pure. Given the same AssessmentInput
 *   (deep-equal), always returns a byte-identical EngineeringAssessment.
 *   No side effects, no persistence, no timestamps, no randomness. This
 *   is what tests exercise to verify Milestone 2.3's determinism
 *   requirement directly, and what any future caller should prefer if it
 *   already has an AssessmentInput in hand.
 *
 *   runAssessment(project) — the orchestrator every real caller uses
 *   (serverExecutionLoop.ts, the read API route). Gathers current durable
 *   state, computes, and persists a new history entry ONLY when the
 *   computed content actually differs from the immediately preceding
 *   assessment — an unchanged assessment is a no-op write, the same
 *   "don't log what didn't change" discipline Live Knowledge Refresh
 *   (Milestone 2.2) already established.
 */
export function computeAssessment(input: AssessmentInput): EngineeringAssessment {
  const qualityGates = evaluateQualityGates(input)
  const riskAssessment = evaluateRiskAssessment(input)
  const engineeringHealth = evaluateEngineeringHealth(qualityGates, riskAssessment)

  return {
    project: input.project,
    qualityGates,
    riskAssessment,
    engineeringHealth,
    technicalDebtBaseline: input.technicalDebtRecordCount,
  }
}

export type RunAssessmentResult = {
  assessment: EngineeringAssessment
  changed: boolean
}

export function runAssessment(project: string): RunAssessmentResult {
  const startedAt = Date.now()
  const input = gatherAssessmentInput(project)
  const assessment = computeAssessment(input)

  const previous = latestAssessment(project)
  const changed = !previous || !assessmentsEqual(previous.assessment, assessment)

  if (changed) {
    appendAssessment(assessment)
    publish({
      category: 'Assessment Updates',
      project,
      type: 'assessment-changed',
      // durationMs measures gather+compute for THIS run only — a raw
      // fact the Metrics Service (Production Validation 2.1) averages;
      // an unchanged run publishes no event at all (see "don't log what
      // didn't change" above), so this average is scoped to assessments
      // that actually recorded a new entry, not every gather+compute call.
      payload: { engineeringHealth: assessment.engineeringHealth, riskLevel: assessment.riskAssessment.overall, durationMs: Date.now() - startedAt },
    })
  }

  return { assessment, changed }
}

export function getLatestAssessment(project: string): AssessmentHistoryEntry | null {
  return latestAssessment(project)
}

function assessmentsEqual(a: EngineeringAssessment, b: EngineeringAssessment): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
