import { readLocal, writeLocal } from './localStore'

export type ValidationStatus = 'Passing' | 'Failing' | 'Unknown'

export const VALIDATION_STATUS_OPTIONS: ValidationStatus[] = ['Passing', 'Failing', 'Unknown']

/**
 * A pasted-in Claude implementation report. Every field here is entered by
 * hand today — the shape is deliberately flat strings/arrays so a future
 * parser can populate the same fields from a raw response without any model
 * changes.
 */
export type Handover = {
  id: string
  project: string // project slug, or '' for none
  phase: string
  relatedMilestone: string // milestone id, or ''
  relatedBatch: string // batch id, or ''
  date: string // ISO date
  claudeModel: string
  objective: string
  originalPrompt: string
  fullResponse: string
  executiveSummary: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  sqlScriptsAdded: string[]
  buildStatus: ValidationStatus
  typescriptStatus: ValidationStatus
  runtimeStatus: ValidationStatus
  risksIdentified: string
  recommendations: string
  nextSuggestedBatch: string
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-handovers-v1'

export function getHandovers(): Handover[] {
  return readLocal<Handover[]>(KEY, [])
}

function saveHandovers(items: Handover[]) {
  writeLocal(KEY, items)
}

export type HandoverInput = Omit<Handover, 'id' | 'createdAt' | 'updatedAt'>

export function createHandover(input: HandoverInput): Handover {
  const now = new Date().toISOString()
  const record: Handover = {
    id: `handover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: now,
    updatedAt: now,
  }
  const items = getHandovers()
  items.unshift(record)
  saveHandovers(items)
  return record
}

export function updateHandover(id: string, patch: Partial<Omit<Handover, 'id' | 'createdAt'>>) {
  const items = getHandovers().map(h => (h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h))
  saveHandovers(items)
}

export function deleteHandover(id: string) {
  saveHandovers(getHandovers().filter(h => h.id !== id))
}

export function searchHandovers(query: string): Handover[] {
  const q = query.trim().toLowerCase()
  const items = getHandovers()
  if (!q) return items
  return items.filter(h =>
    [h.phase, h.claudeModel, h.objective, h.executiveSummary, h.risksIdentified, h.recommendations, h.nextSuggestedBatch].some(
      field => field.toLowerCase().includes(q)
    )
  )
}

export function handoversForProject(slug: string): Handover[] {
  return getHandovers().filter(h => h.project === slug)
}

export function handoversForMilestone(milestoneId: string): Handover[] {
  return getHandovers().filter(h => h.relatedMilestone === milestoneId)
}

export function handoversForBatch(batchId: string): Handover[] {
  return getHandovers().filter(h => h.relatedBatch === batchId)
}

/** Most recent handover for a project, by date then by when it was recorded. */
export function getLatestHandover(slug: string): Handover | null {
  const items = handoversForProject(slug).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
  return items[0] ?? null
}
