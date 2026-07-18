import { readLocal, writeLocal } from './localStore'
import { milestonesForProject } from './milestonesStorage'

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
  /**
   * Explicit engineering order, same contract as Milestone.sequence
   * (lib/dev/milestonesStorage.ts) — "current batch" selection sorts
   * only by this, never by id, createdAt, or array position (this store
   * unshifts, so array order is newest-first). Batches with no explicit
   * sequence default to Number.MAX_SAFE_INTEGER.
   */
  sequence: number
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-batches-v1'

export const BATCH_STATUS_OPTIONS: BatchStatus[] = ['Queued', 'Active', 'Complete']

/**
 * 'Complete' is deliberately excluded — it should only ever be reached via
 * the Execution Engine's Approve pipeline (lib/dev/runtime/executionService.ts
 * → completeDevelopmentCycle), never a manual form edit, so a human can't
 * silently mark work done that was never actually executed and validated.
 */
export const MANUALLY_SETTABLE_BATCH_STATUS_OPTIONS: BatchStatus[] = ['Queued', 'Active']

type StoredBatch = Omit<Batch, 'archived' | 'sequence'> & Partial<Pick<Batch, 'archived' | 'sequence'>>

export function getBatches(): Batch[] {
  return readLocal<StoredBatch[]>(KEY, []).map(b => ({ archived: false, sequence: Number.MAX_SAFE_INTEGER, ...b }))
}

function saveBatches(items: Batch[]) {
  writeLocal(KEY, items)
}

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
  /** Explicit engineering-order position. Omit for batches with no defined place in the plan (defaults to Number.MAX_SAFE_INTEGER). */
  sequence?: number
}): Batch {
  const now = new Date().toISOString()
  const record: Batch = {
    id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    batchNumber: input.batchNumber.trim(),
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  const items = getBatches()
  items.unshift(record)
  saveBatches(items)
  return record
}

export function updateBatch(id: string, patch: Partial<Omit<Batch, 'id' | 'createdAt'>>) {
  const items = getBatches().map(b => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b))
  saveBatches(items)
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
  saveBatches(getBatches().filter(b => b.id !== id))
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
 * The first incomplete batch in engineering sequence — Active and
 * Queued are both "not done yet," so both are candidates; which one
 * wins is decided entirely by `sequence`, never by preferring one
 * status over the other and never by array/insertion order (this store
 * unshifts, so array order is newest-first, the opposite of engineering
 * order). Batch reach-1 stays current until it's Complete, then
 * whichever non-Complete batch has the next-lowest sequence takes over
 * automatically — no separate "advance" step needed.
 */
export function getCurrentBatchForProject(projectSlug: string): Batch | null {
  const items = [...batchesForProject(projectSlug)].sort((a, b) => a.sequence - b.sequence)
  return items.find(b => b.status !== 'Complete') ?? null
}
