'use client'

import type { ReactNode } from 'react'
import { DASHBOARD_KEY } from '@/lib/enterpriseNav'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { HeroArtwork } from '@/components/owner/HeroArtwork'

export type OwnerTheme =
  | 'dashboard'
  | 'seo'
  | 'ads'
  | 'content'
  | 'competitors'
  | 'rankings'
  | 'clients'
  | 'reports'
  | 'settings'
  | 'automation'
  | 'queue'
  | 'creative'

type OwnerPageShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  theme: OwnerTheme
  children: ReactNode
  /** Dashboard hides the back control */
  hideBack?: boolean
}

const THEME_ACCENT: Record<OwnerTheme, string> = {
  dashboard: 'from-violet-500 to-cyan-400',
  seo: 'from-cyan-400 to-blue-500',
  ads: 'from-fuchsia-500 to-orange-400',
  content: 'from-fuchsia-500 to-violet-500',
  competitors: 'from-indigo-500 to-emerald-400',
  rankings: 'from-emerald-400 to-cyan-400',
  clients: 'from-violet-500 to-blue-500',
  reports: 'from-violet-600 to-indigo-500',
  settings: 'from-slate-600 to-violet-500',
  automation: 'from-violet-500 to-cyan-400',
  queue: 'from-orange-500 to-pink-500',
  creative: 'from-fuchsia-500 to-violet-600',
}

const THEME_GLOW: Record<OwnerTheme, string> = {
  dashboard:
    'radial-gradient(circle at 80% 30%, rgba(124,58,237,0.18), transparent 50%), radial-gradient(circle at 60% 70%, rgba(34,211,238,0.15), transparent 45%)',
  seo: 'radial-gradient(circle at 75% 40%, rgba(34,211,238,0.2), transparent 50%), radial-gradient(circle at 85% 80%, rgba(59,130,246,0.12), transparent 40%)',
  ads: 'radial-gradient(circle at 78% 35%, rgba(236,72,153,0.18), transparent 50%), radial-gradient(circle at 70% 75%, rgba(249,115,22,0.14), transparent 45%)',
  content:
    'radial-gradient(circle at 80% 40%, rgba(217,70,239,0.16), transparent 50%), radial-gradient(circle at 65% 70%, rgba(139,92,246,0.14), transparent 45%)',
  competitors:
    'radial-gradient(circle at 75% 45%, rgba(99,102,241,0.18), transparent 50%), radial-gradient(circle at 82% 75%, rgba(16,185,129,0.12), transparent 45%)',
  rankings:
    'radial-gradient(circle at 78% 38%, rgba(16,185,129,0.18), transparent 50%), radial-gradient(circle at 68% 72%, rgba(34,211,238,0.14), transparent 45%)',
  clients:
    'radial-gradient(circle at 80% 35%, rgba(124,58,237,0.16), transparent 50%), radial-gradient(circle at 72% 78%, rgba(37,99,235,0.12), transparent 45%)',
  reports:
    'radial-gradient(circle at 76% 40%, rgba(79,70,229,0.16), transparent 50%), radial-gradient(circle at 84% 70%, rgba(124,58,237,0.12), transparent 45%)',
  settings:
    'radial-gradient(circle at 78% 42%, rgba(100,116,139,0.12), transparent 50%), radial-gradient(circle at 70% 75%, rgba(124,58,237,0.14), transparent 45%)',
  automation:
    'radial-gradient(circle at 80% 30%, rgba(124,58,237,0.18), transparent 50%), radial-gradient(circle at 60% 70%, rgba(34,211,238,0.15), transparent 45%)',
  queue:
    'radial-gradient(circle at 78% 38%, rgba(249,115,22,0.16), transparent 50%), radial-gradient(circle at 72% 72%, rgba(236,72,153,0.14), transparent 45%)',
  creative:
    'radial-gradient(circle at 78% 35%, rgba(217,70,239,0.18), transparent 50%), radial-gradient(circle at 68% 70%, rgba(124,58,237,0.14), transparent 45%)',
}

export function PageBackButton() {
  const { active, goBack, backLabel, canGoBack } = useAppNavigation()
  if (active === DASHBOARD_KEY) return null

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      ← Back{canGoBack ? ` to ${backLabel}` : ' to Dashboard'}
    </button>
  )
}

export function OwnerPageShell({ eyebrow, title, subtitle, theme, children, hideBack }: OwnerPageShellProps) {
  const accent = THEME_ACCENT[theme]

  return (
    <div className="relative isolate">
      {!hideBack ? (
        <div className="mb-5">
          <PageBackButton />
        </div>
      ) : null}

      {/* Hero — single clipped block; text left, artwork right */}
      <section
        className="relative isolate mb-8 min-h-[300px] overflow-hidden rounded-[34px] border border-slate-200/90 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.10)]"
        style={{ contain: 'layout paint' }}
      >
        {/* z-0 background glow — clipped to hero */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{ background: THEME_GLOW[theme] }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[300px] flex-col lg:flex-row lg:items-stretch">
          {/* Hero text — never overlapped by artwork */}
          <div className="relative z-10 flex shrink-0 flex-col justify-center bg-white px-8 py-8 lg:w-[52%] lg:max-w-[52%] lg:border-r lg:border-slate-100/80">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-600">{eyebrow}</p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">{subtitle}</p>
            <div className="mt-7 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
              Ready for use
            </div>
          </div>

          {/* Hero artwork — contained in right column only */}
          <div className="relative z-10 flex min-h-[220px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50/80 to-white px-6 py-6 lg:min-h-[300px] lg:w-[48%] lg:max-w-[48%]">
            <HeroArtwork theme={theme} accent={accent} />
          </div>
        </div>
      </section>

      {/* Page content — clear flow below hero, no overlap */}
      <div className="relative z-0 space-y-5">{children}</div>
    </div>
  )
}

export function OwnerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`relative rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </section>
  )
}

export function OwnerStatGrid({ stats }: { stats: Array<{ label: string; value: string; color?: string }> }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
          <div className="mt-3 text-3xl font-black tracking-[-0.04em]" style={{ color: stat.color || '#7c3aed' }}>
            {stat.value}
          </div>
        </div>
      ))}
    </section>
  )
}

export function ClickableRow({
  title,
  subtitle,
  badge,
  accent = '#7c3aed',
  onClick,
}: {
  title: string
  subtitle: string
  badge?: string
  accent?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
        style={{ background: accent }}
      >
        {title.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-slate-900">{title}</div>
        <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>
      </div>
      {badge ? (
        <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">
          {badge}
        </span>
      ) : null}
      <span className="text-violet-500 opacity-0 transition group-hover:opacity-100">→</span>
    </button>
  )
}

export function OwnerEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
