'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseUserId, supabase } from '@/lib/supabase'
import { resolvePayCompanyMembership, type PayCompanyMembership } from '@/lib/pay/companyContext'
import { getCompany, getPayrollSettings } from '@/lib/pay/companySettings'
import { can } from '@/lib/pay/permissions'
import type { PayCompany, PayPermissionKey, PayrollSettings } from '@/lib/pay/types'

type PayCompanyContextValue = {
  loading: boolean
  error: string | null
  company: PayCompany | null
  membership: PayCompanyMembership | null
  payrollSettings: PayrollSettings | null
  can: (permission: PayPermissionKey) => boolean
  refresh: () => Promise<void>
}

const PayCompanyContext = createContext<PayCompanyContextValue | null>(null)

export function PayCompanyProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<PayCompany | null>(null)
  const [membership, setMembership] = useState<PayCompanyMembership | null>(null)
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = await getSupabaseUserId()
    if (!userId) {
      router.replace('/pay/login')
      return
    }

    try {
      // resolvePayCompanyMembership() returns null (not a throw) for the
      // expected "signed in, not onboarded yet" case — anything that
      // reaches the catch below is a genuine failure (schema not applied,
      // network error, RLS misconfiguration), not a routing decision, so
      // it's surfaced as an error rather than silently bounced to login
      // or onboarding, which would mask the real problem in a loop.
      const membershipResult = await resolvePayCompanyMembership()
      if (!membershipResult) {
        router.replace('/pay/onboarding')
        return
      }

      const [companyResult, settingsResult] = await Promise.all([
        getCompany(membershipResult.companyId),
        getPayrollSettings(membershipResult.companyId),
      ])

      setMembership(membershipResult)
      setCompany(companyResult)
      setPayrollSettings(settingsResult)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your PAY workspace.')
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void bootstrap()
    })
    return () => subscription.unsubscribe()
  }, [bootstrap])

  const canFn = useCallback(
    (permission: PayPermissionKey) => (membership ? can(membership.role, permission) : false),
    [membership],
  )

  const value = useMemo(
    () => ({ loading, error, company, membership, payrollSettings, can: canFn, refresh: bootstrap }),
    [loading, error, company, membership, payrollSettings, canFn, bootstrap],
  )

  return <PayCompanyContext.Provider value={value}>{children}</PayCompanyContext.Provider>
}

export function usePayCompany() {
  const ctx = useContext(PayCompanyContext)
  if (!ctx) throw new Error('usePayCompany must be used within PayCompanyProvider')
  return ctx
}
