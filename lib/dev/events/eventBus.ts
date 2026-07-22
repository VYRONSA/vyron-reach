import { randomUUID } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { DashboardEvent, PublishDashboardEventInput } from './eventTypes'

/**
 * The Real-Time Event Service's bus — a single in-memory pub/sub for the
 * current process. Deliberately transient: "The Event Service itself is
 * transient. Do not persist event streams." (Milestone 5.1's Persistence
 * section) — nothing here ever touches fileJsonStore/disk. Durable state
 * remains entirely owned by the existing services (Director runtime
 * store, Scheduler store, Inbox store, Escalation store, ...); this bus
 * only ever carries a notification that "something changed over there,"
 * never the durable record itself.
 *
 * A bounded ring buffer of the most recent events backs `getEventsSince`,
 * which exists for exactly one purpose: letting an SSE connection that
 * just reconnected (via the standard `Last-Event-ID` header) or a polling
 * client's `since` query param catch up on whatever it missed without
 * re-deriving a snapshot. It is not a durable log — once an event ages
 * out of the buffer, a catch-up request for it falls back to a fresh
 * snapshot (see dashboardSnapshot.ts) instead, exactly as "transient"
 * implies.
 *
 * State lives in a Bus record rather than bare module-level variables so
 * it can be swapped per async context (see runWithIsolatedEventBus,
 * Production Validation 2.1 Milestone 2.1.3) — every existing exported
 * function's signature and behavior is unchanged for ordinary callers,
 * which always resolve to the one process-global `globalBus` exactly as
 * before.
 */

const RING_BUFFER_SIZE = 1000

type Bus = {
  seq: number
  buffer: DashboardEvent[]
  listeners: Set<(event: DashboardEvent) => void>
}

function freshBus(): Bus {
  return { seq: 0, buffer: [], listeners: new Set() }
}

const globalBus: Bus = freshBus()
const busContext = new AsyncLocalStorage<Bus>()

function currentBus(): Bus {
  return busContext.getStore() ?? globalBus
}

export function publish(input: PublishDashboardEventInput): DashboardEvent {
  const bus = currentBus()
  bus.seq += 1
  const event: DashboardEvent = { ...input, id: randomUUID(), seq: bus.seq, timestamp: new Date().toISOString() }

  bus.buffer.push(event)
  if (bus.buffer.length > RING_BUFFER_SIZE) bus.buffer.shift()

  for (const listener of bus.listeners) {
    try {
      listener(event)
    } catch {
      // One subscriber's failure (e.g. a closed SSE connection mid-write)
      // must never break delivery to every other subscriber or the
      // publishing producer's own call stack — this is a side channel,
      // never allowed to become a source of production errors.
    }
  }

  return event
}

/** Registers a listener for every event published from this point forward — filtering by category/project is the caller's job (see the SSE route), not the bus's, so the bus stays a single, simple mechanism regardless of how many different filter shapes callers need. Returns an unsubscribe function. Resolves to whichever bus is current AT SUBSCRIBE TIME — a subscription made inside runWithIsolatedEventBus stays bound to that isolated bus for its lifetime, even if called again later outside it. */
export function subscribe(listener: (event: DashboardEvent) => void): () => void {
  const bus = currentBus()
  bus.listeners.add(listener)
  return () => bus.listeners.delete(listener)
}

/** Everything still in the ring buffer with seq strictly greater than `sinceSeq`, oldest first — the exact ordering guarantee a reconnecting consumer needs to replay only what it missed, in the order it originally happened. Returns an empty array (never an error) if `sinceSeq` is already newer than anything buffered, or older than the buffer's own retention window — in the latter case the caller is expected to fall back to a snapshot instead of trusting this as "nothing happened." */
export function getEventsSince(sinceSeq: number, project?: string): DashboardEvent[] {
  const bus = currentBus()
  const events = bus.buffer.filter(e => e.seq > sinceSeq)
  return project ? events.filter(e => e.project === project || e.project === '*') : events
}

export function getCurrentSeq(): number {
  return currentBus().seq
}

/** True only when `sinceSeq` still falls within the ring buffer's retention window — the SSE/poll routes use this to decide "replay from the buffer" vs. "the gap is too old, send a fresh snapshot instead." */
export function isWithinRetention(sinceSeq: number): boolean {
  const bus = currentBus()
  if (sinceSeq >= bus.seq) return true // caller is already current, or ahead (shouldn't happen, but not a gap either way)
  if (bus.buffer.length === 0) return sinceSeq === bus.seq
  return sinceSeq >= bus.buffer[0].seq - 1
}

/**
 * Runs `fn` with a brand-new, completely isolated Bus for the duration
 * of its full async chain — Production Validation 2.1 Milestone 2.1.3's
 * Simulation Service uses this so a simulation's synthetic
 * publish()/subscribe() activity can never reach (or be reached by) the
 * real production Metrics/Certification subscriptions already listening
 * on globalBus, even though both run in the same live process at the
 * same time. Safe under concurrency for the same reason
 * runWithIsolatedDataDir (vyronDevDataDir.ts) is: AsyncLocalStorage
 * scopes the override per async call chain, never process-globally.
 */
export function runWithIsolatedEventBus<T>(fn: () => T): T {
  return busContext.run(freshBus(), fn)
}
