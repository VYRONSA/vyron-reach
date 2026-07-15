'use client'

import type { ReactNode } from 'react'
import { LogoutButton } from '@/components/PageChrome'

export function VyronWorkspaceAtmosphere() {
  return (
    <div className="vyron-workspace-bg" aria-hidden>
      <div className="vyron-workspace-grid" />
      <div className="vyron-workspace-vignette" />
    </div>
  )
}

type VyronHeroCardProps = {
  breadcrumbs: string[]
  title: string
  subtitle: string
  onLogout: () => void
  liveLabel?: string
  badge?: string
}

export function VyronHeroCard({
  breadcrumbs,
  title,
  subtitle,
  onLogout,
  liveLabel = 'Live intelligence stream active',
  badge = 'AI Revenue Operations',
}: VyronHeroCardProps) {
  const trail = ['VYRON REACH', ...breadcrumbs]

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/65 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-[90px]" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-56 w-72 rounded-full bg-cyan-400/20 blur-[85px]" />
      <div className="pointer-events-none absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-emerald-400/20 blur-[85px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.08),transparent_35%)]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {badge ? (
            <span className="mb-4 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-violet-700">
              {badge}
            </span>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{trail.join(' / ')}</p>
          <h1 className="mt-4 max-w-5xl text-[2.25rem] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 md:text-[3.1rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-[14px] font-semibold leading-7 text-slate-600">
            {subtitle}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.75)]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
              {liveLabel}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <LogoutButton onLogout={onLogout} variant="hero" />
        </div>
      </div>
    </section>
  )
}

export function VyronBackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/80 px-5 py-3 text-sm font-black text-slate-800 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:border-violet-300 hover:text-violet-700"
    >
      <svg className="h-4 w-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to {label}
    </button>
  )
}

export function VyronHubCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-violet-500/18 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-48 rounded-full bg-cyan-400/16 blur-[60px]" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-700">Intelligence Layer</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">{description}</p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  )
}

export function VyronGlassCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const base = `rounded-[28px] border border-white/70 bg-white/82 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} w-full text-left transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_70px_rgba(124,58,237,0.15)]`}>
        {children}
      </button>
    )
  }
  return <div className={base}>{children}</div>
}

export function VyronKpiCard({
  label,
  value,
  delta,
  sparkline,
  onClick,
}: {
  label: string
  value: string
  delta: string
  sparkline: ReactNode
  onClick?: () => void
}) {
  return (
    <VyronGlassCard onClick={onClick} className="p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-black text-emerald-700">{delta}</p>
      <div className="mt-4">{sparkline}</div>
    </VyronGlassCard>
  )
}

export function VyronActionCard({
  title,
  onClick,
  index,
}: {
  title: string
  onClick?: () => void
  index?: number
}) {
  const inner = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
        <span className="text-sm font-black text-white">{index != null ? index + 1 : '◇'}</span>
      </div>
      <p className="mt-5 line-clamp-2 text-sm font-black leading-snug text-slate-950">{title}</p>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.20em] text-violet-700">
        Open intelligence layer →
      </p>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex min-h-[160px] w-full flex-col justify-between overflow-hidden rounded-[28px] border border-white/70 bg-white/82 p-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_70px_rgba(124,58,237,0.15)]"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/18 blur-[44px]" />
        <div className="relative">{inner}</div>
      </button>
    )
  }

  return (
    <div className="flex min-h-[160px] flex-col justify-between rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      {inner}
    </div>
  )
}

export function VyronAiInsightCard({
  title,
  insight,
  metric,
  onClick,
}: {
  title: string
  insight: string
  metric?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{title}</p>
        {metric ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
            {metric}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-sm font-semibold leading-7 text-slate-650">{insight}</p>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
        AI Recommendation →
      </p>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full rounded-[28px] border border-white/70 bg-white/82 p-6 text-left shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300">
        {content}
      </button>
    )
  }

  return <div className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">{content}</div>
}

export function VyronSparkline({
  color,
  points,
  id,
}: {
  color: string
  points: string
  id: string
}) {
  const areaPath = `M ${points.split(' ').join(' L ')} L 120,36 L 0,36 Z`
  return (
    <svg viewBox="0 0 120 36" className="h-10 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" />
    </svg>
  )
}
