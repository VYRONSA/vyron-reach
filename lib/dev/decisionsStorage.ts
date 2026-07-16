import { readLocal, writeLocal } from './localStore'

export type DecisionStatus = 'Proposed' | 'Approved' | 'Superseded' | 'Rejected'

export type Decision = {
  id: string
  decision: string
  reason: string
  alternatives: string
  approvedDate: string
  status: DecisionStatus
  relatedProject: string // project slug, or '' for none
  relatedMilestone: string // milestone id, or '' for none
  relatedBatch: string // batch id, or '' for none
  relatedJournalEntry: string // journal entry id, or '' for none
  relatedPrompt: string // prompt id, or '' for none
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-decisions-v1'

const LINK_DEFAULTS = {
  relatedMilestone: '',
  relatedBatch: '',
  relatedJournalEntry: '',
  relatedPrompt: '',
}

type StoredDecision = Omit<Decision, keyof typeof LINK_DEFAULTS> & Partial<Pick<Decision, keyof typeof LINK_DEFAULTS>>

export function getDecisions(): Decision[] {
  return readLocal<StoredDecision[]>(KEY, []).map(d => ({ ...LINK_DEFAULTS, ...d }))
}

function saveDecisions(decisions: Decision[]) {
  writeLocal(KEY, decisions)
}

export function createDecision(input: {
  decision: string
  reason: string
  alternatives: string
  approvedDate: string
  status: DecisionStatus
  relatedProject: string
  relatedMilestone?: string
  relatedBatch?: string
  relatedJournalEntry?: string
  relatedPrompt?: string
}): Decision {
  const now = new Date().toISOString()
  const record: Decision = {
    id: `decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    decision: input.decision.trim(),
    reason: input.reason,
    alternatives: input.alternatives,
    approvedDate: input.approvedDate,
    status: input.status,
    relatedProject: input.relatedProject,
    relatedMilestone: input.relatedMilestone ?? '',
    relatedBatch: input.relatedBatch ?? '',
    relatedJournalEntry: input.relatedJournalEntry ?? '',
    relatedPrompt: input.relatedPrompt ?? '',
    createdAt: now,
    updatedAt: now,
  }
  const decisions = getDecisions()
  decisions.unshift(record)
  saveDecisions(decisions)
  return record
}

export function updateDecision(id: string, patch: Partial<Omit<Decision, 'id' | 'createdAt'>>) {
  const decisions = getDecisions().map(d => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d))
  saveDecisions(decisions)
}

export function deleteDecision(id: string) {
  saveDecisions(getDecisions().filter(d => d.id !== id))
}

export function searchDecisions(query: string): Decision[] {
  const q = query.trim().toLowerCase()
  const decisions = getDecisions()
  if (!q) return decisions
  return decisions.filter(d =>
    [d.decision, d.reason, d.alternatives, d.status, d.relatedProject].some(field =>
      field.toLowerCase().includes(q)
    )
  )
}

export function decisionsForProject(slug: string): Decision[] {
  return getDecisions().filter(d => d.relatedProject === slug)
}

export function decisionsForMilestone(milestoneId: string): Decision[] {
  return getDecisions().filter(d => d.relatedMilestone === milestoneId)
}

export function decisionsForBatch(batchId: string): Decision[] {
  return getDecisions().filter(d => d.relatedBatch === batchId)
}

export function decisionsForJournalEntry(entryId: string): Decision[] {
  return getDecisions().filter(d => d.relatedJournalEntry === entryId)
}

export function decisionsForPrompt(promptId: string): Decision[] {
  return getDecisions().filter(d => d.relatedPrompt === promptId)
}

export const DECISION_STATUS_OPTIONS: DecisionStatus[] = ['Proposed', 'Approved', 'Superseded', 'Rejected']
