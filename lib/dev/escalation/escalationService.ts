import path from 'node:path'
import { withFileLock } from '../fileLock'
import { getVyronDevDataDir } from '../vyronDevDataDir'
import { getInboxItem, listInboxItems } from '../director/engineeringInboxStore'
import * as planningStateService from '../planningState/planningStateService'
import { raiseNotification } from '../notifications/notificationService'
import { listEscalationRules } from './escalationRulesStore'
import { listEscalationStates, startMonitoring, recordReminder, closeEscalation } from './escalationStateStore'
import { selectRule, computeEscalationDecision } from './escalationPolicy'
import type { EscalationCycleResult } from './escalationTypes'

/**
 * The Escalation Service — the ONLY thing that decides whether an
 * unresolved Engineering Inbox item needs another reminder. It never
 * touches the Director, the Scheduler, or a Notification Provider: it
 * only reads engineeringInboxStore.ts (unmodified) and calls
 * raiseNotification (the Notification Service's one integration point,
 * exactly as the Scheduler already does — no second, parallel way to
 * reach a provider is introduced here).
 */

function cycleLockFile(): string {
  return path.join(getVyronDevDataDir(), 'escalation-cycle.lock')
}

export type EscalationCycleOptions = {
  now?: string
}

export function runEscalationCycle(options: EscalationCycleOptions = {}): EscalationCycleResult {
  return withFileLock(cycleLockFile(), () => runEscalationCycleLocked(options))
}

function runEscalationCycleLocked(options: EscalationCycleOptions): EscalationCycleResult {
  const now = options.now ?? new Date().toISOString()
  const errors: EscalationCycleResult['errors'] = []
  const resolved: string[] = []
  const remindersSent: EscalationCycleResult['remindersSent'] = []

  // Anything still "Monitoring" whose underlying inbox item is no longer
  // Open (resolved, dismissed, or gone) gets closed first — resolution
  // always wins over escalation, so a reminder can never fire for an item
  // the CEO already addressed this same cycle.
  for (const state of listEscalationStates({ status: 'Monitoring' })) {
    try {
      const item = getInboxItem(state.inboxItemId)
      if (!item || item.status === 'Resolved') {
        closeEscalation(state.inboxItemId, 'Resolved', now)
        resolved.push(state.inboxItemId)
      } else if (item.status === 'Dismissed') {
        closeEscalation(state.inboxItemId, 'Cancelled', now)
        resolved.push(state.inboxItemId)
      }
    } catch (err) {
      errors.push({ inboxItemId: state.inboxItemId, message: err instanceof Error ? err.message : String(err) })
    }
  }

  const rules = listEscalationRules()
  const openItems = listInboxItems({ status: 'Open' })
  let checked = 0

  for (const item of openItems) {
    checked += 1
    try {
      const project = planningStateService.getProject(item.project)
      const projectStatus = project?.status ?? 'active'
      const rule = selectRule({ reasonType: item.reasonType, severity: item.severity, project: item.project, projectStatus }, rules)
      if (!rule) continue // no matching rule — configuration-driven means no config, no escalation

      const state = startMonitoring(item.id, item.project, rule.id, now)
      const openDurationMs = Math.max(0, new Date(now).getTime() - new Date(item.timestamp).getTime())

      const decision = computeEscalationDecision({ rule, openDurationMs, currentLevel: state.currentLevel, reminderCount: state.reminderCount })
      if (!decision.shouldSendReminder) continue

      recordReminder(item.id, decision.level.level, decision.level.label, now)
      remindersSent.push({ inboxItemId: item.id, project: item.project, level: decision.level.level })

      void raiseNotification({
        type: 'Inbox Item Escalated',
        project: item.project,
        title: `${item.project}: ${decision.level.label} (Level ${decision.level.level})`,
        message: `${item.reasonType} — ${item.reason}`,
        severity: decision.level.severity,
        metadata: { inboxItemId: item.id, ruleId: rule.id, level: String(decision.level.level), channel: rule.channel },
      })
    } catch (err) {
      errors.push({ inboxItemId: item.id, message: err instanceof Error ? err.message : String(err) })
    }
  }

  return { timestamp: now, checked, remindersSent, resolved, errors }
}
