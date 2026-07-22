import { describe, it, expect } from 'vitest'
import { selectRule, computeEscalationDecision, estimateNextReminderAt, type InboxItemMatchInput } from '../../../lib/dev/escalation/escalationPolicy'
import type { EscalationRule } from '../../../lib/dev/escalation/escalationTypes'

function rule(overrides: Partial<EscalationRule> = {}): EscalationRule {
  return {
    id: 'r1',
    name: 'test rule',
    enabled: true,
    reasonType: null,
    severity: null,
    project: null,
    priority: null,
    maxOpenDurationMs: 100_000,
    maxNotificationCount: 3,
    channel: 'In-App',
    levels: [
      { level: 1, label: 'Normal reminder', afterMs: 1_000, severity: 'Medium' },
      { level: 2, label: 'High priority reminder', afterMs: 10_000, severity: 'High' },
      { level: 3, label: 'Critical executive alert', afterMs: 50_000, severity: 'Critical' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function item(overrides: Partial<InboxItemMatchInput> = {}): InboxItemMatchInput {
  return { reasonType: 'Approval Required', severity: 'High', project: 'acme', projectStatus: 'active', ...overrides }
}

describe('Escalation Policy — rule selection', () => {
  it('matches a catch-all rule (every dimension null) against any item', () => {
    expect(selectRule(item(), [rule()])).not.toBeNull()
  })

  it('returns null when no rule matches', () => {
    expect(selectRule(item({ project: 'other' }), [rule({ project: 'acme' })])).toBeNull()
  })

  it('never matches a disabled rule', () => {
    expect(selectRule(item(), [rule({ enabled: false })])).toBeNull()
  })

  it('prefers the more specific rule when multiple match', () => {
    const generic = rule({ id: 'generic' })
    const specific = rule({ id: 'specific', project: 'acme', reasonType: 'Approval Required' })
    const selected = selectRule(item(), [generic, specific])
    expect(selected?.id).toBe('specific')
  })

  it('rejects a rule whose non-null criteria do not all match', () => {
    const wrongSeverity = rule({ project: 'acme', severity: 'Low' })
    expect(selectRule(item({ project: 'acme', severity: 'High' }), [wrongSeverity])).toBeNull()
  })

  it('breaks ties between equally specific rules deterministically by id', () => {
    const a = rule({ id: 'a-rule', project: 'acme' })
    const b = rule({ id: 'b-rule', project: 'acme' })
    expect(selectRule(item(), [b, a])?.id).toBe('a-rule')
    expect(selectRule(item(), [a, b])?.id).toBe('a-rule')
  })
})

describe('Escalation Policy — escalation decision', () => {
  it('no reminder due before the first level threshold', () => {
    const decision = computeEscalationDecision({ rule: rule(), openDurationMs: 500, currentLevel: 0, reminderCount: 0 })
    expect(decision.shouldSendReminder).toBe(false)
  })

  it('reminder due once the first level threshold is crossed', () => {
    const decision = computeEscalationDecision({ rule: rule(), openDurationMs: 1_500, currentLevel: 0, reminderCount: 0 })
    expect(decision.shouldSendReminder).toBe(true)
    expect(decision.level?.level).toBe(1)
  })

  it('escalates through multiple levels as duration grows', () => {
    const level2 = computeEscalationDecision({ rule: rule(), openDurationMs: 11_000, currentLevel: 1, reminderCount: 1 })
    expect(level2.level?.level).toBe(2)

    const level3 = computeEscalationDecision({ rule: rule(), openDurationMs: 51_000, currentLevel: 2, reminderCount: 2 })
    expect(level3.level?.level).toBe(3)
  })

  it('never re-sends a reminder for a level already reached', () => {
    const decision = computeEscalationDecision({ rule: rule(), openDurationMs: 5_000, currentLevel: 1, reminderCount: 1 })
    expect(decision.shouldSendReminder).toBe(false) // still within level 1's range, already at level 1
  })

  it('respects maxNotificationCount as a hard cap regardless of level thresholds crossed', () => {
    const decision = computeEscalationDecision({ rule: rule({ maxNotificationCount: 1 }), openDurationMs: 51_000, currentLevel: 1, reminderCount: 1 })
    expect(decision.shouldSendReminder).toBe(false)
  })

  it('maxOpenDurationMs forces the top configured level even if intermediate thresholds were never checked', () => {
    const decision = computeEscalationDecision({
      rule: rule({ maxOpenDurationMs: 2_000, levels: [{ level: 1, label: 'x', afterMs: 100_000, severity: 'Medium' }] }),
      openDurationMs: 3_000,
      currentLevel: 0,
      reminderCount: 0,
    })
    expect(decision.shouldSendReminder).toBe(true)
    expect(decision.level?.level).toBe(1)
  })
})

describe('Escalation Policy — next reminder estimate', () => {
  it('estimates the next level threshold from the item\'s open time', () => {
    const next = estimateNextReminderAt(rule(), 0, 0, '2026-01-01T00:00:00.000Z')
    expect(next).toBe('2026-01-01T00:00:01.000Z') // level 1's afterMs (1000ms) from opened time
  })

  it('returns null once the top level has already been reached', () => {
    expect(estimateNextReminderAt(rule(), 3, 3, '2026-01-01T00:00:00.000Z')).toBeNull()
  })

  it('returns null once maxNotificationCount has already been reached', () => {
    expect(estimateNextReminderAt(rule({ maxNotificationCount: 1 }), 1, 1, '2026-01-01T00:00:00.000Z')).toBeNull()
  })
})
