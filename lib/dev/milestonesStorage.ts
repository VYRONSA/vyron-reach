import { readLocal, writeLocal } from './localStore'

export type MilestoneStatus = 'Upcoming' | 'In Progress' | 'At Risk' | 'Complete'

export type Milestone = {
  id: string
  project: string // project slug, or '' for none
  title: string
  description: string
  startDate: string
  targetDate: string
  progress: number
  status: MilestoneStatus
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-milestones-v1'

export const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ['Upcoming', 'In Progress', 'At Risk', 'Complete']

export function getMilestones(): Milestone[] {
  return readLocal<Milestone[]>(KEY, [])
}

function saveMilestones(items: Milestone[]) {
  writeLocal(KEY, items)
}

export function createMilestone(input: {
  project: string
  title: string
  description: string
  startDate: string
  targetDate: string
  progress: number
  status: MilestoneStatus
}): Milestone {
  const now = new Date().toISOString()
  const record: Milestone = {
    id: `milestone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    title: input.title.trim(),
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

export function getCurrentMilestone(slug: string): Milestone | null {
  const items = milestonesForProject(slug)
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
