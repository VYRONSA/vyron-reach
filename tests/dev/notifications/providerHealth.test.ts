import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { getProviderHealth } from '../../../lib/dev/notifications/providerHealth'
import { createDelivery, markDelivered, markFailed, markRetrying } from '../../../lib/dev/notifications/deliveryStore'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function event(project: string): NotificationEvent {
  return {
    id: `e-${Math.random().toString(36).slice(2)}`, type: 'CEO Approval Required', project, title: 'x', message: 'x',
    severity: 'High', timestamp: '2026-01-01T00:00:00.000Z', metadata: {},
  }
}

describe('Provider Health — derived from delivery history', () => {
  it('reports zero activity for a provider with no deliveries yet', () => {
    const health = getProviderHealth(`Fresh-${uniqueSlug()}`, true)
    expect(health.totalDeliveries).toBe(0)
    expect(health.delivered).toBe(0)
    expect(health.failed).toBe(0)
    expect(health.lastDeliveredAt).toBeNull()
  })

  it('counts delivered, failed, and pending deliveries correctly', () => {
    const project = uniqueSlug()
    const provider = `Counted-${uniqueSlug()}`

    const d1 = createDelivery({ event: event(project), provider, maxAttempts: 5 })
    markDelivered(d1.id)
    const d2 = createDelivery({ event: event(project), provider, maxAttempts: 5 })
    markFailed(d2.id, 'x', 5)
    const d3 = createDelivery({ event: event(project), provider, maxAttempts: 5 })
    markRetrying(d3.id, 'x', 1, new Date().toISOString())
    createDelivery({ event: event(project), provider, maxAttempts: 5 }) // still Queued

    const health = getProviderHealth(provider, true)
    expect(health.totalDeliveries).toBe(4)
    expect(health.delivered).toBe(1)
    expect(health.failed).toBe(1)
    expect(health.pending).toBe(2) // Retrying + Queued
  })

  it('reports the enabled flag it was given, not derived independently', () => {
    expect(getProviderHealth('X', true).enabled).toBe(true)
    expect(getProviderHealth('X', false).enabled).toBe(false)
  })

  it('scopes health strictly to the named provider', () => {
    const project = uniqueSlug()
    const providerA = `A-${uniqueSlug()}`
    const providerB = `B-${uniqueSlug()}`
    const d = createDelivery({ event: event(project), provider: providerA, maxAttempts: 5 })
    markDelivered(d.id)
    expect(getProviderHealth(providerA, true).delivered).toBe(1)
    expect(getProviderHealth(providerB, true).delivered).toBe(0)
  })
})
