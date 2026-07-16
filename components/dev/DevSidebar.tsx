'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/dev',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dev/activity',
    label: 'Activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M3 12h4l2.5-7L14 19l2.5-7H21" />
      </svg>
    ),
  },
  {
    href: '/dev/portfolio',
    label: 'Product Portfolio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <rect x="3.5" y="4" width="17" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    href: '/dev/projects',
    label: 'Projects',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    ),
  },
  {
    href: '/dev/milestones',
    label: 'Milestones',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M5 21V4M5 4h11l-2.5 3.5L16 11H5" />
      </svg>
    ),
  },
  {
    href: '/dev/batches',
    label: 'Batches',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <rect x="4" y="4" width="7" height="7" rx="1.2" />
        <rect x="13" y="4" width="7" height="7" rx="1.2" />
        <rect x="4" y="13" width="7" height="7" rx="1.2" />
        <rect x="13" y="13" width="7" height="7" rx="1.2" />
      </svg>
    ),
  },
  {
    href: '/dev/queue',
    label: 'Development Queue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M4 6h16M4 12h16M4 18h9" />
      </svg>
    ),
  },
  {
    href: '/dev/risks',
    label: 'Risk Register',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M12 3 3 20h18Z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    ),
  },
  {
    href: '/dev/technical-debt',
    label: 'Technical Debt',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M4 20 20 4M4 20l4-1 1-4M20 4l-4 1-1 4" />
      </svg>
    ),
  },
  {
    href: '/dev/decisions',
    label: 'Architecture Decisions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M12 3 3 8v8l9 5 9-5V8Z" />
        <path d="M12 12v9M3 8l9 4 9-4" />
      </svg>
    ),
  },
  {
    href: '/dev/prompts',
    label: 'Prompt Library',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M7 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/dev/journal',
    label: 'Development Journal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    href: '/dev/ai-workspace',
    label: 'AI Workspace',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    ),
  },
  {
    href: '/dev/knowledge',
    label: 'Knowledge Centre',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 1 17.5 21H6.5A2.5 2.5 0 0 1 4 18.5Z" />
        <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
      </svg>
    ),
  },
  {
    href: '/dev/git-build',
    label: 'Git & Build',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="6" cy="18" r="2.2" />
        <circle cx="18" cy="12" r="2.2" />
        <path d="M6 8.2V15.8M8 6c4.5 0 6 2 8 4.4" />
      </svg>
    ),
  },
  {
    href: '/dev/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-6l-.3 2.8a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1c.5.4 1.1.75 1.7 1L9 20.7h6l.3-2.8c.6-.25 1.2-.6 1.7-1l2.4 1 2-3.4Z" />
      </svg>
    ),
  },
]

export function DevSidebar() {
  const pathname = usePathname()
  const { preferences, toggleSidebar } = useDevPreferences()
  const collapsed = preferences.sidebarCollapsed

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--dev-border)] bg-[var(--dev-sidebar)] py-6 transition-[width] duration-150 ${
        collapsed ? 'w-[76px] px-3' : 'w-[248px] px-4'
      }`}
    >
      <div className={`flex items-center gap-2.5 px-2 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 font-mono text-sm font-bold text-white">
          V
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-none text-[var(--dev-text)]">VYRON DEV</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--dev-text-faint)]">
              Internal Portal
            </div>
          </div>
        ) : null}
      </div>

      <nav className="mt-8 flex-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/dev' ? pathname === '/dev' : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                active
                  ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)] ring-1 ring-inset ring-[var(--dev-accent)]/20'
                  : 'text-[var(--dev-text-muted)] hover:bg-[var(--dev-surface-hover)] hover:text-[var(--dev-text)]'
              }`}
            >
              <span className={active ? 'text-[var(--dev-accent)]' : 'text-[var(--dev-text-faint)]'}>{item.icon}</span>
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={toggleSidebar}
        className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--dev-text-faint)] transition-colors hover:bg-[var(--dev-surface-hover)] hover:text-[var(--dev-text-muted)] ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        <span className={`inline-block transition-transform ${collapsed ? 'rotate-180' : ''}`}>&larr;</span>
        {!collapsed ? 'Collapse' : null}
      </button>

      {!collapsed && preferences.displayName ? (
        <div className="mb-2 truncate px-3 text-xs text-[var(--dev-text-faint)]">
          Signed in as <span className="text-[var(--dev-text-muted)]">{preferences.displayName}</span>
        </div>
      ) : null}

      <form action="/api/dev/logout" method="POST">
        <button
          type="submit"
          title={collapsed ? 'Sign out' : undefined}
          className={`flex w-full items-center justify-between rounded-lg border border-[var(--dev-border-strong)] px-3 py-2.5 text-[13px] font-medium text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/30 hover:text-[var(--dev-text)] ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          {!collapsed ? (
            <>
              Sign out
              <span className="text-[var(--dev-text-faint)]">&rarr;</span>
            </>
          ) : (
            <span className="text-[var(--dev-text-faint)]">&rarr;</span>
          )}
        </button>
      </form>
    </aside>
  )
}
