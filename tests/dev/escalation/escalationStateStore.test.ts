import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { listEscalationStates, getEscalationState, startMonitoring, recordReminder, closeEscalation } from '../../../lib/dev/escalation/escalationStateStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Escalation State Store — starting monitoring', () => {
  it('creates a fresh Monitoring record at level 0', () => {
    const project = uniqueSlug()
    const state = startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    expect(state.status).toBe('Monitoring')
    expect(state.currentLevel).toBe(0)
    expect(state.reminderCount).toBe(0)
    expect(state.history).toHaveLength(1)
    expect(state.history[0].event).toBe('Started')
  })

  it('is idempotent — calling it again for the same item returns the existing record unchanged', () => {
    const project = uniqueSlug()
    const first = startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    const second = startMonitoring('item-1', project, 'default', '2026-01-02T00:00:00.000Z')
    expect(second.createdAt).toBe(first.createdAt)
    expect(listEscalationStates()).toHaveLength(1)
  })
})

describe('Escalation State Store — reopen after resolution restarts escalation (PRA-P1-035)', () => {
  it('resets a Resolved record to a fresh Monitoring state instead of leaving it permanently closed', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    recordReminder('item-1', 2, 'High priority reminder', '2026-01-01T01:00:00.000Z')
    closeEscalation('item-1', 'Resolved', '2026-01-01T02:00:00.000Z')
    expect(getEscalationState('item-1')?.status).toBe('Resolved')

    // The DEF-002 reopen path raised the same underlying condition again — the
    // escalation cycle calls startMonitoring for every currently-Open item,
    // including one whose escalation record is still 'Resolved' from before.
    const reopened = startMonitoring('item-1', project, 'default', '2026-01-02T00:00:00.000Z')

    expect(reopened.status).toBe('Monitoring')
    expect(reopened.currentLevel).toBe(0)
    expect(reopened.reminderCount).toBe(0)
    expect(reopened.resolvedAt).toBeNull()
    expect(reopened.lastReminderAt).toBeNull()
    // Never a second record — still exactly one state per inbox item id.
    expect(listEscalationStates()).toHaveLength(1)
    expect(listEscalationStates({ status: 'Monitoring' })).toHaveLength(1)
    // History is append-only — the reopen is a new entry, not a rewrite of what already happened.
    expect(reopened.history.length).toBeGreaterThan(1)
    expect(reopened.history.at(-1)?.detail).toMatch(/reopened after being resolved/i)
  })

  it('resets a Cancelled (Dismissed) record the same way', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    closeEscalation('item-1', 'Cancelled', '2026-01-01T02:00:00.000Z')

    const reopened = startMonitoring('item-1', project, 'default', '2026-01-02T00:00:00.000Z')
    expect(reopened.status).toBe('Monitoring')
    expect(reopened.currentLevel).toBe(0)
  })

  it('a reopened, reset escalation can escalate again — recordReminder works on it exactly as on a brand-new one', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    closeEscalation('item-1', 'Resolved', '2026-01-01T02:00:00.000Z')
    startMonitoring('item-1', project, 'default', '2026-01-02T00:00:00.000Z')

    const state = recordReminder('item-1', 1, 'First reminder since reopening', '2026-01-02T01:00:00.000Z')
    expect(state?.currentLevel).toBe(1)
    expect(state?.reminderCount).toBe(1)
  })

  it('still a true no-op while genuinely still Monitoring — the reopen path never fires for an item that was never closed', () => {
    const project = uniqueSlug()
    const first = startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    recordReminder('item-1', 1, 'A reminder', '2026-01-01T01:00:00.000Z')
    const second = startMonitoring('item-1', project, 'default', '2026-01-02T00:00:00.000Z')
    expect(second.createdAt).toBe(first.createdAt)
    expect(second.currentLevel).toBe(1) // untouched — recordReminder's own progress survives, not reset
    expect(second.history).toHaveLength(2) // Started + Reminder Sent, no spurious restart entry
  })
})

describe('Escalation State Store — recording reminders', () => {
  it('bumps currentLevel, increments reminderCount, and appends history', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    const state = recordReminder('item-1', 1, 'Normal reminder', '2026-01-01T01:00:00.000Z')
    expect(state?.currentLevel).toBe(1)
    expect(state?.reminderCount).toBe(1)
    expect(state?.lastReminderAt).toBe('2026-01-01T01:00:00.000Z')
    expect(state?.history).toHaveLength(2)
    expect(state?.history[1].event).toBe('Reminder Sent')
  })

  it('accumulates across multiple levels', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    recordReminder('item-1', 1, 'Normal reminder', '2026-01-01T01:00:00.000Z')
    const state = recordReminder('item-1', 2, 'High priority reminder', '2026-01-02T00:00:00.000Z')
    expect(state?.currentLevel).toBe(2)
    expect(state?.reminderCount).toBe(2)
    expect(state?.history).toHaveLength(3)
  })

  it('returns null for an item with no monitoring record', () => {
    expect(recordReminder('unknown', 1, 'x', '2026-01-01T00:00:00.000Z')).toBeNull()
  })
})

describe('Escalation State Store — closing', () => {
  it('marks Resolved, records history, and stops being Monitoring', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    const state = closeEscalation('item-1', 'Resolved', '2026-01-01T02:00:00.000Z')
    expect(state?.status).toBe('Resolved')
    expect(state?.resolvedAt).toBe('2026-01-01T02:00:00.000Z')
    expect(state?.history.at(-1)?.event).toBe('Resolved')
    expect(listEscalationStates({ status: 'Monitoring' })).toHaveLength(0)
  })

  it('marks Cancelled distinctly from Resolved', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    const state = closeEscalation('item-1', 'Cancelled', '2026-01-01T02:00:00.000Z')
    expect(state?.status).toBe('Cancelled')
  })

  it('is idempotent — closing an already-closed item does not append duplicate history', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    closeEscalation('item-1', 'Resolved', '2026-01-01T02:00:00.000Z')
    const state = closeEscalation('item-1', 'Resolved', '2026-01-01T03:00:00.000Z')
    expect(state?.history).toHaveLength(2) // Started + Resolved, not a second Resolved
  })

  it('returns null for an item with no monitoring record', () => {
    expect(closeEscalation('unknown', 'Resolved', '2026-01-01T00:00:00.000Z')).toBeNull()
  })
})

describe('Escalation State Store — filtering and restart survival', () => {
  it('filters by project and status', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    startMonitoring('item-a', projectA, 'default', '2026-01-01T00:00:00.000Z')
    startMonitoring('item-b', projectB, 'default', '2026-01-01T00:00:00.000Z')
    closeEscalation('item-b', 'Resolved', '2026-01-01T01:00:00.000Z')

    expect(listEscalationStates({ project: projectA })).toHaveLength(1)
    expect(listEscalationStates({ status: 'Monitoring' }).map(s => s.inboxItemId)).toEqual(['item-a'])
  })

  it('a fresh read sees everything a prior process wrote', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2026-01-01T00:00:00.000Z')
    expect(getEscalationState('item-1')).not.toBeNull()
  })
})
