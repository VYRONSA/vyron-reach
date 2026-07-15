'use client'

import { useMemo, useState } from 'react'
import { DrillDownPage, type DrillRecord } from '@/components/DrillDownPanel'

type ActionBoardPageProps = {
  tasks?: any[]
  data?: any
  appData?: any
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : []
}

function lower(value: any) {
  return String(value || '').toLowerCase()
}

function todayString() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

function dueBucket(dateValue: any) {
  if (!dateValue) return 'No Date'

  const today = new Date()
  const due = new Date(dateValue)

  today.setHours(0,0,0,0)
  due.setHours(0,0,0,0)

  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff <= 7) return 'This Week'

  return 'Later'
}

function taskRecord(task: any): DrillRecord {
  return {
    title: task.title || 'Revenue Action',
    subtitle: task.leadName || task.channel || 'Action Item',
    badge: 'Revenue Action',
    previousPage: 'Revenue Actions',
    metrics: [
      {
        label: 'Priority',
        value: task.priority || 'Normal',
        tone: lower(task.priority).includes('high') ? 'red' : 'purple',
      },
      {
        label: 'Status',
        value: task.status || 'Pending',
        tone: lower(task.status).includes('done') ? 'green' : 'cyan',
      },
    ],
    rows: [
      { label: 'Task', value: task.title || 'Task' },
      { label: 'Lead', value: task.leadName || 'Not linked' },
      { label: 'Owner', value: task.owner || 'Unassigned' },
      { label: 'Due Date', value: task.dueDate || 'Not set' },
      { label: 'Type', value: task.type || 'General' },
    ],
    notes: [
      {
        title: 'Execution Rule',
        text: 'Every action must either move revenue forward, protect onboarding or improve conversion.',
      },
      {
        title: 'Next Step',
        text: task.notes || 'Confirm next action and follow-up date.',
      },
    ],
  }
}

export function RevenueActionsPage({
  tasks,
  data,
  appData,
}: ActionBoardPageProps) {
  const source = data || appData || {}

  const rows = safeArray(tasks || source.tasks)

  const [search, setSearch] = useState('')
  const [drill, setDrill] = useState<DrillRecord | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return rows

    return rows.filter((task: any) => {
      const haystack = `
        ${task.title || ''}
        ${task.leadName || ''}
        ${task.owner || ''}
        ${task.status || ''}
      `.toLowerCase()

      return haystack.includes(search.toLowerCase())
    })
  }, [rows, search])

  const overdue = filtered.filter((task: any) => dueBucket(task.dueDate) === 'Overdue')
  const today = filtered.filter((task: any) => dueBucket(task.dueDate) === 'Today')
  const thisWeek = filtered.filter((task: any) => dueBucket(task.dueDate) === 'This Week')

  if (drill) {
    return (
      <DrillDownPage
        record={drill}
        onBack={() => setDrill(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              REVENUE ACTION SYSTEM
            </p>

            <h1 className="mt-3 text-5xl font-black text-white">
              Daily Execution Board
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Focus only on the actions that directly affect demos, proposals, onboarding and revenue growth.
            </p>
          </div>

          <div className="w-full max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search actions..."
              className="w-full rounded-2xl border border-purple-500/20 bg-[#05050f] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Overdue" value={String(overdue.length)} tone="red" />
        <MetricCard title="Today" value={String(today.length)} tone="cyan" />
        <MetricCard title="This Week" value={String(thisWeek.length)} tone="purple" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ActionColumn
          title="Overdue"
          tone="red"
          rows={overdue}
          onClick={(task) => setDrill(taskRecord(task))}
        />

        <ActionColumn
          title="Today"
          tone="cyan"
          rows={today}
          onClick={(task) => setDrill(taskRecord(task))}
        />

        <ActionColumn
          title="This Week"
          tone="purple"
          rows={thisWeek}
          onClick={(task) => setDrill(taskRecord(task))}
        />
      </section>
    </div>
  )
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string
  value: string
  tone: 'red' | 'cyan' | 'purple'
}) {
  const classes =
    tone === 'red'
      ? 'border-red-500/20 bg-red-500/10'
      : tone === 'cyan'
      ? 'border-cyan-500/20 bg-cyan-500/10'
      : 'border-purple-500/20 bg-purple-500/10'

  return (
    <div className={`rounded-3xl border p-6 ${classes}`}>
      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-300">
        {title}
      </div>

      <div className="mt-4 text-5xl font-black text-white">
        {value}
      </div>
    </div>
  )
}

function ActionColumn({
  title,
  tone,
  rows,
  onClick,
}: {
  title: string
  tone: 'red' | 'cyan' | 'purple'
  rows: any[]
  onClick: (task: any) => void
}) {
  const classes =
    tone === 'red'
      ? 'border-red-500/20'
      : tone === 'cyan'
      ? 'border-cyan-500/20'
      : 'border-purple-500/20'

  return (
    <div className={`rounded-3xl border bg-[#0b0b1d] p-5 ${classes}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="text-sm font-black uppercase tracking-[0.22em] text-white">
          {title}
        </div>

        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
          {rows.length}
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
            No actions.
          </div>
        ) : (
          rows.map((task: any, index: number) => (
            <button
              key={task.id || `${task.title}-${index}`}
              onClick={() => onClick(task)}
              className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]"
            >
              <div className="text-sm font-black text-white">
                {task.title || 'Task'}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {task.leadName || task.owner || 'Action'}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  {task.status || 'Pending'}
                </div>

                <div className="text-xs font-black text-slate-300">
                  {task.dueDate || todayString()}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
