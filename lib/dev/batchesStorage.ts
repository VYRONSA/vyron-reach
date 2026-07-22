import { getMilestones, milestonesForProject } from './milestonesStorage'
import {
  getPlanningCache,
  applyBatchUpsert,
  applyBatchRemoval,
  scheduleServerWrite,
  callApi,
  randomPlanningId,
  nowISO,
} from './planningState/planningClientCache'

export type BatchStatus = 'Queued' | 'Active' | 'Complete'

export type Batch = {
  id: string
  batchNumber: string
  milestone: string // milestone id, or '' for unassigned
  objective: string
  summary: string
  completedTasks: string
  lessonsLearned: string
  claudePrompt: string
  completionDate: string
  status: BatchStatus
  archived: boolean
  /** Explicit engineering order, same contract as Milestone.sequence. */
  sequence: number
  createdAt: string
  updatedAt: string
}

export const BATCH_STATUS_OPTIONS: BatchStatus[] = ['Queued', 'Active', 'Complete']

/**
 * 'Complete' is deliberately excluded — it should only ever be reached via
 * the Execution Engine's Approve pipeline (lib/dev/runtime/executionService.ts
 * → completeDevelopmentCycle), never a manual form edit.
 */
export const MANUALLY_SETTABLE_BATCH_STATUS_OPTIONS: BatchStatus[] = ['Queued', 'Active']

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getBatches(): Batch[] {
  return getPlanningCache().batches
}

function projectSlugForBatch(batch: Pick<Batch, 'milestone'>): string | null {
  if (!batch.milestone) return null
  return getMilestones().find(m => m.id === batch.milestone)?.project || null
}

/**
 * Only one Active batch per project, milestone-status derivation, etc.
 * are enforced exclusively by the Planning Service
 * (lib/dev/planningState/planningStateService.ts's enforcePlanningStateFor
 * / deriveMilestoneStatus) — never reimplemented here. Every mutation
 * below applies an optimistic, unenforced local update purely for
 * immediate UI feedback, then reconciles the cache from the server's
 * authoritative result once it responds.
 */
export function createBatch(input: {
  batchNumber: string
  milestone: string
  objective: string
  summary: string
  completedTasks: string
  lessonsLearned: string
  claudePrompt: string
  completionDate: string
  status: BatchStatus
  sequence?: number
}): Batch {
  const now = nowISO()
  const record: Batch = {
    id: randomPlanningId('batch'),
    ...input,
    batchNumber: input.batchNumber.trim(),
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  applyBatchUpsert(record)
  const slug = projectSlugForBatch(record)
  if (slug) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${slug}/batches`, {
        method: 'POST',
        body: JSON.stringify({
          batchNumber: record.batchNumber,
          milestone: record.milestone,
          objective: record.objective,
          summary: record.summary,
          completedTasks: record.completedTasks,
          lessonsLearned: record.lessonsLearned,
          claudePrompt: record.claudePrompt,
          completionDate: record.completionDate,
          status: record.status,
          sequence: input.sequence,
        }),
      })
    )
  }
  return record
}

export function updateBatch(id: string, patch: Partial<Omit<Batch, 'id' | 'createdAt'>>) {
  const current = getBatches().find(b => b.id === id)
  if (!current) return
  const updated: Batch = { ...current, ...patch, updatedAt: nowISO() }
  applyBatchUpsert(updated)
  const slug = projectSlugForBatch(current)
  if (slug) {
    scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${slug}/batches/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }))
  }
}

export function archiveBatch(id: string) {
  updateBatch(id, { archived: true })
}

export function restoreBatch(id: string) {
  updateBatch(id, { archived: false })
}

export function completeBatch(id: string) {
  updateBatch(id, { status: 'Complete', completionDate: new Date().toISOString().slice(0, 10) })
}

export function deleteBatch(id: string) {
  const current = getBatches().find(b => b.id === id)
  applyBatchRemoval(id)
  if (!current) return
  const slug = projectSlugForBatch(current)
  if (slug) scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${slug}/batches/${id}`, { method: 'DELETE' }))
}

export function searchBatches(query: string): Batch[] {
  const q = query.trim().toLowerCase()
  const items = getBatches()
  if (!q) return items
  return items.filter(b =>
    [b.batchNumber, b.objective, b.summary, b.completedTasks, b.lessonsLearned, b.claudePrompt, b.status].some(f =>
      f.toLowerCase().includes(q)
    )
  )
}

export function batchesForMilestone(milestoneId: string): Batch[] {
  return getBatches().filter(b => b.milestone === milestoneId)
}

export function batchesForProject(projectSlug: string): Batch[] {
  const milestoneIds = new Set(milestonesForProject(projectSlug).map(m => m.id))
  return getBatches().filter(b => milestoneIds.has(b.milestone))
}

/**
 * The single authoritative "Current Batch" for display purposes — reads
 * whichever batch the Planning Service already resolved to `Active` in
 * the cache. No enforcement runs here (that would duplicate the Planning
 * Service's own invariant logic); the cache is always kept consistent
 * with the server via reconciliation after every mutation.
 */
export function getCurrentBatchForProject(projectSlug: string): Batch | null {
  return batchesForProject(projectSlug).find(b => b.status === 'Active') ?? null
}
