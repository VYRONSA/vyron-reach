'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/pay',
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
    href: '/pay/employees',
    label: 'Employees',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.6-3.4 3-5.4 5.5-5.4S14.4 15.6 15 19" />
        <circle cx="17" cy="8.5" r="2.4" />
        <path d="M15.5 13.5c2 .2 3.7 1.9 4.2 5" />
      </svg>
    ),
  },
  {
    href: '/pay/company',
    label: 'Company Setup',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
        <path d="M12 10h7a1 1 0 0 1 1 1v10" />
        <path d="M7 8h1M7 12h1M7 16h1M15 14h1M15 17h1" />
      </svg>
    ),
  },
  {
    href: '/pay/payroll-settings',
    label: 'Payroll Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-6l-.3 2.8a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1c.5.4 1.1.75 1.7 1L9 20.7h6l.3-2.8c.6-.25 1.2-.6 1.7-1l2.4 1 2-3.4Z" />
      </svg>
    ),
  },
  {
    href: '/pay/team',
    label: 'Team',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 19c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5" />
        <path d="M14.5 14.3c2 .2 3.7 1.7 4 4.7" />
      </svg>
    ),
  },
]

export function PaySidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-[var(--pay-border)] bg-[var(--pay-sidebar)] px-4 py-6">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pay-accent)] text-sm font-bold text-white">
          V
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-none text-[var(--pay-text)]">VYRON PAY</div>
          <div className="mt-1 truncate text-[9px] uppercase tracking-[0.18em] text-[var(--pay-text-faint)]">
            {companyName || 'Payroll Intelligence'}
          </div>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/pay' ? pathname === '/pay' : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? 'bg-[var(--pay-accent-soft)] text-[var(--pay-accent)] ring-1 ring-inset ring-[var(--pay-accent)]/20'
                  : 'text-[var(--pay-text-muted)] hover:bg-[var(--pay-surface-hover)] hover:text-[var(--pay-text)]'
              }`}
            >
              <span className={active ? 'text-[var(--pay-accent)]' : 'text-[var(--pay-text-faint)]'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
