'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DrillRecord } from '@/components/DrillDownPanel'
import { DASHBOARD_KEY, getPageTitle } from '@/lib/enterpriseNav'
import {
  clearExecutionPrefill,
  loadExecutionPrefill,
  saveExecutionPrefill,
  type ExecutionPrefill,
} from '@/lib/executionPrefill'
import { VYRON_STORAGE_KEY } from '@/lib/vyronStore/storage'

type AppNavigationContextValue = {
  active: string
  breadcrumbs: string[]
  canGoBack: boolean
  backLabel: string
  drill: DrillRecord | null
  executionPrefill: ExecutionPrefill | null
  navigate: (key: string) => void
  navigateWithPrefill: (key: string, prefill: ExecutionPrefill) => void
  clearExecutionPrefill: () => void
  goBack: () => void
  openDrill: (record: DrillRecord) => void
  closeDrill: () => void
  logout: () => void
}

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null)

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([DASHBOARD_KEY])
  const [drill, setDrill] = useState<DrillRecord | null>(null)
  const [executionPrefill, setExecutionPrefill] = useState<ExecutionPrefill | null>(null)

  const active = stack[stack.length - 1] ?? DASHBOARD_KEY

  const navigate = useCallback((key: string) => {
    setDrill(null)
    setExecutionPrefill(loadExecutionPrefill())
    setStack(prev => {
      if (prev[prev.length - 1] === key) return prev
      const existing = prev.indexOf(key)
      if (existing >= 0) return prev.slice(0, existing + 1)
      return [...prev, key]
    })
  }, [])

  const navigateWithPrefill = useCallback((key: string, prefill: ExecutionPrefill) => {
    saveExecutionPrefill(prefill)
    setExecutionPrefill(prefill)
    setDrill(null)
    setStack(prev => {
      if (prev[prev.length - 1] === key) return prev
      const existing = prev.indexOf(key)
      if (existing >= 0) return prev.slice(0, existing + 1)
      return [...prev, key]
    })
  }, [])

  const clearPrefill = useCallback(() => {
    clearExecutionPrefill()
    setExecutionPrefill(null)
  }, [])

  const goBack = useCallback(() => {
    if (drill) {
      setDrill(null)
      return
    }
    setStack(prev => {
      if (prev.length > 1) return prev.slice(0, -1)
      if (prev[prev.length - 1] === DASHBOARD_KEY) return prev
      return [DASHBOARD_KEY]
    })
  }, [drill])

  const openDrill = useCallback((record: DrillRecord) => {
    setDrill({
      ...record,
      previousPage: record.previousPage || getPageTitle(active),
    })
  }, [active])

  const closeDrill = useCallback(() => setDrill(null), [])

  const logout = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
    } catch {
      /* demo mode */
    }
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(VYRON_STORAGE_KEY)
      const savedMeta = localStorage.getItem('vyron-reach-owner-meta-v2')
      localStorage.clear()
      sessionStorage.clear()
      if (savedData) localStorage.setItem(VYRON_STORAGE_KEY, savedData)
      if (savedMeta) localStorage.setItem('vyron-reach-owner-meta-v2', savedMeta)
      window.location.href = '/login'
    }
  }, [])

  const breadcrumbs = useMemo(
    () => stack.map(key => getPageTitle(key)),
    [stack],
  )

  const canGoBack = drill !== null || stack.length > 1

  const backLabel = drill
    ? drill.previousPage || getPageTitle(active)
    : stack.length > 1
      ? getPageTitle(stack[stack.length - 2])
      : 'Dashboard'

  const value = useMemo(
    () => ({
      active,
      breadcrumbs,
      canGoBack,
      backLabel,
      executionPrefill,
      drill,
      navigate,
      navigateWithPrefill,
      clearExecutionPrefill: clearPrefill,
      goBack,
      openDrill,
      closeDrill,
      logout,
    }),
    [
      active,
      breadcrumbs,
      canGoBack,
      backLabel,
      executionPrefill,
      drill,
      navigate,
      navigateWithPrefill,
      clearPrefill,
      goBack,
      openDrill,
      closeDrill,
      logout,
    ],
  )

  return (
    <AppNavigationContext.Provider value={value}>
      {children}
    </AppNavigationContext.Provider>
  )
}

export function useAppNavigation() {
  const ctx = useContext(AppNavigationContext)
  if (!ctx) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider')
  }
  return ctx
}
