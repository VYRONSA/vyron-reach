import type { InterventionReasonType, InterventionSeverity } from '../director/directorRuntimeTypes'
import type { ProjectStatus } from '../projectsData'
import type { NotificationSeverity } from '../notifications/notificationTypes'

/**
 * The Engineering Inbox Escalation Engine (Version 2.0 Phase 4, Milestone
 * 4.3) — types. The Escalation Service monitors lib/dev/director/
 * engineeringInboxStore.ts (entirely unmodified by this milestone) and
 * raises reminders through the existing Notification Service as an
 * unresolved item ages, without touching the Director, the Scheduler, or
 * any Notification Provider.
 */

/** One rung of a rule's escalation ladder. Levels are ordered ascending by `level`; the number of levels is entirely configuration-driven — nothing in the Escalation Service hardcodes "3 levels." */
export type EscalationLevelDefinition = {
  level: number
  label: string
  /** How long the inbox item must have been continuously open (ms) before this level is reached. */
  afterMs: number
  severity: NotificationSeverity
}

/**
 * A configuration-driven escalation policy. Match criteria (reasonType,
 * severity, project, priority) are each independently optional — `null`
 * means "matches any" for that dimension, so a rule can be as broad
 * (a single catch-all) or as narrow (one specific project's Security
 * Review items) as an operator wants. When more than one rule matches a
 * given inbox item, the most specific one wins (see escalationPolicy.ts's
 * selectRule) — a project- or reason-specific rule always overrides a
 * broader default.
 */
export type EscalationRule = {
  id: string
  name: string
  enabled: boolean
  reasonType: InterventionReasonType | null
  severity: InterventionSeverity | null
  project: string | null
  /** Reuses the existing Project.status field as the "priority" signal — no new Planning Service schema, mirroring the Scheduler's identical precedent (schedulingPolicy.ts's STATUS_WEIGHT). */
  priority: ProjectStatus | null
  /** Safety ceiling: if an item has been open this long, it is immediately treated as having reached the highest configured level, even if intermediate level thresholds were skipped or misconfigured. */
  maxOpenDurationMs: number
  /** Hard cap on total reminders ever sent for one item under this rule — independent of how many levels are configured, so a rule can never spam indefinitely. */
  maxNotificationCount: number
  /**
   * Descriptive only — carried into the raised NotificationEvent's
   * metadata.channel for a human or a future provider to read. Escalation
   * never selects or calls a specific provider itself: raiseNotification
   * already fans out to every enabled provider exactly as it does for
   * every other event type in this codebase, and that fan-out is
   * deliberately left unchanged by this milestone.
   */
  channel: string
  levels: EscalationLevelDefinition[]
  createdAt: string
  updatedAt: string
}

export type EscalationItemStatus = 'Monitoring' | 'Resolved' | 'Cancelled'

export type EscalationHistoryEvent = 'Started' | 'Reminder Sent' | 'Escalated' | 'Resolved' | 'Cancelled'

export type EscalationHistoryEntry = {
  timestamp: string
  event: EscalationHistoryEvent
  level: number | null
  detail: string
}

/** Persisted, per-inbox-item escalation state — exactly the fields the mission requires tracked: current level, reminder count, last reminder sent, resolution status, and full history. */
export type EscalationItemState = {
  inboxItemId: string
  project: string
  ruleId: string
  status: EscalationItemStatus
  /** 0 = not yet escalated (no reminder sent yet); otherwise the highest EscalationLevelDefinition.level reached so far. */
  currentLevel: number
  reminderCount: number
  lastReminderAt: string | null
  resolvedAt: string | null
  history: EscalationHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export type EscalationCycleResult = {
  timestamp: string
  checked: number
  remindersSent: { inboxItemId: string; project: string; level: number }[]
  resolved: string[]
  errors: { inboxItemId: string; message: string }[]
}
