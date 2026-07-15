'use client'

import { useMemo, useState } from 'react'
import { DrillDownPage, type DrillRecord } from '@/components/DrillDownPanel'

type Props = {
  data?: any
  appData?: any
  leads?: any[]
  campaigns?: any[]
  tasks?: any[]
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : []
}

function safeNumber(value: any) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: any) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(safeNumber(value))
}

function valueOf(item: any) {
  return safeNumber(item.value || item.revenue || item.spend || item.budget || item.deal_value || item.estimated_value)
}

function createRecord(item: any, page: string): DrillRecord {
  return {
    title: item.name || item.title || item.company || 'Internal Record',
    subtitle: item.company || item.channel || item.status || page,
    badge: `${page} Internal Detail`,
    previousPage: page,
    metrics: [
      { label: 'Value', value: money(valueOf(item)), tone: 'green' },
      { label: 'Status', value: item.status || 'Tracked', tone: 'purple' },
    ],
    rows: Object.entries(item || {}).slice(0, 12).map(([label, value]) => ({
      label,
      value: String(value || ''),
    })),
    notes: [
      {
        title: 'Internal-use instruction',
        text: 'This is for your own operating workflow. Use it to decide the next task, report, recommendation or campaign adjustment.',
      },
      {
        title: 'Client-facing output',
        text: item.notes || 'Prepare a clean report, update, recommendation or next action summary for the client.',
      },
    ],
  }
}

export function PipelinePage({
  data,
  appData,
  leads,
  campaigns,
  tasks,
}: Props) {
  const [search, setSearch] = useState('')
  const [drill, setDrill] = useState<DrillRecord | null>(null)

  const source = data || appData || {}
  const rows = safeArray(leads || source.leads)

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    return rows.filter((item: any) => Object.values(item || {}).join(' ').toLowerCase().includes(search.toLowerCase()))
  }, [rows, search])

  if (drill) {
    return <DrillDownPage record={drill} onBack={() => setDrill(null)} />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              INTERNAL OPERATOR
            </p>

            <h1 className="mt-3 text-4xl font-black text-white">
              Pipeline
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Internal pipeline of work, proposals, onboarding and report clients.
            </p>
          </div>

          <div className="w-full max-w-md">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search internal records..."
              className="w-full rounded-2xl border border-purple-500/20 bg-[#05050f] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric title="Records" value={String(filtered.length)} />
        <Metric title="Total Value" value={money(filtered.reduce((sum: number, item: any) => sum + valueOf(item), 0))} />
        <Metric title="Use" value="Internal" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-purple-500/20 bg-[#0b0b1d] p-8 text-sm font-bold text-slate-500">
            No internal records loaded yet.
          </div>
        ) : (
          filtered.map((item: any, index: number) => (
            <button
              key={item.id || `${item.name || item.title}-${index}`}
              onClick={() => setDrill(createRecord(item, 'Pipeline'))}
              className="rounded-3xl border border-purple-500/15 bg-[#0b0b1d] p-5 text-left hover:border-purple-400/40 hover:bg-purple-500/10"
            >
              <div className="text-lg font-black text-white">
                {item.name || item.title || item.company || 'Internal Record'}
              </div>

              <div className="mt-2 text-sm text-slate-400">
                {item.company || item.channel || item.status || 'Tracked internally'}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">
                  {item.status || 'Pipeline'}
                </div>

                <div className="text-sm font-black text-emerald-300">
                  {money(valueOf(item))}
                </div>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {title}
      </div>

      <div className="mt-4 text-3xl font-black text-white">
        {value}
      </div>
    </div>
  )
}
