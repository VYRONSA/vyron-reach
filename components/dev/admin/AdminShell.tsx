'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/dev/admin', label: 'Overview' },
  { href: '/dev/admin/projects', label: 'Projects' },
]

/**
 * The Administration Centre's own chrome — deliberately separate from
 * DevPortalShell/DevSidebar. This is where the owner configures the
 * Development Operating System itself, not where day-to-day development
 * happens, so it doesn't share navigation, preferences, or focus mode
 * with the workspace. The amber accent (see .dev-admin-root in
 * portal-theme.css) is the other half of that visual separation.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div data-theme="dark" className="dev-root dev-admin-root">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-[var(--dev-border)] bg-[var(--dev-sidebar)] px-4 py-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 font-mono text-sm font-bold text-white">
              A
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-none text-[var(--dev-text)]">Administration</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--dev-text-faint)]">
                Owner Only
              </div>
            </div>
          </div>

          <nav className="mt-8 flex-1 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = item.href === '/dev/admin' ? pathname === '/dev/admin' : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)] ring-1 ring-inset ring-[var(--dev-accent)]/20'
                      : 'text-[var(--dev-text-muted)] hover:bg-[var(--dev-surface-hover)] hover:text-[var(--dev-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Link
            href="/dev"
            className="flex items-center justify-between rounded-lg border border-[var(--dev-border-strong)] px-3 py-2.5 text-[13px] font-medium text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/30 hover:text-[var(--dev-text)]"
          >
            Exit to Development Workspace
            <span className="text-[var(--dev-text-faint)]">&rarr;</span>
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="min-w-0">
            <div className="mx-auto max-w-[1100px] px-8 py-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
