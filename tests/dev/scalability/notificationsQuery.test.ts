import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import {
  recordInAppNotification,
  markInAppNotificationRead,
  queryInAppNotifications,
  archiveReadNotifications,
  queryArchivedInAppNotifications,
} from '../../../lib/dev/notifications/inAppNotificationStore'
import { createDelivery, markDelivered, queryDeliveries, archiveTerminalDeliveries, queryArchivedDeliveries } from '../../../lib/dev/notifications/deliveryStore'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function event(project: string, overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2)}`,
    type: 'CEO Approval Required',
    project,
    title: 'Approval required',
    message: 'Please review',
    severity: 'High',
    timestamp: new Date().toISOString(),
    metadata: {},
    ...overrides,
  }
}

describe('In-App Notifications — pagination, filtering, search', () => {
  it('paginates and filters by project/severity/read', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 12; i++) recordInAppNotification(event(project, { severity: i % 2 === 0 ? 'High' : 'Low' }))
    const page = queryInAppNotifications({ project }, { pageSize: 5 })
    expect(page.items).toHaveLength(5)
    expect(page.total).toBe(12)
    expect(queryInAppNotifications({ project, severity: 'High' }).total).toBe(6)
    expect(queryInAppNotifications({ project, read: false }).total).toBe(12)
  })

  it('finds notifications by title/message text', () => {
    const project = uniqueSlug()
    recordInAppNotification(event(project, { title: 'Scheduler started payments-service' }))
    recordInAppNotification(event(project, { title: 'Escalation reminder' }))
    expect(queryInAppNotifications({ project, search: 'payments' }).items).toHaveLength(1)
  })
})

describe('In-App Notifications — archiving and retention', () => {
  it('never archives an unread notification regardless of age', () => {
    const project = uniqueSlug()
    recordInAppNotification(event(project))
    const result = archiveReadNotifications('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(0)
  })

  it('archives read notifications past retention, and they remain queryable', () => {
    const project = uniqueSlug()
    const recorded = recordInAppNotification(event(project))
    markInAppNotificationRead(recorded.id)

    const result = archiveReadNotifications('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(1)
    expect(queryInAppNotifications({ project }).total).toBe(0)
    expect(queryArchivedInAppNotifications(project).total).toBe(1)
  })
})

describe('Notification Deliveries — pagination, filtering, search', () => {
  it('paginates and filters by project/provider/status', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 8; i++) createDelivery({ event: event(project), provider: i % 2 === 0 ? 'Email' : 'WhatsApp', maxAttempts: 3 })
    const page = queryDeliveries({ project }, { pageSize: 3 })
    expect(page.items).toHaveLength(3)
    expect(page.total).toBe(8)
    expect(queryDeliveries({ project, provider: 'Email' }).total).toBe(4)
    expect(queryDeliveries({ project, status: 'Queued' }).total).toBe(8)
  })
})

describe('Notification Deliveries — archiving and retention', () => {
  it('never archives a Queued/Sending/Retrying delivery — deliveryBootstrap.ts must still be able to find and resume it', () => {
    const project = uniqueSlug()
    createDelivery({ event: event(project), provider: 'Email', maxAttempts: 3 })
    const result = archiveTerminalDeliveries('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(0)
  })

  it('archives terminal deliveries past retention, and they remain queryable', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 3 })
    markDelivered(delivery.id)

    const result = archiveTerminalDeliveries('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(1)
    expect(queryDeliveries({ project }).total).toBe(0)
    expect(queryArchivedDeliveries(project).total).toBe(1)
  })
})
