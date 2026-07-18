'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { resolvePayCompanyMembership } from '@/lib/pay/companyContext'
import '../portal-theme.css'

export default function PayLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    try {
      const membership = await resolvePayCompanyMembership()
      router.replace(membership ? '/pay' : '/pay/onboarding')
    } catch (err) {
      // A real resolution failure (e.g. schema not yet applied, network
      // error) is not the same as "no workspace yet" — resolvePayCompanyMembership
      // already returns null for that case without throwing. Show the
      // error instead of silently routing to onboarding, which would
      // mask the real problem behind a confusing create/join screen.
      setError(err instanceof Error ? err.message : 'Could not resolve your PAY workspace.')
      setLoading(false)
    }
  }

  return (
    <div className="pay-root flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pay-accent)] text-lg font-bold text-white">
            V
          </div>
          <div className="mt-4 text-[15px] font-semibold text-[var(--pay-text)]">VYRON PAY</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--pay-text-faint)]">
            Payroll Intelligence Platform
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--pay-border)] bg-[var(--pay-surface)] p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[var(--pay-text-muted)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] px-3 py-2.5 text-sm text-[var(--pay-text)] outline-none focus:border-[var(--pay-accent)]/50 focus:ring-1 focus:ring-[var(--pay-accent)]/30"
                placeholder="you@company.co.za"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--pay-text-muted)]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] px-3 py-2.5 text-sm text-[var(--pay-text)] outline-none focus:border-[var(--pay-accent)]/50 focus:ring-1 focus:ring-[var(--pay-accent)]/30"
                placeholder="••••••••••"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--pay-accent)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
