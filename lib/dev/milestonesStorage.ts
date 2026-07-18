import { readLocal, writeLocal } from './localStore'

export type MilestoneStatus = 'Upcoming' | 'In Progress' | 'At Risk' | 'Complete'

export type Milestone = {
  id: string
  project: string // project slug, or '' for none
  title: string
  description: string
  phase: string
  startDate: string
  targetDate: string
  progress: number
  status: MilestoneStatus
  archived: boolean
  /**
   * Explicit engineering order — the only thing "current milestone"
   * selection is allowed to sort by (see getCurrentMilestone below).
   * Never inferred from id, createdAt, or storage array position: this
   * store unshifts new records, so array/insertion order is newest-first
   * and is the opposite of engineering order. Milestones with no
   * explicit sequence (anything created outside the Initializer today)
   * default to Number.MAX_SAFE_INTEGER — unsequenced work sorts after
   * everything that has a real position in the plan, it never guesses one.
   */
  sequence: number
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-milestones-v1'

export const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ['Upcoming', 'In Progress', 'At Risk', 'Complete']

type StoredMilestone = Omit<Milestone, 'phase' | 'archived' | 'sequence'> & Partial<Pick<Milestone, 'phase' | 'archived' | 'sequence'>>

export function getMilestones(): Milestone[] {
  return readLocal<StoredMilestone[]>(KEY, []).map(m => ({ phase: '', archived: false, sequence: Number.MAX_SAFE_INTEGER, ...m }))
}

function saveMilestones(items: Milestone[]) {
  writeLocal(KEY, items)
}

export function createMilestone(input: {
  project: string
  title: string
  description: string
  phase: string
  startDate: string
  targetDate: string
  progress: number
  status: MilestoneStatus
  /** Explicit engineering-order position. Omit for milestones with no defined place in the plan (defaults to Number.MAX_SAFE_INTEGER). */
  sequence?: number
}): Milestone {
  const now = new Date().toISOString()
  const record: Milestone = {
    id: `milestone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    title: input.title.trim(),
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  const items = getMilestones()
  items.unshift(record)
  saveMilestones(items)
  return record
}

export function updateMilestone(id: string, patch: Partial<Omit<Milestone, 'id' | 'createdAt'>>) {
  const items = getMilestones().map(m => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m))
  saveMilestones(items)
}

export function archiveMilestone(id: string) {
  updateMilestone(id, { archived: true })
}

export function restoreMilestone(id: string) {
  updateMilestone(id, { archived: false })
}

export function deleteMilestone(id: string) {
  saveMilestones(getMilestones().filter(m => m.id !== id))
}

export function searchMilestones(query: string): Milestone[] {
  const q = query.trim().toLowerCase()
  const items = getMilestones()
  if (!q) return items
  return items.filter(m => [m.title, m.description, m.status].some(f => f.toLowerCase().includes(q)))
}

export function milestonesForProject(slug: string): Milestone[] {
  return getMilestones().filter(m => m.project === slug)
}

/**
 * Milestone-only fallback for callers with no current-batch context to
 * derive from (see getCurrentBatchForProject in batchesStorage.ts,
 * which projectIntelligence.ts prefers when a batch exists — "current
 * milestone" is meant to come FROM the current batch, not be picked
 * independently). Sorted by explicit `sequence`, never by storage array
 * order — this store unshifts, so array order is newest-first.
 */
export function getCurrentMilestone(slug: string): Milestone | null {
  const items = [...milestonesForProject(slug)].sort((a, b) => a.sequence - b.sequence)
  return (
    items.find(m => m.status === 'In Progress') ??
    items.find(m => m.status === 'At Risk') ??
    items.find(m => m.status === 'Upcoming') ??
    null
  )
}

/** Progress computed from Milestones: complete / total. Null when no milestones exist yet. */
export function getMilestoneProgress(slug: string): number | null {
  const items = milestonesForProject(slug)
  if (items.length === 0) return null
  const complete = items.filter(m => m.status === 'Complete').length
  return Math.round((complete / items.length) * 100)
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function overdueMilestones(): Milestone[] {
  const today = todayISO()
  return getMilestones().filter(m => m.status !== 'Complete' && m.targetDate !== '' && m.targetDate < today)
}
