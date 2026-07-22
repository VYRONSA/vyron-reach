'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { InAppNotification } from '@/lib/dev/notifications/inAppNotificationStore'
import type { NotificationSeverity } from '@/lib/dev/notifications/notificationTypes'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevEmptyState } from './ui'

const SEVERITY_TONE: Record<InAppNotification['severity'], 'danger' | 'warning' | 'info' | 'neutral' | 'success'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
  Info: 'success',
}

const SEVERITY_FILTERS: { id: NotificationSeverity | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Critical', label: 'Critical' },
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
  { id: 'Info', label: 'Info' },
]

const PAGE_SIZE = 10

type PagedResponse = {
  items: InAppNotification[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

async function fetchPage(options: { page: number; severity: NotificationSeverity | 'all'; search: string; archived: boolean }): Promise<PagedResponse> {
  const params = new URLSearchParams({ page: String(options.page), pageSize: String(PAGE_SIZE) })
  if (options.severity !== 'all') params.set('severity', options.severity)
  if (options.search.trim()) params.set('search', options.search.trim())
  if (options.archived) params.set('archived', 'true')
  const res = await fetch(`/api/dev/notifications?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`)
  return res.json()
}

async function markRead(id: string): Promise<void> {
  await fetch('/api/dev/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
}

/**
 * The dashboard's view of every notification the Notification Service
 * has raised (any type — Scheduler, Escalation, Director, ...), across
 * every project — the same In-App provider record every other producer
 * in this app already writes to (lib/dev/notifications/providers/
 * inAppNotificationProvider.ts), just rendered live instead of requiring
 * a page reload.
 *
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2): server-side
 * paginated, filtered by severity, searched by title/message, and can
 * switch to viewing the archive (notifications retention has already
 * moved out of the live store — see archiveReadNotifications in
 * inAppNotificationStore.ts) — never loads the full notification log in
 * one response.
 */
export function NotificationsPanel() {
  const [data, setData] = useState<PagedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState<NotificationSeverity | 'all'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)

  const refresh = () => {
    fetchPage({ page, severity, search, archived })
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load notifications.'))
  }

  useEffect(() => {
    refresh()
    // Fallback-only — the Real-Time Event Service (below) triggers an
    // immediate refetch whenever a delivery is queued or changes status.
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, severity, search, archived])

  // Debounces the search box itself (typing), separate from the
  // dashboard-event debounce below — two independent reasons to coalesce
  // rapid triggers into one fetch.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    categories: ['Notification Delivery'],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(refresh, 250)
    },
  })

  const handleRead = async (item: InAppNotification) => {
    if (item.read || archived) return
    setBusyId(item.id)
    try {
      await markRead(item.id)
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  const items = useMemo(() => data?.items ?? [], [data])

  return (
    <DevCard>
      <DevCardHeader
        title="Notifications"
        badge={
          <button
            type="button"
            onClick={() => {
              setArchived(a => !a)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              archived ? 'bg-[var(--dev-accent)] text-white' : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)]'
            }`}
          >
            {archived ? 'Viewing Archive' : 'View Archive'}
          </button>
        }
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {SEVERITY_FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setSeverity(f.id)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              severity === f.id ? 'bg-[var(--dev-accent)] text-white' : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search title or message..."
          className="ml-auto min-w-[200px] rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-1.5 text-xs text-[var(--dev-text)] placeholder:text-[var(--dev-text-faint)]"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      {items.length === 0 ? (
        <DevEmptyState>{archived ? 'No archived notifications match this filter.' : 'No notifications match this filter.'}</DevEmptyState>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map(item => (
            <li
              key={item.id}
              className={`rounded-lg border p-3 ${item.read ? 'border-[var(--dev-border)]' : 'border-[var(--dev-accent)]/40'}`}
              onMouseEnter={() => handleRead(item)}
            >
              <div className="flex flex-wrap items-center gap-2">
                {!item.read ? <span className="h-2 w-2 rounded-full bg-[var(--dev-accent)]" /> : null}
                <DevBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</DevBadge>
                <span className="text-sm font-medium text-[var(--dev-text)]">{item.title}</span>
                <span className="text-[11px] text-[var(--dev-text-faint)]">
                  {item.project === '*' ? 'All projects' : item.project} · {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--dev-text-muted)]">{item.message}</p>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <DevButton variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={data.page <= 1}>
            Previous
          </DevButton>
          <span className="text-xs text-[var(--dev-text-faint)]">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </span>
          <DevButton variant="secondary" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={data.page >= data.totalPages}>
            Next
          </DevButton>
        </div>
      ) : null}
    </DevCard>
  )
}
