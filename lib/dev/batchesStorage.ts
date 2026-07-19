import { readLocal, writeLocal } from './localStore'
import { getMilestones, milestonesForProject, syncMilestoneStatus } from './milestonesStorage'

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

/** Writes without re-running planning-state enforcement — used internally by enforcePlanningState itself so demoting/promoting a batch never recurses back through the enforcement it's already in the middle of running. */
function rawUpdateBatch(id: string, patch: Partial<Omit<Batch, 'id' | 'createdAt'>>) {
  const items = getBatches().map(b => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b))
  saveBatches(items)
}

function projectSlugForBatch(batch: Batch): string | null {
  if (!batch.milestone) return null
  return getMilestones().find(m => m.id === batch.milestone)?.project || null
}

/**
 * The Planning Rules enforcement point — "Only one Active batch per
 * project," "Project Current Batch must always equal Active Batch,"
 * "Completed batches cannot remain Queued," and "Milestone status derives
 * from batch completion," all in one pass. Idempotent and cheap, so it's
 * safe to call both after every write (createBatch/updateBatch) and on
 * every read (getCurrentBatchForProject self-heals legacy data this way
 * too) without worrying about redundant work or recursion — the only
 * writes it performs are rawUpdateBatch (never re-enters this function)
 * and syncMilestoneStatus (a different store, no cycle back here).
 *
 * `justActivatedId` matters only when there's a conflict to resolve: it's
 * the batch a write JUST explicitly set to Active, if any. A human
 * deliberately activating a later batch (e.g. skipping one that turned out
 * irrelevant) must win over whatever was already Active — never get
 * silently reverted back to it — so the conflict resolution below prefers
 * this id over "lowest sequence" whenever it's one of the batches in
 * conflict. Reads (getCurrentBatchForProject's self-heal) pass none, since
 * there's no explicit human action to honor there, so sequence order
 * decides.
 */
function enforcePlanningState(projectSlug: string, justActivatedId?: string): void {
  const items = [...batchesForProject(projectSlug)].sort((a, b) => a.sequence - b.sequence)
  const activeBatches = items.filter(b => b.status === 'Active')

  if (activeBatches.length > 1) {
    const keep = activeBatches.find(b => b.id === justActivatedId) ?? activeBatches[0]
    for (const extra of activeBatches.filter(b => b.id !== keep.id)) rawUpdateBatch(extra.id, { status: 'Queued' })
  } else if (activeBatches.length === 0) {
    // Nothing Active — either this project has never been started, or the
    // previously-Active batch just completed. Either way, work isn't
    // supposed to sit idle in Queued while incomplete batches exist, so
    // the next one in engineering sequence is promoted automatically.
    const next = items.find(b => b.status !== 'Complete')
    if (next) rawUpdateBatch(next.id, { status: 'Active' })
  }

  const milestoneIds = new Set(items.map(b => b.milestone).filter(Boolean))
  for (const milestoneId of milestoneIds) {
    syncMilestoneStatus(
      milestoneId,
      items.filter(b => b.milestone === milestoneId).map(b => b.status)
    )
  }
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
  const slug = projectSlugForBatch(record)
  if (slug) enforcePlanningState(slug, record.status === 'Active' ? record.id : undefined)
  return record
}

export function updateBatch(id: string, patch: Partial<Omit<Batch, 'id' | 'createdAt'>>) {
  rawUpdateBatch(id, patch)
  const updated = getBatches().find(b => b.id === id)
  const slug = updated ? projectSlugForBatch(updated) : null
  if (slug) enforcePlanningState(slug, patch.status === 'Active' ? id : undefined)
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
 * The single authoritative "Current Batch" — the Planning Rule "Project
 * Current Batch must always equal Active Batch" means this is, by
 * definition, whichever batch has status === 'Active', never picked by
 * sequence alone (sequence only decides which batch enforcePlanningState
 * promotes to Active next). enforcePlanningState runs here too so a
 * project whose data predates this invariant (or was hand-edited into an
 * inconsistent state) self-heals on the very next read, instead of every
 * caller needing to know to call it first. Every subsystem that shows
 * "Current Batch" — Project pages, Milestones, the Batch Manager's own
 * Active badge, the Planning Engine, Runtime Context, the Prompt
 * Builder — resolves through this one function (directly or via
 * projectIntelligence.ts), so they can no longer disagree.
 */
export function getCurrentBatchForProject(projectSlug: string): Batch | null {
  enforcePlanningState(projectSlug)
  return batchesForProject(projectSlug).find(b => b.status === 'Active') ?? null
}

