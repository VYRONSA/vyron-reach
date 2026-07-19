import type { NotificationEvent, NotificationProvider } from '../notificationTypes'

/**
 * Placeholder — no SMTP/transactional-email credentials exist in this
 * project yet. Disabled so the Notification Service's fan-out never
 * attempts a real send; the provider still exists (and is registered) so
 * the event architecture is already correct the moment credentials do
 * exist. Wiring a real transport later (Resend, SES, SMTP, ...) means
 * filling in send() and flipping `enabled` — nothing about
 * NotificationEvent, the Director, or any other provider changes.
 */
export class EmailNotificationProvider implements NotificationProvider {
  readonly name = 'Email'
  readonly enabled = false

  async send(_event: NotificationEvent): Promise<void> {
    // Intentionally a no-op — see class doc comment.
  }
}
