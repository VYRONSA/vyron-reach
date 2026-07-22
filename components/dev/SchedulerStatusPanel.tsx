'use client'

import { useEffect, useRef, useState } from 'react'
import type { SchedulerState } from '@/lib/dev/scheduler/schedulerTypes'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevBadge, DevCard, DevCardHeader, DevField } from './ui'

const ELIGIBILITY_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Running: 'info',
  Eligible: 'neutral',
  Blocked: 'danger',
  WaitingForCeo: 'warning',
  Completed: 'success',
  NoWork: 'neutral',
  AwaitingGo: 'warning',
}

async function fetchSchedulerStatus(): Promise<SchedulerState> {
  const res = await fetch('/api/dev/scheduler/status')
  if (!res.ok) throw new Error(`Failed to load scheduler status (${res.status})`)
  const body = await res.json()
  return body.state as SchedulerState
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

/**
 * A read-only view of the Cross-Project Execution Scheduler
 * (lib/dev/scheduler/) — polling only, exactly like
 * LiveEngineeringCommandCentre.tsx: this component never triggers a
 * scheduling cycle itself, it only displays what the Scheduler's own
 * background tick (schedulerBootstrap.ts) already decided.
 */
export function SchedulerStatusPanel() {
  const [state, setState] = useState<SchedulerState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const status = await fetchSchedulerStatus()
        if (!cancelled) setState(status)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scheduler status.')
      }
    }
    tick()
    // Fallback-only now — the Real-Time Event Service (below) triggers an
    // immediate refetch on every real Scheduler cycle; this interval only
    // matters if that live connection is itself degraded.
    const timer = setInterval(tick, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    categories: ['Scheduler Activity'],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(() => {
        fetchSchedulerStatus().then(setState).catch(err => setError(err instanceof Error ? err.message : 'Failed to load scheduler status.'))
      }, 250)
    },
  })

  const order = state?.lastCycleResult?.order ?? []
  const running = order.filter(i => i.eligibility === 'Running')
  const waiting = order.filter(i => i.eligibility === 'Eligible')
  const paused = order.filter(i => i.eligibility === 'WaitingForCeo')
  const blocked = order.filter(i => i.eligibility === 'Blocked')

  return (
    <DevCard>
      <DevCardHeader title="Cross-Project Execution Scheduler" />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DevField label="Projects Running">
          <span className="text-sm text-[var(--dev-text)]">{running.length}</span>
        </DevField>
        <DevField label="Projects Waiting">
          <span className="text-sm text-[var(--dev-text)]">{waiting.length}</span>
        </DevField>
        <DevField label="Projects Paused">
          <span className="text-sm text-[var(--dev-text)]">{paused.length}</span>
        </DevField>
        <DevField label="Projects Blocked">
          <span className="text-sm text-[var(--dev-text)]">{blocked.length}</span>
        </DevField>
        <DevField label="Last Scheduling Cycle">
          <span className="text-sm text-[var(--dev-text)]">{formatTimestamp(state?.lastCycleAt ?? null)}</span>
        </DevField>
        <DevField label="Total Cycles">
          <span className="text-sm text-[var(--dev-text)]">{state?.totalCycles ?? 0}</span>
        </DevField>
      </div>

      {order.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--dev-text-muted)]">Current Execution Order</h3>
          <ol className="mt-2 space-y-1">
            {order.map((item, index) => (
              <li key={item.project} className="flex items-center gap-2 text-sm text-[var(--dev-text)]">
                <span className="text-[var(--dev-text-muted)]">{index + 1}.</span>
                <span>{item.project}</span>
                <DevBadge tone={ELIGIBILITY_TONE[item.eligibility] ?? 'neutral'}>{item.eligibility}</DevBadge>
                <span className="text-xs text-[var(--dev-text-muted)]">score: {Math.round(item.priorityScore)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}
    </DevCard>
  )
}
