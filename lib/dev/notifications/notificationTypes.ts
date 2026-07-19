/**
 * The Notification Service's event architecture. The Director raises
 * events only — it has no idea how (or whether) any given event actually
 * reaches anyone; that is entirely the receiving NotificationProvider's
 * concern. Adding a new delivery channel later (Slack, SMS, a real
 * WhatsApp integration) means writing one more class implementing
 * NotificationProvider and registering it in notificationService.ts —
 * nothing about NotificationEvent, the Director, or any existing provider
 * changes.
 */
export type NotificationEventType =
  | 'CEO Approval Required'
  | 'Project Blocked'
  | 'Business Rule Required'
  | 'Security Approval Required'
  | 'Development Completed'
  | 'Milestone Completed'
  | 'Phase Completed'
  | 'Project Completed'
  | 'Engineering Resumed'
  | 'Engineering Paused'

export type NotificationSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'

export type NotificationEvent = {
  id: string
  type: NotificationEventType
  project: string
  title: string
  message: string
  severity: NotificationSeverity
  timestamp: string
  /** Free-form context a specific provider may want (batchId, inboxItemId, milestoneId, ...) — never required, never parsed by the service itself. */
  metadata: Record<string, string>
}

export type RaiseNotificationInput = Omit<NotificationEvent, 'id' | 'timestamp'>

/** The one contract every delivery channel implements. `enabled` lets a provider exist in the registry (so the architecture is already correct) before it's actually wired up to a real external API. */
export interface NotificationProvider {
  readonly name: string
  readonly enabled: boolean
  send(event: NotificationEvent): Promise<void>
}
