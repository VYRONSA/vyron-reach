'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addProjectListItem,
  deleteProjectListItem,
  getProjectList,
  PROJECT_LIST_CONFIG,
  updateProjectListItem,
  type ProjectListItem,
  type ProjectListKind,
} from '@/lib/dev/projectLists'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect } from './ui'

const STATUS_TONE: Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  Planned: 'neutral',
  'In progress': 'info',
  Done: 'success',
  Upcoming: 'neutral',
  Complete: 'success',
  Queued: 'neutral',
  Active: 'info',
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
  Next: 'info',
  Later: 'neutral',
}

export function ProjectListSection({ projectSlug, kind }: { projectSlug: string; kind: ProjectListKind }) {
  const config = PROJECT_LIST_CONFIG[kind]
  const [items, setItems] = useState<ProjectListItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [status, setStatus] = useState(config.statusOptions[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDetail, setEditingDetail] = useState('')

  const refresh = () => setItems(getProjectList(projectSlug, kind))

  useEffect(() => {
    refresh()
    setStatus(config.statusOptions[0])
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug, kind])

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [items]
  )

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addProjectListItem(projectSlug, kind, { title, detail, status })
    setTitle('')
    setDetail('')
    refresh()
  }

  const startEdit = (item: ProjectListItem) => {
    setEditingId(item.id)
    setEditingTitle(item.title)
    setEditingDetail(item.detail)
  }

  const commitEdit = () => {
    if (editingId) {
      updateProjectListItem(projectSlug, kind, editingId, {
        title: editingTitle.trim() || 'Untitled',
        detail: editingDetail.trim(),
      })
    }
    setEditingId(null)
    refresh()
  }

  const handleStatusChange = (id: string, next: string) => {
    updateProjectListItem(projectSlug, kind, id, { status: next })
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteProjectListItem(projectSlug, kind, id)
    refresh()
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading {config.label.toLowerCase()}...</div>

  return (
    <div>
      <form
        onSubmit={handleCreate}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3 sm:flex-row sm:items-center"
      >
        <DevInput value={title} onChange={e => setTitle(e.target.value)} placeholder={`New ${config.label.toLowerCase()} item...`} className="flex-1" />
        <DevInput
          value={detail}
          onChange={e => setDetail(e.target.value)}
          placeholder={config.detailPlaceholder}
          className="sm:w-48"
        />
        <DevSelect value={status} onChange={e => setStatus(e.target.value)} className="sm:w-36">
          {config.statusOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </DevSelect>
        <DevButton type="submit">Add</DevButton>
      </form>

      {sorted.length === 0 ? (
        <DevEmptyState>No {config.label.toLowerCase()} recorded yet.</DevEmptyState>
      ) : (
        <div className="space-y-2">
          {sorted.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 rounded border border-[var(--dev-accent)]/40 bg-[var(--dev-input-bg)] px-2 py-1 text-sm text-[var(--dev-text)] outline-none"
                    />
                    <input
                      value={editingDetail}
                      onChange={e => setEditingDetail(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      placeholder={config.detailLabel}
                      className="rounded border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1 text-sm text-[var(--dev-text)] outline-none sm:w-40"
                    />
                  </div>
                ) : (
                  <button type="button" onClick={() => startEdit(item)} className="text-left">
                    <div className="text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">{item.title}</div>
                    {item.detail ? <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{item.detail}</div> : null}
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(item.id, e.target.value)}
                  className="rounded-md border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1 text-xs text-[var(--dev-text)] outline-none"
                >
                  {config.statusOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <DevBadge tone={STATUS_TONE[item.status] ?? 'neutral'}>{item.status}</DevBadge>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--dev-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
