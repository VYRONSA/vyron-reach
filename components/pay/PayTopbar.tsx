'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PayBadge } from './ui'
import type { PayUserRole } from '@/lib/pay/types'

export function PayTopbar({ role }: { role: PayUserRole | null }) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setEmail(data.session?.user?.email ?? null)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/pay/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--pay-border)] bg-[var(--pay-surface)] px-8">
      <div className="text-sm text-[var(--pay-text-muted)]">
        {email ? <span>Signed in as <span className="text-[var(--pay-text)]">{email}</span></span> : null}
      </div>
      <div className="flex items-center gap-3">
        {role ? <PayBadge tone="info">{role}</PayBadge> : null}
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-[var(--pay-border-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--pay-text-muted)] transition-colors hover:border-[var(--pay-accent)]/40 hover:text-[var(--pay-text)]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
