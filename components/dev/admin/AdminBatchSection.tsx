'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import {
  archiveBatch,
  BATCH_STATUS_OPTIONS,
  completeBatch,
  createBatch,
  getBatches,
  restoreBatch,
  updateBatch,
  type Batch,
  type BatchStatus,
} from '@/lib/dev/batchesStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from '../ui'

const STATUS_TONE: Record<BatchStatus, 'neutral' | 'info' | 'success'> = {
  Queued: 'neutral',
  Active: 'info',
  Complete: 'success',
}

function emptyForm(milestoneId: string) {
  return {
    batchNumber: '',
    milestone: milestoneId,
    objective: '',
    summary: '',
    completedTasks: '',
    lessonsLearned: '',
    claudePrompt: '',
    completionDate: '',
    status: 'Queued' as BatchStatus,
  }
}

export function AdminBatchSection({ projectSlug }: { projectSlug: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(''))

  const refresh = () => {
    const projectMilestones = getMilestones().filter(m => m.project === projectSlug)
    const milestoneIds = new Set(projectMilestones.map(m => m.id))
    setMilestones(projectMilestones)
    setBatches(getBatches().filter(b => milestoneIds.has(b.milestone)))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug])

  const milestoneTitle = (id: string) => milestones.find(m => m.id === id)?.title ?? 'Unassigned'

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(milestones[0]?.id ?? ''))
    setShowForm(true)
  }

  const startEdit = (b: Batch) => {
    setEditingId(b.id)
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
    if (!form.batchNumber.trim() || !form.milestone) return
    if (editingId) {
      updateBatch(editingId, form)
    } else {
      createBatch(form)
    }
    setShowForm(false)
    setEditingId(null)
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">Batches</div>
        <DevButton variant="secondary" onClick={startCreate} disabled={milestones.length === 0}>
          New Batch
        </DevButton>
      </div>

      {milestones.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Create a milestone first — batches must belong to one.</p>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DevInput
              value={form.batchNumber}
              onChange={e => setForm(prev => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Batch number"
              aria-label="Batch number"
              required
            />
            <DevSelect
              value={form.milestone}
              onChange={e => setForm(prev => ({ ...prev, milestone: e.target.value }))}
              aria-label="Milestone"
              required
            >
              {milestones.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </DevSelect>
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as BatchStatus }))}
              aria-label="Batch status"
            >
              {BATCH_STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </DevSelect>
          </div>
          <DevTextarea
            value={form.objective}
            onChange={e => setForm(prev => ({ ...prev, objective: e.target.value }))}
            placeholder="Objective"
            aria-label="Batch objective"
            rows={2}
          />
          <DevTextarea
            value={form.summary}
            onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Summary"
            aria-label="Batch summary"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save' : 'Create'}</DevButton>
            <DevButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </DevButton>
          </div>
        </form>
      ) : null}

      <div className="mt-3 space-y-2">
        {batches.length === 0 ? (
          <DevEmptyState>No batches for this project yet.</DevEmptyState>
        ) : (
          batches.map(b => (
            <div
              key={b.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3 ${b.archived ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--dev-text)]">Batch {b.batchNumber}</span>
                  {b.archived ? <DevBadge tone="neutral">Archived</DevBadge> : null}
                </div>
                <div className="mt-0.5 truncate text-xs text-[var(--dev-text-faint)]">{milestoneTitle(b.milestone)}</div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <DevBadge tone={STATUS_TONE[b.status]}>{b.status}</DevBadge>
                <DevButton variant="secondary" onClick={() => startEdit(b)}>
                  Edit
                </DevButton>
                {b.status !== 'Complete' ? (
                  <DevButton variant="secondary" onClick={() => { completeBatch(b.id); refresh() }}>
                    Complete
                  </DevButton>
                ) : null}
                {b.archived ? (
                  <DevButton variant="secondary" onClick={() => { restoreBatch(b.id); refresh() }}>
                    Restore
                  </DevButton>
                ) : (
                  <DevButton variant="danger" onClick={() => { archiveBatch(b.id); refresh() }}>
                    Archive
                  </DevButton>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
