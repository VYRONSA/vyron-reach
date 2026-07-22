import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { listEscalationRules, getEscalationRule, createEscalationRule, updateEscalationRule, deleteEscalationRule } from '../../../lib/dev/escalation/escalationRulesStore'
import type { CreateEscalationRuleInput } from '../../../lib/dev/escalation/escalationRulesStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function ruleInput(overrides: Partial<CreateEscalationRuleInput> = {}): CreateEscalationRuleInput {
  return {
    name: 'custom rule',
    enabled: true,
    reasonType: null,
    severity: null,
    project: 'acme',
    priority: null,
    maxOpenDurationMs: 10_000,
    maxNotificationCount: 2,
    channel: 'Email',
    levels: [{ level: 1, label: 'Normal reminder', afterMs: 1_000, severity: 'Medium' }],
    ...overrides,
  }
}

describe('Escalation Rules Store — defaults', () => {
  it('seeds exactly one catch-all default rule when the store has never been written', () => {
    const rules = listEscalationRules()
    expect(rules).toHaveLength(1)
    expect(rules[0].id).toBe('default')
    expect(rules[0].reasonType).toBeNull()
    expect(rules[0].project).toBeNull()
    expect(rules[0].levels.length).toBeGreaterThan(0)
  })
})

describe('Escalation Rules Store — CRUD', () => {
  it('creates a rule and it appears alongside the default', () => {
    const created = createEscalationRule(ruleInput())
    const rules = listEscalationRules()
    expect(rules.map(r => r.id)).toContain('default')
    expect(rules.map(r => r.id)).toContain(created.id)
  })

  it('reads a single rule by id', () => {
    const created = createEscalationRule(ruleInput())
    expect(getEscalationRule(created.id)?.name).toBe('custom rule')
    expect(getEscalationRule('does-not-exist')).toBeNull()
  })

  it('updates a rule, preserving id and createdAt', () => {
    const created = createEscalationRule(ruleInput())
    const updated = updateEscalationRule(created.id, { maxNotificationCount: 9 })
    expect(updated?.id).toBe(created.id)
    expect(updated?.createdAt).toBe(created.createdAt)
    expect(updated?.maxNotificationCount).toBe(9)
  })

  it('returns null when updating a rule that does not exist', () => {
    expect(updateEscalationRule('nope', { maxNotificationCount: 9 })).toBeNull()
  })

  it('deletes a rule', () => {
    const created = createEscalationRule(ruleInput())
    expect(deleteEscalationRule(created.id)).toBe(true)
    expect(getEscalationRule(created.id)).toBeNull()
  })

  it('deleting a nonexistent rule reports false and changes nothing', () => {
    expect(deleteEscalationRule('nope')).toBe(false)
    expect(listEscalationRules()).toHaveLength(1) // still just the default
  })
})

describe('Escalation Rules Store — restart survival', () => {
  it('a fresh read sees every rule a prior process wrote', () => {
    const created = createEscalationRule(ruleInput())
    expect(listEscalationRules().some(r => r.id === created.id)).toBe(true)
  })
})
