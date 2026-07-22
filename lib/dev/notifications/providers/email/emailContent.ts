import { classifyEvent, type MessageKind } from '../../eventClassification'
import type { NotificationEvent } from '../../notificationTypes'

export type EmailContent = {
  subject: string
  text: string
  html: string
}

const KIND_PREFIX: Record<MessageKind, string> = {
  ApprovalRequest: 'Action Required',
  Escalation: 'Escalation',
  EngineeringSummary: 'Engineering Update',
  Notification: 'Notification',
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Builds the Email provider's message for every event — "Send notification / Send approval request / Send engineering summary / Send escalation" are all this one function, differing only in subject prefix and a short kind-specific instruction line, since every NotificationEvent already carries the same title/message/severity/project regardless of kind. */
export function buildEmailContent(event: NotificationEvent): EmailContent {
  const kind = classifyEvent(event)
  const subject = `[VYRON DEV] ${KIND_PREFIX[kind]}: ${event.title}`

  const instruction =
    kind === 'ApprovalRequest'
      ? 'This requires your approval before autonomous engineering can continue.'
      : kind === 'Escalation'
        ? 'This is an escalation — please review as soon as possible.'
        : kind === 'EngineeringSummary'
          ? 'Autonomous engineering progress update.'
          : ''

  const lines = [
    `Project: ${event.project}`,
    `Severity: ${event.severity}`,
    '',
    event.message,
    instruction ? `\n${instruction}` : '',
  ].filter(Boolean)

  const text = lines.join('\n')

  const html = `
    <div>
      <p><strong>Project:</strong> ${escapeHtml(event.project)}<br/>
      <strong>Severity:</strong> ${escapeHtml(event.severity)}</p>
      <p>${escapeHtml(event.message)}</p>
      ${instruction ? `<p><em>${escapeHtml(instruction)}</em></p>` : ''}
    </div>
  `.trim()

  return { subject, text, html }
}
