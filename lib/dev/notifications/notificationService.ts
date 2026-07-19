import { randomUUID } from 'node:crypto'
import { InAppNotificationProvider } from './providers/inAppNotificationProvider'
import { EmailNotificationProvider } from './providers/emailNotificationProvider'
import { WhatsAppNotificationProvider } from './providers/whatsappNotificationProvider'
import type { NotificationEvent, NotificationProvider, RaiseNotificationInput } from './notificationTypes'

const PROVIDERS: NotificationProvider[] = [new InAppNotificationProvider(), new EmailNotificationProvider(), new WhatsAppNotificationProvider()]

/**
 * The Notification Service — "The Engineering Director raises events
 * only. Notification providers deliver them." raise() is the entire
 * surface the Director (or anything else) needs: it never knows or cares
 * which providers are enabled or how many there are. A provider's own
 * failure never breaks another provider's delivery or the caller's flow —
 * each send() is isolated.
 */
export async function raiseNotification(input: RaiseNotificationInput): Promise<NotificationEvent> {
  const event: NotificationEvent = { ...input, id: randomUUID(), timestamp: new Date().toISOString() }
  await Promise.all(
    PROVIDERS.map(p => (p.enabled ? p.send(event).catch(() => undefined) : Promise.resolve()))
  )
  return event
}

export function listNotificationProviders(): { name: string; enabled: boolean }[] {
  return PROVIDERS.map(p => ({ name: p.name, enabled: p.enabled }))
}
