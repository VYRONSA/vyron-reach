'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PROJECTS } from '@/lib/dev/projectsData'
import {
  createTask,
  deleteTask,
  getTasks,
  PRIORITY_LABEL,
  STATUS_LABEL,
  toggleTaskComplete,
  updateTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/dev/queueStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect } from './ui'
import { useFocusHighlight } from './useFocusHighlight'

const PRIORITY_TONE: Record<TaskPriority, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const STATUS_TONE: Record<TaskStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  todo: 'neutral',
  'in-progress': 'info',
  blocked: 'warning',
  done: 'success',
}

export function QueueBoard({ projectFilter, compact = false }: { projectFilter?: string; compact?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [title, setTitle] = useState('')
  const [project, setProject] = useState(projectFilter ?? '')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const refresh = () => setTasks(getTasks())

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(
    () => (projectFilter ? tasks.filter(t => t.project === projectFilter) : tasks),
    [tasks, projectFilter]
  )

  const highlighted = useFocusHighlight(visible.map(t => t.id))

  const counts = useMemo(() => {
    const base = { total: visible.length, todo: 0, 'in-progress': 0, blocked: 0, done: 0 } as Record<
      'total' | TaskStatus,
      number
    >
    for (const t of visible) base[t.status] += 1
    return base
  }, [visible])

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createTask({ title, project: projectFilter ?? project, priority })
    setTitle('')
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteTask(id)
    refresh()
  }

  const handleToggle = (id: string) => {
    toggleTaskComplete(id)
    refresh()
  }

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask(id, { status })
    refresh()
  }

  const handlePriorityChange = (id: string, p: TaskPriority) => {
    updateTask(id, { priority: p })
    refresh()
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  const commitEdit = () => {
    if (editingId && editingTitle.trim()) {
      updateTask(editingId, { title: editingTitle.trim() })
    }
    setEditingId(null)
    refresh()
  }

  const projectName = (slug: string) => PROJECTS.find(p => p.slug === slug)?.name ?? (slug ? slug : 'Unassigned')

  if (!hydrated) {
    return <div className="text-sm text-[var(--dev-text-faint)]">Loading queue...</div>
  }

  return (
    <div>
      {!compact ? (
        <div className="mb-5 flex flex-wrap gap-3 text-xs">
          <DevBadge tone="neutral">{counts.total} total</DevBadge>
          <DevBadge tone="neutral">{counts.todo} to do</DevBadge>
          <DevBadge tone="info">{counts['in-progress']} in progress</DevBadge>
          <DevBadge tone="warning">{counts.blocked} blocked</DevBadge>
          <DevBadge tone="success">{counts.done} done</DevBadge>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-3 sm:flex-row sm:items-center"
      >
        <DevInput
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New task title..."
          className="flex-1"
        />
        {!projectFilter ? (
          <DevSelect value={project} onChange={e => setProject(e.target.value)} className="sm:w-44">
            <option value="">Unassigned</option>
            {PROJECTS.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </DevSelect>
        ) : null}
        <DevSelect
          value={priority}
          onChange={e => setPriority(e.target.value as TaskPriority)}
          className="sm:w-32"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </DevSelect>
        <DevButton type="submit">Add task</DevButton>
      </form>

      {visible.length === 0 ? (
        <DevEmptyState>No tasks yet. Add one above.</DevEmptyState>
      ) : (
        <div className="space-y-2">
          {visible.map(task => (
            <div
              key={task.id}
              id={`record-${task.id}`}
              className={`scroll-mt-24 flex flex-col gap-3 rounded-xl border bg-[var(--dev-surface)] p-3.5 transition-shadow duration-500 sm:flex-row sm:items-center sm:justify-between ${
                task.status === 'done' ? 'opacity-60' : ''
              } ${
                highlighted === task.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
              }`}
            >
              <div className="flex flex-1 items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(task.id)}
                  aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    task.status === 'done'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-[var(--dev-border-strong)] text-transparent hover:border-[var(--dev-accent)]'
                  }`}
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full rounded border border-[var(--dev-accent)]/40 bg-[var(--dev-input-bg)] px-2 py-1 text-sm text-[var(--dev-text)] outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      className={`text-left text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)] ${
                        task.status === 'done' ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </button>
                  )}
                  {!projectFilter ? (
                    <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{projectName(task.project)}</div>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DevBadge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]}</DevBadge>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="rounded-md border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1 text-xs text-[var(--dev-text)] outline-none"
                >
                  {(Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <select
                  value={task.priority}
                  onChange={e => handlePriorityChange(task.id, e.target.value as TaskPriority)}
                  className="rounded-md border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1 text-xs text-[var(--dev-text)] outline-none"
                >
                  {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map(p => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  aria-label="Delete task"
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
