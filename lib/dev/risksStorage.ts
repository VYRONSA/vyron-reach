import { readLocal, writeLocal } from './localStore'

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

const KEY = 'vyron-dev-risks-v1'

export const RISK_LEVEL_OPTIONS: RiskLevel[] = ['Low', 'Medium', 'High']
export const RISK_STATUS_OPTIONS: RiskStatus[] = ['Open', 'Monitoring', 'Mitigated', 'Closed']

type StoredRisk = Omit<Risk, 'relatedMilestone'> & { relatedMilestone?: string }

export function getRisks(): Risk[] {
  return readLocal<StoredRisk[]>(KEY, []).map(r => ({ relatedMilestone: '', ...r }))
}

function saveRisks(items: Risk[]) {
  writeLocal(KEY, items)
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
  const now = new Date().toISOString()
  const record: Risk = {
    id: `risk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    relatedMilestone: input.relatedMilestone ?? '',
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const items = getRisks()
  items.unshift(record)
  saveRisks(items)
  return record
}

export function updateRisk(id: string, patch: Partial<Omit<Risk, 'id' | 'createdAt'>>) {
  const items = getRisks().map(r => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
  saveRisks(items)
}

export function deleteRisk(id: string) {
  saveRisks(getRisks().filter(r => r.id !== id))
}

export function searchRisks(query: string): Risk[] {
  const q = query.trim().toLowerCase()
  const items = getRisks()
  if (!q) return items
  return items.filter(r =>
    [r.title, r.description, r.mitigation, r.owner, r.severity, r.status].some(f => f.toLowerCase().includes(q))
  )
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
