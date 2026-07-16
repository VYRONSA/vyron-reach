'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  MILESTONE_STATUS_OPTIONS,
  updateMilestone,
  type Milestone,
  type MilestoneStatus,
} from '@/lib/dev/milestonesStorage'
import { batchesForMilestone } from '@/lib/dev/batchesStorage'
import { getDecisions } from '@/lib/dev/decisionsStorage'
import { releasesForMilestone } from '@/lib/dev/releasesStorage'
import { risksForMilestone } from '@/lib/dev/risksStorage'
import { recordRecentItem } from '@/lib/dev/recents'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'

const STATUS_TONE: Record<MilestoneStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  Upcoming: 'neutral',
  'In Progress': 'info',
  'At Risk': 'warning',
  Complete: 'success',
}

function emptyForm(projectFilter?: string) {
  return {
    project: projectFilter ?? '',
    title: '',
    description: '',
    startDate: '',
    targetDate: '',
    progress: 0,
    status: 'Upcoming' as MilestoneStatus,
  }
}

export function MilestonesBoard({ projectFilter }: { projectFilter?: string }) {
  const { preferences, setPreferences } = useDevPreferences()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [decisionCounts, setDecisionCounts] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm(projectFilter))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const refresh = () => {
    setMilestones(getMilestones())
    const counts: Record<string, number> = {}
    for (const d of getDecisions()) {
      if (!d.relatedMilestone) continue
      counts[d.relatedMilestone] = (counts[d.relatedMilestone] ?? 0) + 1
    }
    setDecisionCounts(counts)
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(() => {
    let list = projectFilter ? milestones.filter(m => m.project === projectFilter) : milestones
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        [m.title, m.description, m.status, getProjectName(m.project)].some(f => f.toLowerCase().includes(q))
      )
    }
    return [...list].sort((a, b) => (a.targetDate || a.createdAt) < (b.targetDate || b.createdAt) ? -1 : 1)
  }, [milestones, projectFilter, query])

  const highlighted = useFocusHighlight(visible.map(m => m.id))

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(projectFilter))
    setShowForm(true)
  }

  const startEdit = (m: Milestone) => {
    setEditingId(m.id)
    recordRecentItem({ type: 'milestone', id: m.id, label: m.title, href: `/dev/milestones?focus=${m.id}` })
    setForm({
      project: m.project,
      title: m.title,
      description: m.description,
      startDate: m.startDate,
      targetDate: m.targetDate,
      progress: m.progress,
      status: m.status,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      updateMilestone(editingId, form)
    } else {
      createMilestone(form)
    }
    setShowForm(false)
    setForm(emptyForm(projectFilter))
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteMilestone(id)
    refresh()
  }

  const togglePin = (id: string) => {
    const pinned = preferences.pinnedMilestones.includes(id)
      ? preferences.pinnedMilestones.filter(x => x !== id)
      : [...preferences.pinnedMilestones, id]
    setPreferences({ pinnedMilestones: pinned })
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading milestones...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search milestones..."
          aria-label="Search milestones"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New milestone'}</DevButton>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4"
        >
          <DevInput
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Milestone title"
            required
          />
          <DevTextarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Start date</label>
              <DevInput
                type="date"
                value={form.startDate}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Target date</label>
              <DevInput
                type="date"
                value={form.targetDate}
                onChange={e => setForm(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {!projectFilter ? (
              <DevSelect
                value={form.project}
                onChange={e => setForm(prev => ({ ...prev, project: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {PROJECTS.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </DevSelect>
            ) : null}
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as MilestoneStatus }))}
            >
              {MILESTONE_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </DevSelect>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Progress %</label>
              <DevInput
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Create milestone'}</DevButton>
            <DevButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancel
            </DevButton>
          </div>
        </form>
      ) : null}

      {visible.length === 0 ? (
        <DevEmptyState>No milestones recorded{query ? ' matching your search' : ''} yet.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(m => {
            const batchCount = batchesForMilestone(m.id).length
            const releaseCount = releasesForMilestone(m.id).length
            const riskCount = risksForMilestone(m.id).length
            const decisionCount = decisionCounts[m.id] ?? 0
            const pinned = preferences.pinnedMilestones.includes(m.id)
            return (
              <div
                key={m.id}
                id={`record-${m.id}`}
                className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                  highlighted === m.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                  >
                    {m.title}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePin(m.id)}
                      aria-label={pinned ? 'Unpin milestone' : 'Pin milestone'}
                      className={`text-base leading-none ${pinned ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
                    >
                      &#9733;
                    </button>
                    <DevBadge tone={STATUS_TONE[m.status]}>{m.status}</DevBadge>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      aria-label="Delete milestone"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                {m.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{m.description}</p>
                ) : null}

                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dev-surface-hover)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dev-text-faint)]">
                  {!projectFilter ? <span>{getProjectName(m.project)}</span> : null}
                  {m.startDate ? <span>Start {m.startDate}</span> : null}
                  {m.targetDate ? <span>Target {m.targetDate}</span> : null}
                  <span className="font-mono">{m.progress}%</span>
                  <Link href={`/dev/batches?milestone=${m.id}`} className="hover:text-[var(--dev-accent)]">
                    {batchCount} batches
                  </Link>
                  <Link href={`/dev/decisions?milestone=${m.id}`} className="hover:text-[var(--dev-accent)]">
                    {decisionCount} decisions
                  </Link>
                  <Link href={`/dev/risks?milestone=${m.id}`} className="hover:text-[var(--dev-accent)]">
                    {riskCount} risks
                  </Link>
                  <span>{releaseCount} releases</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
