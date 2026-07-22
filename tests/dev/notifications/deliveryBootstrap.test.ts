import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { createDelivery, getDelivery, markSending, markRetrying } from '../../../lib/dev/notifications/deliveryStore'
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

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising deliveryBootstrap.ts's in-memory bootstrapPromise singleton, mirroring recoveryBootstrap.test.ts's exact pattern. */
async function freshDeliveryBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/notifications/deliveryBootstrap')
}

describe('Notification Delivery Bootstrap — resumes pending deliveries', () => {
  it('resumes a Queued delivery left over from a previous process', async () => {
    const project = uniqueSlug()
    // Unconfigured 'Email' provider — isEnabled() is false, so
    // processDelivery cancels it deterministically with zero real
    // network I/O, which is what makes this both safe and fast to
    // assert on while still proving the delivery was genuinely resumed
    // (it moved out of Queued into a terminal state at all).
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()

    await waitFor(() => getDelivery(delivery.id)?.status === 'Cancelled')
    expect(getDelivery(delivery.id)?.lastError).toMatch(/disabled/i)
  })

  it('resumes a Sending delivery (the process died mid-attempt)', async () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    markSending(delivery.id)

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()

    await waitFor(() => getDelivery(delivery.id)?.status === 'Cancelled')
  })

  it('resumes a Retrying delivery', async () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    markRetrying(delivery.id, 'previous transient error', 1, new Date().toISOString())

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()

    await waitFor(() => getDelivery(delivery.id)?.status === 'Cancelled')
  })

  it('leaves a delivery for an unknown/unregistered provider untouched rather than guessing', async () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'SomeRemovedProvider', maxAttempts: 5 })

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(getDelivery(delivery.id)?.status).toBe('Queued') // never touched
  })

  it('never touches an already-terminal delivery (Delivered/Failed/Cancelled)', async () => {
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })
    // Directly seed it as already Failed — listPendingDeliveries excludes it, so bootstrap must never touch it.
    const { markFailed } = await import('../../../lib/dev/notifications/deliveryStore')
    markFailed(delivery.id, 'already failed before restart', 5)

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(getDelivery(delivery.id)?.lastError).toBe('already failed before restart')
  })
})

describe('Notification Delivery Bootstrap — single recovery per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    const p1 = runNotificationDeliveryBootstrap()
    const p2 = runNotificationDeliveryBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once recovery completes', async () => {
    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'notification-delivery-bootstrap.lock'))).toBe(false)
  })
})

describe('Notification Delivery Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'notification-delivery-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )
    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()

    await waitFor(() => getDelivery(delivery.id)?.status === 'Cancelled')
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'notification-delivery-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const project = uniqueSlug()
    const delivery = createDelivery({ event: event(project), provider: 'Email', maxAttempts: 5 })

    const { runNotificationDeliveryBootstrap } = await freshDeliveryBootstrap()
    await runNotificationDeliveryBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
    expect(getDelivery(delivery.id)?.status).toBe('Queued') // never resumed — the "live" holder owns recovery
  })
})
