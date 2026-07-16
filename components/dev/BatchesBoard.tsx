'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS } from '@/lib/dev/projectsData'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import {
  BATCH_STATUS_OPTIONS,
  createBatch,
  deleteBatch,
  getBatches,
  updateBatch,
  type Batch,
  type BatchStatus,
} from '@/lib/dev/batchesStorage'
import { decisionsForBatch } from '@/lib/dev/decisionsStorage'
import { debtForBatch } from '@/lib/dev/technicalDebtStorage'
import { recordRecentItem } from '@/lib/dev/recents'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'
import { useQueryParam } from './useQueryParam'

const STATUS_TONE: Record<BatchStatus, 'neutral' | 'info' | 'success'> = {
  Queued: 'neutral',
  Active: 'info',
  Complete: 'success',
}

function milestoneLabel(milestones: Milestone[], id: string) {
  const m = milestones.find(x => x.id === id)
  if (!m) return 'Unassigned'
  const project = PROJECTS.find(p => p.slug === m.project)
  return project ? `${m.title} — ${project.name}` : m.title
}

function emptyForm(milestoneFilter?: string) {
  return {
    batchNumber: '',
    milestone: milestoneFilter ?? '',
    objective: '',
    summary: '',
    completedTasks: '',
    lessonsLearned: '',
    claudePrompt: '',
    completionDate: '',
    status: 'Queued' as BatchStatus,
  }
}

export function BatchesBoard({ milestoneFilter, projectFilter }: { milestoneFilter?: string; projectFilter?: string }) {
  const { preferences, setPreferences } = useDevPreferences()
  const [batches, setBatches] = useState<Batch[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm(milestoneFilter))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const urlMilestoneFilter = useQueryParam('milestone')
  const [milestoneLinkFilter, setMilestoneLinkFilter] = useState('')
  useEffect(() => {
    if (!milestoneFilter && urlMilestoneFilter) setMilestoneLinkFilter(urlMilestoneFilter)
  }, [urlMilestoneFilter, milestoneFilter])

  const refresh = () => {
    setBatches(getBatches())
    setMilestones(getMilestones())
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const projectMilestoneIds = useMemo(
    () => (projectFilter ? new Set(milestones.filter(m => m.project === projectFilter).map(m => m.id)) : null),
    [milestones, projectFilter]
  )

  const visible = useMemo(() => {
    let list = batches
    if (milestoneFilter) list = list.filter(b => b.milestone === milestoneFilter)
    else if (milestoneLinkFilter) list = list.filter(b => b.milestone === milestoneLinkFilter)
    else if (projectMilestoneIds) list = list.filter(b => projectMilestoneIds.has(b.milestone))
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(b =>
        [b.batchNumber, b.objective, b.summary, b.lessonsLearned, b.claudePrompt, b.status].some(f =>
          f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [batches, milestoneFilter, milestoneLinkFilter, projectMilestoneIds, query])

  const highlighted = useFocusHighlight(visible.map(b => b.id))

  const availableMilestones = useMemo(
    () => (projectFilter ? milestones.filter(m => m.project === projectFilter) : milestones),
    [milestones, projectFilter]
  )

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(milestoneFilter))
    setShowForm(true)
  }

  const startEdit = (b: Batch) => {
    setEditingId(b.id)
    recordRecentItem({ type: 'batch', id: b.id, label: `Batch ${b.batchNumber}`, href: `/dev/batches?focus=${b.id}` })
    setForm({
      batchNumber: b.batchNumber,
      milestone: b.milestone,
      objective: b.objective,
      summary: b.summary,
      completedTasks: b.completedTasks,
      lessonsLearned: b.lessonsLearned,
      claudePrompt: b.claudePrompt,
      completionDate: b.completionDate,
      status: b.status,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.batchNumber.trim()) return
    if (editingId) {
      updateBatch(editingId, form)
    } else {
      createBatch(form)
    }
    setShowForm(false)
    setForm(emptyForm(milestoneFilter))
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteBatch(id)
    refresh()
  }

  const togglePin = (id: string) => {
    const pinned = preferences.pinnedBatches.includes(id)
      ? preferences.pinnedBatches.filter(x => x !== id)
      : [...preferences.pinnedBatches, id]
    setPreferences({ pinnedBatches: pinned })
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading batches...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search batches..."
          aria-label="Search batches"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New batch'}</DevButton>
      </div>

      {milestoneLinkFilter && !milestoneFilter ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-3 py-2 text-xs text-[var(--dev-accent)]">
          <span>Filtered to {milestoneLabel(milestones, milestoneLinkFilter)}</span>
          <button type="button" onClick={() => setMilestoneLinkFilter('')} className="ml-auto font-medium hover:underline">
            Clear
          </button>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DevInput
              value={form.batchNumber}
              onChange={e => setForm(prev => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Batch number"
              required
            />
            {!milestoneFilter ? (
              <DevSelect
                value={form.milestone}
                onChange={e => setForm(prev => ({ ...prev, milestone: e.target.value }))}
                className="sm:col-span-1"
              >
                <option value="">Unassigned</option>
                {availableMilestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {milestoneLabel(milestones, m.id)}
                  </option>
                ))}
              </DevSelect>
            ) : null}
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as BatchStatus }))}
            >
              {BATCH_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </DevSelect>
          </div>
          <DevTextarea
            value={form.objective}
            onChange={e => setForm(prev => ({ ...prev, objective: e.target.value }))}
            placeholder="Objective"
            rows={2}
          />
          <DevTextarea
            value={form.summary}
            onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Summary"
            rows={2}
          />
          <DevTextarea
            value={form.completedTasks}
            onChange={e => setForm(prev => ({ ...prev, completedTasks: e.target.value }))}
            placeholder="Completed tasks"
            rows={2}
          />
          <DevTextarea
            value={form.lessonsLearned}
            onChange={e => setForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
            placeholder="Lessons learned"
            rows={2}
          />
          <DevTextarea
            value={form.claudePrompt}
            onChange={e => setForm(prev => ({ ...prev, claudePrompt: e.target.value }))}
            placeholder="Claude prompt used for this batch"
            rows={3}
          />
          <div>
            <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Completion date</label>
            <DevInput
              type="date"
              value={form.completionDate}
              onChange={e => setForm(prev => ({ ...prev, completionDate: e.target.value }))}
              className="sm:w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Create batch'}</DevButton>
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
        <DevEmptyState>No batches recorded{query ? ' matching your search' : ''} yet.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(b => {
            const decisionCount = decisionsForBatch(b.id).length
            const debtCount = debtForBatch(b.id).length
            const pinned = preferences.pinnedBatches.includes(b.id)
            return (
              <div
                key={b.id}
                id={`record-${b.id}`}
                className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                  highlighted === b.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                  >
                    Batch {b.batchNumber}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePin(b.id)}
                      aria-label={pinned ? 'Unpin batch' : 'Pin batch'}
                      className={`text-base leading-none ${pinned ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
                    >
                      &#9733;
                    </button>
                    <DevBadge tone={STATUS_TONE[b.status]}>{b.status}</DevBadge>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      aria-label="Delete batch"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                {b.objective ? <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{b.objective}</p> : null}
                {b.summary ? (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--dev-text-faint)]">
                    <span className="font-medium">Summary:</span> {b.summary}
                  </p>
                ) : null}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dev-text-faint)]">
                  {!milestoneFilter && b.milestone ? (
                    <Link href={`/dev/milestones?focus=${b.milestone}`} className="hover:text-[var(--dev-accent)]">
                      {milestoneLabel(milestones, b.milestone)}
                    </Link>
                  ) : !milestoneFilter ? (
                    <span>Unassigned</span>
                  ) : null}
                  {b.completionDate ? <span>Completed {b.completionDate}</span> : null}
                  <Link href={`/dev/decisions?batch=${b.id}`} className="hover:text-[var(--dev-accent)]">
                    {decisionCount} decisions
                  </Link>
                  <Link href={`/dev/technical-debt?batch=${b.id}`} className="hover:text-[var(--dev-accent)]">
                    {debtCount} debt items
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
