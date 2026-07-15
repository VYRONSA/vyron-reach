'use client'

import React from 'react'

export type Kpi = {
  label: string
  value: string
  delta: string
  color: string
  icon: string
}

const nav = [
  'Dashboard',
  'Campaigns',
  'Revenue',
  'Websites',
  'Automation',
  'AI Content Factory',
  'Audience Intelligence',
  'Market Intelligence',
  'Integrations',
  'Reports',
  'Production AI',
  'Growth Intelligence',
  'Workflow Engine',
  'Competitor Tracking',
  'Trend Intelligence',
  'Industry Analysis',
  'Opportunity Finder',
  'AI Video Studio',
  'AI Image Studio',
  'Voice Studio',
]

export function ReachPageShell(props: {
  active: string
  eyebrow: string
  title: string
  subtitle: string
  liveLabel: string
  kpis: Kpi[]
  theme: string
  children: React.ReactNode
}) {
  return (
    <main className={pageBackground(props.theme)}>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 h-screen w-[292px] shrink-0 overflow-y-auto bg-gradient-to-b from-[#0b0d2f] via-[#071a3a] to-[#08051f] px-6 py-7 text-white shadow-[18px_0_55px_rgba(15,23,42,0.18)]">
          <div className="flex items-center gap-4">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-500 text-2xl font-black shadow-[0_18px_45px_rgba(124,58,237,0.45)]">
              V
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.58em] text-slate-300">Vyron</div>
              <div className="text-[28px] font-black uppercase leading-none tracking-[0.12em]">Reach</div>
              <div className="mt-2 text-[8px] font-black uppercase tracking-[0.35em] text-slate-400">Revenue Command OS</div>
            </div>
          </div>

          <div className="mt-9 text-[11px] font-black uppercase tracking-[0.30em] text-slate-400">Workspace</div>
          <div className="mt-3 space-y-2">
            {nav.map(item => (
              <button
                key={item}
                className={`flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-extrabold transition ${
                  props.active === item
                    ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-500 text-white shadow-[0_16px_36px_rgba(88,80,255,0.35)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                <span className="truncate">{item}</span>
                <span className="ml-auto opacity-70">›</span>
              </button>
            ))}
          </div>

          <button className="mt-10 flex h-14 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-500 px-5 text-sm font-black uppercase tracking-[0.18em] text-white">
            Logout <span>↪</span>
          </button>
        </aside>

        <section className="relative min-w-0 flex-1 px-8 py-6">
          <DecorativePageAtmosphere active={props.active} theme={props.theme} />

          <header className="relative z-10 mb-5 flex items-center justify-between gap-5">
            <div className="flex h-12 w-[520px] max-w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 shadow-sm backdrop-blur-xl">
              <span className="text-slate-500">⌕</span>
              <input
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500"
                placeholder="Search intelligence, campaigns, assets, reports..."
              />
              <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-500">⌘K</span>
            </div>
            <div className="flex items-center gap-4">
              <TopBadge text="🔔" />
              <TopBadge text="💬" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black text-white">AI</div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-sm font-black text-white">AV</div>
              <div>
                <div className="text-sm font-black">VYRON Admin</div>
                <div className="text-xs font-semibold text-slate-500">Enterprise</div>
              </div>
            </div>
          </header>

          <section className="relative z-10 mb-5 min-h-[270px] overflow-hidden rounded-[30px] border border-white/80 bg-white/80 shadow-[0_20px_70px_rgba(59,130,246,0.12)] backdrop-blur-xl">
            <HeroVisual active={props.active} theme={props.theme} />
            <div className="relative z-10 max-w-[720px] p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.30em] text-violet-700">{props.eyebrow}</p>
              <h1 className="mt-5 text-[46px] font-black leading-[1.02] tracking-[-0.055em]">{props.title}</h1>
              <p className="mt-5 max-w-[650px] text-[15px] font-semibold leading-7 text-slate-600">{props.subtitle}</p>
              <div className="mt-7 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
                {props.liveLabel}
              </div>
            </div>
          </section>

          <section className="relative z-10 mb-5 grid gap-4 xl:grid-cols-6">
            {props.kpis.map(k => <KpiCard key={k.label} kpi={k} />)}
          </section>

          <div className="relative z-10">{props.children}</div>
        </section>
      </div>
    </main>
  )
}

function pageBackground(theme: string) {
  const map: Record<string, string> = {
    finance: 'min-h-screen bg-[radial-gradient(circle_at_80%_4%,rgba(124,58,237,.20),transparent_30%),radial-gradient(circle_at_64%_26%,rgba(34,211,238,.16),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#edf7ff_48%,#fff5fb_100%)] text-slate-950',
    campaign: 'min-h-screen bg-[radial-gradient(circle_at_78%_8%,rgba(236,72,153,.24),transparent_30%),radial-gradient(circle_at_62%_34%,rgba(37,99,235,.20),transparent_34%),linear-gradient(135deg,#fff8fb_0%,#eef6ff_45%,#f7f2ff_100%)] text-slate-950',
    revenue: 'min-h-screen bg-[radial-gradient(circle_at_72%_8%,rgba(16,185,129,.20),transparent_28%),radial-gradient(circle_at_60%_32%,rgba(124,58,237,.14),transparent_34%),linear-gradient(135deg,#ffffff_0%,#effdf6_44%,#f5f3ff_100%)] text-slate-950',
    websites: 'min-h-screen bg-[radial-gradient(circle_at_76%_10%,rgba(34,211,238,.25),transparent_30%),radial-gradient(circle_at_58%_34%,rgba(37,99,235,.18),transparent_32%),linear-gradient(135deg,#f8fdff_0%,#eff8ff_50%,#ffffff_100%)] text-slate-950',
    automation: 'min-h-screen bg-[radial-gradient(circle_at_78%_8%,rgba(124,58,237,.24),transparent_30%),radial-gradient(circle_at_62%_36%,rgba(34,211,238,.20),transparent_34%),linear-gradient(135deg,#fbf8ff_0%,#eef7ff_52%,#ffffff_100%)] text-slate-950',
    content: 'min-h-screen bg-[radial-gradient(circle_at_76%_8%,rgba(236,72,153,.20),transparent_30%),radial-gradient(circle_at_60%_34%,rgba(34,211,238,.20),transparent_34%),linear-gradient(135deg,#ffffff_0%,#fff4fb_42%,#eff8ff_100%)] text-slate-950',
    audience: 'min-h-screen bg-[radial-gradient(circle_at_76%_10%,rgba(124,58,237,.18),transparent_30%),radial-gradient(circle_at_60%_34%,rgba(16,185,129,.16),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f5f3ff_48%,#ecfdf5_100%)] text-slate-950',
    market: 'min-h-screen bg-[radial-gradient(circle_at_76%_10%,rgba(99,102,241,.22),transparent_30%),radial-gradient(circle_at_60%_34%,rgba(34,211,238,.14),transparent_34%),linear-gradient(135deg,#ffffff_0%,#eef2ff_48%,#eff6ff_100%)] text-slate-950',
    integrations: 'min-h-screen bg-[radial-gradient(circle_at_76%_10%,rgba(37,99,235,.20),transparent_30%),radial-gradient(circle_at_60%_34%,rgba(168,85,247,.16),transparent_34%),linear-gradient(135deg,#ffffff_0%,#eef7ff_48%,#faf5ff_100%)] text-slate-950',
    reports: 'min-h-screen bg-[radial-gradient(circle_at_76%_10%,rgba(124,58,237,.16),transparent_30%),radial-gradient(circle_at_60%_34%,rgba(15,23,42,.08),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#f5f3ff_100%)] text-slate-950',
  }
  return map[theme] || map.finance
}

function DecorativePageAtmosphere({ active, theme }: { active: string; theme: string }) {
  const badgeText = active.includes('Campaign') || active === 'Campaigns'
    ? ['Facebook Ads', 'Instagram Reels', 'Google Ads']
    : active.includes('Website') || active === 'Websites'
      ? ['SEO Rank #1', 'Google Search', 'Heatmap']
      : active.includes('Content') || active.includes('Video') || active.includes('Image')
        ? ['AI Creative', 'Video Render', 'Brand Assets']
        : active.includes('Revenue') || active.includes('Billing')
          ? ['ROAS 7.8x', 'Pipeline R84M', 'Profit +42%']
          : ['VYRON CORE', 'VYRON COST', 'VYRON FARM']

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-violet-400/10 blur-[80px]" />
      <div className="absolute bottom-10 right-60 h-72 w-72 rounded-full bg-cyan-400/10 blur-[90px]" />
      <div className="absolute left-10 top-[420px] h-60 w-60 rounded-full bg-pink-400/8 blur-[80px]" />
      <div className="absolute right-14 top-[420px] hidden rotate-6 gap-3 xl:grid">
        {badgeText.map((text, i) => (
          <div
            key={text}
            className="rounded-2xl border border-white/60 bg-white/45 px-5 py-3 text-xs font-black text-slate-700 shadow-[0_16px_50px_rgba(15,23,42,.08)] backdrop-blur-xl"
            style={{ marginLeft: `${i * 18}px` }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroVisual({ active, theme }: { active: string; theme: string }) {
  const type = visualType(active, theme)
  return (
    <div className="absolute inset-y-0 right-0 w-[52%] overflow-hidden">
      <div className={heroBackground(theme)} />
      {type === 'ads' && <AdsVisual />}
      {type === 'seo' && <SeoVisual />}
      {type === 'finance' && <FinanceVisual />}
      {type === 'automation' && <AutomationVisual />}
      {type === 'creative' && <CreativeVisual />}
      {type === 'audience' && <AudienceVisual />}
      {type === 'ecosystem' && <EcosystemVisual />}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/80 via-white/30 to-transparent" />
    </div>
  )
}

function visualType(active: string, theme: string) {
  if (active.includes('Campaign') || active === 'Campaigns' || active.includes('Social')) return 'ads'
  if (active.includes('Website') || active.includes('SEO') || active.includes('Funnel')) return 'seo'
  if (active.includes('Revenue') || active.includes('Billing') || theme === 'revenue') return 'finance'
  if (active.includes('Automation') || active.includes('Workflow') || active.includes('Orchestration') || theme === 'automation') return 'automation'
  if (active.includes('Content') || active.includes('Video') || active.includes('Image') || active.includes('Voice')) return 'creative'
  if (active.includes('Audience') || active.includes('Market') || active.includes('Trend') || active.includes('Industry')) return 'audience'
  return 'ecosystem'
}

function heroBackground(theme: string) {
  const map: Record<string, string> = {
    finance: 'absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(34,211,238,.38),transparent_32%),radial-gradient(circle_at_52%_32%,rgba(124,58,237,.36),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.15),rgba(59,130,246,.25))]',
    campaign: 'absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(236,72,153,.58),transparent_32%),radial-gradient(circle_at_70%_40%,rgba(37,99,235,.55),transparent_36%),linear-gradient(135deg,#071a3a,#7c3aed)]',
    revenue: 'absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(16,185,129,.38),transparent_34%),radial-gradient(circle_at_50%_36%,rgba(124,58,237,.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.65),rgba(239,246,255,.9))]',
    websites: 'absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(34,211,238,.38),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.35),rgba(30,64,175,.45))]',
    automation: 'absolute inset-0 bg-[radial-gradient(circle_at_65%_42%,rgba(124,58,237,.40),transparent_34%),radial-gradient(circle_at_80%_44%,rgba(34,211,238,.34),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.4),rgba(237,233,254,.95))]',
    content: 'absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(34,211,238,.34),transparent_32%),radial-gradient(circle_at_55%_34%,rgba(236,72,153,.32),transparent_30%),linear-gradient(135deg,rgba(255,255,255,.7),rgba(239,246,255,.85))]',
    audience: 'absolute inset-0 bg-[radial-gradient(circle_at_66%_44%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_82%_38%,rgba(16,185,129,.26),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.8),rgba(245,243,255,.9))]',
    market: 'absolute inset-0 bg-[radial-gradient(circle_at_66%_44%,rgba(99,102,241,.38),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.8),rgba(239,246,255,.9))]',
    integrations: 'absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(124,58,237,.34),transparent_32%),radial-gradient(circle_at_80%_35%,rgba(34,211,238,.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.85),rgba(245,243,255,.9))]',
    reports: 'absolute inset-0 bg-[radial-gradient(circle_at_64%_42%,rgba(124,58,237,.26),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.85),rgba(245,243,255,.95))]',
  }
  return map[theme] || map.finance
}

function AdsVisual() {
  return (
    <>
      <FloatingCard className="right-16 top-8 w-52" title="Facebook Ads" value="+42% CTR" color="#1877F2" />
      <FloatingCard className="right-44 top-28 w-52" title="Instagram Reels" value="1.8M Reach" color="#E1306C" />
      <FloatingCard className="right-12 bottom-10 w-56" title="Google Ads" value="ROAS 6.4x" color="#4285F4" />
      <PhoneMock className="right-72 top-10" />
    </>
  )
}

function SeoVisual() {
  return (
    <>
      <FloatingCard className="right-12 top-8 w-64" title="Google Ranking" value="#1 Keyword" color="#4285F4" />
      <div className="absolute right-16 top-28 w-72 rounded-3xl border border-white/60 bg-white/35 p-4 backdrop-blur-xl">
        <div className="mb-3 h-3 w-32 rounded-full bg-emerald-400" />
        {[90, 72, 84, 54].map((w, i) => <div key={i} className="mb-2 h-2 rounded-full bg-white/70"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${w}%` }} /></div>)}
      </div>
      <BrowserMock className="right-64 bottom-10" />
    </>
  )
}

function FinanceVisual() {
  return (
    <>
      <FloatingCard className="right-12 top-8 w-56" title="Revenue" value="R 24.8M" color="#10B981" />
      <FloatingCard className="right-56 top-24 w-56" title="ROAS" value="7.8x" color="#9333EA" />
      <div className="absolute right-20 bottom-8 h-28 w-72 rounded-[34px] border border-white/60 bg-white/30 p-4 backdrop-blur-xl">
        <svg viewBox="0 0 220 70" className="h-full w-full">
          <path d="M5 60 C40 20 70 45 100 25 C130 5 150 50 190 18 L215 10" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    </>
  )
}

function AutomationVisual() {
  return (
    <>
      {[
        ['AI Agent', 'right-16 top-8'],
        ['Trigger', 'right-60 top-28'],
        ['Workflow', 'right-24 bottom-12'],
        ['Deploy', 'right-80 bottom-20'],
      ].map(([title, pos]) => <FloatingCard key={title} className={`${pos} w-44`} title={title} value="Active" color="#7C3AED" />)}
      <svg className="absolute right-28 top-20 h-44 w-80 opacity-60" viewBox="0 0 320 180">
        <path d="M40 40 C120 20 160 120 260 80" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M80 130 C130 80 190 160 280 120" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="8 8" />
      </svg>
    </>
  )
}

function CreativeVisual() {
  return (
    <>
      <FloatingCard className="right-12 top-8 w-56" title="AI Creative" value="Generated" color="#EC4899" />
      <FloatingCard className="right-60 top-28 w-48" title="Video Render" value="92%" color="#22D3EE" />
      <div className="absolute right-20 bottom-8 grid grid-cols-3 gap-3">
        {['bg-pink-400','bg-violet-500','bg-cyan-400','bg-orange-400','bg-emerald-400','bg-blue-500'].map(c => (
          <div key={c} className={`h-20 w-20 rounded-3xl ${c} shadow-lg`} />
        ))}
      </div>
    </>
  )
}

function AudienceVisual() {
  return (
    <>
      <FloatingCard className="right-12 top-8 w-56" title="Audience" value="24.8M" color="#7C3AED" />
      <FloatingCard className="right-56 top-28 w-56" title="Sentiment" value="Positive" color="#10B981" />
      <div className="absolute right-16 bottom-10 flex gap-3">
        {[0,1,2,3,4,5,6].map(i => <div key={i} className="h-16 w-16 rounded-full border-4 border-white/70 bg-gradient-to-br from-violet-400 to-cyan-400 shadow-xl" />)}
      </div>
    </>
  )
}

function EcosystemVisual() {
  return (
    <>
      {['CORE','COST','FARM','MAINT','BUILD','REACH'].map((x, i) => (
        <div
          key={x}
          className="absolute rounded-3xl border border-white/60 bg-white/35 px-5 py-4 text-sm font-black text-slate-800 shadow-xl backdrop-blur-xl"
          style={{ right: `${28 + (i % 3) * 130}px`, top: `${32 + Math.floor(i / 3) * 92}px` }}
        >
          VYRON {x}
        </div>
      ))}
    </>
  )
}

function FloatingCard({ className, title, value, color }: { className: string; title: string; value: string; color: string }) {
  return (
    <div className={`absolute rounded-3xl border border-white/60 bg-white/35 p-4 shadow-xl backdrop-blur-xl ${className}`}>
      <div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function PhoneMock({ className }: { className: string }) {
  return (
    <div className={`absolute h-48 w-28 rounded-[28px] border-4 border-white/70 bg-slate-950 p-2 shadow-2xl ${className}`}>
      <div className="h-full rounded-[22px] bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-400 p-3">
        <div className="h-16 rounded-2xl bg-white/25" />
        <div className="mt-3 h-2 rounded-full bg-white/80" />
        <div className="mt-2 h-2 w-2/3 rounded-full bg-white/60" />
      </div>
    </div>
  )
}

function BrowserMock({ className }: { className: string }) {
  return (
    <div className={`absolute h-40 w-64 rounded-3xl border border-white/60 bg-white/35 p-4 shadow-2xl backdrop-blur-xl ${className}`}>
      <div className="mb-4 flex gap-2"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-yellow-400" /><span className="h-3 w-3 rounded-full bg-green-400" /></div>
      <div className="h-20 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500" />
    </div>
  )
}

function TopBadge({ text }: { text: string }) {
  return <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">{text}</div>
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ background: `${kpi.color}22` }}>{kpi.icon}</div>
      <div className="mt-4 text-xs font-black text-slate-600">{kpi.label}</div>
      <div className="mt-3 text-[28px] font-black tracking-[-0.04em]">{kpi.value}</div>
      <div className={`mt-2 text-xs font-black ${kpi.delta.startsWith('-') ? 'text-pink-500' : 'text-emerald-600'}`}>
        ↑ {kpi.delta} <span className="text-slate-400">vs last 30 days</span>
      </div>
      <Spark color={kpi.color} />
    </div>
  )
}

export function Card({ title, action, children, className = '' }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[18px] border border-slate-200 bg-white/86 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-black">{title}</h2>
        {action && <button className="text-xs font-black text-blue-600">{action}</button>}
      </div>
      {children}
    </section>
  )
}

export function Spark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 140 42" className="mt-4 h-10 w-full">
      <path d="M4 32 L24 20 L44 28 L64 18 L84 26 L104 16 L130 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M4 32 L24 20 L44 28 L64 18 L84 26 L104 16 L130 24 L130 42 L4 42 Z" fill={color} opacity="0.12" />
    </svg>
  )
}

export function LineChart({ color = '#9333ea', second = '#1688ff' }: { color?: string; second?: string }) {
  return (
    <svg viewBox="0 0 520 255" className="h-[255px] w-full">
      {[40,90,140,190,240].map(y => <line key={y} x1="20" x2="500" y1={y} y2={y} stroke="#e5e7eb" />)}
      <path d="M30 210 C85 140 120 170 160 110 C210 40 230 150 270 90 C310 30 350 130 390 70 C430 30 460 80 500 25" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M30 220 C100 200 170 210 230 180 C300 130 310 220 380 190 C430 150 470 145 500 120" fill="none" stroke={second} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function Donut({ label = 'R 67.3M', sub = 'Total' }: { label?: string; sub?: string }) {
  return (
    <div className="flex items-center gap-6">
      <div className="h-40 w-40 rounded-full bg-[conic-gradient(#9333ea_0_35%,#1688ff_35%_63%,#22d3ee_63%_85%,#f97316_85%_100%)] p-7">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
          <div className="text-xl font-black">{label}</div>
          <div className="text-xs font-semibold text-slate-500">{sub}</div>
        </div>
      </div>
      <div className="space-y-3 text-xs font-bold text-slate-700">
        <div>Qualification 35%</div>
        <div>Proposal 28%</div>
        <div>Negotiation 22%</div>
        <div>Closed Won 15%</div>
      </div>
    </div>
  )
}