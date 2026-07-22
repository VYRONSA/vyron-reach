import { classifyEvent, type MessageKind } from '../../eventClassification'
import type { NotificationEvent } from '../../notificationTypes'

const KIND_LABEL: Record<MessageKind, string> = {
  ApprovalRequest: '🔔 Action Required',
  Escalation: '🚨 Escalation',
  EngineeringSummary: '✅ Engineering Update',
  Notification: 'ℹ️ Notification',
}

/** WhatsApp messages are plain text (no HTML) — "Engineering notifications / CEO approval requests / Critical alerts / Escalations" are all this one function, same as the Email content builder, differing only in the label line. */
export function buildWhatsAppMessage(event: NotificationEvent): string {
  const kind = classifyEvent(event)
  const lines = [
    `${KIND_LABEL[kind]}: ${event.title}`,
    `Project: ${event.project} · Severity: ${event.severity}`,
    '',
    event.message,
  ]
  if (kind === 'ApprovalRequest') lines.push('', 'Reply in the Engineering Command Centre to resolve.')
  return lines.join('\n')
}
