'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  listEngineeringInbox,
  listAllDirectorStatuses,
  resolveEngineeringInboxItem,
  dismissEngineeringInboxItem,
  markEngineeringInboxItemRead,
} from '@/lib/dev/runtime/directorClient'
import type { DirectorRuntimeStatus, EngineeringInboxItem } from '@/lib/dev/director/directorRuntimeTypes'
import { DevBadge, DevButton, DevEmptyState, DevSkeleton } from './ui'

type FilterId = 'all' | 'waitingForCeo' | 'blocked' | 'security' | 'businessDecision' | 'approval' | 'completed' | 'unread'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'waitingForCeo', label: 'Waiting for CEO' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'security', label: 'Security' },
  { id: 'businessDecision', label: 'Business Decision' },
  { id: 'approval', label: 'Approval' },
  { id: 'completed', label: 'Completed' },
  { id: 'unread', label: 'Unread' },
]

const SEVERITY_TONE: Record<EngineeringInboxItem['severity'], 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/**
 * The Global Engineering Inbox — aggregates every project's Engineering
 * Inbox in one place (route: /dev/inbox), since a CEO managing several
 * autonomous runs shouldn't have to check each project's own tab for
 * interruptions. Read-only + Approve/Reject actions only, same as the
 * per-project Command Centre — this view never executes anything either.
 */
export function GlobalEngineeringInboxView() {
  const [items, setItems] = useState<EngineeringInboxItem[]>([])
  const [statuses, setStatuses] = useState<DirectorRuntimeStatus[]>([])
  const [filter, setFilter] = useState<FilterId>('all')
  const [hydrated, setHydrated] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = async () => {
    const [allItems, allStatuses] = await Promise.all([listEngineeringInbox(), listAllDirectorStatuses()])
    setItems(allItems)
    setStatuses(allStatuses)
    setHydrated(true)
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [])

  const stateByProject = useMemo(() => new Map(statuses.map(s => [s.project, s.state])), [statuses])

  const visible = useMemo(() => {
    switch (filter) {
      case 'waitingForCeo':
        return items.filter(i => stateByProject.get(i.project) === 'Waiting for CEO')
      case 'blocked':
        return items.filter(i => stateByProject.get(i.project) === 'Blocked')
      case 'security':
        return items.filter(i => i.reasonType === 'Security Review')
      case 'businessDecision':
        return items.filter(i => i.reasonType === 'Business Decision Required')
      case 'approval':
        return items.filter(i => i.reasonType === 'Approval Required')
      case 'completed':
        return items.filter(i => i.status === 'Resolved')
      case 'unread':
        return items.filter(i => !i.read)
      default:
        return items
    }
  }, [items, filter, stateByProject])

  const handleView = async (item: EngineeringInboxItem) => {
    if (!item.read) await markEngineeringInboxItemRead(item.id)
    await refresh()
  }

  const handleResolve = async (item: EngineeringInboxItem) => {
    setBusyId(item.id)
    try {
      await resolveEngineeringInboxItem(item.id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const handleDismiss = async (item: EngineeringInboxItem) => {
    setBusyId(item.id)
    try {
      await dismissEngineeringInboxItem(item.id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (!hydrated) {
    return (
      <div className="space-y-2">
        <DevSkeleton className="h-16 w-full" />
        <DevSkeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-[var(--dev-accent)] text-white'
                : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <DevEmptyState>No Engineering Inbox items match this filter.</DevEmptyState>
      ) : (
        <ul className="space-y-2">
          {visible.map(item => (
            <li
              key={item.id}
              className={`rounded-xl border p-4 ${item.read ? 'border-[var(--dev-border)]' : 'border-[var(--dev-accent)]/40'}`}
              onMouseEnter={() => handleView(item)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!item.read ? <span className="h-2 w-2 rounded-full bg-[var(--dev-accent)]" /> : null}
                  <DevBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</DevBadge>
                  <span className="text-sm font-medium text-[var(--dev-text)]">{item.reasonType}</span>
                  <DevBadge tone={item.status === 'Resolved' ? 'success' : item.status === 'Dismissed' ? 'neutral' : 'warning'}>
                    {item.status}
                  </DevBadge>
                </div>
                <span className="text-[11px] text-[var(--dev-text-faint)]">
                  {item.project}
                  {item.batchNumber ? ` — Batch ${item.batchNumber}` : ''} · {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--dev-text-muted)]">{item.reason}</p>
              <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                <span className="font-medium">Recommended:</span> {item.recommendedAction}
              </p>
              {item.status === 'Open' ? (
                <div className="mt-3 flex items-center gap-2">
                  <DevButton onClick={() => handleResolve(item)} disabled={busyId === item.id}>
                    Approve (Resolve &amp; Resume)
                  </DevButton>
                  <DevButton variant="secondary" onClick={() => handleDismiss(item)} disabled={busyId === item.id}>
                    Reject (Dismiss)
                  </DevButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
