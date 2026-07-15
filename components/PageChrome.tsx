'use client'

import type { ReactNode } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { DrillDownPage } from '@/components/DrillDownPanel'

type PageChromeProps = {
  children: ReactNode
}

/*
  VYRON REACH DUPLICATE HERO FIX

  This file intentionally DOES NOT render a global hero/banner.

  Reason:
  Every VYRON REACH page already renders its own approved page-specific hero.
  The old PageChrome was adding a second global hero above every page, causing:
  - duplicated top sections
  - duplicated page titles
  - duplicated backgrounds
  - duplicated descriptions
  - stacked command-centre blocks

  Correct architecture:
  PageChrome = topbar + drill wrapper only.
  Individual pages = their own hero + cards + graphs + layout.
*/

export function PageChrome({ children }: PageChromeProps) {
  const { drill, closeDrill, logout } = useAppNavigation()

  if (drill) {
    return (
      <div className="space-y-6">
        <PremiumTopbar />

        <button
          type="button"
          onClick={closeDrill}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          ← Back to {drill.previousPage || 'Previous page'}
        </button>

        <DrillDownPage record={drill} onBack={closeDrill} onLogout={logout} embedded />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PremiumTopbar />
      {children}
    </div>
  )
}

function PremiumTopbar() {
  return (
    <header className="flex items-center justify-between gap-5">
      <div className="flex h-12 w-[520px] max-w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl">
        <svg
          className="h-5 w-5 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>

        <input
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
          placeholder="Search intelligence, campaigns, assets, reports..."
        />

        <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-500">
          ⌘K
        </span>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <TopIcon label="🔔" badge="8" />
        <TopIcon label="💬" badge="12" />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black text-white shadow-sm">
          AI
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-sm font-black text-white">
          AV
        </div>

        <div>
          <div className="text-sm font-black text-slate-950">VYRON Admin</div>
          <div className="text-xs font-semibold text-slate-500">Enterprise</div>
        </div>
      </div>
    </header>
  )
}

function TopIcon({ label, badge }: { label: string; badge: string }) {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm backdrop-blur-xl">
      <span>{label}</span>
      <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 py-0.5 text-[9px] font-black text-white">
        {badge}
      </span>
    </div>
  )
}

export function LogoutButton({
  onLogout,
}: {
  onLogout: () => void
  variant?: 'default' | 'hero' | 'sidebar'
}) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
    >
      Logout
    </button>
  )
}
