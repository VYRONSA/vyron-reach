import type { NotificationEvent, NotificationEventType } from './notificationTypes'

/**
 * Shared by both Email and WhatsApp content builders — one place decides
 * "what kind of message is this," so the two providers' formatters can
 * never disagree about which NotificationEventTypes count as an approval
 * request vs. an escalation vs. a summary. Satisfies both providers'
 * mission-listed responsibilities from one classification: Email's "Send
 * approval request / engineering summary / escalation" and WhatsApp's
 * "CEO approval requests / critical alerts / escalations" map onto the
 * same four MessageKind values.
 */
export type MessageKind = 'ApprovalRequest' | 'EngineeringSummary' | 'Escalation' | 'Notification'

const APPROVAL_TYPES: NotificationEventType[] = ['CEO Approval Required', 'Business Rule Required', 'Security Approval Required', 'Release Go/Hold Required', 'Rollback Go/Hold Required']
const ESCALATION_TYPES: NotificationEventType[] = ['Project Blocked']
const SUMMARY_TYPES: NotificationEventType[] = ['Development Completed', 'Milestone Completed', 'Phase Completed', 'Project Completed']

export function classifyEvent(event: NotificationEvent): MessageKind {
  if (APPROVAL_TYPES.includes(event.type)) return 'ApprovalRequest'
  // Severity Critical always escalates, regardless of type — a "critical alert"
  // per the mission's WhatsApp responsibilities isn't tied to one specific type.
  if (ESCALATION_TYPES.includes(event.type) || event.severity === 'Critical') return 'Escalation'
  if (SUMMARY_TYPES.includes(event.type)) return 'EngineeringSummary'
  return 'Notification'
}
