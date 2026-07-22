import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { EscalationRule, EscalationLevelDefinition } from './escalationTypes'

const FILE = 'escalation-rules.json'

const DEFAULT_LEVELS: EscalationLevelDefinition[] = [
  { level: 1, label: 'Normal reminder', afterMs: 4 * 60 * 60 * 1000, severity: 'Medium' },
  { level: 2, label: 'High priority reminder', afterMs: 24 * 60 * 60 * 1000, severity: 'High' },
  { level: 3, label: 'Critical executive alert', afterMs: 72 * 60 * 60 * 1000, severity: 'Critical' },
]

/** Seeded the first time the store is ever read — a catch-all rule (every match dimension is `null`) so escalation has sane, configurable-but-not-required-to-configure default behavior, matching the pattern of every other DEFAULT_* seed in this codebase (e.g. schedulerStore.ts's DEFAULT_STATE). */
function buildDefaultRule(now: string): EscalationRule {
  return {
    id: 'default',
    name: 'Default — all unresolved inbox items',
    enabled: true,
    reasonType: null,
    severity: null,
    project: null,
    priority: null,
    maxOpenDurationMs: 72 * 60 * 60 * 1000,
    maxNotificationCount: 3,
    channel: 'In-App',
    levels: DEFAULT_LEVELS,
    createdAt: now,
    updatedAt: now,
  }
}

function defaultRules(): EscalationRule[] {
  return [buildDefaultRule(new Date(0).toISOString())]
}

export function listEscalationRules(): EscalationRule[] {
  return readJsonStore<EscalationRule[]>(FILE, defaultRules())
}

export function getEscalationRule(id: string): EscalationRule | null {
  return listEscalationRules().find(r => r.id === id) ?? null
}

export type CreateEscalationRuleInput = Omit<EscalationRule, 'id' | 'createdAt' | 'updatedAt'>

export function createEscalationRule(input: CreateEscalationRuleInput): EscalationRule {
  const now = new Date().toISOString()
  const rule: EscalationRule = { ...input, id: randomUUID(), createdAt: now, updatedAt: now }
  updateJsonStore<EscalationRule[]>(FILE, defaultRules(), rules => [...rules, rule])
  return rule
}

export function updateEscalationRule(id: string, patch: Partial<Omit<EscalationRule, 'id' | 'createdAt'>>): EscalationRule | null {
  let result: EscalationRule | null = null
  updateJsonStore<EscalationRule[]>(FILE, defaultRules(), rules => {
    const idx = rules.findIndex(r => r.id === id)
    if (idx === -1) return rules
    const next = [...rules]
    result = { ...rules[idx], ...patch, id: rules[idx].id, createdAt: rules[idx].createdAt, updatedAt: new Date().toISOString() }
    next[idx] = result
    return next
  })
  return result
}

export function deleteEscalationRule(id: string): boolean {
  let removed = false
  updateJsonStore<EscalationRule[]>(FILE, defaultRules(), rules => {
    const next = rules.filter(r => r.id !== id)
    removed = next.length !== rules.length
    return next
  })
  return removed
}
