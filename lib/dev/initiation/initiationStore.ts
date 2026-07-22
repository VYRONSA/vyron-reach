import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { InitiationRequest } from './initiationTypes'

/**
 * File-backed store for InitiationRequest records — same shape as
 * lib/dev/director/engineeringInboxStore.ts (a single flat JSON array,
 * filtered in-memory by project), since an InitiationRequest is workflow
 * state scoped by its own id, not a per-project planning collection.
 */
const FILE = 'initiation-requests.json'

export function readInitiationRequests(): InitiationRequest[] {
  return readJsonStore<InitiationRequest[]>(FILE, [])
}

export function listInitiationRequests(project?: string): InitiationRequest[] {
  const all = readInitiationRequests()
  return project ? all.filter(r => r.project === project) : all
}

export function getInitiationRequest(id: string): InitiationRequest | null {
  return readInitiationRequests().find(r => r.id === id) ?? null
}

/** Appends a brand-new record inside the store's file lock — the caller is responsible for any pre-write invariant checks (e.g. slug uniqueness) since those must be checked against durable state anyway. */
export function insertInitiationRequest(record: InitiationRequest): InitiationRequest {
  updateJsonStore<InitiationRequest[]>(FILE, [], current => [record, ...current])
  return record
}

/**
 * The one safe way to mutate an existing record: `mutate` runs inside the
 * store's file lock against the current on-disk value, so a caller can
 * safely implement compare-and-swap transitions (e.g. "only proceed if
 * status is still Draft") without a separate read-then-write race window.
 * Returns null if `id` doesn't exist, or if `mutate` itself returns null
 * (the CAS-failed case) — the store never learns what a valid transition
 * looks like, that's initiationService.ts's job.
 */
export function updateInitiationRequest(
  id: string,
  mutate: (current: InitiationRequest) => InitiationRequest | null
): InitiationRequest | null {
  let result: InitiationRequest | null = null
  updateJsonStore<InitiationRequest[]>(FILE, [], items => {
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
