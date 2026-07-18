import type { EngineeringPhaseDefinition } from './initializerTypes'

/**
 * The default Engineering Roadmap phases. Not a persisted entity of
 * their own — every Milestone already carries a free-text `phase`
 * field (lib/dev/milestonesStorage.ts), editable in the Admin UI like
 * any other milestone field. This module is the single canonical
 * definition of what those phase strings are, so milestoneInitializer
 * (and anything else that needs "Phase 2 — Core Platform") never
 * hard-codes its own copy.
 */
export const DEFAULT_PHASES: EngineeringPhaseDefinition[] = [
  { number: 1, name: 'Foundation' },
  { number: 2, name: 'Core Platform' },
  { number: 3, name: 'Business Features' },
  { number: 4, name: 'AI & Intelligence' },
  { number: 5, name: 'Optimisation' },
  { number: 6, name: 'Production Readiness' },
  { number: 7, name: 'Release' },
]

/** "Phase 2 — Core Platform" — the exact string stored in Milestone.phase. */
export function phaseLabel(phase: EngineeringPhaseDefinition): string {
  return `Phase ${phase.number} — ${phase.name}`
}

export function phaseByNumber(number: number): EngineeringPhaseDefinition {
  const phase = DEFAULT_PHASES.find(p => p.number === number)
  if (!phase) throw new Error(`No default phase numbered ${number}`)
  return phase
}
