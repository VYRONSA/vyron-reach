import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { registerDeliveryHandler, enqueueDelivery, processDelivery, type DeliveryHandler } from '../../../lib/dev/notifications/deliveryQueue'
import { getDelivery, listDeliveries } from '../../../lib/dev/notifications/deliveryStore'
import { DeliveryError } from '../../../lib/dev/notifications/retryPolicy'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
  vi.useRealTimers()
})

function event(project: string, overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2)}`, type: 'CEO Approval Required', project, title: 'x', message: 'x',
    severity: 'High', timestamp: '2026-01-01T00:00:00.000Z', metadata: {}, ...overrides,
  }
}

/** A fake timer setup that fakes only setTimeout/clearTimeout — Date.now() stays real, so fileLock.ts's withFileLock spin-loop (which reads Date.now() directly, not via setTimeout) is never affected. */
function useFakeDeliveryTimers() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
}

describe('Delivery Queue — successful delivery', () => {
  it('marks a delivery Delivered when the attempt succeeds', async () => {
    const project = uniqueSlug()
    const provider = `TestProvider-${uniqueSlug()}`
    const handler: DeliveryHandler = { attempt: async () => {}, isEnabled: () => true }
    registerDeliveryHandler(provider, handler)

    const delivery = enqueueDelivery(event(project), provider)
    await waitFor(() => getDelivery(delivery.id)?.status === 'Delivered')
    expect(getDelivery(delivery.id)?.attempts).toBe(0) // never incremented on a first-try success
  })

  it('enqueue returns immediately, before the attempt (however slow) has resolved — the Director never blocks', async () => {
    const project = uniqueSlug()
    const provider = `SlowProvider-${uniqueSlug()}`
    let resolveAttempt: () => void = () => {}
    const attemptStarted = new Promise<void>(resolve => {
      registerDeliveryHandler(provider, {
        attempt: () => new Promise<void>(res => { resolve(); resolveAttempt = res }),
        isEnabled: () => true,
      })
    })

    const start = Date.now()
    const delivery = enqueueDelivery(event(project), provider)
    const elapsedForEnqueue = Date.now() - start
    expect(elapsedForEnqueue).toBeLessThan(200) // enqueue itself never waits on the attempt

    await attemptStarted
    expect(getDelivery(delivery.id)?.status).toBe('Sending') // in flight, not yet resolved
    resolveAttempt()
    await waitFor(() => getDelivery(delivery.id)?.status === 'Delivered')
  })
})

describe('Delivery Queue — retry on transient failure', () => {
  it('retries a transient failure and eventually delivers', async () => {
    useFakeDeliveryTimers()
    const project = uniqueSlug()
    const provider = `FlakyProvider-${uniqueSlug()}`
    let callCount = 0
    registerDeliveryHandler(provider, {
      attempt: async () => {
        callCount += 1
        if (callCount < 3) throw new DeliveryError('temporary outage', 'Transient')
      },
      isEnabled: () => true,
    })

    const delivery = enqueueDelivery(event(project), provider)

    // First attempt fails -> Retrying. Advance through the backoff delays
    // (fake timers, so this costs no real wall-clock time) until delivered.
    // advanceTimersByTimeAsync also flushes the microtask queue as it goes,
    // which is what lets each attempt's own async work settle in between.
    await vi.advanceTimersByTimeAsync(0)
    expect(getDelivery(delivery.id)?.status).toBe('Retrying')

    await vi.advanceTimersByTimeAsync(2000) // first backoff delay
    expect(getDelivery(delivery.id)?.status).toBe('Retrying')

    await vi.advanceTimersByTimeAsync(4000) // second backoff delay
    expect(getDelivery(delivery.id)?.status).toBe('Delivered')

    expect(callCount).toBe(3)
    expect(getDelivery(delivery.id)?.attempts).toBe(2) // 2 failed attempts recorded before the successful 3rd
  })

  it('records the last error message while retrying', async () => {
    useFakeDeliveryTimers()
    const project = uniqueSlug()
    const provider = `FlakyProvider2-${uniqueSlug()}`
    registerDeliveryHandler(provider, { attempt: async () => { throw new DeliveryError('rate limited', 'Transient') }, isEnabled: () => true })

    const delivery = enqueueDelivery(event(project), provider, 5)
    await vi.advanceTimersByTimeAsync(0)
    expect(getDelivery(delivery.id)?.status).toBe('Retrying')
    expect(getDelivery(delivery.id)?.lastError).toBe('rate limited')
  })
})

describe('Delivery Queue — permanent failure', () => {
  it('marks Failed immediately on a permanent error, without retrying', async () => {
    const project = uniqueSlug()
    const provider = `BrokenProvider-${uniqueSlug()}`
    let callCount = 0
    registerDeliveryHandler(provider, {
      attempt: async () => { callCount += 1; throw new DeliveryError('invalid recipient', 'Permanent') },
      isEnabled: () => true,
    })

    const delivery = enqueueDelivery(event(project), provider)
    await waitFor(() => getDelivery(delivery.id)?.status === 'Failed')
    expect(callCount).toBe(1)
    expect(getDelivery(delivery.id)?.lastError).toBe('invalid recipient')
  })

  it('marks Failed after exhausting the maximum retry count, even for transient errors', async () => {
    useFakeDeliveryTimers()
    const project = uniqueSlug()
    const provider = `AlwaysFailingProvider-${uniqueSlug()}`
    let callCount = 0
    registerDeliveryHandler(provider, { attempt: async () => { callCount += 1; throw new DeliveryError('still down', 'Transient') }, isEnabled: () => true })

    const delivery = enqueueDelivery(event(project), provider, 3)
    // Attempt 1 fails -> Retrying (attempts=1), next timer scheduled at +1000ms.
    await vi.advanceTimersByTimeAsync(0)
    expect(getDelivery(delivery.id)?.status).toBe('Retrying')
    expect(getDelivery(delivery.id)?.attempts).toBe(1)

    // Attempt 2 fires at +1000ms, fails -> Retrying (attempts=2), next timer at +2000ms more.
    await vi.advanceTimersByTimeAsync(1000)
    expect(getDelivery(delivery.id)?.status).toBe('Retrying')
    expect(getDelivery(delivery.id)?.attempts).toBe(2)

    // Attempt 3 fires next, reaching maxAttempts (3) -> Failed by exhaustion, not classification.
    await vi.advanceTimersByTimeAsync(2000)
    expect(getDelivery(delivery.id)?.status).toBe('Failed')

    expect(callCount).toBe(3)
    expect(getDelivery(delivery.id)?.attempts).toBe(3)
  }, 15000)
})

describe('Delivery Queue — provider disabled', () => {
  it('cancels a delivery instead of attempting it when the provider is disabled', async () => {
    const project = uniqueSlug()
    const provider = `DisabledProvider-${uniqueSlug()}`
    let attempted = false
    registerDeliveryHandler(provider, { attempt: async () => { attempted = true }, isEnabled: () => false })

    const delivery = enqueueDelivery(event(project), provider)
    await waitFor(() => getDelivery(delivery.id)?.status === 'Cancelled')
    expect(attempted).toBe(false)
    expect(getDelivery(delivery.id)?.lastError).toMatch(/disabled/i)
  })
})

describe('Delivery Queue — multiple queued notifications', () => {
  it('handles several enqueued deliveries independently and concurrently', async () => {
    const project = uniqueSlug()
    const provider = `MultiProvider-${uniqueSlug()}`
    registerDeliveryHandler(provider, { attempt: async () => {}, isEnabled: () => true })

    const deliveries = [event(project), event(project), event(project)].map(e => enqueueDelivery(e, provider))
    await waitFor(() => deliveries.every(d => getDelivery(d.id)?.status === 'Delivered'))
    expect(listDeliveries(project)).toHaveLength(3)
  })
})

describe('Delivery Queue — processDelivery is idempotent against terminal states', () => {
  it('does nothing when called again on an already-Delivered delivery', async () => {
    const project = uniqueSlug()
    const provider = `IdempotentProvider-${uniqueSlug()}`
    let callCount = 0
    const handler: DeliveryHandler = { attempt: async () => { callCount += 1 }, isEnabled: () => true }
    registerDeliveryHandler(provider, handler)

    const delivery = enqueueDelivery(event(project), provider)
    await waitFor(() => getDelivery(delivery.id)?.status === 'Delivered')
    expect(callCount).toBe(1)

    await processDelivery(delivery.id, handler)
    expect(callCount).toBe(1) // never re-attempted
  })

  it('does nothing for an unknown delivery id', async () => {
    const handler: DeliveryHandler = { attempt: async () => {}, isEnabled: () => true }
    await expect(processDelivery('does-not-exist', handler)).resolves.toBeUndefined()
  })
})
