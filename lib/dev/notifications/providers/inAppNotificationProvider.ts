import { recordInAppNotification } from '../inAppNotificationStore'
import type { NotificationEvent, NotificationProvider } from '../notificationTypes'

/** The one fully real provider — no external service required, so it's always enabled. Persists every event to the file-backed in-app notification store, which the dashboard's notification list reads directly. */
export class InAppNotificationProvider implements NotificationProvider {
  readonly name = 'In-App'
  readonly enabled = true

  async send(event: NotificationEvent): Promise<void> {
    recordInAppNotification(event)
  }
}
