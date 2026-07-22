import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { CertificationCriteria, CertificationCriteriaChange, CertificationCriteriaChangeType } from './certificationTypes'

const FILE = 'certification-criteria.json'
const HISTORY_FILE = 'certification-criteria-history.json'

/** Seeded the first time the store is ever read — mirrors escalationRulesStore.ts's identical DEFAULT_RULE pattern: certification works with zero configuration required, but every threshold stays fully configurable. */
function buildDefaultCriteria(now: string): CertificationCriteria {
  return {
    id: 'default',
    name: 'Default certification criteria',
    enabled: true,
    project: null,
    maxInterventionsForAutonomous: 0,
    maxInterventionsForAssisted: 3,
    requireAtLeastOneCompletedTask: true,
    recoveryDisqualifiesAutonomous: false,
    createdAt: now,
    updatedAt: now,
  }
}

function defaultCriteria(): CertificationCriteria[] {
  return [buildDefaultCriteria(new Date(0).toISOString())]
}

export function listCertificationCriteria(): CertificationCriteria[] {
  return readJsonStore<CertificationCriteria[]>(FILE, defaultCriteria())
}

export function getCertificationCriteria(id: string): CertificationCriteria | null {
  return listCertificationCriteria().find(c => c.id === id) ?? null
}

export type CreateCertificationCriteriaInput = Omit<CertificationCriteria, 'id' | 'createdAt' | 'updatedAt'>

export function createCertificationCriteria(input: CreateCertificationCriteriaInput): CertificationCriteria {
  const now = new Date().toISOString()
  const criteria: CertificationCriteria = { ...input, id: randomUUID(), createdAt: now, updatedAt: now }
  updateJsonStore<CertificationCriteria[]>(FILE, defaultCriteria(), current => [...current, criteria])
  return criteria
}

/** Append-only — mirrors releaseManagementStore.ts's appendReleaseControlDecision exactly: never mutated or deleted, one entry per change, oldest last. */
function appendCertificationCriteriaChange(criteriaId: string, changeType: CertificationCriteriaChangeType, changedBy: string, previous: CertificationCriteria): CertificationCriteriaChange {
  const change: CertificationCriteriaChange = { id: randomUUID(), criteriaId, changeType, changedBy, changedAt: new Date().toISOString(), previous }
  updateJsonStore<CertificationCriteriaChange[]>(HISTORY_FILE, [], current => [change, ...current])
  return change
}

export function listCertificationCriteriaHistory(criteriaId: string): CertificationCriteriaChange[] {
  return readJsonStore<CertificationCriteriaChange[]>(HISTORY_FILE, []).filter(c => c.criteriaId === criteriaId)
}

export function updateCertificationCriteria(id: string, patch: Partial<Omit<CertificationCriteria, 'id' | 'createdAt'>>, changedBy: string): CertificationCriteria | null {
  let previous: CertificationCriteria | null = null
  const all = updateJsonStore<CertificationCriteria[]>(FILE, defaultCriteria(), current => {
    const idx = current.findIndex(c => c.id === id)
    if (idx === -1) return current
    previous = current[idx]
    const next = [...current]
    next[idx] = { ...current[idx], ...patch, id: current[idx].id, createdAt: current[idx].createdAt, updatedAt: new Date().toISOString() }
    return next
  })
  if (previous) appendCertificationCriteriaChange(id, 'Updated', changedBy, previous)
  return all.find(c => c.id === id) ?? null
}

export function deleteCertificationCriteria(id: string, changedBy: string): boolean {
  let removed: CertificationCriteria | null = null
  updateJsonStore<CertificationCriteria[]>(FILE, defaultCriteria(), current => {
    const existing = current.find(c => c.id === id) ?? null
    const next = current.filter(c => c.id !== id)
    if (next.length !== current.length) removed = existing
    return next
  })
  if (removed) appendCertificationCriteriaChange(id, 'Deleted', changedBy, removed)
  return removed !== null
}

/** The most specific enabled criteria for a project (an exact project match wins over the null/wildcard default) — same specificity-ranking idea as escalationPolicy.ts's selectRule, simplified to one dimension since certification criteria only ever scope by project. */
export function selectCriteria(project: string, criteria: CertificationCriteria[]): CertificationCriteria | null {
  const candidates = criteria.filter(c => c.enabled && (c.project === null || c.project === project))
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => Number(b.project !== null) - Number(a.project !== null) || a.id.localeCompare(b.id))[0]
}
