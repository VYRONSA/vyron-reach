import type { NotificationEvent } from './notificationTypes'

/**
 * The Real Notification Provider Framework's delivery model (Version 2.0
 * Phase 4, Milestone 4.1). A NotificationDelivery is created the instant
 * a provider's send() is called and persists independently of the
 * in-memory process — this is what makes delivery genuinely
 * asynchronous (the Director never awaits anything past the fast,
 * synchronous enqueue write) and what makes "recovery resumes pending
 * deliveries correctly" possible (a crashed process's queued/sending/
 * retrying deliveries are durable, not lost).
 */
export type NotificationDeliveryStatus = 'Queued' | 'Sending' | 'Delivered' | 'Failed' | 'Retrying' | 'Cancelled'

export type NotificationDelivery = {
  id: string
  /** The full event, embedded (not just an id reference) — this is what lets recovery reconstruct and resume a delivery attempt after a restart without needing anything held only in memory. */
  event: NotificationEvent
  project: string
  /** Matches NotificationProvider.name ('Email', 'WhatsApp', ...) — the key deliveryQueue.ts's handler registry is looked up by. */
  provider: string
  status: NotificationDeliveryStatus
  attempts: number
  maxAttempts: number
  /** Set only while Retrying — when the next attempt is scheduled for. Null in every other status. */
  nextAttemptAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  deliveredAt: string | null
}
