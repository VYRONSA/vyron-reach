import {
  getPlanningCache,
  applyTechnicalDebtUpsert,
  applyTechnicalDebtRemoval,
  scheduleServerWrite,
  callApi,
  randomPlanningId,
  nowISO,
} from './planningState/planningClientCache'

export type DebtPriority = 'Low' | 'Medium' | 'High'
export type DebtStatus = 'Open' | 'In Progress' | 'Resolved'

export type TechnicalDebt = {
  id: string
  title: string
  description: string
  project: string // project slug, or '' for none
  relatedBatch: string // batch id, or '' for none
  priority: DebtPriority
  estimatedEffort: string
  createdDate: string
  resolvedDate: string
  status: DebtStatus
  createdAt: string
  updatedAt: string
}

export const DEBT_PRIORITY_OPTIONS: DebtPriority[] = ['Low', 'Medium', 'High']
export const DEBT_STATUS_OPTIONS: DebtStatus[] = ['Open', 'In Progress', 'Resolved']

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getTechnicalDebt(): TechnicalDebt[] {
  return getPlanningCache().technicalDebt
}

export function createTechnicalDebt(input: {
  title: string
  description: string
  project: string
  relatedBatch?: string
  priority: DebtPriority
  estimatedEffort: string
  createdDate: string
  resolvedDate: string
  status: DebtStatus
}): TechnicalDebt {
  const now = nowISO()
  const record: TechnicalDebt = {
    id: randomPlanningId('debt'),
    ...input,
    relatedBatch: input.relatedBatch ?? '',
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  }
  applyTechnicalDebtUpsert(record)
  if (input.project) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${input.project}/technical-debt`, {
        method: 'POST',
        body: JSON.stringify({
          title: record.title,
          description: record.description,
          relatedBatch: record.relatedBatch,
          priority: record.priority,
          estimatedEffort: record.estimatedEffort,
          createdDate: record.createdDate,
          resolvedDate: record.resolvedDate,
          status: record.status,
        }),
      })
    )
  }
  return record
}

export function updateTechnicalDebt(id: string, patch: Partial<Omit<TechnicalDebt, 'id' | 'createdAt'>>) {
  const current = getTechnicalDebt().find(d => d.id === id)
  if (!current) return
  const updated: TechnicalDebt = { ...current, ...patch, updatedAt: nowISO() }
  applyTechnicalDebtUpsert(updated)
  if (current.project) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${current.project}/technical-debt/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    )
  }
}

export function deleteTechnicalDebt(id: string) {
  const current = getTechnicalDebt().find(d => d.id === id)
  applyTechnicalDebtRemoval(id)
  if (!current?.project) return
  scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${current.project}/technical-debt/${id}`, { method: 'DELETE' }))
}

export function searchTechnicalDebt(query: string): TechnicalDebt[] {
  const q = query.trim().toLowerCase()
  const items = getTechnicalDebt()
  if (!q) return items
  return items.filter(d => [d.title, d.description, d.estimatedEffort, d.priority, d.status].some(f => f.toLowerCase().includes(q)))
}

export function debtForProject(slug: string): TechnicalDebt[] {
  return getTechnicalDebt().filter(d => d.project === slug)
}

export function debtForBatch(batchId: string): TechnicalDebt[] {
  return getTechnicalDebt().filter(d => d.relatedBatch === batchId)
}

export function outstandingDebt(): TechnicalDebt[] {
  return getTechnicalDebt().filter(d => d.status !== 'Resolved')
}
