import { createDelivery, getDelivery, markSending, markDelivered, markRetrying, markFailed, markCancelled } from './deliveryStore'
import { computeBackoffDelayMs, classifyError, DEFAULT_MAX_ATTEMPTS } from './retryPolicy'
import type { NotificationEvent } from './notificationTypes'
import type { NotificationDelivery } from './deliveryTypes'

/**
 * The async delivery engine — the ONLY place a provider's real network
 * call actually happens. enqueueDelivery returns as soon as the delivery
 * record is written (ordinary synchronous fs I/O, fast); the actual
 * attempt runs fire-and-forget (`void processDelivery(...)`, never
 * awaited by the caller) — this is what makes "the Director must never
 * block waiting for delivery" true without notificationService.ts or any
 * caller needing to change at all: raiseNotification's
 * `await provider.send(event)` now resolves the instant the record is
 * queued, not when it's actually delivered.
 *
 * Provider-agnostic and reused identically by both live enqueues and
 * deliveryBootstrap.ts's crash recovery — a DeliveryHandler is looked up
 * by provider name from the registry below rather than captured in a
 * closure, specifically so a delivery record (pure JSON: the event +
 * provider name) is everything recovery needs to resume it after a
 * restart, with no in-memory state required.
 *
 * PRA-P1-034 — a crash between `handler.attempt(delivery.event)` resolving
 * (line below) and `markDelivered` persisting that fact is a real,
 * possible window: deliveryBootstrap.ts resumes a `Sending` delivery on
 * the next process, effectively re-attempting a send that may have
 * already succeeded. Where the destination provider supports a
 * request-level idempotency key, `delivery.event.id` (stable across every
 * attempt/resume) is passed as one — see resendTransport.ts. Where it
 * doesn't (raw SMTP, Meta WhatsApp Cloud API, Twilio), this is an accepted
 * "prefer duplicate over lost" tradeoff, documented at each of those
 * transports rather than silently assumed away.
 */

export type DeliveryHandler = {
  /** Performs the real send. Throws a DeliveryError (or any Error, treated as Transient) on failure. */
  attempt: (event: NotificationEvent) => Promise<void>
  /** Read fresh on every delivery attempt — never cached — so a provider disabled mid-retry-cycle is honored on the very next attempt. */
  isEnabled: () => boolean
}

const handlers = new Map<string, DeliveryHandler>()

/** Called once per provider module at load time (see emailNotificationProvider.ts / whatsappNotificationProvider.ts) — this is the "configuration, not architecture" seam that makes a new provider pluggable: registering a handler is the only wiring a new provider needs. */
export function registerDeliveryHandler(provider: string, handler: DeliveryHandler): void {
  handlers.set(provider, handler)
}

export function getDeliveryHandler(provider: string): DeliveryHandler | null {
  return handlers.get(provider) ?? null
}

export function enqueueDelivery(event: NotificationEvent, provider: string, maxAttempts: number = DEFAULT_MAX_ATTEMPTS): NotificationDelivery {
  const delivery = createDelivery({ event, provider, maxAttempts })
  const handler = getDeliveryHandler(provider)
  if (handler) void processDelivery(delivery.id, handler)
  return delivery
}

/**
 * Advances one delivery by exactly one attempt (or cancels/no-ops if
 * there's nothing to do) — used identically for a fresh enqueue, a
 * scheduled retry (via setTimeout below), and a post-restart resume
 * (deliveryBootstrap.ts). Never throws — every failure path ends in a
 * persisted status, since nothing awaits this function's rejection.
 */
export async function processDelivery(deliveryId: string, handler: DeliveryHandler): Promise<void> {
  const delivery = getDelivery(deliveryId)
  if (!delivery) return
  if (delivery.status === 'Delivered' || delivery.status === 'Failed' || delivery.status === 'Cancelled') return // terminal — nothing left to do

  if (!handler.isEnabled()) {
    markCancelled(deliveryId, 'Provider is disabled')
    return
  }

  markSending(deliveryId)
  try {
    await handler.attempt(delivery.event)
    markDelivered(deliveryId)
  } catch (err) {
    const { kind, message } = classifyError(err)
    const nextAttemptNumber = delivery.attempts + 1

    if (kind === 'Permanent' || nextAttemptNumber >= delivery.maxAttempts) {
      markFailed(deliveryId, message, nextAttemptNumber)
      return
    }

    const delayMs = computeBackoffDelayMs(nextAttemptNumber)
    const nextAttemptAt = new Date(Date.now() + delayMs).toISOString()
    markRetrying(deliveryId, message, nextAttemptNumber, nextAttemptAt)
    setTimeout(() => {
      void processDelivery(deliveryId, handler)
    }, delayMs)
  }
}
