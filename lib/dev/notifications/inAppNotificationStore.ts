import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { NotificationEvent } from './notificationTypes'

const FILE = 'in-app-notifications.json'
const MAX_ENTRIES = 500

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
