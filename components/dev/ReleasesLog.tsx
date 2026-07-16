'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import { getMilestones } from '@/lib/dev/milestonesStorage'
import { createRelease, deleteRelease, getReleases, type Release } from '@/lib/dev/releasesStorage'
import { DevButton, DevCard, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'

function emptyForm(projectFilter?: string) {
  return { version: '', project: projectFilter ?? '', relatedMilestone: '', date: '', notes: '' }
}

export function ReleasesLog({ projectFilter }: { projectFilter?: string }) {
  const [releases, setReleases] = useState<Release[]>([])
  const [milestoneTitles, setMilestoneTitles] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)
  const [form, setForm] = useState(emptyForm(projectFilter))
  const [showForm, setShowForm] = useState(false)

  const refresh = () => {
    setReleases(getReleases())
    const titles: Record<string, string> = {}
    for (const m of getMilestones()) titles[m.id] = m.title
    setMilestoneTitles(titles)
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const sorted = useMemo(() => {
    const list = projectFilter ? releases.filter(r => r.project === projectFilter) : releases
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [releases, projectFilter])

  const highlighted = useFocusHighlight(sorted.map(r => r.id))

  const milestoneOptions = useMemo(
    () => getMilestones().filter(m => !form.project || m.project === form.project),
    [form.project]
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.version.trim()) return
    createRelease(form)
    setForm(emptyForm(projectFilter))
    setShowForm(false)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteRelease(id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading releases...</div>

  return (
    <DevCard eyebrow="Shipped" title="Release History">
      <div className="mt-3">
        <DevButton onClick={() => setShowForm(v => !v)} variant="secondary">
          {showForm ? 'Cancel' : 'Log a release'}
        </DevButton>

        {showForm ? (
          <form
            onSubmit={handleSubmit}
            className="mt-3 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface-hover)] p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DevInput
                value={form.version}
                onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))}
                placeholder="Version, e.g. v1.2.0"
                required
              />
              <DevInput
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!projectFilter ? (
                <DevSelect
                  value={form.project}
                  onChange={e => setForm(prev => ({ ...prev, project: e.target.value, relatedMilestone: '' }))}
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
                value={form.relatedMilestone}
                onChange={e => setForm(prev => ({ ...prev, relatedMilestone: e.target.value }))}
              >
                <option value="">No linked milestone</option>
                {milestoneOptions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </DevSelect>
            </div>
            <DevTextarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Release notes"
              rows={2}
            />
            <DevButton type="submit">Log release</DevButton>
          </form>
        ) : null}

        <div className="mt-3">
          {sorted.length === 0 ? (
            <DevEmptyState>No releases logged yet.</DevEmptyState>
          ) : (
            <div className="space-y-2">
              {sorted.map(r => (
                <div
                  key={r.id}
                  id={`record-${r.id}`}
                  className={`scroll-mt-24 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition-shadow duration-500 ${
                    highlighted === r.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--dev-text)]">{r.version}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--dev-text-faint)]">
                      {!projectFilter && r.project ? <span>{getProjectName(r.project)}</span> : null}
                      {r.relatedMilestone ? <span>{milestoneTitles[r.relatedMilestone] ?? 'Milestone'}</span> : null}
                      {r.date ? <span>{r.date}</span> : null}
                    </div>
                    {r.notes ? <p className="mt-1 text-xs text-[var(--dev-text-muted)]">{r.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label="Delete release"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DevCard>
  )
}
