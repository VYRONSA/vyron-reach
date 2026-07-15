'use client'

import { useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { inferTaskKind } from '@/lib/actionQueue'
import type { ActionAdvertMeta, ActionContextMeta, ActionTaskKind, Priority } from '@/lib/vyronStore/types'

export type DrillMetric = {
  label: string
  value: string
  tone?: 'green' | 'purple' | 'cyan' | 'orange' | 'red' | string
}

export type DrillRow = {
  label: string
  value: string
}

export type DrillNote = {
  title: string
  text: string
}

export type DrillQueueItem = {
  title: string
  subtitle: string
  department: string
  sourcePage?: string
  priority?: Priority
  due?: string
  executionBrief?: string
  nextSteps?: string[]
  outputNeeded?: string
  kind?: ActionTaskKind
  contextMeta?: ActionContextMeta
  advertMeta?: ActionAdvertMeta
}

export type DrillRecord = {
  title: string
  subtitle?: string
  badge?: string
  previousPage?: string
  metrics?: DrillMetric[]
  rows?: DrillRow[]
  notes?: DrillNote[]
  queueItem?: DrillQueueItem
}

type DrillDownPageProps = {
  record: DrillRecord
  onBack?: () => void
  onLogout?: () => void
  embedded?: boolean
}

const QUEUE_PAGE_KEY = 'ai-action-queue'

export function DrillDownPage({ record, onBack, onLogout, embedded = false }: DrillDownPageProps) {
  const { navigate } = useAppNavigation()
  const { store, addToActionQueue } = useVyronData()
  const [queued, setQueued] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const metrics =
    record.metrics?.length
      ? record.metrics
      : [
          { label: 'Status', value: 'Active', tone: 'green' },
          { label: 'Priority', value: 'High', tone: 'purple' },
          { label: 'Automation', value: 'Enabled', tone: 'cyan' },
        ]

  const rows =
    record.rows?.length
      ? record.rows
      : [
          { label: 'Module', value: record.previousPage || 'VYRON REACH' },
          { label: 'Action', value: record.title },
          { label: 'Execution', value: 'AI-assisted' },
          { label: 'Output', value: 'Marketing decision ready' },
        ]

  const actions =
    record.notes?.length
      ? record.notes.map(n => n.text)
      : [
          'Check target keywords and search intent',
          'Create or update ranking content',
          'Review competitor weakness',
          'Set low-cost Google Ads testing budget (R50/day)',
          'Track ranking movement weekly',
        ]

  return (
    <section className={embedded ? 'space-y-6' : 'min-h-screen bg-slate-50 p-8'}>
      {!embedded && (
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm"
          >
            ← Back
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
            >
              Logout
            </button>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-300/25 blur-[90px]" />
        <div className="absolute bottom-0 right-56 h-72 w-72 rounded-full bg-cyan-300/20 blur-[90px]" />

        <div className="relative z-10">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-600">
            {record.badge || 'VYRON REACH ACTION DETAIL'}
          </div>

          <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-[-0.06em] text-slate-950">
            {record.title}
          </h1>

          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">
            {record.subtitle ||
              'Focused marketing action view for SEO, ads, content, rankings, competitors and execution decisions.'}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={`${metric.label}-${metric.value}`}
                className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
              >
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  {metric.label}
                </div>
                <div className={`mt-3 text-4xl font-black tracking-[-0.04em] ${metricTone(metric.tone)}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] xl:col-span-7">
          <h2 className="text-xl font-black text-slate-950">AI Execution Brief</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Use this screen to decide what must happen next. It should never be a useless placeholder page.
          </p>

          <div className="mt-6 space-y-4">
            {rows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-center justify-between gap-6 rounded-2xl bg-slate-50 px-5 py-4"
              >
                <div className="text-sm font-black text-slate-500">{row.label}</div>
                <div className="max-w-[65%] text-right text-sm font-black text-slate-950">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] xl:col-span-5">
          <h2 className="text-xl font-black text-slate-950">Next Best Actions</h2>

          <div className="mt-6 space-y-3">
            {actions.map((action, index) => (
              <div key={`${action}-${index}`} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 text-xs font-black text-white">
                  {index + 1}
                </div>
                <div className="text-sm font-bold leading-6 text-slate-700">{action}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={queued}
            onClick={() => {
              const qi = record.queueItem ?? buildFallbackQueueItem(record)
              const sourcePage = qi.sourcePage ?? record.previousPage ?? 'VYRON REACH'
              addToActionQueue({
                title: qi.title,
                subtitle: qi.subtitle,
                department: qi.department,
                sourcePage,
                priority: qi.priority ?? 'High',
                due: qi.due ?? 'This week',
                executionBrief: qi.executionBrief ?? record.subtitle ?? qi.title,
                nextSteps: qi.nextSteps ?? actions,
                outputNeeded: qi.outputNeeded ?? `Deliverable for: ${qi.title}`,
                kind: inferTaskKind(sourcePage, qi.kind, Boolean(qi.advertMeta)),
                contextMeta: qi.contextMeta ?? extractContextFromRows(rows, store.settings, qi.title),
                advertMeta: qi.advertMeta,
                generatedOutput: '',
                notes: '',
              })
              setQueued(true)
            }}
            className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {queued ? 'Added to AI Action Queue ✓' : 'Add to AI Action Queue'}
          </button>

          {queued ? (
            <div className="mt-4 space-y-3">
              <div
                role="status"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
              >
                Added to AI Action Queue
              </div>
              <button
                type="button"
                onClick={() => navigate(QUEUE_PAGE_KEY)}
                className="h-11 w-full rounded-2xl border border-violet-200 bg-violet-50 text-sm font-black text-violet-800"
              >
                Open AI Action Queue
              </button>
              {record.queueItem?.kind === 'advert_image' && record.queueItem.advertMeta?.prompt ? (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(record.queueItem!.advertMeta!.prompt)
                    setCopyDone(true)
                    setTimeout(() => setCopyDone(false), 2000)
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800"
                >
                  {copyDone ? 'Prompt Copied ✓' : 'Copy Prompt'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {queued ? (
        <div
          className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-2xl border border-emerald-200 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
          role="alert"
        >
          <p className="text-sm font-black text-emerald-800">Added to AI Action Queue</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Open the queue to start, copy prompts, or mark complete.</p>
          <button
            type="button"
            onClick={() => navigate(QUEUE_PAGE_KEY)}
            className="mt-3 w-full rounded-xl bg-violet-600 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Open AI Action Queue
          </button>
        </div>
      ) : null}
    </section>
  )
}

function buildFallbackQueueItem(record: DrillRecord): DrillQueueItem {
  const steps = record.notes?.map(n => n.text) ?? []
  const sourcePage = record.previousPage ?? 'VYRON REACH'
  return {
    title: record.title,
    subtitle: record.subtitle ?? '',
    department: sourcePage,
    sourcePage,
    priority: 'High',
    due: 'This week',
    executionBrief: record.subtitle ?? record.title,
    nextSteps: steps.length ? steps : ['Review details', 'Execute action', 'Mark complete'],
    outputNeeded: `Deliverable for: ${record.title}`,
    kind: inferTaskKind(sourcePage),
  }
}

function extractContextFromRows(
  rows: DrillRow[],
  settings: { businessName: string; defaultTargetArea: string; defaultAdDailyBudget: number },
  fallbackTitle: string,
): ActionContextMeta {
  const find = (...needles: string[]) => {
    const row = rows.find(r => needles.some(n => r.label.toLowerCase().includes(n)))
    return row?.value
  }
  return {
    keyword: find('keyword', 'search', 'action', 'volume')?.replace(/^#/, '') ?? fallbackTitle,
    business: find('business') ?? settings.businessName,
    targetArea: find('target area', 'market', 'area') ?? settings.defaultTargetArea,
    searchIntent: find('intent') ?? 'Buyer Intent',
    difficulty: find('difficulty') ?? '35',
    volume: find('volume') ?? '400+',
    suggestedDailyBudget: find('budget', 'daily') ?? `R${settings.defaultAdDailyBudget}/day`,
  }
}

function metricTone(tone?: string) {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'cyan') return 'text-cyan-600'
  if (tone === 'orange') return 'text-orange-500'
  if (tone === 'red') return 'text-rose-500'
  return 'text-violet-600'
}
