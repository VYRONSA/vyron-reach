import { listDirectorStatuses } from '../director/directorRuntimeStore'
import { listInboxItems } from '../director/engineeringInboxStore'
import * as planningStateService from '../planningState/planningStateService'
import { getSchedulerState } from '../scheduler/schedulerStore'
import { listEscalationStates } from '../escalation/escalationStateStore'
import { listInAppNotifications } from '../notifications/inAppNotificationStore'
import { getCurrentSeq } from './eventBus'

/**
 * "Late subscribers must synchronize with current state before consuming
 * live events" (Milestone 5.1's Scalability section) — this is that
 * synchronization. It is deliberately NOT a replay of past events (the
 * Event Service publishes only forward-looking change notifications, see
 * eventBus.ts's docstring); it is a fresh read of exactly the same
 * durable state every REST status endpoint already exposes
 * (schedulerStore, engineeringInboxStore, escalationStateStore,
 * inAppNotificationStore, directorRuntimeStore, planningStateService),
 * bundled into one payload so a brand-new SSE connection (or a polling
 * client with no `since` cursor yet) can render a fully caught-up
 * dashboard in a single round trip. The accompanying `seq` is the bus's
 * current sequence number at the moment the snapshot was taken — the
 * cursor the client then uses for every subsequent `since`/
 * `Last-Event-ID` request, so no event published after the snapshot was
 * read is ever silently skipped.
 */
export type DashboardSnapshot = {
  seq: number
  timestamp: string
  directorStatuses: ReturnType<typeof listDirectorStatuses>
  inboxItems: ReturnType<typeof listInboxItems>
  schedulerState: ReturnType<typeof getSchedulerState>
  escalationStates: ReturnType<typeof listEscalationStates>
  notifications: ReturnType<typeof listInAppNotifications>
  projects: ReturnType<typeof planningStateService.listProjects>
}

export function buildDashboardSnapshot(project?: string): DashboardSnapshot {
  const seq = getCurrentSeq()
  return {
    seq,
    timestamp: new Date().toISOString(),
    directorStatuses: project ? listDirectorStatuses().filter(s => s.project === project) : listDirectorStatuses(),
    inboxItems: listInboxItems(project ? { project, status: 'Open' } : { status: 'Open' }),
    schedulerState: getSchedulerState(),
    escalationStates: listEscalationStates(project ? { project } : {}),
    notifications: listInAppNotifications(project),
    projects: project
      ? planningStateService.listProjects().filter(p => p.slug === project)
      : planningStateService.listProjects(),
  }
}
