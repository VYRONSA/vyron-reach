'use client'

import { useMemo } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import type { DrillRecord } from '@/components/DrillDownPanel'
import type { ModuleConfig } from '@/lib/moduleRegistry'

type EnterpriseModulePageProps = {
  config: ModuleConfig
}

export function EnterpriseModulePage({ config }: EnterpriseModulePageProps) {
  const { openDrill } = useAppNavigation()
  const items = useMemo(() => config.loadItems(), [config])

  return (
    <div className="space-y-5">
      <section className="relative min-h-[300px] overflow-hidden rounded-[34px] border border-white/80 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.10)]">
        <div className="absolute inset-y-0 right-0 hidden w-[54%] lg:block">
          <ModuleHero title={config.title} />
        </div>

        <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-white via-white/95 to-transparent" />

        <div className="relative z-10 max-w-3xl">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-600">
            AI Revenue Operations Command Centre
          </div>

          <h1 className="mt-5 text-5xl font-black tracking-[-0.06em] text-slate-950">
            {config.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            {config.subtitle}
          </p>

          <div className="mt-7 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
            Live Intelligence Stream Active
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/80 bg-white/85 p-7 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-600">
          Production Intelligence Layer
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
          {config.title} intelligence hub
        </h2>

        <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
          Operational layers connected to VYRON REACH revenue intelligence. Open any layer for AI-scored metrics,
          recommendations and execution detail.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => openDrill(buildDrillRecord(item, config.title, index))}
            className="group relative min-h-[210px] overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(124,58,237,0.18)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 opacity-90" />
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-300/25 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-500 text-lg font-black text-white shadow-xl">
                  {index + 1}
                </div>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Active
                </span>
              </div>

              <h3 className="mt-7 line-clamp-2 text-xl font-black leading-tight tracking-[-0.03em] text-slate-950">
                {item}
              </h3>

              <div className="mt-auto pt-5 text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-500">
                Open Intelligence Layer →
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}

function buildDrillRecord(item: string, title: string, index: number): DrillRecord {
  return {
    title: item,
    subtitle: `${item} operational intelligence layer`,
    badge: title,
    previousPage: title,
    metrics: [
      { label: 'Status', value: 'Active', tone: 'green' },
      { label: 'Priority', value: index % 3 === 0 ? 'High' : 'Medium', tone: 'purple' },
      { label: 'Automation', value: 'Enabled', tone: 'cyan' },
    ],
    rows: [
      { label: 'Module', value: title },
      { label: 'Layer', value: item },
      { label: 'Execution', value: 'Autonomous' },
      { label: 'Reporting', value: 'Client-ready intelligence available' },
      { label: 'Next Action', value: 'Review metrics and deploy optimization pass' },
    ],
  }
}

function ModuleHero({ title }: { title: string }) {
  const text = title.toLowerCase()
  const accent = text.includes('revenue')
    ? 'from-emerald-400 to-cyan-400'
    : text.includes('campaign')
      ? 'from-fuchsia-500 to-orange-400'
      : text.includes('website')
        ? 'from-cyan-400 to-blue-500'
        : 'from-violet-500 to-cyan-400'

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(34,211,238,.35),transparent_30%),radial-gradient(circle_at_45%_35%,rgba(168,85,247,.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.02))]" />

      <div className={`absolute right-16 top-12 flex h-36 w-36 items-center justify-center rounded-[40px] bg-gradient-to-br ${accent} text-4xl font-black text-white shadow-2xl`}>
        AI
      </div>

      <div className="absolute bottom-8 right-8 grid w-[430px] grid-cols-2 gap-4">
        {['Signals', 'Forecast', 'Deploy', 'Optimize'].map((label, index) => (
          <div key={label} className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-xl backdrop-blur-xl">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">0{index + 1}</div>
            <div className="mt-2 text-lg font-black text-slate-950">{label}</div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className={`h-2 rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${55 + index * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
