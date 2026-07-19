import type { NotificationEvent, NotificationProvider } from '../notificationTypes'

/**
 * Placeholder interface only — per the mission, the WhatsApp Business API
 * itself is explicitly NOT implemented here. Disabled so the Notification
 * Service's fan-out never attempts a real send. What this class does
 * establish for real: the provider contract and where a future
 * integration (Twilio, Meta Cloud API, ...) plugs in — send() would format
 * `event` into a WhatsApp template message and call out to that API,
 * keyed by whatever CEO phone/session mapping that integration adds. No
 * other file needs to change when that lands.
 */
export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly name = 'WhatsApp'
  readonly enabled = false

  async send(_event: NotificationEvent): Promise<void> {
    // Intentionally a no-op — see class doc comment.
  }
}
