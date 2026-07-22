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
  /**
   * Version 2.0 Phase 4 Milestone 4.2 — raised by the Cross-Project
   * Execution Scheduler (lib/dev/scheduler/), never by a Director itself
   * (a Director completing its own work still raises the existing
   * 'Project Completed' above — the Scheduler doesn't duplicate that).
   */
  | 'Project Started'
  | 'Project Waiting'
  | 'Scheduler Recovered'
  | 'Scheduling Error'
  /**
   * Version 2.0 Phase 4 Milestone 4.3 — raised by the Engineering Inbox
   * Escalation Engine (lib/dev/escalation/) whenever an unresolved inbox
   * item crosses into a new configured escalation level.
   */
  | 'Inbox Item Escalated'
  /**
   * Project Initiation & Autonomous Delivery Orchestration — raised by
   * lib/dev/initiation/initiationService.ts at the three transitions a
   * stakeholder actually needs to hear about (a directive was submitted,
   * a generated programme was approved, and provisioning committed real
   * milestones/batches and handed off to execution).
   */
  | 'Project Initiation Submitted'
  | 'Project Initiation Approved'
  | 'Project Initiation Provisioned'
  /**
   * Autonomous Release Management — raised by
   * lib/dev/director/releaseManagement/ when a release has been
   * prepared and needs an Executive's Go/Hold decision, and when an
   * approved release's execution fails partway through.
   */
  | 'Release Go/Hold Required'
  | 'Release Failure'
  /**
   * Autonomous Operations — raised by
   * lib/dev/director/operations/ when a post-release monitoring cycle
   * detects an incident, and when a prior known-good release is
   * available and awaiting a rollback Go/Hold decision.
   */
  | 'Operational Incident'
  | 'Rollback Go/Hold Required'

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
