'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  type JournalEntry,
} from '@/lib/dev/journalStorage'
import { decisionsForJournalEntry } from '@/lib/dev/decisionsStorage'
import { recordRecentItem } from '@/lib/dev/recents'
import { DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(projectFilter?: string) {
  return {
    date: todayISO(),
    project: projectFilter ?? '',
    summary: '',
    wins: '',
    problems: '',
    ideas: '',
    nextActions: '',
  }
}

export function JournalBoard({ projectFilter }: { projectFilter?: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [decisionCounts, setDecisionCounts] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(projectFilter))

  const refresh = () => {
    const all = getJournalEntries()
    setEntries(all)
    const counts: Record<string, number> = {}
    for (const e of all) counts[e.id] = decisionsForJournalEntry(e.id).length
    setDecisionCounts(counts)
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = projectFilter ? entries.filter(e => e.project === projectFilter) : entries
    if (q) {
      list = list.filter(e =>
        [e.summary, e.wins, e.problems, e.ideas, e.nextActions, e.date, getProjectName(e.project)].some(f =>
          f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [entries, projectFilter, query])

  const highlighted = useFocusHighlight(visible.map(e => e.id))

  const startCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm(projectFilter), date: todayISO() })
    setShowForm(true)
  }

  const startEdit = (e: JournalEntry) => {
    setEditingId(e.id)
    recordRecentItem({
      type: 'journal',
      id: e.id,
      label: `${e.date} — ${e.summary || 'Untitled entry'}`,
      href: `/dev/journal?focus=${e.id}`,
    })
    setForm({
      date: e.date,
      project: e.project,
      summary: e.summary,
      wins: e.wins,
      problems: e.problems,
      ideas: e.ideas,
      nextActions: e.nextActions,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.summary.trim()) return
    if (editingId) {
      updateJournalEntry(editingId, form)
    } else {
      createJournalEntry(form)
    }
    setShowForm(false)
    setForm(emptyForm(projectFilter))
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteJournalEntry(id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading journal...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search journal entries..."
          aria-label="Search journal entries"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New entry'}</DevButton>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DevInput type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
            {!projectFilter ? (
              <DevSelect value={form.project} onChange={e => setForm(prev => ({ ...prev, project: e.target.value }))}>
                <option value="">No project</option>
                {PROJECTS.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </DevSelect>
            ) : null}
          </div>
          <DevTextarea
            value={form.summary}
            onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Summary"
            rows={2}
            required
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DevTextarea value={form.wins} onChange={e => setForm(prev => ({ ...prev, wins: e.target.value }))} placeholder="Wins" rows={2} />
            <DevTextarea value={form.problems} onChange={e => setForm(prev => ({ ...prev, problems: e.target.value }))} placeholder="Problems" rows={2} />
            <DevTextarea value={form.ideas} onChange={e => setForm(prev => ({ ...prev, ideas: e.target.value }))} placeholder="Ideas" rows={2} />
            <DevTextarea
              value={form.nextActions}
              onChange={e => setForm(prev => ({ ...prev, nextActions: e.target.value }))}
              placeholder="Next actions"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Save entry'}</DevButton>
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
        <DevEmptyState>No journal entries{query ? ' match your search' : ' yet'}.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(entry => {
            const decisionCount = decisionCounts[entry.id] ?? 0
            return (
              <div
                key={entry.id}
                id={`record-${entry.id}`}
                className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                  highlighted === entry.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-[var(--dev-text-faint)]">
                      {entry.date} &middot; {getProjectName(entry.project)}
                    </div>
                    <button type="button" onClick={() => startEdit(entry)} className="mt-1 text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                      {entry.summary}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete entry"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    &times;
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[var(--dev-text-muted)] sm:grid-cols-2">
                  {entry.wins ? (
                    <div>
                      <span className="font-medium text-[var(--dev-text)]">Wins:</span> {entry.wins}
                    </div>
                  ) : null}
                  {entry.problems ? (
                    <div>
                      <span className="font-medium text-[var(--dev-text)]">Problems:</span> {entry.problems}
                    </div>
                  ) : null}
                  {entry.ideas ? (
                    <div>
                      <span className="font-medium text-[var(--dev-text)]">Ideas:</span> {entry.ideas}
                    </div>
                  ) : null}
                  {entry.nextActions ? (
                    <div>
                      <span className="font-medium text-[var(--dev-text)]">Next:</span> {entry.nextActions}
                    </div>
                  ) : null}
                </div>
                {decisionCount > 0 ? (
                  <div className="mt-2.5 text-[11px] text-[var(--dev-text-faint)]">
                    <Link href={`/dev/decisions?journal=${entry.id}`} className="hover:text-[var(--dev-accent)]">
                      {decisionCount} linked decision{decisionCount === 1 ? '' : 's'}
                    </Link>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
