import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import {
  createDelivery, getDelivery, listDeliveries, listDeliveriesForProvider, listPendingDeliveries,
  markSending, markDelivered, markRetrying, markFailed, markCancelled,
} from '../../../lib/dev/notifications/deliveryStore'
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
    id: 'evt-1', type: 'CEO Approval Required', project, title: 'Approval needed', message: 'Please review.',
    severity: 'High', timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

describe('Delivery Store — creation', () => {
  it('creates a delivery record starting in Queued with zero attempts', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    expect(delivery.status).toBe('Queued')
    expect(delivery.attempts).toBe(0)
    expect(delivery.maxAttempts).toBe(5)
    expect(delivery.deliveredAt).toBeNull()
    expect(delivery.nextAttemptAt).toBeNull()
  })

  it('embeds the full event, not just an id reference', () => {
    const project = uniqueSlug()
    const e = event(project, { title: 'Specific title' })
    const delivery = createDelivery({ event: e, provider: 'Email', maxAttempts: 5 })
    expect(delivery.event).toEqual(e)
  })

  it('scopes deliveries strictly by project', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    createDelivery({ event: event(projectA), provider: 'Email', maxAttempts: 5 })
    expect(listDeliveries(projectB)).toEqual([])
    expect(listDeliveries(projectA)).toHaveLength(1)
  })
})

describe('Delivery Store — status transitions', () => {
  it('marks Sending', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    expect(markSending(delivery.id)?.status).toBe('Sending')
  })

  it('marks Delivered with a timestamp, clearing any retry/error state', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    markRetrying(delivery.id, 'transient error', 1, new Date().toISOString())
    const delivered = markDelivered(delivery.id)
    expect(delivered?.status).toBe('Delivered')
    expect(delivered?.deliveredAt).toBeTruthy()
    expect(delivered?.nextAttemptAt).toBeNull()
    expect(delivered?.lastError).toBeNull()
  })

  it('marks Retrying with attempts, error, and next-attempt time', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    const nextAt = new Date(Date.now() + 1000).toISOString()
    const retrying = markRetrying(delivery.id, 'connection timeout', 1, nextAt)
    expect(retrying?.status).toBe('Retrying')
    expect(retrying?.attempts).toBe(1)
    expect(retrying?.lastError).toBe('connection timeout')
    expect(retrying?.nextAttemptAt).toBe(nextAt)
  })

  it('marks Failed as a terminal state with the final error', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    const failed = markFailed(delivery.id, 'permanent rejection', 5)
    expect(failed?.status).toBe('Failed')
    expect(failed?.attempts).toBe(5)
    expect(failed?.lastError).toBe('permanent rejection')
  })

  it('marks Cancelled with a reason', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    const cancelled = markCancelled(delivery.id, 'Provider is disabled')
    expect(cancelled?.status).toBe('Cancelled')
    expect(cancelled?.lastError).toBe('Provider is disabled')
  })

  it('returns null when updating a delivery id that does not exist', () => {
    expect(markSending('does-not-exist')).toBeNull()
    expect(markDelivered('does-not-exist')).toBeNull()
  })
})

describe('Delivery Store — pending deliveries (what recovery resumes)', () => {
  it('includes Queued, Sending, and Retrying, but not Delivered/Failed/Cancelled', () => {
    const project = uniqueSlug()
    const queued = createDelivery({ event: event(project, { id: 'e1' }), provider: 'Email', maxAttempts: 5 })
    const sending = createDelivery({ event: event(project, { id: 'e2' }), provider: 'Email', maxAttempts: 5 })
    const retrying = createDelivery({ event: event(project, { id: 'e3' }), provider: 'Email', maxAttempts: 5 })
    const delivered = createDelivery({ event: event(project, { id: 'e4' }), provider: 'Email', maxAttempts: 5 })
    const failed = createDelivery({ event: event(project, { id: 'e5' }), provider: 'Email', maxAttempts: 5 })
    const cancelled = createDelivery({ event: event(project, { id: 'e6' }), provider: 'Email', maxAttempts: 5 })

    markSending(sending.id)
    markRetrying(retrying.id, 'x', 1, new Date().toISOString())
    markDelivered(delivered.id)
    markFailed(failed.id, 'x', 5)
    markCancelled(cancelled.id, 'x')

    const pendingIds = listPendingDeliveries().map(d => d.id)
    expect(pendingIds).toContain(queued.id)
    expect(pendingIds).toContain(sending.id)
    expect(pendingIds).toContain(retrying.id)
    expect(pendingIds).not.toContain(delivered.id)
    expect(pendingIds).not.toContain(failed.id)
    expect(pendingIds).not.toContain(cancelled.id)
  })
})

describe('Delivery Store — per-provider listing and restart survival', () => {
  it('lists deliveries scoped by provider', () => {
    const project = uniqueSlug()
    createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    createDelivery({ event: event(project), provider: 'WhatsApp', maxAttempts: 5 })
    expect(listDeliveriesForProvider('Email')).toHaveLength(1)
    expect(listDeliveriesForProvider('WhatsApp')).toHaveLength(1)
  })

  it('survives a simulated restart — a fresh read sees everything a prior process wrote', () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    markDelivered(delivery.id)
    expect(getDelivery(delivery.id)?.status).toBe('Delivered')
  })
})
