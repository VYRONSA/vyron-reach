'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getProjects, getProjectName } from '@/lib/dev/projectsData'
import { ACTIVITY_CATEGORIES, getActivityEvents, type ActivityCategory, type ActivityEvent } from '@/lib/dev/activityFeed'
import { DevBadge, DevEmptyState, DevInput, DevSelect } from './ui'

const CATEGORY_TONE: Record<ActivityCategory, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Journal: 'neutral',
  Queue: 'info',
  Milestones: 'info',
  Batches: 'info',
  Releases: 'success',
  Decisions: 'neutral',
  Risks: 'danger',
  'Technical Debt': 'warning',
  Prompts: 'neutral',
}

function formatDate(value: string) {
  if (!value) return ''
  const asDate = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  if (Number.isNaN(asDate.getTime())) return value
  return asDate.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: value.length > 10 ? '2-digit' : undefined, minute: value.length > 10 ? '2-digit' : undefined })
}

export function ActivityTimeline() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [project, setProject] = useState('')
  const [categories, setCategories] = useState<Set<ActivityCategory>>(new Set(ACTIVITY_CATEGORIES))
  const [status, setStatus] = useState<'All' | 'Open' | 'Resolved'>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setEvents(getActivityEvents())
    setHydrated(true)
  }, [])

  const toggleCategory = (cat: ActivityCategory) => {
    setCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const visible = useMemo(() => {
    return events.filter(e => {
      if (project && e.project !== project) return false
      if (!categories.has(e.category)) return false
      if (status !== 'All' && e.bucket !== status) return false
      const day = e.date.slice(0, 10)
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false
      return true
    })
  }, [events, project, categories, status, dateFrom, dateTo])

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading activity...</div>

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3">
        <DevSelect value={project} onChange={e => setProject(e.target.value)} aria-label="Filter by project" className="sm:w-44">
          <option value="">All projects</option>
          {getProjects().map(p => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </DevSelect>

        <div className="flex items-center gap-1.5">
          <DevInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="From date" className="w-36" />
          <span className="text-xs text-[var(--dev-text-faint)]">to</span>
          <DevInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="To date" className="w-36" />
        </div>

        <div className="flex gap-1 rounded-lg border border-[var(--dev-border-strong)] p-1">
          {(['All', 'Open', 'Resolved'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                status === s ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                categories.has(cat)
                  ? 'border-[var(--dev-accent)]/40 bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                  : 'border-[var(--dev-border-strong)] text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <DevEmptyState>Nothing matches these filters yet.</DevEmptyState>
      ) : (
        <div className="relative space-y-0 border-l border-[var(--dev-border)] pl-5">
          {visible.map(event => (
            <Link
              key={`${event.category}-${event.id}`}
              href={event.href}
              className="group relative block py-2.5 pl-3 -ml-[21px] before:absolute before:left-[-21px] before:top-[19px] before:h-2 before:w-2 before:-translate-x-1/2 before:rounded-full before:bg-[var(--dev-border-strong)] before:transition-colors hover:before:bg-[var(--dev-accent)]"
            >
              <div className="rounded-xl border border-transparent px-3 py-2.5 transition-colors group-hover:border-[var(--dev-border)] group-hover:bg-[var(--dev-surface)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <DevBadge tone={CATEGORY_TONE[event.category]}>{event.category}</DevBadge>
                    <span className="truncate text-sm text-[var(--dev-text)]">{event.title}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--dev-text-faint)]">{formatDate(event.date)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--dev-text-faint)]">
                  {event.project ? <span>{getProjectName(event.project)}</span> : null}
                  <span className={event.bucket === 'Open' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}>
                    {event.bucket}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
