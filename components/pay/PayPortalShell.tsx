'use client'

import type { ReactNode } from 'react'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { PaySidebar } from './PaySidebar'
import { PayTopbar } from './PayTopbar'

function PayLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-[var(--pay-text-muted)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--pay-accent)] border-t-transparent" />
        Loading your PAY workspace…
      </div>
    </div>
  )
}

function PayErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-medium text-rose-700">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export function PayPortalShell({ children }: { children: ReactNode }) {
  const { loading, error, company, membership, refresh } = usePayCompany()

  if (error) {
    return <PayErrorScreen message={error} onRetry={refresh} />
  }

  if (loading || !company) {
    return <PayLoadingScreen />
  }

  return (
    <div className="flex min-h-screen">
      <PaySidebar companyName={company.companyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PayTopbar role={membership?.role ?? null} />
        <main className="min-w-0 flex-1">
          <div className="pay-fade-in mx-auto max-w-[1240px] px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
