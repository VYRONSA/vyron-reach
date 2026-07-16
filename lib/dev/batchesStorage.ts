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
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-batches-v1'

export const BATCH_STATUS_OPTIONS: BatchStatus[] = ['Queued', 'Active', 'Complete']

export function getBatches(): Batch[] {
  return readLocal<Batch[]>(KEY, [])
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
}): Batch {
  const now = new Date().toISOString()
  const record: Batch = {
    id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    batchNumber: input.batchNumber.trim(),
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

export function getCurrentBatchForProject(projectSlug: string): Batch | null {
  const items = batchesForProject(projectSlug)
  return items.find(b => b.status === 'Active') ?? items.find(b => b.status === 'Queued') ?? null
}
