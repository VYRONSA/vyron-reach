'use client'

import { useState, type FormEvent } from 'react'
import {
  archiveMilestone,
  createMilestone,
  MILESTONE_STATUS_OPTIONS,
  restoreMilestone,
  updateMilestone,
  type Milestone,
  type MilestoneStatus,
} from '@/lib/dev/milestonesStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from '../ui'

const STATUS_TONE: Record<MilestoneStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  Upcoming: 'neutral',
  'In Progress': 'info',
  'At Risk': 'warning',
  Complete: 'success',
}

function emptyForm(projectSlug: string) {
  return { project: projectSlug, title: '', description: '', phase: '', startDate: '', targetDate: '', progress: 0, status: 'Upcoming' as MilestoneStatus }
}

export function AdminMilestoneSection({
  projectSlug,
  milestones,
  onChange,
}: {
  projectSlug: string
  milestones: Milestone[]
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(projectSlug))

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(projectSlug))
    setShowForm(true)
  }

  const startEdit = (m: Milestone) => {
    setEditingId(m.id)
    setForm({
      project: m.project,
      title: m.title,
      description: m.description,
      phase: m.phase,
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
    setEditingId(null)
    onChange()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">Milestones</div>
        <DevButton variant="secondary" onClick={startCreate}>
          New Milestone
        </DevButton>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4">
          <DevInput
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            aria-label="Milestone title"
            required
          />
          <DevTextarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            aria-label="Milestone description"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DevInput
              value={form.phase}
              onChange={e => setForm(prev => ({ ...prev, phase: e.target.value }))}
              placeholder="Phase"
              aria-label="Milestone phase"
            />
            <DevSelect
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as MilestoneStatus }))}
              aria-label="Milestone status"
            >
              {MILESTONE_STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </DevSelect>
            <DevInput
              type="date"
              value={form.targetDate}
              onChange={e => setForm(prev => ({ ...prev, targetDate: e.target.value }))}
              aria-label="Target date"
            />
            <DevInput
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
              aria-label="Progress percent"
            />
          </div>
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save' : 'Create'}</DevButton>
            <DevButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </DevButton>
          </div>
        </form>
      ) : null}

      <div className="mt-3 space-y-2">
        {milestones.length === 0 ? (
          <DevEmptyState>No milestones for this project yet.</DevEmptyState>
        ) : (
          milestones.map(m => (
            <div
              key={m.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3 ${m.archived ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--dev-text)]">{m.title}</span>
                  {m.archived ? <DevBadge tone="neutral">Archived</DevBadge> : null}
                </div>
                <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{m.phase || 'No phase set'}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DevBadge tone={STATUS_TONE[m.status]}>{m.status}</DevBadge>
                <DevButton variant="secondary" onClick={() => startEdit(m)}>
                  Edit
                </DevButton>
                {m.archived ? (
                  <DevButton variant="secondary" onClick={() => { restoreMilestone(m.id); onChange() }}>
                    Restore
                  </DevButton>
                ) : (
                  <DevButton variant="danger" onClick={() => { archiveMilestone(m.id); onChange() }}>
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
