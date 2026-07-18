import { batchesForMilestone, createBatch } from '../batchesStorage'
import type { Milestone } from '../milestonesStorage'
import type { InitializerStepResult } from './initializerTypes'

/**
 * Guarantees every milestone has at least one batch, each starting
 * Queued (this store's equivalent of "Planned" — BatchStatus has no
 * separate Planned state). Objective/summary/etc. are left blank on
 * purpose: deciding what a batch is actually for is the Planning
 * Engine's job, not the Initializer's — creating a real objective here
 * would be exactly the "generated objective" the spec forbids.
 * Idempotent per milestone: one that already has a batch is skipped,
 * never given a second one.
 *
 * `milestones` (from roadmapInitializer) is existing-then-newly-created,
 * NOT engineering order, so it's sorted by `sequence` here before
 * numbering/sequencing batches — batchNumber and batch.sequence must
 * both reflect the canonical plan, never the incoming array's order.
 */
export function initializeBatches(projectSlug: string, milestones: Milestone[]): InitializerStepResult {
  const created: string[] = []
  const skipped: string[] = []

  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence)

  ordered.forEach((milestone, index) => {
    if (batchesForMilestone(milestone.id).length > 0) {
      skipped.push(milestone.title)
      return
    }
    createBatch({
      batchNumber: `${projectSlug}-${index + 1}`,
      milestone: milestone.id,
      objective: '',
      summary: '',
      completedTasks: '',
      lessonsLearned: '',
      claudePrompt: '',
      completionDate: '',
      status: 'Queued',
      sequence: milestone.sequence,
    })
    created.push(milestone.title)
  })

  return { step: 'Batches', created, skipped }
}
