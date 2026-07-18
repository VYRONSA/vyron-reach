'use client'

import { useEffect, useState } from 'react'
import { getSupabaseUserId, supabase } from '@/lib/supabase'
import '../portal-theme.css'

type Mode = 'create' | 'join'

export default function PayOnboardingPage() {
  const [mode, setMode] = useState<Mode>('create')
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const userId = await getSupabaseUserId()
      if (!userId) window.location.href = '/pay/login'
    })()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const email = sessionData.session?.user?.email ?? ''
      const { error: rpcError } = await supabase.rpc('vyron_pay_create_company', {
        p_company_name: companyName,
        p_contact_email: email,
      })
      if (rpcError) throw new Error(rpcError.message)
      window.location.href = '/pay'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const email = sessionData.session?.user?.email ?? ''
      const { error: rpcError } = await supabase.rpc('vyron_pay_join_company_by_code', {
        p_invite_code: inviteCode.trim(),
        p_email: email,
      })
      if (rpcError) throw new Error(rpcError.message)
      window.location.href = '/pay'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join workspace. Check the invite code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pay-root flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--pay-border)] bg-[var(--pay-surface)] p-10 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pay-accent)] text-lg font-bold text-white">
            V
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--pay-text)]">Set Up Workspace</h2>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-[var(--pay-text-faint)]">
            One more step before you start
          </p>
        </div>

        <div className="mb-8 flex gap-2 rounded-2xl bg-[var(--pay-surface-hover)] p-1.5">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition ${mode === 'create' ? 'bg-[var(--pay-surface)] text-[var(--pay-text)] shadow' : 'text-[var(--pay-text-faint)]'}`}
          >
            Create Workspace
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition ${mode === 'join' ? 'bg-[var(--pay-surface)] text-[var(--pay-text)] shadow' : 'text-[var(--pay-text-faint)]'}`}
          >
            Join Workspace
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-xs font-medium text-rose-600">{error}</div>
        ) : null}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-bold uppercase text-[var(--pay-text-faint)]">
                Company Name
              </label>
              <input
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Manufacturing (Pty) Ltd"
                className="w-full rounded-2xl border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] p-4 text-sm font-medium text-[var(--pay-text)] outline-none focus:border-[var(--pay-accent)]"
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--pay-accent)] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-90"
            >
              {loading ? 'Creating…' : 'Create Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-bold uppercase text-[var(--pay-text-faint)]">
                Invite Code
              </label>
              <input
                required
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="e.g. 8f3a1c2d"
                className="w-full rounded-2xl border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] p-4 text-sm font-medium text-[var(--pay-text)] outline-none focus:border-[var(--pay-accent)]"
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--pay-accent)] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-90"
            >
              {loading ? 'Joining…' : 'Join Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
