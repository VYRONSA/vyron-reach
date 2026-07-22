import { readJsonStore, updateJsonStore } from '../fileJsonStore'
import type { Incident, RollbackControlDecision } from './operationsMonitoringTypes'

/**
 * File-backed persistence for Autonomous Operations — mirrors
 * lib/dev/director/releaseManagement/releaseManagementStore.ts exactly:
 * a flat JSON array of Incidents with CAS mutation via updateJsonStore's
 * file lock (so the recurring monitoring cycle's own auto-resolve logic
 * can never race a human's rollback decision into an inconsistent
 * state), plus an append-only RollbackControlDecision store.
 */

const INCIDENTS_FILE = 'operations-incidents.json'
const DECISIONS_FILE = 'operations-rollback-decisions.json'

export function readIncidents(): Incident[] {
  return readJsonStore<Incident[]>(INCIDENTS_FILE, [])
}

export function listIncidents(project?: string): Incident[] {
  const all = readIncidents()
  return project ? all.filter(i => i.project === project) : all
}

export function getIncident(id: string): Incident | null {
  return readIncidents().find(i => i.id === id) ?? null
}

/** The one Open/RollbackPending incident for this project's current release, if any — used to avoid detecting a duplicate incident every cycle for the same ongoing problem. */
export function findActiveIncident(project: string, releaseId: string): Incident | null {
  return readIncidents().find(i => i.project === project && i.relatedReleaseId === releaseId && i.status !== 'Resolved') ?? null
}

export function insertIncident(record: Incident): Incident {
  updateJsonStore<Incident[]>(INCIDENTS_FILE, [], current => [record, ...current])
  return record
}

/** Compare-and-swap mutation, same contract as releaseManagementStore.ts's updateReleaseRequest — `mutate` returning null means "don't apply." */
export function updateIncident(id: string, mutate: (current: Incident) => Incident | null): Incident | null {
  let result: Incident | null = null
  updateJsonStore<Incident[]>(INCIDENTS_FILE, [], items => {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return items
    const next = mutate(items[idx])
    if (!next) return items
    result = next
    const copy = [...items]
    copy[idx] = next
    return copy
  })
  return result
}

export function appendRollbackControlDecision(decision: RollbackControlDecision): RollbackControlDecision {
  updateJsonStore<RollbackControlDecision[]>(DECISIONS_FILE, [], current => [decision, ...current])
  return decision
}

export function listRollbackControlDecisions(incidentId: string): RollbackControlDecision[] {
  return readJsonStore<RollbackControlDecision[]>(DECISIONS_FILE, []).filter(d => d.incidentId === incidentId)
}
