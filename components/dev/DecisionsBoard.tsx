'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS, getProjectName } from '@/lib/dev/projectsData'
import {
  createDecision,
  DECISION_STATUS_OPTIONS,
  deleteDecision,
  getDecisions,
  updateDecision,
  type Decision,
  type DecisionStatus,
} from '@/lib/dev/decisionsStorage'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import { getJournalEntries, type JournalEntry } from '@/lib/dev/journalStorage'
import { getPrompts, type Prompt } from '@/lib/dev/promptsStorage'
import { recordRecentItem } from '@/lib/dev/recents'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'
import { useQueryParam } from './useQueryParam'

const STATUS_TONE: Record<DecisionStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  Proposed: 'neutral',
  Approved: 'success',
  Superseded: 'warning',
  Rejected: 'danger',
}

function milestoneTitle(milestones: Milestone[], id: string) {
  return milestones.find(m => m.id === id)?.title ?? 'Milestone'
}

function batchLabel(batches: Batch[], id: string) {
  const b = batches.find(x => x.id === id)
  return b ? `Batch ${b.batchNumber}` : 'Batch'
}

function journalLabel(entries: JournalEntry[], id: string) {
  const e = entries.find(x => x.id === id)
  return e ? e.date : 'Journal entry'
}

function promptLabel(prompts: Prompt[], id: string) {
  return prompts.find(p => p.id === id)?.title ?? 'Prompt'
}

const emptyForm = {
  decision: '',
  reason: '',
  alternatives: '',
  approvedDate: '',
  status: 'Proposed' as DecisionStatus,
  relatedProject: '',
  relatedMilestone: '',
  relatedBatch: '',
  relatedJournalEntry: '',
  relatedPrompt: '',
}

export function DecisionsBoard({ projectFilter }: { projectFilter?: string }) {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const urlMilestoneFilter = useQueryParam('milestone')
  const urlBatchFilter = useQueryParam('batch')
  const urlJournalFilter = useQueryParam('journal')
  const urlPromptFilter = useQueryParam('prompt')
  const [milestoneLinkFilter, setMilestoneLinkFilter] = useState('')
  const [batchLinkFilter, setBatchLinkFilter] = useState('')
  const [journalLinkFilter, setJournalLinkFilter] = useState('')
  const [promptLinkFilter, setPromptLinkFilter] = useState('')
  useEffect(() => {
    if (urlMilestoneFilter) setMilestoneLinkFilter(urlMilestoneFilter)
    if (urlBatchFilter) setBatchLinkFilter(urlBatchFilter)
    if (urlJournalFilter) setJournalLinkFilter(urlJournalFilter)
    if (urlPromptFilter) setPromptLinkFilter(urlPromptFilter)
  }, [urlMilestoneFilter, urlBatchFilter, urlJournalFilter, urlPromptFilter])

  const refresh = () => {
    setDecisions(getDecisions())
    setMilestones(getMilestones())
    setBatches(getBatches())
    setJournalEntries(getJournalEntries())
    setPrompts(getPrompts())
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const milestoneOptions = useMemo(() => {
    const scope = form.relatedProject || projectFilter
    return scope ? milestones.filter(m => m.project === scope) : milestones
  }, [milestones, form.relatedProject, projectFilter])

  const visible = useMemo(() => {
    let list = projectFilter ? decisions.filter(d => d.relatedProject === projectFilter) : decisions
    if (milestoneLinkFilter) list = list.filter(d => d.relatedMilestone === milestoneLinkFilter)
    if (batchLinkFilter) list = list.filter(d => d.relatedBatch === batchLinkFilter)
    if (journalLinkFilter) list = list.filter(d => d.relatedJournalEntry === journalLinkFilter)
    if (promptLinkFilter) list = list.filter(d => d.relatedPrompt === promptLinkFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(d =>
        [d.decision, d.reason, d.alternatives, d.status, getProjectName(d.relatedProject)].some(f =>
          f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [decisions, projectFilter, milestoneLinkFilter, batchLinkFilter, journalLinkFilter, promptLinkFilter, query])

  const highlighted = useFocusHighlight(visible.map(d => d.id))

  const startCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, relatedProject: projectFilter ?? '' })
    setShowForm(true)
  }

  const startEdit = (d: Decision) => {
    setEditingId(d.id)
    recordRecentItem({ type: 'decision', id: d.id, label: d.decision, href: `/dev/decisions?focus=${d.id}` })
    setForm({
      decision: d.decision,
      reason: d.reason,
      alternatives: d.alternatives,
      approvedDate: d.approvedDate,
      status: d.status,
      relatedProject: d.relatedProject,
      relatedMilestone: d.relatedMilestone,
      relatedBatch: d.relatedBatch,
      relatedJournalEntry: d.relatedJournalEntry,
      relatedPrompt: d.relatedPrompt,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.decision.trim()) return
    if (editingId) {
      updateDecision(editingId, form)
    } else {
      createDecision(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteDecision(id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading decisions...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DevInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search decisions..."
          aria-label="Search decisions"
          className="sm:max-w-xs"
        />
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New decision'}</DevButton>
      </div>

      {milestoneLinkFilter || batchLinkFilter || journalLinkFilter || promptLinkFilter ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-3 py-2 text-xs text-[var(--dev-accent)]">
          <span>
            Filtered to{' '}
            {milestoneLinkFilter
              ? milestoneTitle(milestones, milestoneLinkFilter)
              : batchLinkFilter
                ? batchLabel(batches, batchLinkFilter)
                : journalLinkFilter
                  ? `Journal: ${journalLabel(journalEntries, journalLinkFilter)}`
                  : `Prompt: ${promptLabel(prompts, promptLinkFilter)}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setMilestoneLinkFilter('')
              setBatchLinkFilter('')
              setJournalLinkFilter('')
              setPromptLinkFilter('')
            }}
            className="ml-auto font-medium hover:underline"
          >
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
            value={form.decision}
            onChange={e => setForm(prev => ({ ...prev, decision: e.target.value }))}
            placeholder="Decision"
            required
          />
          <DevTextarea
            value={form.reason}
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason"
            rows={2}
          />
          <DevTextarea
            value={form.alternatives}
            onChange={e => setForm(prev => ({ ...prev, alternatives: e.target.value }))}
            placeholder="Alternatives considered"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DevInput
              type="date"
              value={form.approvedDate}
              onChange={e => setForm(prev => ({ ...prev, approvedDate: e.target.value }))}
            />
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as DecisionStatus }))}
            >
              {DECISION_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </DevSelect>
            {!projectFilter ? (
              <DevSelect
                value={form.relatedProject}
                onChange={e => setForm(prev => ({ ...prev, relatedProject: e.target.value, relatedMilestone: '' }))}
              >
                <option value="">Unassigned</option>
                {PROJECTS.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </DevSelect>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DevSelect
              value={form.relatedJournalEntry}
              onChange={e => setForm(prev => ({ ...prev, relatedJournalEntry: e.target.value }))}
            >
              <option value="">No linked journal entry</option>
              {journalEntries.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.date} — {entry.summary || 'Untitled entry'}
                </option>
              ))}
            </DevSelect>
            <DevSelect
              value={form.relatedPrompt}
              onChange={e => setForm(prev => ({ ...prev, relatedPrompt: e.target.value }))}
            >
              <option value="">No linked prompt</option>
              {prompts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </DevSelect>
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Record decision'}</DevButton>
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
        <DevEmptyState>No architecture decisions recorded{query ? ' matching your search' : ''} yet.</DevEmptyState>
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
                <button type="button" onClick={() => startEdit(d)} className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {d.decision}
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <DevBadge tone={STATUS_TONE[d.status]}>{d.status}</DevBadge>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    aria-label="Delete decision"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {d.reason ? <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{d.reason}</p> : null}
              {d.alternatives ? (
                <p className="mt-1 text-xs leading-relaxed text-[var(--dev-text-faint)]">
                  <span className="font-medium">Alternatives:</span> {d.alternatives}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dev-text-faint)]">
                {!projectFilter ? <span>{getProjectName(d.relatedProject)}</span> : null}
                {d.approvedDate ? <span>{d.approvedDate}</span> : null}
                {d.relatedMilestone ? (
                  <Link href={`/dev/milestones?focus=${d.relatedMilestone}`} className="hover:text-[var(--dev-accent)]">
                    {milestoneTitle(milestones, d.relatedMilestone)}
                  </Link>
                ) : null}
                {d.relatedBatch ? (
                  <Link href={`/dev/batches?focus=${d.relatedBatch}`} className="hover:text-[var(--dev-accent)]">
                    {batchLabel(batches, d.relatedBatch)}
                  </Link>
                ) : null}
                {d.relatedJournalEntry ? (
                  <Link href={`/dev/journal?focus=${d.relatedJournalEntry}`} className="hover:text-[var(--dev-accent)]">
                    Journal: {journalLabel(journalEntries, d.relatedJournalEntry)}
                  </Link>
                ) : null}
                {d.relatedPrompt ? (
                  <Link href={`/dev/prompts?focus=${d.relatedPrompt}`} className="hover:text-[var(--dev-accent)]">
                    Prompt: {promptLabel(prompts, d.relatedPrompt)}
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
