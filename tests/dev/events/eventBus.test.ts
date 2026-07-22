import { describe, it, expect, vi } from 'vitest'
import { uniqueSlug } from '../support/testHarness'
import type { DashboardEvent, PublishDashboardEventInput } from '../../../lib/dev/events/eventTypes'

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising eventBus.ts's module-level seq counter and ring buffer, mirroring every other in-memory-singleton test in this suite (schedulerBootstrap.test.ts, deliveryBootstrap.test.ts). */
async function freshEventBus() {
  vi.resetModules()
  return import('../../../lib/dev/events/eventBus')
}

function input(overrides: Partial<PublishDashboardEventInput> = {}): PublishDashboardEventInput {
  return { category: 'Planning Changes', project: uniqueSlug(), type: 'test-event', payload: {}, ...overrides }
}

describe('Event Bus — publish', () => {
  it('assigns a monotonically increasing seq, a unique id, and a timestamp', async () => {
    const bus = await freshEventBus()
    const a = bus.publish(input())
    const b = bus.publish(input())
    expect(b.seq).toBeGreaterThan(a.seq)
    expect(a.id).not.toBe(b.id)
    expect(new Date(a.timestamp).getTime()).not.toBeNaN()
  })

  it('is transient — a fresh module instance starts back at seq 0 regardless of what a prior instance published', async () => {
    const bus1 = await freshEventBus()
    bus1.publish(input())
    bus1.publish(input())
    expect(bus1.getCurrentSeq()).toBeGreaterThan(0)

    const bus2 = await freshEventBus()
    expect(bus2.getCurrentSeq()).toBe(0)
  })
})

describe('Event Bus — subscribe', () => {
  it('delivers a published event to a subscriber', async () => {
    const bus = await freshEventBus()
    const received: DashboardEvent[] = []
    bus.subscribe(e => received.push(e))
    const published = bus.publish(input({ type: 'x' }))
    expect(received).toHaveLength(1)
    expect(received[0].id).toBe(published.id)
  })

  it('delivers the same event to every subscriber — simulates multiple simultaneous browser sessions', async () => {
    const bus = await freshEventBus()
    const a: DashboardEvent[] = []
    const b: DashboardEvent[] = []
    bus.subscribe(e => a.push(e))
    bus.subscribe(e => b.push(e))
    bus.publish(input())
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(a[0].id).toBe(b[0].id)
  })

  it('unsubscribe stops further delivery to that listener only', async () => {
    const bus = await freshEventBus()
    const received: DashboardEvent[] = []
    const unsubscribe = bus.subscribe(e => received.push(e))
    bus.publish(input())
    unsubscribe()
    bus.publish(input())
    expect(received).toHaveLength(1)
  })

  it('one subscriber throwing never prevents delivery to other subscribers', async () => {
    const bus = await freshEventBus()
    const received: DashboardEvent[] = []
    bus.subscribe(() => {
      throw new Error('boom')
    })
    bus.subscribe(e => received.push(e))
    expect(() => bus.publish(input())).not.toThrow()
    expect(received).toHaveLength(1)
  })

  it('delivers events to a subscriber in the exact order they were published — ordered delivery per connection', async () => {
    const bus = await freshEventBus()
    const received: number[] = []
    bus.subscribe(e => received.push(e.seq))
    for (let i = 0; i < 20; i++) bus.publish(input({ type: `event-${i}` }))
    expect(received).toEqual([...received].sort((a, b) => a - b))
  })
})

describe('Event Bus — getEventsSince (reconnect catch-up)', () => {
  it('returns only events with seq strictly greater than the given cursor, oldest first', async () => {
    const bus = await freshEventBus()
    const a = bus.publish(input())
    const b = bus.publish(input())
    const c = bus.publish(input())
    const since = bus.getEventsSince(a.seq)
    expect(since.map(e => e.id)).toEqual([b.id, c.id])
  })

  it('returns an empty array when the cursor is already current', async () => {
    const bus = await freshEventBus()
    bus.publish(input())
    expect(bus.getEventsSince(bus.getCurrentSeq())).toEqual([])
  })

  it('filters by project, always including cross-project "*" events', async () => {
    const bus = await freshEventBus()
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    bus.publish(input({ project: projectA }))
    bus.publish(input({ project: projectB }))
    bus.publish(input({ project: '*' }))

    const forA = bus.getEventsSince(0, projectA)
    expect(forA.map(e => e.project).sort()).toEqual([projectA, '*'].sort())
  })
})

describe('Event Bus — retention', () => {
  it('isWithinRetention is true for a cursor that is already current', async () => {
    const bus = await freshEventBus()
    bus.publish(input())
    expect(bus.isWithinRetention(bus.getCurrentSeq())).toBe(true)
  })

  it('isWithinRetention is true for a cursor still inside the ring buffer', async () => {
    const bus = await freshEventBus()
    const first = bus.publish(input())
    bus.publish(input())
    expect(bus.isWithinRetention(first.seq - 1)).toBe(true)
  })

  it('isWithinRetention is false once the buffer evicts the requested cursor', async () => {
    const bus = await freshEventBus()
    const first = bus.publish(input())
    // Push well past the ring buffer's retention window so `first` is evicted.
    for (let i = 0; i < 1100; i++) bus.publish(input())
    expect(bus.isWithinRetention(first.seq)).toBe(false)
  })
})
