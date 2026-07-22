import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { createInboxItem, resolveInboxItem, dismissInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import type { CreateInboxItemInput } from '../../../lib/dev/director/engineeringInboxStore'
import { createEscalationRule, updateEscalationRule } from '../../../lib/dev/escalation/escalationRulesStore'
import type { CreateEscalationRuleInput } from '../../../lib/dev/escalation/escalationRulesStore'
import { getEscalationState, listEscalationStates } from '../../../lib/dev/escalation/escalationStateStore'
import { runEscalationCycle } from '../../../lib/dev/escalation/escalationService'
import { listInAppNotifications } from '../../../lib/dev/notifications/inAppNotificationStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedProject(project: string, status: planningStateService.PlanningProjectInput['status'] = 'active') {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status, progress: 0, color: '#000', icon: 'x' })
}

function seedInboxItem(project: string, overrides: Partial<CreateInboxItemInput> = {}) {
  return createInboxItem({
    project,
    batchId: null,
    batchNumber: null,
    reasonType: 'Approval Required',
    severity: 'High',
    reason: 'Needs executive sign-off',
    recommendedAction: 'Review and approve',
    ...overrides,
  })
}

function threeLevelRule(project: string, overrides: Partial<CreateEscalationRuleInput> = {}) {
  return createEscalationRule({
    name: `${project} rule`,
    enabled: true,
    reasonType: null,
    severity: null,
    project,
    priority: null,
    maxOpenDurationMs: 100_000,
    maxNotificationCount: 5,
    channel: 'In-App',
    levels: [
      { level: 1, label: 'Normal reminder', afterMs: 1_000, severity: 'Medium' },
      { level: 2, label: 'High priority reminder', afterMs: 5_000, severity: 'High' },
      { level: 3, label: 'Critical executive alert', afterMs: 20_000, severity: 'Critical' },
    ],
    ...overrides,
  })
}

function nowPlus(baseIso: string, ms: number): string {
  return new Date(new Date(baseIso).getTime() + ms).toISOString()
}

describe('Escalation Service — reminder generation', () => {
  it('sends no reminder before the first level threshold', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    const result = runEscalationCycle({ now: nowPlus(item.timestamp, 500) })

    expect(result.checked).toBe(1)
    expect(result.remindersSent).toHaveLength(0)
    expect(getEscalationState(item.id)?.currentLevel).toBe(0)
  })

  it('sends a level 1 reminder once its threshold is crossed', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    const result = runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })

    expect(result.remindersSent).toEqual([{ inboxItemId: item.id, project, level: 1 }])
    const state = getEscalationState(item.id)
    expect(state?.currentLevel).toBe(1)
    expect(state?.reminderCount).toBe(1)
  })
})

describe('Escalation Service — multiple escalation levels', () => {
  it('escalates through level 1, 2, then 3 as the item ages across cycles', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    expect(getEscalationState(item.id)?.currentLevel).toBe(1)

    runEscalationCycle({ now: nowPlus(item.timestamp, 6_000) })
    expect(getEscalationState(item.id)?.currentLevel).toBe(2)

    runEscalationCycle({ now: nowPlus(item.timestamp, 21_000) })
    const finalState = getEscalationState(item.id)
    expect(finalState?.currentLevel).toBe(3)
    expect(finalState?.reminderCount).toBe(3)
    expect(finalState?.history.filter(h => h.event === 'Reminder Sent')).toHaveLength(3)
  })
})

describe('Escalation Service — resolution stops reminders', () => {
  it('cancels pending escalation and records resolution once the inbox item is Resolved', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    expect(getEscalationState(item.id)?.currentLevel).toBe(1)

    resolveInboxItem(item.id, 'Approved')
    const result = runEscalationCycle({ now: nowPlus(item.timestamp, 21_000) }) // would have crossed level 2 and 3

    expect(result.resolved).toContain(item.id)
    expect(result.remindersSent).toHaveLength(0)
    const state = getEscalationState(item.id)
    expect(state?.status).toBe('Resolved')
    expect(state?.currentLevel).toBe(1) // never advanced past its last real reminder
    expect(state?.history.at(-1)?.event).toBe('Resolved')
  })

  it('treats a Dismissed item as Cancelled, distinct from Resolved', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    dismissInboxItem(item.id, 'Not actionable')
    runEscalationCycle({ now: nowPlus(item.timestamp, 21_000) })

    expect(getEscalationState(item.id)?.status).toBe('Cancelled')
  })
})

describe('Escalation Service — duplicate reminder prevention', () => {
  it('never sends a second reminder for a cycle run again at the same elapsed time', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    const first = runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    expect(first.remindersSent).toHaveLength(1)

    const second = runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    expect(second.remindersSent).toHaveLength(0)
    expect(getEscalationState(item.id)?.reminderCount).toBe(1)
  })

  it('never sends a second reminder for the same level even after several redundant cycles', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    runEscalationCycle({ now: nowPlus(item.timestamp, 2_000) })
    runEscalationCycle({ now: nowPlus(item.timestamp, 3_000) })

    expect(getEscalationState(item.id)?.reminderCount).toBe(1)
  })
})

describe('Escalation Service — independent project escalation', () => {
  it('two projects with different rule thresholds escalate independently', () => {
    const fastProject = uniqueSlug('fast')
    const slowProject = uniqueSlug('slow')
    seedProject(fastProject)
    seedProject(slowProject)
    threeLevelRule(fastProject, { levels: [{ level: 1, label: 'Normal reminder', afterMs: 500, severity: 'Medium' }] })
    threeLevelRule(slowProject, { levels: [{ level: 1, label: 'Normal reminder', afterMs: 50_000, severity: 'Medium' }] })
    const fastItem = seedInboxItem(fastProject)
    const slowItem = seedInboxItem(slowProject)

    const result = runEscalationCycle({ now: nowPlus(fastItem.timestamp, 1_000) })

    expect(result.remindersSent.map(r => r.inboxItemId)).toEqual([fastItem.id])
    expect(getEscalationState(fastItem.id)?.currentLevel).toBe(1)
    expect(getEscalationState(slowItem.id)?.currentLevel).toBe(0)
  })
})

describe('Escalation Service — notification integration', () => {
  it('raises an Inbox Item Escalated notification through the Notification Service for each reminder', async () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    await new Promise(resolve => setTimeout(resolve, 50)) // raiseNotification is fire-and-forget

    const notifications = listInAppNotifications(project).filter(n => n.type === 'Inbox Item Escalated')
    expect(notifications).toHaveLength(1)
    expect(notifications[0].severity).toBe('Medium') // level 1's configured severity
    expect(notifications[0].metadata.level).toBe('1')
  })
})

describe('Escalation Service — escalation history', () => {
  it('accumulates Started, Reminder Sent, and Resolved entries in order', () => {
    const project = uniqueSlug()
    seedProject(project)
    threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) })
    resolveInboxItem(item.id)
    runEscalationCycle({ now: nowPlus(item.timestamp, 2_000) })

    const events = getEscalationState(item.id)?.history.map(h => h.event)
    expect(events).toEqual(['Started', 'Reminder Sent', 'Resolved'])
  })
})

describe('Escalation Service — configuration changes', () => {
  it('a lowered maxNotificationCount takes effect on the very next cycle', () => {
    const project = uniqueSlug()
    seedProject(project)
    const rule = threeLevelRule(project)
    const item = seedInboxItem(project)

    runEscalationCycle({ now: nowPlus(item.timestamp, 1_500) }) // level 1, reminderCount 1
    updateEscalationRule(rule.id, { maxNotificationCount: 1 })
    const result = runEscalationCycle({ now: nowPlus(item.timestamp, 21_000) }) // would otherwise reach level 3

    expect(result.remindersSent).toHaveLength(0)
    expect(getEscalationState(item.id)?.reminderCount).toBe(1)
  })

  it('an item with no matching rule (default disabled, no project-specific rule) is checked but never escalated', () => {
    const project = uniqueSlug()
    seedProject(project)
    updateEscalationRule('default', { enabled: false })
    const item = seedInboxItem(project)

    const result = runEscalationCycle({ now: nowPlus(item.timestamp, 999_999) })

    expect(result.checked).toBe(1)
    expect(result.remindersSent).toHaveLength(0)
    expect(listEscalationStates()).toHaveLength(0) // never even started monitoring
  })
})
