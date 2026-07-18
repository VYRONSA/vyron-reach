import { createMilestone, milestonesForProject, type Milestone } from '../milestonesStorage'
import { phaseByNumber, phaseLabel } from './phaseInitializer'
import type { InitializerStepResult, MilestoneTemplate } from './initializerTypes'

/**
 * The default milestone structure, in canonical Engineering Sequence
 * order. Titles are prescribed by the Initializer spec itself (not
 * invented), each assigned to the phase it naturally belongs to and a
 * `sequence` matching its position in that order — the explicit,
 * persisted signal getCurrentMilestone/getCurrentBatchForProject sort
 * by. Phase 5 (Optimisation) gets no default milestone — nothing in the
 * spec's example list maps to it — and stays available for one to be
 * added later, same as every other phase.
 */
export const DEFAULT_MILESTONES: MilestoneTemplate[] = [
  { title: 'Foundation Complete', phaseNumber: 1, sequence: 1 },
  { title: 'Authentication', phaseNumber: 2, sequence: 2 },
  { title: 'Database', phaseNumber: 2, sequence: 3 },
  { title: 'Core Services', phaseNumber: 2, sequence: 4 },
  { title: 'Business Logic', phaseNumber: 3, sequence: 5 },
  { title: 'Reporting', phaseNumber: 3, sequence: 6 },
  { title: 'AI', phaseNumber: 4, sequence: 7 },
  { title: 'Security', phaseNumber: 6, sequence: 8 },
  { title: 'Testing', phaseNumber: 6, sequence: 9 },
  { title: 'Release Candidate', phaseNumber: 7, sequence: 10 },
  { title: 'Version 1.0', phaseNumber: 7, sequence: 11 },
]

/**
 * Creates the default milestones for a project, skipping any title that
 * already exists for it (case-insensitive) — the idempotency guard that
 * makes running the Initializer twice a no-op for this step. Returns
 * every milestone (newly created or pre-existing) so batchInitializer
 * can guarantee "each milestone receives at least one batch" without a
 * second lookup.
 */
export function initializeMilestones(projectSlug: string): { result: InitializerStepResult; milestones: Milestone[] } {
  const existing = milestonesForProject(projectSlug)
  const existingTitles = new Set(existing.map(m => m.title.trim().toLowerCase()))

  const created: string[] = []
  const skipped: string[] = []
  const milestones: Milestone[] = [...existing]

  for (const template of DEFAULT_MILESTONES) {
    if (existingTitles.has(template.title.toLowerCase())) {
      skipped.push(template.title)
      continue
    }
    const milestone = createMilestone({
      project: projectSlug,
      title: template.title,
      description: '',
      phase: phaseLabel(phaseByNumber(template.phaseNumber)),
      startDate: '',
      targetDate: '',
      progress: 0,
      status: 'Upcoming',
      sequence: template.sequence,
    })
    milestones.push(milestone)
    created.push(template.title)
  }

  return { result: { step: 'Milestones', created, skipped }, milestones }
}
