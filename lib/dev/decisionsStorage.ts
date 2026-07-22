import { getPlanningCache, applyDecisionUpsert, applyDecisionRemoval, scheduleServerWrite, callApi, randomPlanningId, nowISO } from './planningState/planningClientCache'

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

export const DECISION_STATUS_OPTIONS: DecisionStatus[] = ['Proposed', 'Approved', 'Superseded', 'Rejected']

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getDecisions(): Decision[] {
  return getPlanningCache().decisions
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
  const now = nowISO()
  const record: Decision = {
    id: randomPlanningId('decision'),
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
  applyDecisionUpsert(record)
  if (input.relatedProject) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${input.relatedProject}/decisions`, {
        method: 'POST',
        body: JSON.stringify({
          decision: record.decision,
          reason: record.reason,
          alternatives: record.alternatives,
          approvedDate: record.approvedDate,
          status: record.status,
          relatedMilestone: record.relatedMilestone,
          relatedBatch: record.relatedBatch,
          relatedJournalEntry: record.relatedJournalEntry,
          relatedPrompt: record.relatedPrompt,
        }),
      })
    )
  }
  return record
}

export function updateDecision(id: string, patch: Partial<Omit<Decision, 'id' | 'createdAt'>>) {
  const current = getDecisions().find(d => d.id === id)
  if (!current) return
  const updated: Decision = { ...current, ...patch, updatedAt: nowISO() }
  applyDecisionUpsert(updated)
  if (current.relatedProject) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${current.relatedProject}/decisions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    )
  }
}

export function deleteDecision(id: string) {
  const current = getDecisions().find(d => d.id === id)
  applyDecisionRemoval(id)
  if (!current?.relatedProject) return
  scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${current.relatedProject}/decisions/${id}`, { method: 'DELETE' }))
}

export function searchDecisions(query: string): Decision[] {
  const q = query.trim().toLowerCase()
  const decisions = getDecisions()
  if (!q) return decisions
  return decisions.filter(d => [d.decision, d.reason, d.alternatives, d.status, d.relatedProject].some(field => field.toLowerCase().includes(q)))
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
