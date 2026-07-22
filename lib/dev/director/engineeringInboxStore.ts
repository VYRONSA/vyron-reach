import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from './fileJsonStore'
import { publish } from '../events/eventBus'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../query/queryHelpers'
import { archiveEligibleRecords, queryArchive } from '../archive/archiveService'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { RetentionPolicy, ArchiveResult } from '../archive/archiveTypes'
import type { EngineeringInboxItem, EngineeringInboxStatus, InterventionSeverity, InterventionReasonType } from './directorRuntimeTypes'

const FILE = 'engineering-inbox.json'
const ARCHIVE_FILE = 'engineering-inbox-archive.json'
const DAY_MS = 24 * 60 * 60 * 1000

export type CreateInboxItemInput = Omit<EngineeringInboxItem, 'id' | 'timestamp' | 'status' | 'resolvedAt' | 'resolutionNote' | 'read'>

/**
 * Every required CEO interruption becomes exactly one of these — created
 * by the Director loop the instant it decides a batch can't proceed
 * unattended. Appending happens inside updateJsonStore's file lock, so a
 * concurrent create/update elsewhere can never clobber this item or be
 * clobbered by it.
 *
 * DEF-002 fix: a batch-level pause (input.batchId set) is deduplicated by
 * (project, batchId, reasonType) inside this same locked mutate — there is
 * exactly one row for that combination, ever, not "one Open at a time".
 * Without this, resolving an item and resuming into the same still-unmet
 * condition (e.g. a Quality Assurance failure that was never actually
 * fixed) created a brand-new item every retry, since the prior one had
 * already flipped to Resolved by the time the loop re-paused — a plain
 * "no duplicate Open item" check would have missed that entirely. Instead
 * the existing row (whatever its status) is reopened and refreshed in
 * place, so the CEO always sees a single, updating item per approval
 * rather than an ever-growing pile of identical ones.
 *
 * PRA-P1-019 remediation: project-level items (batchId null — Release/
 * Rollback/Operational-incident governance) now get the exact same
 * dedup/reopen treatment, keyed on (project, sourceRef, reasonType)
 * instead of batchId, whenever the caller supplies `sourceRef` (the
 * underlying ReleaseRequest/Incident id) — e.g. re-raising the same
 * incident's Rollback Go/Hold notice, or the same release's Go/Hold
 * notice, reopens the one existing row rather than creating another.
 * Deliberately still scoped to callers that actually pass a sourceRef
 * (release/incident creators now do): a project-level item with no
 * sourceRef is left exactly as before (never deduped), so nothing that
 * hasn't been updated to supply one silently changes behavior.
 */
export function createInboxItem(input: CreateInboxItemInput): EngineeringInboxItem {
  let result!: EngineeringInboxItem
  updateJsonStore<EngineeringInboxItem[]>(FILE, [], items => {
    const idx = input.batchId
      ? items.findIndex(i => i.project === input.project && i.batchId === input.batchId && i.reasonType === input.reasonType)
      : input.sourceRef
        ? items.findIndex(i => i.project === input.project && i.batchId === null && i.sourceRef === input.sourceRef && i.reasonType === input.reasonType)
        : -1

    if (idx !== -1) {
      result = { ...items[idx], ...input, timestamp: new Date().toISOString(), status: 'Open', resolvedAt: null, resolutionNote: null, read: false }
      const next = [...items]
      next[idx] = result
      return next
    }

    result = { ...input, id: randomUUID(), timestamp: new Date().toISOString(), status: 'Open', resolvedAt: null, resolutionNote: null, read: false }
    return [result, ...items]
  })
  publish({ category: 'Engineering Inbox', project: result.project, type: 'item-opened', payload: { itemId: result.id, reasonType: result.reasonType, severity: result.severity } })
  return result
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
  const all = updateJsonStore<EngineeringInboxItem[]>(FILE, [], current => {
    const idx = current.findIndex(i => i.id === id)
    if (idx === -1) return current
    const next = [...current]
    next[idx] = { ...current[idx], status, resolvedAt: new Date().toISOString(), resolutionNote: resolutionNote ?? null }
    return next
  })
  const result = all.find(i => i.id === id) ?? null
  if (result) publish({ category: 'Engineering Inbox', project: result.project, type: 'item-closed', payload: { itemId: result.id, status } })
  return result
}

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — extends
 * this store with server-side pagination, filtering, and search, on the
 * shared lib/dev/query/ primitives. listInboxItems above is untouched
 * and still the right choice for callers that genuinely need every
 * matching item (e.g. the Director loop checking "is there an Open item
 * for this project"); queryInboxItems is for surfaces (dashboard pages,
 * APIs) that must never load an unbounded inbox in full.
 */
export type InboxQueryFilter = {
  project?: string
  status?: EngineeringInboxStatus
  severity?: InterventionSeverity
  reasonType?: InterventionReasonType
  dateRange?: DateRangeFilter
  /** Indexed against reasonType/reason/recommendedAction — see queryHelpers.ts's buildSearchIndex. */
  search?: string
}

export function queryInboxItems(filter: InboxQueryFilter = {}, page: PageRequest = {}): PageResult<EngineeringInboxItem> {
  let items = readJsonStore<EngineeringInboxItem[]>(FILE, [])
  if (filter.project) items = items.filter(i => i.project === filter.project)
  if (filter.status) items = items.filter(i => i.status === filter.status)
  if (filter.severity) items = items.filter(i => i.severity === filter.severity)
  if (filter.reasonType) items = items.filter(i => i.reasonType === filter.reasonType)
  if (filter.dateRange) items = items.filter(i => inDateRange(i.timestamp, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, i => `${i.reasonType} ${i.reason} ${i.recommendedAction}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

/** Resolved/Dismissed items older than the policy's maxAgeMs move to the archive — Open items are never eligible (isEligible below), so "Retention must never affect active runtime state" holds regardless of policy. */
const DEFAULT_INBOX_RETENTION: RetentionPolicy = { maxAgeMs: 90 * DAY_MS, maxLiveCount: null }

export function archiveClosedInboxItems(now: string = new Date().toISOString(), policy: RetentionPolicy = DEFAULT_INBOX_RETENTION): ArchiveResult {
  return archiveEligibleRecords<EngineeringInboxItem>({
    liveFile: FILE,
    archiveFile: ARCHIVE_FILE,
    isEligible: item => item.status === 'Resolved' || item.status === 'Dismissed',
    getTimestamp: item => item.resolvedAt ?? item.timestamp,
    policy,
    now,
  })
}

export function queryArchivedInboxItems(project?: string, page: PageRequest = {}): PageResult<EngineeringInboxItem> {
  return queryArchive<EngineeringInboxItem>(ARCHIVE_FILE, page, project ? item => item.project === project : undefined)
}
