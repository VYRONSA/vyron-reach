'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { listAllDirectorStatuses, resolveEngineeringInboxItem, dismissEngineeringInboxItem, markEngineeringInboxItemRead } from '@/lib/dev/runtime/directorClient'
import type { DirectorRuntimeStatus, EngineeringInboxItem, InterventionReasonType, EngineeringInboxStatus } from '@/lib/dev/director/directorRuntimeTypes'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevBadge, DevButton, DevEmptyState, DevSkeleton } from './ui'
import { ReleaseDecisionModal } from './ReleaseDecisionModal'

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

/** Filters that map directly to a server-side field (reasonType/status) go through the paginated API — "large datasets must never be loaded entirely" holds for these. 'waitingForCeo'/'blocked' need a cross-reference against each item's owning project's live Director state (not a field the Inbox store itself has) and 'unread' is a small per-page boolean refinement — both stay a light client-side pass over the current page only, never over an unbounded full set. */
const SERVER_FILTER: Partial<Record<FilterId, { reasonType?: InterventionReasonType; status?: EngineeringInboxStatus }>> = {
  security: { reasonType: 'Security Review' },
  businessDecision: { reasonType: 'Business Decision Required' },
  approval: { reasonType: 'Approval Required' },
  completed: { status: 'Resolved' },
}

const SEVERITY_TONE: Record<EngineeringInboxItem['severity'], 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

const PAGE_SIZE = 15

type PagedResponse = { items: EngineeringInboxItem[]; page: number; pageSize: number; total: number; totalPages: number }

async function fetchPage(options: { page: number; filter: FilterId; search: string; archived: boolean }): Promise<PagedResponse> {
  const params = new URLSearchParams({ page: String(options.page), pageSize: String(PAGE_SIZE) })
  const server = SERVER_FILTER[options.filter]
  if (server?.reasonType) params.set('reasonType', server.reasonType)
  if (server?.status) params.set('status', server.status)
  if (options.search.trim()) params.set('search', options.search.trim())
  if (options.archived) params.set('archived', 'true')
  const res = await fetch(`/api/dev/director/inbox?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to load Engineering Inbox (${res.status})`)
  return res.json()
}

/**
 * The Global Engineering Inbox — aggregates every project's Engineering
 * Inbox in one place (route: /dev/inbox), since a CEO managing several
 * autonomous runs shouldn't have to check each project's own tab for
 * interruptions. Read-only + Approve/Reject actions only, same as the
 * per-project Command Centre — this view never executes anything either.
 *
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2): reads
 * through the paginated/searchable Inbox API — see fetchPage above — and
 * can switch to viewing the archive (see archiveClosedInboxItems in
 * engineeringInboxStore.ts) instead of the live queue.
 */
export function GlobalEngineeringInboxView() {
  const [data, setData] = useState<PagedResponse | null>(null)
  const [statuses, setStatuses] = useState<DirectorRuntimeStatus[]>([])
  const [filter, setFilter] = useState<FilterId>('all')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [releaseReviewItem, setReleaseReviewItem] = useState<EngineeringInboxItem | null>(null)

  const refresh = async () => {
    const [pageResult, allStatuses] = await Promise.all([fetchPage({ page, filter, search, archived }), listAllDirectorStatuses()])
    setData(pageResult)
    setStatuses(allStatuses)
    setHydrated(true)
  }

  useEffect(() => {
    refresh()
    // Fallback-only — the Real-Time Event Service (below) triggers an
    // immediate refetch whenever an inbox item opens or closes anywhere.
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, search, archived])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    categories: ['Engineering Inbox'],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(refresh, 250)
    },
  })

  const stateByProject = useMemo(() => new Map(statuses.map(s => [s.project, s.state])), [statuses])
  // PRA-P1-037 — the same fact isCurrentInboxBlocker (directorRuntimeStore.ts)
  // answers server-side, read here from the same DirectorRuntimeStatus
  // already fetched for stateByProject above, so this Open item can be
  // visually distinguished from an older/unrelated Open item for the same
  // project instead of every Open item looking identical.
  const blockerByProject = useMemo(() => new Map(statuses.map(s => [s.project, s.waitingInboxItemId])), [statuses])

  const visible = useMemo(() => {
    const items = data?.items ?? []
    switch (filter) {
      case 'waitingForCeo':
        return items.filter(i => stateByProject.get(i.project) === 'Waiting for CEO')
      case 'blocked':
        return items.filter(i => stateByProject.get(i.project) === 'Blocked')
      case 'unread':
        return items.filter(i => !i.read)
      default:
        return items // security/businessDecision/approval/completed/all already filtered server-side, see SERVER_FILTER
    }
  }, [data, filter, stateByProject])

  const handleView = async (item: EngineeringInboxItem) => {
    if (!item.read && !archived) await markEngineeringInboxItemRead(item.id)
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

  /**
   * PRA-P1-032 remediation — a "Release Go/Hold Required" item's generic
   * Approve/Reject buttons used to call only resolveEngineeringInboxItem,
   * which never touches Release Management at all. Deciding now happens in
   * ReleaseDecisionModal against the real decision endpoint; this only
   * clears the notification afterward, the same resolve call every other
   * item already uses.
   */
  const handleReleaseDecided = async () => {
    if (releaseReviewItem) await resolveEngineeringInboxItem(releaseReviewItem.id)
    setReleaseReviewItem(null)
    await refresh()
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-[var(--dev-accent)] text-white'
                : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setArchived(a => !a)
            setPage(1)
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            archived ? 'bg-[var(--dev-accent)] text-white' : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)]'
          }`}
        >
          {archived ? 'Viewing Archive' : 'View Archive'}
        </button>
        <input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search reason or recommended action..."
          className="ml-auto min-w-[220px] rounded-lg border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-3 py-1.5 text-xs text-[var(--dev-text)] placeholder:text-[var(--dev-text-faint)]"
        />
      </div>

      {visible.length === 0 ? (
        <DevEmptyState>No Engineering Inbox items match this filter.</DevEmptyState>
      ) : (
        <ul className="space-y-2">
          {visible.map(item => {
            const isBlocker = item.status === 'Open' && blockerByProject.get(item.project) === item.id
            return (
            <li
              key={item.id}
              className={`rounded-xl border p-4 ${
                isBlocker ? 'border-rose-500/50 ring-1 ring-rose-500/30' : item.read ? 'border-[var(--dev-border)]' : 'border-[var(--dev-accent)]/40'
              }`}
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
                  {isBlocker ? (
                    <DevBadge tone="danger">This is currently blocking execution</DevBadge>
                  ) : item.status === 'Open' && stateByProject.get(item.project) === 'Waiting for CEO' ? (
                    <span className="text-[11px] text-[var(--dev-text-faint)]">Not the active blocker</span>
                  ) : null}
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
              {item.status === 'Open' && !archived ? (
                item.reasonType === 'Release Go/Hold Required' ? (
                  <div className="mt-3">
                    <DevButton onClick={() => setReleaseReviewItem(item)}>Review Release</DevButton>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <DevButton onClick={() => handleResolve(item)} disabled={busyId === item.id}>
                      Approve (Resolve &amp; Resume)
                    </DevButton>
                    <DevButton variant="secondary" onClick={() => handleDismiss(item)} disabled={busyId === item.id}>
                      Reject (Dismiss)
                    </DevButton>
                  </div>
                )
              ) : null}
            </li>
            )
          })}
        </ul>
      )}

      {releaseReviewItem ? (
        <ReleaseDecisionModal
          project={releaseReviewItem.project}
          onClose={() => setReleaseReviewItem(null)}
          onDecided={handleReleaseDecided}
        />
      ) : null}

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
    </div>
  )
}
