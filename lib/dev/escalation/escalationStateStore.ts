import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { publish } from '../events/eventBus'
import { paginate } from '../query/queryHelpers'
import { archiveEligibleRecords, queryArchive } from '../archive/archiveService'
import type { PageRequest, PageResult } from '../query/queryTypes'
import type { RetentionPolicy, ArchiveResult } from '../archive/archiveTypes'
import type { EscalationItemState, EscalationHistoryEntry } from './escalationTypes'

const FILE = 'escalation-state.json'
const ARCHIVE_FILE = 'escalation-state-archive.json'
const DAY_MS = 24 * 60 * 60 * 1000

export function listEscalationStates(filter: { project?: string; status?: EscalationItemState['status'] } = {}): EscalationItemState[] {
  return readJsonStore<EscalationItemState[]>(FILE, []).filter(
    s => (filter.project ? s.project === filter.project : true) && (filter.status ? s.status === filter.status : true)
  )
}

export function getEscalationState(inboxItemId: string): EscalationItemState | null {
  return readJsonStore<EscalationItemState[]>(FILE, []).find(s => s.inboxItemId === inboxItemId) ?? null
}

/**
 * Creates a fresh Monitoring record the first time an Open inbox item is
 * seen — one `updateJsonStore` call, so a concurrent cycle can never
 * create two records for the same item.
 *
 * PRA-P1-035 remediation: a record already existing used to be treated as
 * fully idempotent regardless of its status. The DEF-002 reopen path
 * (engineeringInboxStore.ts) reuses the same inbox item id when a
 * batch-level condition recurs after being marked Resolved, so this
 * store's own record for that id could already be 'Resolved'/'Cancelled'
 * by the time the recurring condition calls startMonitoring again — and
 * since escalationService.ts's cycle only ever re-checks records still
 * 'Monitoring', that record would silently never escalate again on
 * recurrence. Finding it in a closed state now restarts monitoring from a
 * clean slate (level/reminder count back to zero) instead of being a
 * no-op, while the still-Monitoring case below is untouched — still a
 * true no-op, exactly as before.
 */
export function startMonitoring(inboxItemId: string, project: string, ruleId: string, now: string): EscalationItemState {
  let result!: EscalationItemState
  updateJsonStore<EscalationItemState[]>(FILE, [], states => {
    const idx = states.findIndex(s => s.inboxItemId === inboxItemId)
    const existing = idx === -1 ? null : states[idx]

    if (existing && existing.status === 'Monitoring') {
      result = existing
      return states
    }

    if (existing) {
      // Reopened after being Resolved/Cancelled — restart from a clean slate.
      const entry: EscalationHistoryEntry = {
        timestamp: now,
        event: 'Started',
        level: null,
        detail: `Monitoring restarted under rule ${ruleId} — inbox item reopened after being ${existing.status.toLowerCase()}`,
      }
      result = {
        ...existing,
        ruleId,
        status: 'Monitoring',
        currentLevel: 0,
        reminderCount: 0,
        lastReminderAt: null,
        resolvedAt: null,
        history: [...existing.history, entry],
        updatedAt: now,
      }
      const next = [...states]
      next[idx] = result
      return next
    }

    const entry: EscalationHistoryEntry = { timestamp: now, event: 'Started', level: null, detail: `Monitoring started under rule ${ruleId}` }
    result = {
      inboxItemId,
      project,
      ruleId,
      status: 'Monitoring',
      currentLevel: 0,
      reminderCount: 0,
      lastReminderAt: null,
      resolvedAt: null,
      history: [entry],
      createdAt: now,
      updatedAt: now,
    }
    return [...states, result]
  })
  publish({ category: 'Escalation', project, type: 'monitoring-started', payload: { inboxItemId, ruleId } })
  return result
}

/** Records exactly one reminder having been sent and bumps the current level — all inside the same lock as the read, so two overlapping cycles can never both decide the same item needs a reminder at the same level and double-send. */
export function recordReminder(inboxItemId: string, level: number, label: string, now: string): EscalationItemState | null {
  const all = updateJsonStore<EscalationItemState[]>(FILE, [], states => {
    const idx = states.findIndex(s => s.inboxItemId === inboxItemId)
    if (idx === -1) return states
    const next = [...states]
    const entry: EscalationHistoryEntry = { timestamp: now, event: 'Reminder Sent', level, detail: label }
    next[idx] = {
      ...states[idx],
      currentLevel: level,
      reminderCount: states[idx].reminderCount + 1,
      lastReminderAt: now,
      history: [...states[idx].history, entry],
      updatedAt: now,
    }
    return next
  })
  const result = all.find(s => s.inboxItemId === inboxItemId) ?? null
  if (result) publish({ category: 'Escalation', project: result.project, type: 'reminder-sent', payload: { inboxItemId, level, label } })
  return result
}

/** Cancels any pending escalation and persists completion the instant an inbox item is no longer Open — "resolved" covers the Director's own Resolved status, "cancelled" covers Dismissed, both are terminal and never monitored again. */
export function closeEscalation(inboxItemId: string, outcome: 'Resolved' | 'Cancelled', now: string): EscalationItemState | null {
  let didClose = false
  const all = updateJsonStore<EscalationItemState[]>(FILE, [], states => {
    const idx = states.findIndex(s => s.inboxItemId === inboxItemId)
    if (idx === -1) return states
    if (states[idx].status !== 'Monitoring') return states // already closed — idempotent, no history change, no event
    const next = [...states]
    const entry: EscalationHistoryEntry = { timestamp: now, event: outcome, level: null, detail: `Inbox item ${outcome.toLowerCase()} — escalation stopped` }
    next[idx] = { ...states[idx], status: outcome, resolvedAt: now, history: [...states[idx].history, entry], updatedAt: now }
    didClose = true
    return next
  })
  const result = all.find(s => s.inboxItemId === inboxItemId) ?? null
  if (didClose && result) publish({ category: 'Escalation', project: result.project, type: 'monitoring-closed', payload: { inboxItemId, outcome } })
  return result
}

/** Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — server-side pagination over Escalation History, on top of the existing listEscalationStates filter. */
export function queryEscalationStates(filter: { project?: string; status?: EscalationItemState['status'] } = {}, page: PageRequest = {}): PageResult<EscalationItemState> {
  return paginate(listEscalationStates(filter), page)
}

/** Resolved/Cancelled items are the only ones ever eligible — a still-Monitoring escalation is exactly the "active runtime state" retention must never touch, matching engineeringInboxStore.ts's identical reasoning for the inbox items these escalations track. */
const DEFAULT_ESCALATION_RETENTION: RetentionPolicy = { maxAgeMs: 90 * DAY_MS, maxLiveCount: null }

export function archiveClosedEscalations(now: string = new Date().toISOString(), policy: RetentionPolicy = DEFAULT_ESCALATION_RETENTION): ArchiveResult {
  return archiveEligibleRecords<EscalationItemState>({
    liveFile: FILE,
    archiveFile: ARCHIVE_FILE,
    isEligible: item => item.status === 'Resolved' || item.status === 'Cancelled',
    getTimestamp: item => item.resolvedAt ?? item.updatedAt,
    policy,
    now,
  })
}

export function queryArchivedEscalations(project?: string, page: PageRequest = {}): PageResult<EscalationItemState> {
  return queryArchive<EscalationItemState>(ARCHIVE_FILE, page, project ? item => item.project === project : undefined)
}
