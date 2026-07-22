import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getInboxItem } from '@/lib/dev/director/engineeringInboxStore'
import { listEscalationRules } from '@/lib/dev/escalation/escalationRulesStore'
import { listEscalationStates } from '@/lib/dev/escalation/escalationStateStore'
import { estimateNextReminderAt } from '@/lib/dev/escalation/escalationPolicy'

/**
 * Read-only — never triggers an escalation cycle itself (a GET request
 * must never have a write side effect), mirroring
 * app/api/dev/scheduler/status/route.ts's identical shape exactly.
 * "Next scheduled reminder" is computed here, on read, from the item's
 * rule and its underlying inbox item's actual open time — the persisted
 * EscalationItemState never stores a precomputed future timestamp that
 * could drift stale between escalation cycles.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const rules = listEscalationRules()
  const rulesById = new Map(rules.map(r => [r.id, r]))
  const states = listEscalationStates()

  const items = states.map(state => {
    const rule = rulesById.get(state.ruleId) ?? null
    const inboxItem = state.status === 'Monitoring' ? getInboxItem(state.inboxItemId) : null
    const nextReminderAt = rule && inboxItem ? estimateNextReminderAt(rule, state.currentLevel, state.reminderCount, inboxItem.timestamp) : null
    return { ...state, nextReminderAt }
  })

  const summary = {
    monitoring: items.filter(i => i.status === 'Monitoring').length,
    resolved: items.filter(i => i.status === 'Resolved').length,
    cancelled: items.filter(i => i.status === 'Cancelled').length,
    byLevel: items
      .filter(i => i.status === 'Monitoring')
      .reduce<Record<number, number>>((acc, i) => {
        acc[i.currentLevel] = (acc[i.currentLevel] ?? 0) + 1
        return acc
      }, {}),
  }

  return NextResponse.json({ rules, items, summary })
}
