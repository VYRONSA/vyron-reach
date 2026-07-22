import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../query/queryHelpers'
import { archiveEligibleRecords, queryArchive } from '../archive/archiveService'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { RetentionPolicy, ArchiveResult } from '../archive/archiveTypes'
import type { NotificationEvent, NotificationEventType, NotificationSeverity } from './notificationTypes'

const FILE = 'in-app-notifications.json'
const ARCHIVE_FILE = 'in-app-notifications-archive.json'
const MAX_ENTRIES = 500
const DAY_MS = 24 * 60 * 60 * 1000

export type InAppNotification = NotificationEvent & { read: boolean }

export function recordInAppNotification(event: NotificationEvent): InAppNotification {
  const item: InAppNotification = { ...event, read: false }
  updateJsonStore<InAppNotification[]>(FILE, [], items => [item, ...items].slice(0, MAX_ENTRIES))
  return item
}

export function listInAppNotifications(project?: string): InAppNotification[] {
  const items = readJsonStore<InAppNotification[]>(FILE, [])
  return project ? items.filter(i => i.project === project) : items
}

export function markInAppNotificationRead(id: string): InAppNotification | null {
  let result: InAppNotification | null = null
  updateJsonStore<InAppNotification[]>(FILE, [], items => {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return items
    const next = [...items]
    result = { ...items[idx], read: true }
    next[idx] = result
    return next
  })
  return result
}

/** Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — server-side pagination/filtering/search over the same MAX_ENTRIES-capped store, so a dashboard page never has to load its full 500-entry window just to show one page of 25. */
export type InAppNotificationQueryFilter = {
  project?: string
  severity?: NotificationSeverity
  type?: NotificationEventType
  read?: boolean
  dateRange?: DateRangeFilter
  search?: string
}

export function queryInAppNotifications(filter: InAppNotificationQueryFilter = {}, page: PageRequest = {}): PageResult<InAppNotification> {
  let items = readJsonStore<InAppNotification[]>(FILE, [])
  if (filter.project) items = items.filter(i => i.project === filter.project)
  if (filter.severity) items = items.filter(i => i.severity === filter.severity)
  if (filter.type) items = items.filter(i => i.type === filter.type)
  if (filter.read !== undefined) items = items.filter(i => i.read === filter.read)
  if (filter.dateRange) items = items.filter(i => inDateRange(i.timestamp, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, i => `${i.title} ${i.message}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

/** Read notifications are the only ones eligible for archiving — an unread notification is still "active" from the recipient's point of view, so retention never touches it regardless of age. */
const DEFAULT_IN_APP_RETENTION: RetentionPolicy = { maxAgeMs: 30 * DAY_MS, maxLiveCount: null }

export function archiveReadNotifications(now: string = new Date().toISOString(), policy: RetentionPolicy = DEFAULT_IN_APP_RETENTION): ArchiveResult {
  return archiveEligibleRecords<InAppNotification>({
    liveFile: FILE,
    archiveFile: ARCHIVE_FILE,
    isEligible: item => item.read,
    getTimestamp: item => item.timestamp,
    policy,
    now,
  })
}

export function queryArchivedInAppNotifications(project?: string, page: PageRequest = {}): PageResult<InAppNotification> {
  return queryArchive<InAppNotification>(ARCHIVE_FILE, page, project ? item => item.project === project : undefined)
}
