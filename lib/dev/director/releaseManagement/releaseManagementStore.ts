import { readJsonStore, updateJsonStore } from '../fileJsonStore'
import type { ReleaseRequest, ReleaseControlDecision } from './releaseManagementTypes'

/**
 * File-backed persistence for Release Management — a ReleaseRequest
 * store mirroring lib/dev/initiation/initiationStore.ts exactly (a flat
 * JSON array, filtered/found in-memory, CAS mutation via updateJsonStore's
 * file lock), plus an append-only ReleaseControlDecision store mirroring
 * lib/dev/initiation/executiveControl.ts's decision store exactly.
 */

const REQUESTS_FILE = 'release-requests.json'
const DECISIONS_FILE = 'release-control-decisions.json'

export function readReleaseRequests(): ReleaseRequest[] {
  return readJsonStore<ReleaseRequest[]>(REQUESTS_FILE, [])
}

export function listReleaseRequests(project?: string): ReleaseRequest[] {
  const all = readReleaseRequests()
  return project ? all.filter(r => r.project === project) : all
}

export function getReleaseRequest(id: string): ReleaseRequest | null {
  return readReleaseRequests().find(r => r.id === id) ?? null
}

export function insertReleaseRequest(record: ReleaseRequest): ReleaseRequest {
  updateJsonStore<ReleaseRequest[]>(REQUESTS_FILE, [], current => [record, ...current])
  return record
}

/** Compare-and-swap mutation, same contract as initiationStore.ts's updateInitiationRequest — `mutate` returning null means "don't apply," letting the service layer implement status-transition guards without a read-then-write race window. */
export function updateReleaseRequest(id: string, mutate: (current: ReleaseRequest) => ReleaseRequest | null): ReleaseRequest | null {
  let result: ReleaseRequest | null = null
  updateJsonStore<ReleaseRequest[]>(REQUESTS_FILE, [], items => {
    const idx = items.findIndex(r => r.id === id)
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

/** Append-only — never mutated or deleted, mirroring executiveControl.ts's appendExecutiveControlDecision exactly. */
export function appendReleaseControlDecision(decision: ReleaseControlDecision): ReleaseControlDecision {
  updateJsonStore<ReleaseControlDecision[]>(DECISIONS_FILE, [], current => [decision, ...current])
  return decision
}

export function listReleaseControlDecisions(releaseId: string): ReleaseControlDecision[] {
  return readJsonStore<ReleaseControlDecision[]>(DECISIONS_FILE, []).filter(d => d.releaseId === releaseId)
}
