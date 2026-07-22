import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { publish } from '../events/eventBus'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../query/queryHelpers'
import { archiveEligibleRecords, queryArchive } from '../archive/archiveService'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { RetentionPolicy, ArchiveResult } from '../archive/archiveTypes'
import type { NotificationEvent } from './notificationTypes'
import type { NotificationDelivery, NotificationDeliveryStatus } from './deliveryTypes'

/**
 * Persistence for notification delivery history — on the same atomic
 * fileJsonStore primitives every other durable store in this app uses
 * (readJsonStore/updateJsonStore, themselves on fileLock.ts's
 * write-then-rename + cross-process mutex). No new persistence
 * mechanism. Capped like directorHistoryStore.ts (an operational/delivery
 * log, not a permanent engineering record like the Knowledge Service) —
 * unlike Milestone 2.1's domain records, losing old delivery attempts
 * once a provider has moved on is acceptable; the cap exists so this
 * file doesn't grow unbounded over a long-running server's lifetime.
 */

const FILE = 'notification-deliveries.json'
const ARCHIVE_FILE = 'notification-deliveries-archive.json'
const MAX_ENTRIES = 5000
const DAY_MS = 24 * 60 * 60 * 1000

export type CreateDeliveryInput = {
  event: NotificationEvent
  provider: string
  maxAttempts: number
}

export function createDelivery(input: CreateDeliveryInput): NotificationDelivery {
  const now = new Date().toISOString()
  const delivery: NotificationDelivery = {
    id: randomUUID(),
    event: input.event,
    project: input.event.project,
    provider: input.provider,
    status: 'Queued',
    attempts: 0,
    maxAttempts: input.maxAttempts,
    nextAttemptAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    deliveredAt: null,
  }
  updateJsonStore<NotificationDelivery[]>(FILE, [], all => [delivery, ...all].slice(0, MAX_ENTRIES))
  publish({ category: 'Notification Delivery', project: delivery.project, type: 'delivery-queued', payload: { deliveryId: delivery.id, provider: delivery.provider, status: delivery.status } })
  return delivery
}

export function getDelivery(id: string): NotificationDelivery | null {
  return readJsonStore<NotificationDelivery[]>(FILE, []).find(d => d.id === id) ?? null
}

export function listDeliveries(project?: string): NotificationDelivery[] {
  const all = readJsonStore<NotificationDelivery[]>(FILE, [])
  return project ? all.filter(d => d.project === project) : all
}

export function listDeliveriesForProvider(provider: string): NotificationDelivery[] {
  return readJsonStore<NotificationDelivery[]>(FILE, []).filter(d => d.provider === provider)
}

/** Queued/Sending/Retrying — exactly what deliveryBootstrap.ts resumes on recovery, and what a live process still needs to act on. */
export function listPendingDeliveries(): NotificationDelivery[] {
  return readJsonStore<NotificationDelivery[]>(FILE, []).filter(d => d.status === 'Queued' || d.status === 'Sending' || d.status === 'Retrying')
}

function patchDelivery(id: string, patch: Partial<Omit<NotificationDelivery, 'id' | 'event' | 'project' | 'provider' | 'createdAt'>>): NotificationDelivery | null {
  const all = updateJsonStore<NotificationDelivery[]>(FILE, [], current => {
    const idx = current.findIndex(d => d.id === id)
    if (idx === -1) return current
    const next = [...current]
    next[idx] = { ...current[idx], ...patch, updatedAt: new Date().toISOString() }
    return next
  })
  const result = all.find(d => d.id === id) ?? null
  // The single write path for every delivery status transition
  // (Sending/Delivered/Retrying/Failed/Cancelled) — covers all of them
  // with one publish call, exactly like directorRuntimeStore.ts's
  // patchDirectorStatus.
  if (result) publish({ category: 'Notification Delivery', project: result.project, type: 'delivery-status-changed', payload: { deliveryId: result.id, provider: result.provider, status: result.status } })
  return result
}

export function markSending(id: string): NotificationDelivery | null {
  return patchDelivery(id, { status: 'Sending' })
}

export function markDelivered(id: string): NotificationDelivery | null {
  return patchDelivery(id, { status: 'Delivered', deliveredAt: new Date().toISOString(), nextAttemptAt: null, lastError: null })
}

export function markRetrying(id: string, error: string, attempts: number, nextAttemptAt: string): NotificationDelivery | null {
  return patchDelivery(id, { status: 'Retrying', attempts, lastError: error, nextAttemptAt })
}

export function markFailed(id: string, error: string, attempts: number): NotificationDelivery | null {
  return patchDelivery(id, { status: 'Failed', attempts, lastError: error, nextAttemptAt: null })
}

export function markCancelled(id: string, reason: string): NotificationDelivery | null {
  return patchDelivery(id, { status: 'Cancelled', lastError: reason, nextAttemptAt: null })
}

/** Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — server-side pagination/filtering/search over the delivery log, so a dashboard page never has to load its full (up to MAX_ENTRIES) window. */
export type DeliveryQueryFilter = {
  project?: string
  provider?: string
  status?: NotificationDeliveryStatus
  dateRange?: DateRangeFilter
  /** Indexed against the delivery's own NotificationEvent title/message. */
  search?: string
}

export function queryDeliveries(filter: DeliveryQueryFilter = {}, page: PageRequest = {}): PageResult<NotificationDelivery> {
  let items = readJsonStore<NotificationDelivery[]>(FILE, [])
  if (filter.project) items = items.filter(d => d.project === filter.project)
  if (filter.provider) items = items.filter(d => d.provider === filter.provider)
  if (filter.status) items = items.filter(d => d.status === filter.status)
  if (filter.dateRange) items = items.filter(d => inDateRange(d.createdAt, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, d => `${d.event.title} ${d.event.message}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

/** Only terminal deliveries (Delivered/Failed/Cancelled) are ever eligible — a still-Queued/Sending/Retrying delivery is exactly what deliveryBootstrap.ts must be able to find and resume, so it can never be archived out from under recovery. */
const DEFAULT_DELIVERY_RETENTION: RetentionPolicy = { maxAgeMs: 30 * DAY_MS, maxLiveCount: null }

export function archiveTerminalDeliveries(now: string = new Date().toISOString(), policy: RetentionPolicy = DEFAULT_DELIVERY_RETENTION): ArchiveResult {
  return archiveEligibleRecords<NotificationDelivery>({
    liveFile: FILE,
    archiveFile: ARCHIVE_FILE,
    isEligible: item => item.status === 'Delivered' || item.status === 'Failed' || item.status === 'Cancelled',
    getTimestamp: item => item.updatedAt,
    policy,
    now,
  })
}

export function queryArchivedDeliveries(project?: string, page: PageRequest = {}): PageResult<NotificationDelivery> {
  return queryArchive<NotificationDelivery>(ARCHIVE_FILE, page, project ? item => item.project === project : undefined)
}
