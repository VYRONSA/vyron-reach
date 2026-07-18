import { DEFAULT_MILESTONES } from '../initializer/milestoneInitializer'
import type { AssessmentReport } from '../assessment/assessmentTypes'
import type { ExecutiveEngineeringStrategy } from '../director/directorTypes'
import type { AcceptanceCriterion, DraftEngineeringTask, WorkCandidate } from './planningTypes'

/**
 * Turns already-evidenced recommendations (Assessment Engine, Engineering
 * Director) into draft engineering tasks — titles/descriptions/reasons
 * are read straight off those sources, never composed from scratch.
 * Nothing here decides priority, dependencies, or effort; that's
 * planningPrioritizer.ts and planningEstimator.ts.
 */

function normalizeTitle(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Candidates from the Assessment Engine's own recommendations (already
 * deduplicated, evidence-gated — see assessmentRecommendations.ts) and
 * the Director's accelerated-work / priority-escalation items (the
 * Director's own re-ranking of Engineering Intelligence findings).
 * Deduplicated by normalized title so a finding surfaced by both never
 * becomes two tasks.
 */
export function deriveWorkCandidates(assessment: AssessmentReport, directorStrategy: ExecutiveEngineeringStrategy | null): WorkCandidate[] {
  const seen = new Set<string>()
  const candidates: WorkCandidate[] = []

  const add = (candidate: WorkCandidate) => {
    const key = normalizeTitle(candidate.title)
    if (!key || seen.has(key)) return
    seen.add(key)
    candidates.push(candidate)
  }

  for (const escalation of directorStrategy?.recommendedPriorityChanges ?? []) {
    add({
      title: escalation.finding.title,
      description: escalation.finding.recommendation,
      reason: escalation.reason,
      source: `Engineering Director (escalated ${escalation.originalPriority} → ${escalation.recommendedPriority})`,
      sourceSeverity: escalation.recommendedPriority,
    })
  }

  for (const accelerated of directorStrategy?.recommendedAcceleratedWork ?? []) {
    add({
      title: accelerated.finding.title,
      description: accelerated.finding.recommendation,
      reason: accelerated.reason,
      source: `Engineering Director (accelerated work — ${accelerated.finding.module})`,
      sourceSeverity: accelerated.finding.severity,
    })
  }

  for (const rec of assessment.recommendations) {
    add({
      title: rec.text,
      description: rec.text,
      reason: `Engineering Assessment (${rec.category}): ${assessment.riskSummary}`,
      source: `Engineering Assessment — ${rec.category}`,
      sourceSeverity: null,
    })
  }

  return candidates
}

/**
 * Matches a candidate's title/description against the canonical
 * Engineering Sequence's milestone titles (lib/dev/initializer/
 * milestoneInitializer.ts's DEFAULT_MILESTONES — the same list the
 * Initializer uses to seed a project) so the Prioritizer can enforce
 * "never recommend AI before Authentication." A candidate that doesn't
 * literally reference a named milestone maps to null — it isn't forced
 * into a sequence position it wasn't evidenced for.
 */
export function mapToEngineeringSequence(text: string): number | null {
  const lower = text.toLowerCase()
  for (const milestone of DEFAULT_MILESTONES) {
    if (lower.includes(milestone.title.toLowerCase())) return milestone.sequence
  }
  return null
}

/**
 * Concrete, measurable acceptance criteria for the canonical milestones
 * — conventional engineering checkpoints for what each of these
 * standard phases means when done, not project-specific claims. Keyed
 * by the exact DEFAULT_MILESTONES title so a task mapped to one of
 * these (via mapToEngineeringSequence) gets the same checklist every
 * time, never a freshly invented one.
 */
const MILESTONE_ACCEPTANCE_CRITERIA: Record<string, string[]> = {
  'Foundation Complete': ['Project builds successfully', 'TypeScript compiles with zero errors', 'Core directory structure exists and is documented'],
  Authentication: ['Login succeeds', 'Logout succeeds', 'Session persists across requests', 'Unauthorized access is blocked'],
  Database: ['Database connection succeeds', 'Schema migrations apply cleanly', 'Core queries return expected data', 'Rollback of the last migration succeeds'],
  'Core Services': ['Core service endpoints respond successfully', 'Error responses follow a consistent shape', 'Service boundaries have no circular imports'],
  'Business Logic': ['Primary business workflow completes end-to-end', 'Invalid input is rejected with a clear error', 'Edge cases identified during design are covered'],
  Reporting: ['Report generates without error', 'Report data matches the underlying source records', 'Report is accessible from the intended entry point'],
  AI: ['AI feature returns a response for a valid input', 'AI feature fails gracefully on an invalid/empty input', 'AI feature respects existing authentication/authorization gates'],
  Security: ['No committed secrets detected by the Assessment Engine', 'Authentication and authorization reviews show no open Critical finding', 'Dependency vulnerabilities have been reviewed'],
  Testing: ['Test suite runs and passes', 'Highest-risk logic has direct test coverage', 'CI (or the equivalent local gate) blocks on test failure'],
  'Release Candidate': ['Build passes', 'TypeScript passes', 'No open Critical or High Engineering Intelligence finding'],
  'Version 1.0': ['Release Candidate criteria are met', 'Deployment succeeds to the target environment', 'Rollback path is confirmed available'],
}

/** Falls back to a criterion derived from the candidate's own evidence when it doesn't map to a named milestone — still measurable, never vague ("looks better" is not acceptable; "count reaches 0" is). */
function fallbackAcceptanceCriteria(candidate: WorkCandidate): AcceptanceCriterion[] {
  return [
    { text: `"${candidate.title}" is resolved and no longer appears in the next Engineering Assessment run.` },
    { text: 'Build and TypeScript status remain Passing after the change.' },
  ]
}

export function buildAcceptanceCriteria(candidate: WorkCandidate, engineeringSequence: number | null): AcceptanceCriterion[] {
  const milestone = DEFAULT_MILESTONES.find(m => m.sequence === engineeringSequence)
  if (milestone && MILESTONE_ACCEPTANCE_CRITERIA[milestone.title]) {
    return MILESTONE_ACCEPTANCE_CRITERIA[milestone.title].map(text => ({ text }))
  }
  return fallbackAcceptanceCriteria(candidate)
}

let taskCounter = 0
function nextTaskId(projectSlug: string): string {
  taskCounter += 1
  return `plantask_${projectSlug}_${Date.now()}_${taskCounter}`
}

export function buildDraftTask(projectSlug: string, candidate: WorkCandidate): DraftEngineeringTask {
  const engineeringSequence = mapToEngineeringSequence(candidate.title) ?? mapToEngineeringSequence(candidate.description)
  return {
    id: nextTaskId(projectSlug),
    title: candidate.title,
    description: candidate.description,
    reason: candidate.reason,
    status: 'Proposed',
    acceptanceCriteria: buildAcceptanceCriteria(candidate, engineeringSequence),
    engineeringSequence,
    source: candidate.source,
    sourceSeverity: candidate.sourceSeverity,
  }
}
