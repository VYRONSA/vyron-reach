'use client'

import { type ReactNode } from 'react'
import {
  buildNavGroups,
  DASHBOARD_KEY,
  type NavIcon,
} from '@/lib/enterpriseNav'
import { useAppNavigation } from '@/context/AppNavigationContext'

type EnterpriseShellProps = {
  children: ReactNode
}

function Icon({ icon }: { icon: NavIcon }) {
  const common = 'h-[18px] w-[18px] shrink-0'
  if (icon === 'dashboard') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="6" height="6" rx="2" />
        <rect x="14" y="4" width="6" height="6" rx="2" />
        <rect x="4" y="14" width="6" height="6" rx="2" />
        <rect x="14" y="14" width="6" height="6" rx="2" />
      </svg>
    )
  }
  if (icon === 'director') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    )
  }
  if (icon === 'campaigns') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </svg>
    )
  }
  if (icon === 'creatives') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 15l3-3 3 3 4-5" />
      </svg>
    )
  }
  if (icon === 'clients') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="10" r="2" />
      </svg>
    )
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
    </svg>
  )
}

export function EnterpriseShell({ children }: EnterpriseShellProps) {
  const { active, navigate, logout } = useAppNavigation()
  const groups = buildNavGroups()

  return (
    <div className="vyron-app flex">
      <aside className="vyron-sidebar sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto px-6 py-7 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-500 text-2xl font-black shadow-[0_18px_45px_rgba(124,58,237,0.45)]">
            V
          </div>

          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.58em] text-slate-300">Vyron</div>
            <div className="text-[28px] font-black uppercase leading-none tracking-[0.12em]">Reach</div>
            <div className="mt-2 text-[8px] font-black uppercase tracking-[0.35em] text-slate-400">
              AI Marketing Platform
            </div>
          </div>
        </div>

        <nav className="mt-9 flex-1 space-y-2">
          {groups.flatMap(g => g.items).map(item => {
            const selected = active === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`vyron-sidebar-link ${selected ? 'vyron-sidebar-link-active' : ''}`}
              >
                <Icon icon={item.icon} />
                <span className="truncate">{item.label}</span>
                {item.key === 'ai-marketing-director' ? (
                  <span className="ml-auto rounded-full bg-violet-500/40 px-2 py-0.5 text-[8px] font-black uppercase">
                    AI
                  </span>
                ) : item.key !== DASHBOARD_KEY ? (
                  <span className="ml-auto opacity-50">›</span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-7 flex h-14 items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-blue-500 px-5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(72,89,255,0.25)]"
        >
          Logout
          <span>↪</span>
        </button>
      </aside>

      <main className="vyron-shell-main min-w-0">
        <div className="vyron-content-max">{children}</div>
      </main>
    </div>
  )
}

export { DASHBOARD_KEY }
