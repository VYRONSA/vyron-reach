'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import {
  createRisk,
  deleteRisk,
  getRisks,
  RISK_LEVEL_OPTIONS,
  RISK_STATUS_OPTIONS,
  updateRisk,
  type Risk,
  type RiskLevel,
  type RiskStatus,
} from '@/lib/dev/risksStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'
import { useQueryParam } from './useQueryParam'

const SEVERITY_TONE: Record<RiskLevel, 'neutral' | 'warning' | 'danger'> = {
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
}

const STATUS_TONE: Record<RiskStatus, 'danger' | 'warning' | 'info' | 'success'> = {
  Open: 'danger',
  Monitoring: 'warning',
  Mitigated: 'info',
  Closed: 'success',
}

function milestoneTitle(milestones: Milestone[], id: string) {
  return milestones.find(m => m.id === id)?.title ?? 'Milestone'
}

function emptyForm(projectFilter?: string) {
  return {
    title: '',
    description: '',
    project: projectFilter ?? '',
    relatedMilestone: '',
    severity: 'Medium' as RiskLevel,
    probability: 'Medium' as RiskLevel,
    mitigation: '',
    owner: '',
    status: 'Open' as RiskStatus,
  }
}

export function RisksBoard({ projectFilter }: { projectFilter?: string }) {
  const [risks, setRisks] = useState<Risk[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm(projectFilter))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const urlMilestoneFilter = useQueryParam('milestone')
  const [milestoneLinkFilter, setMilestoneLinkFilter] = useState('')
  useEffect(() => {
    if (urlMilestoneFilter) setMilestoneLinkFilter(urlMilestoneFilter)
  }, [urlMilestoneFilter])

  const refresh = () => {
    setRisks(getRisks())
    setMilestones(getMilestones())
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(() => {
    let list = projectFilter ? risks.filter(r => r.project === projectFilter) : risks
    if (milestoneLinkFilter) list = list.filter(r => r.relatedMilestone === milestoneLinkFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(r =>
        [r.title, r.description, r.mitigation, r.owner, r.severity, r.status, getProjectName(r.project)].some(f =>
          f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [risks, projectFilter, milestoneLinkFilter, query])

  const highlighted = useFocusHighlight(visible.map(r => r.id))

  const milestoneOptions = useMemo(() => {
    const scope = form.project || projectFilter
    return scope ? milestones.filter(m => m.project === scope) : milestones
  }, [milestones, form.project, projectFilter])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(projectFilter))
    setShowForm(true)
  }

  const startEdit = (r: Risk) => {
    setEditingId(r.id)
    setForm({
      title: r.title,
      description: r.description,
      project: r.project,
      relatedMilestone: r.relatedMilestone,
      severity: r.severity,
      probability: r.probability,
      mitigation: r.mitigation,
      owner: r.owner,
      status: r.status,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      updateRisk(editingId, form)
    } else {
      createRisk(form)
    }
    setShowForm(false)
    setForm(emptyForm(projectFilter))
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteRisk(id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading risks...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search risks..."
          aria-label="Search risks"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New risk'}</DevButton>
      </div>

      {milestoneLinkFilter ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-3 py-2 text-xs text-[var(--dev-accent)]">
          <span>Filtered to {milestoneTitle(milestones, milestoneLinkFilter)}</span>
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
          <DevInput
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Risk title"
            required
          />
          <DevTextarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={2}
          />
          <DevTextarea
            value={form.mitigation}
            onChange={e => setForm(prev => ({ ...prev, mitigation: e.target.value }))}
            placeholder="Mitigation"
            rows={2}
          />
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
            <DevInput
              value={form.owner}
              onChange={e => setForm(prev => ({ ...prev, owner: e.target.value }))}
              placeholder="Owner"
            />
          </div>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Severity</label>
              <DevSelect
                value={form.severity}
                onChange={e => setForm(prev => ({ ...prev, severity: e.target.value as RiskLevel }))}
              >
                {RISK_LEVEL_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </DevSelect>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Probability</label>
              <DevSelect
                value={form.probability}
                onChange={e => setForm(prev => ({ ...prev, probability: e.target.value as RiskLevel }))}
              >
                {RISK_LEVEL_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </DevSelect>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Status</label>
              <DevSelect
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as RiskStatus }))}
              >
                {RISK_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </DevSelect>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Record risk'}</DevButton>
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
        <DevEmptyState>No risks recorded{query ? ' matching your search' : ''} yet.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div
              key={r.id}
              id={`record-${r.id}`}
              className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                highlighted === r.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                >
                  {r.title}
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <DevBadge tone={SEVERITY_TONE[r.severity]}>{r.severity} severity</DevBadge>
                  <DevBadge tone={STATUS_TONE[r.status]}>{r.status}</DevBadge>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label="Delete risk"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {r.description ? <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{r.description}</p> : null}
              {r.mitigation ? (
                <p className="mt-1 text-xs leading-relaxed text-[var(--dev-text-faint)]">
                  <span className="font-medium">Mitigation:</span> {r.mitigation}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dev-text-faint)]">
                {!projectFilter ? <span>{getProjectName(r.project)}</span> : null}
                <span>Probability: {r.probability}</span>
                {r.owner ? <span>Owner: {r.owner}</span> : null}
                {r.relatedMilestone ? (
                  <Link href={`/dev/milestones?focus=${r.relatedMilestone}`} className="hover:text-[var(--dev-accent)]">
                    {milestoneTitle(milestones, r.relatedMilestone)}
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
