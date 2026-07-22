import {
  getPlanningCache,
  applyMilestoneUpsert,
  applyMilestoneRemoval,
  scheduleServerWrite,
  callApi,
  randomPlanningId,
  nowISO,
} from './planningState/planningClientCache'

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
   * Milestones with no explicit sequence default to Number.MAX_SAFE_INTEGER
   * — unsequenced work sorts after everything that has a real position
   * in the plan, it never guesses one.
   */
  sequence: number
  createdAt: string
  updatedAt: string
}

export const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ['Upcoming', 'In Progress', 'At Risk', 'Complete']

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getMilestones(): Milestone[] {
  return getPlanningCache().milestones
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
  sequence?: number
}): Milestone {
  const now = nowISO()
  const record: Milestone = {
    id: randomPlanningId('milestone'),
    project: input.project,
    title: input.title.trim(),
    description: input.description,
    phase: input.phase,
    startDate: input.startDate,
    targetDate: input.targetDate,
    progress: input.progress,
    status: input.status,
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  applyMilestoneUpsert(record)
  scheduleServerWrite(() =>
    callApi(`/api/dev/planning/projects/${input.project}/milestones`, {
      method: 'POST',
      body: JSON.stringify({
        title: record.title,
        description: record.description,
        phase: record.phase,
        startDate: record.startDate,
        targetDate: record.targetDate,
        progress: record.progress,
        status: record.status,
        sequence: input.sequence,
      }),
    })
  )
  return record
}

export function updateMilestone(id: string, patch: Partial<Omit<Milestone, 'id' | 'createdAt'>>) {
  const current = getMilestones().find(m => m.id === id)
  if (!current) return
  const updated: Milestone = { ...current, ...patch, updatedAt: nowISO() }
  applyMilestoneUpsert(updated)
  scheduleServerWrite(() =>
    callApi(`/api/dev/planning/projects/${current.project}/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  )
}

export function archiveMilestone(id: string) {
  updateMilestone(id, { archived: true })
}

export function restoreMilestone(id: string) {
  updateMilestone(id, { archived: false })
}

export function deleteMilestone(id: string) {
  const current = getMilestones().find(m => m.id === id)
  applyMilestoneRemoval(id)
  if (!current) return
  scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${current.project}/milestones/${id}`, { method: 'DELETE' }))
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
 * derive from (see getCurrentBatchForProject in batchesStorage.ts, which
 * projectIntelligence.ts prefers when a batch exists). Sorted by explicit
 * `sequence`.
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
