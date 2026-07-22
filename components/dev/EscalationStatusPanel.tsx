'use client'

import { useEffect, useRef, useState } from 'react'
import type { EscalationItemState } from '@/lib/dev/escalation/escalationTypes'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevBadge, DevCard, DevCardHeader, DevField } from './ui'

type EscalationStatusResponse = {
  items: (EscalationItemState & { nextReminderAt: string | null })[]
  summary: {
    monitoring: number
    resolved: number
    cancelled: number
    byLevel: Record<number, number>
  }
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Monitoring: 'warning',
  Resolved: 'success',
  Cancelled: 'neutral',
}

async function fetchEscalationStatus(): Promise<EscalationStatusResponse> {
  const res = await fetch('/api/dev/escalation/status')
  if (!res.ok) throw new Error(`Failed to load escalation status (${res.status})`)
  return res.json()
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'None'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

/**
 * A read-only view of the Engineering Inbox Escalation Engine
 * (lib/dev/escalation/) — polling only, exactly like
 * SchedulerStatusPanel.tsx: never triggers an escalation cycle itself,
 * only displays what the Escalation Service's own background tick
 * (escalationBootstrap.ts) already decided.
 */
export function EscalationStatusPanel() {
  const [data, setData] = useState<EscalationStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const status = await fetchEscalationStatus()
        if (!cancelled) setData(status)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load escalation status.')
      }
    }
    tick()
    // Fallback-only — the Real-Time Event Service (below) triggers an
    // immediate refetch whenever an escalation actually changes.
    const timer = setInterval(tick, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    categories: ['Escalation'],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(() => {
        fetchEscalationStatus().then(setData).catch(err => setError(err instanceof Error ? err.message : 'Failed to load escalation status.'))
      }, 250)
    },
  })

  const items = data?.items ?? []
  const monitoring = items.filter(i => i.status === 'Monitoring').sort((a, b) => b.currentLevel - a.currentLevel)
  const history = items.filter(i => i.status !== 'Monitoring').sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))

  return (
    <DevCard>
      <DevCardHeader title="Engineering Inbox Escalation Engine" />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DevField label="Currently Escalated">
          <span className="text-sm text-[var(--dev-text)]">{data?.summary.monitoring ?? 0}</span>
        </DevField>
        <DevField label="Resolved">
          <span className="text-sm text-[var(--dev-text)]">{data?.summary.resolved ?? 0}</span>
        </DevField>
        <DevField label="Cancelled">
          <span className="text-sm text-[var(--dev-text)]">{data?.summary.cancelled ?? 0}</span>
        </DevField>
      </div>

      {monitoring.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Currently Monitoring</h3>
          <ul className="mt-2 space-y-2">
            {monitoring.map(item => (
              <li key={item.inboxItemId} className="flex flex-wrap items-center gap-2 text-sm text-[var(--dev-text)]">
                <DevBadge tone={STATUS_TONE[item.status] ?? 'neutral'}>{item.status}</DevBadge>
                <span>{item.project}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">Level {item.currentLevel}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">Reminders: {item.reminderCount}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">Last: {formatTimestamp(item.lastReminderAt)}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">Next: {formatTimestamp(item.nextReminderAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Escalation History</h3>
          <ul className="mt-2 space-y-2">
            {history.map(item => (
              <li key={item.inboxItemId} className="flex flex-wrap items-center gap-2 text-sm text-[var(--dev-text)]">
                <DevBadge tone={STATUS_TONE[item.status] ?? 'neutral'}>{item.status}</DevBadge>
                <span>{item.project}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">Reached level {item.currentLevel}</span>
                <span className="text-xs text-[var(--dev-text-muted)]">{formatTimestamp(item.resolvedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}
    </DevCard>
  )
}
