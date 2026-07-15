'use client'

import {
  detectBrand,
  resolveCampaignSpec,
  type BrandProfile,
} from '@/lib/enterpriseCreativeEngine'
import type { CreativeLayoutType, EnterpriseCampaignSpec, VyronCreative } from '@/lib/vyronStore/types'

type Mode = 'thumbnail' | 'preview' | 'full'

const THEME_ACCENT: Record<string, { glow: string; accent: string; accent2: string }> = {
  'Futuristic AI': { glow: 'rgba(34,211,238,0.35)', accent: '#22d3ee', accent2: '#a78bfa' },
  'Corporate Clean': { glow: 'rgba(148,163,184,0.25)', accent: '#94a3b8', accent2: '#3b82f6' },
  'High Energy Growth': { glow: 'rgba(249,115,22,0.35)', accent: '#f97316', accent2: '#ec4899' },
  'Executive Enterprise': { glow: 'rgba(59,130,246,0.3)', accent: '#3b82f6', accent2: '#1e3a5f' },
  'South African Market Focus': { glow: 'rgba(16,185,129,0.3)', accent: '#10b981', accent2: '#22d3ee' },
}

const BRAND_BG: Record<BrandProfile, string> = {
  vyron: 'from-[#050b18] via-[#0c1830] to-[#0f2847]',
  bridgewater: 'from-[#041612] via-[#0a2820] to-[#1a3d2e]',
  cuisine: 'from-[#1a0a06] via-[#2d1208] to-[#4a1c0c]',
  generic: 'from-slate-950 via-slate-900 to-slate-800',
}

function aspectForLayout(layout: CreativeLayoutType): string {
  if (layout === 'LinkedIn Corporate' || layout === 'Billboard') return 'aspect-[1.91/1]'
  if (layout === 'Poster') return 'aspect-[4/5]'
  if (layout === 'WhatsApp Promo' || layout === 'Social Ad') return 'aspect-square'
  return 'aspect-auto min-h-[420px]'
}

export function EnterpriseCampaignCreative({
  creative,
  mode = 'preview',
  showMeta = true,
}: {
  creative: VyronCreative
  mode?: Mode
  showMeta?: boolean
}) {
  const spec = resolveCampaignSpec(creative)
  const brand = detectBrand(creative.clientName, creative.productName)
  const theme = THEME_ACCENT[spec.theme] ?? THEME_ACCENT['Futuristic AI']
  const compact = mode === 'thumbnail'
  const full = mode === 'full'

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[20px] bg-gradient-to-br ${BRAND_BG[brand]} ${aspectForLayout(spec.layout)} ${
        compact ? 'text-[10px]' : 'text-sm'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 70% 20%, ${theme.glow}, transparent 55%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(124,58,237,0.2), transparent 50%)`,
        }}
      />
      <div className={`relative z-10 flex h-full flex-col ${compact ? 'p-3' : full ? 'p-6' : 'p-4'}`}>
        <Header spec={spec} brand={brand} compact={compact} theme={theme} />
        {!compact && (
          <>
            <StoryStrip spec={spec} compact={compact} />
            <ProductVisuals spec={spec} brand={brand} compact={compact} full={full} theme={theme} />
          </>
        )}
        {compact ? <CompactVisual brand={brand} theme={theme} /> : null}
        <FeatureGrid spec={spec} compact={compact} theme={theme} />
        {!compact && <OutcomeBar spec={spec} />}
        <CtaFooter spec={spec} compact={compact} theme={theme} />
      </div>
      {creative.version ? (
        <span className="absolute right-2 top-2 z-20 rounded-full bg-black/50 px-2 py-0.5 text-[8px] font-black uppercase text-white">
          V{creative.version}
        </span>
      ) : null}
      {showMeta && !compact ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-[9px] font-black uppercase text-white/70">{spec.layout}</span>
          <span className="text-[9px] font-black uppercase text-cyan-300/90">{spec.theme}</span>
        </div>
      ) : null}
    </div>
  )
}

function Header({
  spec,
  brand,
  compact,
  theme,
}: {
  spec: EnterpriseCampaignSpec
  brand: BrandProfile
  compact: boolean
  theme: { accent: string; accent2: string }
}) {
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
        >
          {spec.brandLabel}
        </span>
        {brand === 'vyron' ? (
          <span className="rounded-full border border-cyan-400/60 bg-cyan-500/20 px-2 py-0.5 text-[8px] font-black uppercase text-cyan-200">
            ● Live
          </span>
        ) : null}
      </div>
      <h3
        className={`mt-2 font-black uppercase leading-[1.05] tracking-tight text-white ${
          compact ? 'text-sm' : 'text-xl sm:text-2xl'
        }`}
      >
        {spec.headline}
      </h3>
      {!compact ? (
        <p className="mt-1 max-w-xl text-[11px] font-semibold leading-snug text-slate-300">{spec.subheadline}</p>
      ) : null}
    </div>
  )
}

function StoryStrip({ spec, compact }: { spec: EnterpriseCampaignSpec; compact: boolean }) {
  return (
    <div className={`mb-3 grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
      <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2">
        <p className="text-[8px] font-black uppercase text-red-300">The problem</p>
        <p className="mt-0.5 text-[10px] font-semibold leading-snug text-red-100/90">{spec.problem}</p>
      </div>
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/25 px-3 py-2">
        <p className="text-[8px] font-black uppercase text-cyan-300">The solution</p>
        <p className="mt-0.5 text-[10px] font-semibold leading-snug text-cyan-50/90">{spec.solution}</p>
      </div>
    </div>
  )
}

function ProductVisuals({
  spec,
  brand,
  compact,
  full,
  theme,
}: {
  spec: EnterpriseCampaignSpec
  brand: BrandProfile
  compact: boolean
  full: boolean
  theme: { accent: string; accent2: string }
}) {
  return (
    <div className={`mb-3 grid gap-2 ${full ? 'lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-5'}`}>
      <div className={`${full ? 'lg:col-span-3' : 'sm:col-span-3'} rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow-2xl`}>
        <p className="mb-1 text-[8px] font-black uppercase text-slate-500">Command centre</p>
        <DashboardMock brand={brand} kpis={spec.kpis} theme={theme} />
        <p className="mt-2 text-[9px] font-medium leading-snug text-slate-400">{spec.productExplanation}</p>
      </div>
      <div className={`${full ? 'lg:col-span-2' : 'sm:col-span-2'} flex flex-col gap-2`}>
        <MobileMock brand={brand} theme={theme} />
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-2 py-1.5">
          <p className="text-[8px] font-black uppercase text-violet-300">Who it helps</p>
          <p className="text-[9px] font-semibold text-violet-100/90">{spec.whoItHelps}</p>
        </div>
      </div>
    </div>
  )
}

function DashboardMock({
  brand,
  kpis,
  theme,
}: {
  brand: BrandProfile
  kpis: EnterpriseCampaignSpec['kpis']
  theme: { accent: string; accent2: string }
}) {
  return (
    <div className="rounded-xl bg-[#0d1526] p-2 ring-1 ring-white/10">
      <div className="mb-2 flex gap-1">
        {['#ef4444', '#eab308', '#22c55e'].map(c => (
          <div key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
        <div className="ml-2 h-2 flex-1 rounded bg-white/5" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {kpis.map(k => (
          <div
            key={k.label}
            className="rounded-lg p-1.5"
            style={{ background: `linear-gradient(145deg, ${theme.accent}22, transparent)` }}
          >
            <p className="text-[7px] font-bold uppercase text-slate-500">{k.label}</p>
            <p className="text-[11px] font-black text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 h-14">
        {[65, 40, 85, 55, 70, 45, 90, 60].map((h, i) => (
          <div
            key={i}
            className="rounded-sm self-end"
            style={{
              height: `${h}%`,
              background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent2})`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      {brand === 'vyron' ? (
        <div className="mt-2 grid grid-cols-2 gap-1 text-[7px] font-bold text-slate-400">
          <div className="rounded bg-white/5 px-1 py-0.5">Roster · Live</div>
          <div className="rounded bg-cyan-500/20 px-1 py-0.5 text-cyan-200">HR Alert · 2</div>
        </div>
      ) : null}
    </div>
  )
}

function MobileMock({ brand, theme }: { brand: BrandProfile; theme: { accent: string } }) {
  return (
    <div className="mx-auto w-[72%] rounded-[14px] border-2 border-slate-600 bg-slate-900 p-1 shadow-xl">
      <div className="h-1 w-8 mx-auto rounded-full bg-slate-700 mb-1" />
      <div className="rounded-lg bg-[#0a1020] p-2 min-h-[80px]">
        <p className="text-[8px] font-black text-white">
          {brand === 'vyron' ? 'Clock In' : brand === 'bridgewater' ? 'Shop' : 'Quote'}
        </p>
        <div className="mt-2 space-y-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-2 rounded bg-white/10" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
        <div
          className="mt-2 rounded-md py-1 text-center text-[7px] font-black uppercase text-white"
          style={{ background: theme.accent }}
        >
          {brand === 'vyron' ? 'Sync Payroll' : 'Order'}
        </div>
      </div>
    </div>
  )
}

function CompactVisual({ brand, theme }: { brand: BrandProfile; theme: { accent: string; accent2: string } }) {
  return (
    <div className="mb-2 grid grid-cols-2 gap-1.5">
      <div className="h-16 rounded-lg bg-slate-950/80 ring-1 ring-white/10 p-1">
        <div className="flex gap-0.5 h-8 items-end">
          {[50, 70, 40, 80].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${h}%`, background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent2})` }}
            />
          ))}
        </div>
      </div>
      <div className="h-16 rounded-lg border border-white/10 bg-slate-900/80 p-1 flex items-center justify-center">
        <span className="text-[8px] font-black text-white/80">
          {brand === 'vyron' ? '📊 KPI' : brand === 'bridgewater' ? '🍾' : '🍱'}
        </span>
      </div>
    </div>
  )
}

function FeatureGrid({
  spec,
  compact,
  theme,
}: {
  spec: EnterpriseCampaignSpec
  compact: boolean
  theme: { accent: string }
}) {
  const items = compact ? spec.features.slice(0, 3) : spec.features
  return (
    <div className={`mb-2 grid gap-1 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
      {items.map(f => (
        <div
          key={f.title}
          className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 backdrop-blur-sm"
        >
          <span className="text-[10px]" style={{ color: theme.accent }}>
            {f.icon}
          </span>
          <p className="text-[8px] font-black uppercase leading-tight text-white">{f.title}</p>
          {!compact ? (
            <p className="mt-0.5 text-[7px] font-medium leading-tight text-slate-400 line-clamp-2">
              {f.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function OutcomeBar({ spec }: { spec: EnterpriseCampaignSpec }) {
  return (
    <div className="mb-2 rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-3 py-2">
      <p className="text-[8px] font-black uppercase text-emerald-400">Business outcome</p>
      <p className="text-[10px] font-bold text-emerald-100">{spec.businessOutcome}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {spec.benefits.slice(0, 3).map(b => (
          <span key={b} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-semibold text-emerald-200">
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}

function CtaFooter({
  spec,
  compact,
  theme,
}: {
  spec: EnterpriseCampaignSpec
  compact: boolean
  theme: { accent: string; accent2: string }
}) {
  return (
    <div
      className={`mt-auto rounded-xl px-3 py-2 ${compact ? 'py-1.5' : ''}`}
      style={{ background: `linear-gradient(90deg, ${theme.accent}33, ${theme.accent2}22)` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 font-black uppercase text-white shadow-lg ${
            compact ? 'text-[8px]' : 'text-[10px]'
          }`}
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
        >
          {spec.cta}
        </button>
        {spec.ctaSecondary && !compact ? (
          <span className="text-[9px] font-black uppercase text-white/70">{spec.ctaSecondary}</span>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-1.5 flex flex-wrap gap-3 text-[9px] font-semibold text-slate-400">
          <span>{spec.website}</span>
          <span>{spec.contact}</span>
        </div>
      ) : null}
    </div>
  )
}
