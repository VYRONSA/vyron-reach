import { getPlanningCache, applyRiskUpsert, applyRiskRemoval, scheduleServerWrite, callApi, randomPlanningId, nowISO } from './planningState/planningClientCache'

export type RiskLevel = 'Low' | 'Medium' | 'High'
export type RiskStatus = 'Open' | 'Monitoring' | 'Mitigated' | 'Closed'

export type Risk = {
  id: string
  title: string
  description: string
  project: string // project slug, or '' for none
  relatedMilestone: string // milestone id, or '' for none
  severity: RiskLevel
  probability: RiskLevel
  mitigation: string
  owner: string
  status: RiskStatus
  createdAt: string
  updatedAt: string
}

export const RISK_LEVEL_OPTIONS: RiskLevel[] = ['Low', 'Medium', 'High']
export const RISK_STATUS_OPTIONS: RiskStatus[] = ['Open', 'Monitoring', 'Mitigated', 'Closed']

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getRisks(): Risk[] {
  return getPlanningCache().risks
}

export function createRisk(input: {
  title: string
  description: string
  project: string
  relatedMilestone?: string
  severity: RiskLevel
  probability: RiskLevel
  mitigation: string
  owner: string
  status: RiskStatus
}): Risk {
  const now = nowISO()
  const record: Risk = {
    id: randomPlanningId('risk'),
    ...input,
    relatedMilestone: input.relatedMilestone ?? '',
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  }
  applyRiskUpsert(record)
  if (input.project) {
    scheduleServerWrite(() =>
      callApi(`/api/dev/planning/projects/${input.project}/risks`, {
        method: 'POST',
        body: JSON.stringify({
          title: record.title,
          description: record.description,
          relatedMilestone: record.relatedMilestone,
          severity: record.severity,
          probability: record.probability,
          mitigation: record.mitigation,
          owner: record.owner,
          status: record.status,
        }),
      })
    )
  }
  return record
}

export function updateRisk(id: string, patch: Partial<Omit<Risk, 'id' | 'createdAt'>>) {
  const current = getRisks().find(r => r.id === id)
  if (!current) return
  const updated: Risk = { ...current, ...patch, updatedAt: nowISO() }
  applyRiskUpsert(updated)
  if (current.project) {
    scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${current.project}/risks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }))
  }
}

export function deleteRisk(id: string) {
  const current = getRisks().find(r => r.id === id)
  applyRiskRemoval(id)
  if (!current?.project) return
  scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${current.project}/risks/${id}`, { method: 'DELETE' }))
}

export function searchRisks(query: string): Risk[] {
  const q = query.trim().toLowerCase()
  const items = getRisks()
  if (!q) return items
  return items.filter(r => [r.title, r.description, r.mitigation, r.owner, r.severity, r.status].some(f => f.toLowerCase().includes(q)))
}

export function risksForProject(slug: string): Risk[] {
  return getRisks().filter(r => r.project === slug)
}

export function risksForMilestone(milestoneId: string): Risk[] {
  return getRisks().filter(r => r.relatedMilestone === milestoneId)
}

export function isOpenRisk(r: Risk): boolean {
  return r.status !== 'Mitigated' && r.status !== 'Closed'
}

export function openHighRisks(): Risk[] {
  return getRisks().filter(r => r.severity === 'High' && isOpenRisk(r))
}

export function openRisksForProject(slug: string): Risk[] {
  return risksForProject(slug).filter(isOpenRisk)
}
