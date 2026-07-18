import type { Milestone } from '../milestonesStorage'
import { DEFAULT_PHASES, phaseLabel } from './phaseInitializer'
import { DEFAULT_MILESTONES } from './milestoneInitializer'
import { initializeMilestones } from './milestoneInitializer'
import type { InitializerStepResult } from './initializerTypes'

/**
 * The Engineering Roadmap = the 7 default phases plus the milestones
 * tagged to them. Phases have no storage of their own (see
 * phaseInitializer.ts) — "creating the roadmap" for a fresh project
 * means making sure phase-tagged milestones exist, phase by phase. A
 * phase only counts as "created" here on the run that actually added
 * its first milestone; a phase whose milestones already existed (or
 * that has no default milestone at all, like Optimisation) reports as
 * skipped — a second run must never re-report the same phase as newly
 * created when nothing changed.
 */
export function initializeRoadmap(projectSlug: string): {
  phaseResult: InitializerStepResult
  milestoneResult: InitializerStepResult
  milestones: Milestone[]
} {
  const { result: milestoneResult, milestones } = initializeMilestones(projectSlug)
  const createdTitles = new Set(milestoneResult.created)

  const created: string[] = []
  const skipped: string[] = []
  for (const phase of DEFAULT_PHASES) {
    const touchedThisRun = DEFAULT_MILESTONES.some(m => m.phaseNumber === phase.number && createdTitles.has(m.title))
    const label = phaseLabel(phase)
    if (touchedThisRun) created.push(label)
    else skipped.push(label)
  }

  return { phaseResult: { step: 'Roadmap Phases', created, skipped }, milestoneResult, milestones }
}
