import { readLocal, writeLocal } from './localStore'

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

const KEY = 'vyron-dev-technical-debt-v1'

export const DEBT_PRIORITY_OPTIONS: DebtPriority[] = ['Low', 'Medium', 'High']
export const DEBT_STATUS_OPTIONS: DebtStatus[] = ['Open', 'In Progress', 'Resolved']

type StoredDebt = Omit<TechnicalDebt, 'relatedBatch'> & { relatedBatch?: string }

export function getTechnicalDebt(): TechnicalDebt[] {
  return readLocal<StoredDebt[]>(KEY, []).map(d => ({ relatedBatch: '', ...d }))
}

function saveDebt(items: TechnicalDebt[]) {
  writeLocal(KEY, items)
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
  const now = new Date().toISOString()
  const record: TechnicalDebt = {
    id: `debt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    relatedBatch: input.relatedBatch ?? '',
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const items = getTechnicalDebt()
  items.unshift(record)
  saveDebt(items)
  return record
}

export function updateTechnicalDebt(id: string, patch: Partial<Omit<TechnicalDebt, 'id' | 'createdAt'>>) {
  const items = getTechnicalDebt().map(d => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d))
  saveDebt(items)
}

export function deleteTechnicalDebt(id: string) {
  saveDebt(getTechnicalDebt().filter(d => d.id !== id))
}

export function searchTechnicalDebt(query: string): TechnicalDebt[] {
  const q = query.trim().toLowerCase()
  const items = getTechnicalDebt()
  if (!q) return items
  return items.filter(d =>
    [d.title, d.description, d.estimatedEffort, d.priority, d.status].some(f => f.toLowerCase().includes(q))
  )
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
