import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from './fileJsonStore'
import type { EngineeringInboxItem, EngineeringInboxStatus } from './directorRuntimeTypes'

const FILE = 'engineering-inbox.json'

export type CreateInboxItemInput = Omit<EngineeringInboxItem, 'id' | 'timestamp' | 'status' | 'resolvedAt' | 'resolutionNote' | 'read'>

/** Every required CEO interruption becomes exactly one of these — created by the Director loop the instant it decides a batch can't proceed unattended. Appending happens inside updateJsonStore's file lock, so a concurrent create/update elsewhere can never clobber this item or be clobbered by it. */
export function createInboxItem(input: CreateInboxItemInput): EngineeringInboxItem {
  const item: EngineeringInboxItem = {
    ...input,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    status: 'Open',
    resolvedAt: null,
    resolutionNote: null,
    read: false,
  }
  updateJsonStore<EngineeringInboxItem[]>(FILE, [], items => [item, ...items])
  return item
}

export function listInboxItems(filter: { project?: string; status?: EngineeringInboxStatus } = {}): EngineeringInboxItem[] {
  return readJsonStore<EngineeringInboxItem[]>(FILE, []).filter(
    i => (filter.project ? i.project === filter.project : true) && (filter.status ? i.status === filter.status : true)
  )
}

export function getInboxItem(id: string): EngineeringInboxItem | null {
  return readJsonStore<EngineeringInboxItem[]>(FILE, []).find(i => i.id === id) ?? null
}

/** Resolving is the only path that lets the Director's paused loop resume — a CEO decision was made, so whatever blocked the batch is considered addressed. */
export function resolveInboxItem(id: string, resolutionNote?: string): EngineeringInboxItem | null {
  return updateStatus(id, 'Resolved', resolutionNote)
}

/** Dismissing acknowledges the item without resuming the paused project — for interruptions the CEO decides don't need the run to continue (e.g. informational). */
export function dismissInboxItem(id: string, resolutionNote?: string): EngineeringInboxItem | null {
  return updateStatus(id, 'Dismissed', resolutionNote)
}

export function markInboxItemRead(id: string): EngineeringInboxItem | null {
  let result: EngineeringInboxItem | null = null
  updateJsonStore<EngineeringInboxItem[]>(FILE, [], items => {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return items
    const next = [...items]
    result = { ...items[idx], read: true }
    next[idx] = result
    return next
  })
  return result
}

function updateStatus(id: string, status: EngineeringInboxStatus, resolutionNote?: string): EngineeringInboxItem | null {
  let result: EngineeringInboxItem | null = null
  updateJsonStore<EngineeringInboxItem[]>(FILE, [], items => {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return items
    const next = [...items]
    result = { ...items[idx], status, resolvedAt: new Date().toISOString(), resolutionNote: resolutionNote ?? null }
    next[idx] = result
    return next
  })
  return result
}
