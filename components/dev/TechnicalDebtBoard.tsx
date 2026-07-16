'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import {
  createTechnicalDebt,
  deleteTechnicalDebt,
  DEBT_PRIORITY_OPTIONS,
  DEBT_STATUS_OPTIONS,
  getTechnicalDebt,
  updateTechnicalDebt,
  type DebtPriority,
  type DebtStatus,
  type TechnicalDebt,
} from '@/lib/dev/technicalDebtStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'
import { useQueryParam } from './useQueryParam'

const PRIORITY_TONE: Record<DebtPriority, 'neutral' | 'warning' | 'danger'> = {
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
}

const STATUS_TONE: Record<DebtStatus, 'danger' | 'info' | 'success'> = {
  Open: 'danger',
  'In Progress': 'info',
  Resolved: 'success',
}

function batchLabel(batches: Batch[], id: string) {
  const b = batches.find(x => x.id === id)
  return b ? `Batch ${b.batchNumber}` : 'Batch'
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(projectFilter?: string) {
  return {
    title: '',
    description: '',
    project: projectFilter ?? '',
    relatedBatch: '',
    priority: 'Medium' as DebtPriority,
    estimatedEffort: '',
    createdDate: todayISO(),
    resolvedDate: '',
    status: 'Open' as DebtStatus,
  }
}

export function TechnicalDebtBoard({ projectFilter }: { projectFilter?: string }) {
  const [items, setItems] = useState<TechnicalDebt[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm(projectFilter))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const urlBatchFilter = useQueryParam('batch')
  const [batchLinkFilter, setBatchLinkFilter] = useState('')
  useEffect(() => {
    if (urlBatchFilter) setBatchLinkFilter(urlBatchFilter)
  }, [urlBatchFilter])

  const refresh = () => {
    setItems(getTechnicalDebt())
    setBatches(getBatches())
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(() => {
    let list = projectFilter ? items.filter(d => d.project === projectFilter) : items
    if (batchLinkFilter) list = list.filter(d => d.relatedBatch === batchLinkFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(d =>
        [d.title, d.description, d.estimatedEffort, d.priority, d.status, getProjectName(d.project)].some(f =>
          f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [items, projectFilter, batchLinkFilter, query])

  const highlighted = useFocusHighlight(visible.map(d => d.id))

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(projectFilter))
    setShowForm(true)
  }

  const startEdit = (d: TechnicalDebt) => {
    setEditingId(d.id)
    setForm({
      title: d.title,
      description: d.description,
      project: d.project,
      relatedBatch: d.relatedBatch,
      priority: d.priority,
      estimatedEffort: d.estimatedEffort,
      createdDate: d.createdDate,
      resolvedDate: d.resolvedDate,
      status: d.status,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      updateTechnicalDebt(editingId, form)
    } else {
      createTechnicalDebt(form)
    }
    setShowForm(false)
    setForm(emptyForm(projectFilter))
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteTechnicalDebt(id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading technical debt...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search technical debt..."
          aria-label="Search technical debt"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New item'}</DevButton>
      </div>

      {batchLinkFilter ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-3 py-2 text-xs text-[var(--dev-accent)]">
          <span>Filtered to {batchLabel(batches, batchLinkFilter)}</span>
          <button type="button" onClick={() => setBatchLinkFilter('')} className="ml-auto font-medium hover:underline">
            Clear
          </button>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4"
        >
          <DevInput
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            required
          />
          <DevTextarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <DevInput
              value={form.estimatedEffort}
              onChange={e => setForm(prev => ({ ...prev, estimatedEffort: e.target.value }))}
              placeholder="Estimated effort, e.g. 2 days"
            />
          </div>
          <DevSelect
            value={form.relatedBatch}
            onChange={e => setForm(prev => ({ ...prev, relatedBatch: e.target.value }))}
          >
            <option value="">No linked batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                Batch {b.batchNumber}
              </option>
            ))}
          </DevSelect>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <DevSelect
              value={form.priority}
              onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as DebtPriority }))}
            >
              {DEBT_PRIORITY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </DevSelect>
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as DebtStatus }))}
            >
              {DEBT_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </DevSelect>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Created</label>
              <DevInput
                type="date"
                value={form.createdDate}
                onChange={e => setForm(prev => ({ ...prev, createdDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Resolved</label>
              <DevInput
                type="date"
                value={form.resolvedDate}
                onChange={e => setForm(prev => ({ ...prev, resolvedDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Record debt'}</DevButton>
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
        <DevEmptyState>No technical debt recorded{query ? ' matching your search' : ''} yet.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(d => (
            <div
              key={d.id}
              id={`record-${d.id}`}
              className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                highlighted === d.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                >
                  {d.title}
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <DevBadge tone={PRIORITY_TONE[d.priority]}>{d.priority}</DevBadge>
                  <DevBadge tone={STATUS_TONE[d.status]}>{d.status}</DevBadge>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    aria-label="Delete debt item"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {d.description ? <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{d.description}</p> : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dev-text-faint)]">
                {!projectFilter ? <span>{getProjectName(d.project)}</span> : null}
                {d.estimatedEffort ? <span>Effort: {d.estimatedEffort}</span> : null}
                {d.createdDate ? <span>Created {d.createdDate}</span> : null}
                {d.resolvedDate ? <span>Resolved {d.resolvedDate}</span> : null}
                {d.relatedBatch ? (
                  <Link href={`/dev/batches?focus=${d.relatedBatch}`} className="hover:text-[var(--dev-accent)]">
                    {batchLabel(batches, d.relatedBatch)}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
