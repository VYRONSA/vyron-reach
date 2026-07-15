'use client'

import type { ReactNode } from 'react'
import type { OwnerTheme } from '@/components/owner/OwnerPageShell'

type HeroArtworkProps = {
  theme: OwnerTheme
  accent: string
}

/** Right-side hero visual — fully contained, unique per page theme */
export function HeroArtwork({ theme, accent }: HeroArtworkProps) {
  return (
    <div
      className={`relative h-full w-full max-w-[420px] overflow-hidden rounded-[28px] border border-slate-200/90 bg-gradient-to-br shadow-[0_20px_60px_rgba(15,23,42,0.12)] ${panelBg(theme)}`}
      aria-hidden
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-[0.07]`} />
      <div className="relative z-10 flex h-full min-h-[200px] flex-col p-5">
        {theme === 'dashboard' && <DashboardArt accent={accent} />}
        {theme === 'seo' && <SeoArt accent={accent} />}
        {theme === 'ads' && <AdsArt accent={accent} />}
        {theme === 'content' && <ContentArt accent={accent} />}
        {theme === 'competitors' && <CompetitorsArt accent={accent} />}
        {theme === 'rankings' && <RankingsArt accent={accent} />}
        {theme === 'clients' && <ClientsArt accent={accent} />}
        {theme === 'reports' && <ReportsArt accent={accent} />}
        {theme === 'settings' && <SettingsArt accent={accent} />}
        {(theme === 'queue' || theme === 'automation') && <QueueArt accent={accent} />}
        {theme === 'creative' && <CreativeArt accent={accent} />}
      </div>
    </div>
  )
}

function panelBg(theme: OwnerTheme): string {
  const map: Record<OwnerTheme, string> = {
    dashboard: 'from-violet-50 via-white to-cyan-50',
    seo: 'from-cyan-50 via-white to-blue-50',
    ads: 'from-orange-50 via-white to-fuchsia-50',
    content: 'from-fuchsia-50 via-white to-violet-50',
    competitors: 'from-indigo-50 via-white to-emerald-50',
    rankings: 'from-emerald-50 via-white to-cyan-50',
    clients: 'from-violet-50 via-white to-blue-50',
    reports: 'from-indigo-50 via-white to-violet-50',
    settings: 'from-slate-50 via-white to-violet-50',
    automation: 'from-violet-50 via-white to-cyan-50',
    queue: 'from-orange-50 via-white to-pink-50',
    creative: 'from-fuchsia-50 via-white to-violet-50',
  }
  return map[theme]
}

function CreativeArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Creative Studio · Approval</MiniLabel>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['V1', 'V2', 'V3'].map((v, i) => (
          <div
            key={v}
            className={`rounded-2xl border border-white/80 bg-gradient-to-br ${accent} p-3 shadow-md ${i === 2 ? 'col-span-2' : ''}`}
          >
            <div className="h-16 rounded-xl bg-white/20" />
            <div className="mt-2 h-2 w-3/4 rounded bg-white/40" />
            <div className="mt-1 text-[9px] font-black text-white">{v} Preview</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black text-emerald-700">Approved</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-700">Awaiting</span>
      </div>
    </>
  )
}

function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{children}</div>
  )
}

function DashboardArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Revenue Command Centre</MiniLabel>
      <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
        {['Revenue', 'Leads', 'ROI', 'Spend'].map((l, i) => (
          <div key={l} className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm">
            <div className="text-[8px] font-bold text-slate-500">{l}</div>
            <div className="mt-1 text-lg font-black text-slate-900">{['+24%', '148', '3.2x', 'R12k'][i]}</div>
            <div className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${60 + i * 8}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex h-16 items-end gap-1 rounded-2xl bg-white/80 p-3">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-md bg-gradient-to-t ${accent}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </>
  )
}

function SeoArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>SEO War Room · Rankings</MiniLabel>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <span className="text-xs font-semibold text-slate-500">workforce software south africa</span>
      </div>
      <div className="mt-3 flex-1 space-y-2">
        {[
          { pos: '#3', kw: 'staff clocking system', vol: '1.2k' },
          { pos: '#7', kw: 'HR compliance software', vol: '890' },
          { pos: '#12', kw: 'rostering software', vol: '640' },
        ].map(row => (
          <div key={row.kw} className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm">
            <span className={`rounded-lg bg-gradient-to-r ${accent} px-2 py-0.5 text-[10px] font-black text-white`}>
              {row.pos}
            </span>
            <span className="flex-1 truncate text-[10px] font-bold text-slate-800">{row.kw}</span>
            <span className="text-[9px] text-slate-400">{row.vol}</span>
          </div>
        ))}
      </div>
      <svg className="mt-2 h-12 w-full" viewBox="0 0 200 48" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="url(#seoLine)"
          strokeWidth="3"
          strokeLinecap="round"
          points="0,40 40,32 80,28 120,18 160,12 200,8"
        />
        <defs>
          <linearGradient id="seoLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}

function AdsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Google Ads · Paid Search</MiniLabel>
      <div className="mt-2 flex gap-2">
        <span className="rounded-lg bg-[#4285F4]/10 px-2 py-1 text-[9px] font-black text-[#4285F4]">Google</span>
        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-600">R50/day</span>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
        {[
          { l: 'CPC', v: 'R4.20' },
          { l: 'CTR', v: '3.8%' },
          { l: 'Intent', v: '92%' },
        ].map(m => (
          <div key={m.l} className="rounded-2xl bg-white/90 p-2 text-center shadow-sm">
            <div className="text-[8px] font-bold text-slate-500">{m.l}</div>
            <div className="text-sm font-black text-slate-900">{m.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-2xl bg-white/90 p-3 shadow-sm">
        <div className="flex justify-between text-[9px] font-bold text-slate-500">
          <span>Waste blocked</span>
          <span className="text-emerald-600">-R340</span>
        </div>
        <div className={`mt-2 h-2 rounded-full bg-gradient-to-r ${accent}`} style={{ width: '72%' }} />
      </div>
      <div className="mt-2 flex gap-1">
        {['Search', 'Display', 'PMax'].map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[8px] font-black ${i === 0 ? `bg-gradient-to-r ${accent} text-white` : 'bg-slate-100 text-slate-500'}`}
          >
            {t}
          </span>
        ))}
      </div>
    </>
  )
}

function ContentArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>AI Content Studio</MiniLabel>
      <div className="mt-3 flex-1 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-[10px] font-black text-white`}>
            AI
          </div>
          <div className="text-[10px] font-bold text-slate-700">Generating landing page…</div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full rounded bg-slate-100" />
          <div className="h-2 w-[90%] rounded bg-slate-100" />
          <div className="h-2 w-[75%] rounded bg-violet-100" />
          <div className="h-2 w-[85%] rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {['Blog', 'FAQ', 'Ad Creative'].map(t => (
          <span key={t} className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[8px] font-black text-slate-600">
            {t}
          </span>
        ))}
      </div>
    </>
  )
}

function CompetitorsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Competitor Radar</MiniLabel>
      <div className="relative mt-3 flex flex-1 items-center justify-center">
        <div className="absolute h-28 w-28 rounded-full border border-dashed border-indigo-200" />
        <div className="absolute h-20 w-20 rounded-full border border-dashed border-indigo-300/60" />
        <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-xs font-black text-white shadow-lg`}>
          YOU
        </div>
        {[
          { x: '8%', y: '12%', l: 'A' },
          { x: '72%', y: '8%', l: 'B' },
          { x: '78%', y: '68%', l: 'C' },
          { x: '12%', y: '72%', l: 'D' },
        ].map(p => (
          <div
            key={p.l}
            className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-700 shadow-md"
            style={{ left: p.x, top: p.y }}
          >
            {p.l}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-[9px] font-bold text-emerald-600">3 keyword gaps detected</div>
    </>
  )
}

function RankingsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Position Movement</MiniLabel>
      <svg className="mt-2 flex-1 w-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="rankFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 L30,85 L60,70 L90,55 L120,45 L150,35 L180,28 L200,20 L200,120 L0,120 Z"
          fill="url(#rankFill)"
        />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          points="0,100 30,85 60,70 90,55 120,45 150,35 180,28 200,20"
        />
        {[0, 30, 60, 90, 120, 150, 180, 200].map((x, i) => (
          <circle key={i} cx={x} cy={[100, 85, 70, 55, 45, 35, 28, 20][i]} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between">
        <span className={`rounded-lg bg-gradient-to-r ${accent} px-2 py-0.5 text-[9px] font-black text-white`}>
          +12 positions
        </span>
        <span className="text-[9px] font-bold text-slate-500">Top 10 forecast</span>
      </div>
    </>
  )
}

function ClientsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Client Portfolio</MiniLabel>
      <div className="mt-3 flex-1 space-y-2">
        {[
          { n: 'Retail Co', b: 'R8k/mo', g: 72 },
          { n: 'Hospitality', b: 'R12k/mo', g: 58 },
          { n: 'Logistics', b: 'R6k/mo', g: 85 },
        ].map(c => (
          <div key={c.n} className="flex items-center gap-3 rounded-2xl bg-white/90 p-2.5 shadow-sm">
            <div className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${accent} opacity-80`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-black text-slate-900">{c.n}</div>
              <div className="text-[9px] text-slate-500">{c.b}</div>
            </div>
            <div className="text-[10px] font-black text-emerald-600">{c.g}%</div>
          </div>
        ))}
      </div>
    </>
  )
}

function ReportsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>Analytics Reports</MiniLabel>
      <div className="mt-3 flex flex-1 gap-3">
        <div className="flex flex-1 flex-col justify-end gap-1 rounded-2xl bg-white/90 p-3 shadow-sm">
          {[55, 70, 45, 85, 60].map((h, i) => (
            <div key={i} className="flex items-end gap-1">
              <div className={`w-3 rounded-t bg-gradient-to-t ${accent}`} style={{ height: `${h * 0.35}px` }} />
            </div>
          ))}
        </div>
        <div className="flex w-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
          <svg className="h-10 w-10 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="6" />
            <path d="M21 21l-5-5" />
            <path d="M10 7v6M7 10h6" strokeLinecap="round" />
          </svg>
          <span className="mt-1 text-[8px] font-black text-slate-600">PDF Ready</span>
        </div>
      </div>
      <div className="mt-2 rounded-xl bg-violet-50 px-2 py-1 text-center text-[9px] font-bold text-violet-700">
        Monthly executive summary
      </div>
    </>
  )
}

function SettingsArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>System Controls</MiniLabel>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-4">
        <svg className="h-20 w-20" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="28" stroke="#cbd5e1" strokeWidth="4" />
          <circle cx="40" cy="40" r="10" fill="#7c3aed" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <rect
              key={i}
              x="37"
              y="8"
              width="6"
              height="14"
              rx="2"
              fill={i % 2 === 0 ? '#7c3aed' : '#94a3b8'}
              transform={`rotate(${deg} 40 40)`}
            />
          ))}
        </svg>
        <div className="w-full space-y-2">
          {['Market: South Africa', 'SEO: 6 months', 'Ads: R50/day'].map(t => (
            <div key={t} className="flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 shadow-sm">
              <span className="text-[9px] font-bold text-slate-600">{t}</span>
              <div className={`h-5 w-9 rounded-full bg-gradient-to-r ${accent} p-0.5`}>
                <div className="ml-auto h-4 w-4 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function QueueArt({ accent }: { accent: string }) {
  return (
    <>
      <MiniLabel>AI Action Queue</MiniLabel>
      <div className="mt-3 flex-1 space-y-2">
        {[
          { t: 'Publish landing page', p: 'Critical', done: false },
          { t: 'Pause waste keywords', p: 'High', done: false },
          { t: 'Client report send', p: 'Medium', done: true },
        ].map(item => (
          <div
            key={item.t}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm ${item.done ? 'bg-slate-50' : 'bg-white/95'}`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                item.done ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-300'
              } text-[10px]`}
            >
              {item.done ? '✓' : ''}
            </div>
            <span className={`flex-1 text-[10px] font-bold ${item.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {item.t}
            </span>
            {!item.done ? (
              <span className={`rounded-full bg-gradient-to-r ${accent} px-1.5 py-0.5 text-[7px] font-black text-white`}>
                {item.p}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        {['Auto', 'SEO', 'Ads'].map(t => (
          <span key={t} className="rounded-lg bg-orange-50 px-2 py-0.5 text-[8px] font-black text-orange-600">
            {t}
          </span>
        ))}
      </div>
    </>
  )
}
