import { getLatestHandover, type Handover } from './handoverStorage'
import { getBatches, type Batch } from './batchesStorage'
import type { DevelopmentSession } from './developmentOrchestrator'
import type { DevelopmentPlan } from './aiPlanningEngine'
import type { DevelopmentDependencyStatus } from './developmentDependencyEngine'
import type { DevelopmentEvent } from './developmentEventEngine'
import { determineCompletionStatus } from './completionStatus'

export type PreviousObjectiveCompletion = 'Completed' | 'Partially Completed' | 'Not Completed' | 'Unknown'
export type DevelopmentDrift = 'No Drift' | 'Minor Drift' | 'Major Drift'
export type DevelopmentMomentum = 'Accelerating' | 'Steady' | 'Slowing' | 'Blocked'

export type RemainingWorkItem = {
  label: string
  source: 'Suggested Next Batch' | 'Recommendation' | 'Risk' | 'Blocker' | 'Queued Task'
  href: string
}

export type DevelopmentConversationMemory = {
  previousObjective: string | null
  completionStatus: PreviousObjectiveCompletion
  remainingWork: RemainingWorkItem[]
  drift: DevelopmentDrift
  driftExplanation: string
  currentCycle: string | null
  previousCycle: string | null
  currentFocus: string | null
  previousFocus: string | null
  delta: string
  momentum: DevelopmentMomentum
  continuitySummary: string
}

/**
 * "Did Claude complete it?" — reuses the same build/typescript/runtime/
 * next-batch determination the Development Completion Engine already made
 * when the handover was logged (a stored Handover has the same field shape
 * determineCompletionStatus reads), then folds in whether the batch it was
 * logged against was actually marked Complete. Never invented: a handover
 * with no evidence of work (no files touched, no summary) is "Not
 * Completed" rather than assumed done; no handover at all is "Unknown".
 */
function determineObjectiveCompletion(handover: Handover | null, relatedBatch: Batch | null): PreviousObjectiveCompletion {
  if (!handover) return 'Unknown'

  const hasEvidence =
    handover.filesCreated.length > 0 ||
    handover.filesModified.length > 0 ||
    handover.filesDeleted.length > 0 ||
    handover.executiveSummary.trim() !== ''
  if (!hasEvidence) return 'Not Completed'

  const { status: engineStatus } = determineCompletionStatus(handover)
  const batchComplete = relatedBatch ? relatedBatch.status === 'Complete' : null

  if (engineStatus === 'Development Complete' && batchComplete !== false) return 'Completed'
  return 'Partially Completed'
}

/** Every item traces to an existing record already computed elsewhere — nothing here is guessed. */
function buildRemainingWork(
  session: DevelopmentSession,
  dependencies: DevelopmentDependencyStatus,
  latestHandover: Handover | null
): RemainingWorkItem[] {
  const items: RemainingWorkItem[] = []
  if (latestHandover?.nextSuggestedBatch) {
    items.push({ label: latestHandover.nextSuggestedBatch, source: 'Suggested Next Batch', href: `/dev/handovers?focus=${latestHandover.id}` })
  }
  if (session.previousRecommendations) {
    items.push({ label: session.previousRecommendations, source: 'Recommendation', href: '/dev/handovers' })
  }
  for (const blocker of dependencies.blockers) {
    items.push({ label: blocker.description, source: 'Blocker', href: blocker.href })
  }
  for (const risk of session.activeRisks) {
    items.push({ label: risk.title, source: 'Risk', href: `/dev/risks?focus=${risk.id}` })
  }
  for (const task of session.outstandingTasks) {
    items.push({ label: task.title, source: 'Queued Task', href: `/dev/queue?focus=${task.id}` })
  }
  return items
}

/**
 * Drift only fires when the objective actually changed while the previous
 * one wasn't cleanly finished — moving on after a completed objective is
 * normal progression, not drift. Severity mirrors how much evidence there
 * was that the previous objective was actually finished.
 */
function detectDrift(
  previousObjective: string | null,
  currentObjective: string | null,
  completion: PreviousObjectiveCompletion
): { drift: DevelopmentDrift; explanation: string } {
  if (!previousObjective) {
    return { drift: 'No Drift', explanation: 'No previous objective on record to compare against.' }
  }
  if (!currentObjective) {
    return { drift: 'No Drift', explanation: 'No current objective set — nothing to compare against the previous session yet.' }
  }
  if (currentObjective === previousObjective) {
    return { drift: 'No Drift', explanation: 'The current objective matches the previous session — development is continuing the same thread.' }
  }
  if (completion === 'Completed') {
    return { drift: 'No Drift', explanation: 'The objective changed, but the previous objective was completed first — this is expected progression.' }
  }
  if (completion === 'Partially Completed') {
    return { drift: 'Minor Drift', explanation: 'The objective changed before the previous objective was fully completed.' }
  }
  return { drift: 'Major Drift', explanation: 'The objective changed while the previous objective shows little or no evidence of completion.' }
}

function buildDelta(previousCycle: string | null, currentCycle: string | null, previousFocus: string | null, currentFocus: string | null): string {
  const parts: string[] = []
  if (previousCycle && currentCycle && previousCycle !== currentCycle) parts.push(`Moved from ${previousCycle} to ${currentCycle}.`)
  else if (previousCycle && currentCycle) parts.push(`Still on ${currentCycle}.`)
  if (previousFocus && currentFocus && previousFocus !== currentFocus) parts.push(`Focus shifted from "${previousFocus}" to "${currentFocus}".`)
  return parts.length > 0 ? parts.join(' ') : 'No prior cycle recorded to compare against.'
}

/**
 * Blocked outranks Slowing outranks Accelerating — the same severity-first
 * ordering used throughout every other engine. Uses Development Events
 * (recent Critical-severity events), Dependency Intelligence (open
 * blockers), Executive Readiness (session.developmentReadiness), and the
 * Completion Engine's read on the previous session, without recomputing
 * any of them.
 */
function determineMomentum(
  session: DevelopmentSession,
  dependencies: DevelopmentDependencyStatus,
  events: DevelopmentEvent[],
  previousCompletion: PreviousObjectiveCompletion
): DevelopmentMomentum {
  const hasCriticalEvent = events.some(e => e.severity === 'Critical')
  if (session.developmentReadiness === 'Blocked' || hasCriticalEvent) return 'Blocked'
  if (
    dependencies.blockers.length > 0 ||
    session.developmentReadiness === 'Needs Review' ||
    previousCompletion === 'Partially Completed' ||
    previousCompletion === 'Not Completed'
  ) {
    return 'Slowing'
  }
  if (previousCompletion === 'Completed' && session.developmentReadiness === 'Ready') return 'Accelerating'
  return 'Steady'
}

/** Falls back to the already-computed Executive Decision rather than inventing new text when there's no more specific signal available. */
function buildContinuitySummary(
  completion: PreviousObjectiveCompletion,
  previousCycle: string | null,
  currentCycle: string | null,
  remainingWork: RemainingWorkItem[],
  executiveDecision: string
): string {
  if (completion === 'Unknown' || !previousCycle) {
    return currentCycle ? `No previous session on record. Begin work on ${currentCycle}.` : executiveDecision
  }
  if (completion === 'Completed') {
    return currentCycle ? `${previousCycle} completed successfully. Continue with ${currentCycle}.` : `${previousCycle} completed successfully.`
  }
  const nextStep = remainingWork[0]?.label ?? executiveDecision
  return `${previousCycle} only partially completed. Resolve ${nextStep} before continuing.`
}

/**
 * The Development Conversation Memory Engine — the permanent memory between
 * Claude development sessions. Pure composition only: session, plan,
 * dependencies, and events are required precomputed params (never
 * recalculated here), and the only additional reads are plain data lookups
 * (getLatestHandover, getBatches) rather than a second call into any
 * intelligence engine — nothing is called twice.
 *
 * "Previous generated prompt" has no persisted record (Prompt Intelligence
 * is a pure, ephemeral generator, not a store) — the durable trace of what
 * was actually asked and returned lives on the latest Handover
 * (originalPrompt/objective/executiveSummary), so that's the source of
 * truth here instead of a live Prompt Intelligence call. This also keeps
 * the dependency graph one-directional: Prompt Intelligence reads this
 * engine's output, this engine never reads Prompt Intelligence's.
 */
export function getDevelopmentConversationMemory(
  slug: string,
  session: DevelopmentSession,
  plan: DevelopmentPlan,
  dependencies: DevelopmentDependencyStatus,
  events: DevelopmentEvent[]
): DevelopmentConversationMemory {
  const latestHandover = getLatestHandover(slug)
  const previousBatch = latestHandover?.relatedBatch ? getBatches().find(b => b.id === latestHandover.relatedBatch) ?? null : null

  const previousObjective = latestHandover?.objective || null
  const previousCycle = previousBatch ? `Batch ${previousBatch.batchNumber}` : null
  const previousFocus = latestHandover?.phase || null

  const currentCycle = session.currentBatch ? `Batch ${session.currentBatch.batchNumber}` : null
  const currentFocus = session.currentPhase && session.currentPhase !== 'Unknown' ? session.currentPhase : null

  const completionStatus = determineObjectiveCompletion(latestHandover, previousBatch)
  const remainingWork = buildRemainingWork(session, dependencies, latestHandover)
  const { drift, explanation: driftExplanation } = detectDrift(previousObjective, session.currentObjective, completionStatus)
  const delta = buildDelta(previousCycle, currentCycle, previousFocus, currentFocus)
  const momentum = determineMomentum(session, dependencies, events, completionStatus)
  const continuitySummary = buildContinuitySummary(completionStatus, previousCycle, currentCycle, remainingWork, plan.executiveDecision)

  return {
    previousObjective,
    completionStatus,
    remainingWork,
    drift,
    driftExplanation,
    currentCycle,
    previousCycle,
    currentFocus,
    previousFocus,
    delta,
    momentum,
    continuitySummary,
  }
}
