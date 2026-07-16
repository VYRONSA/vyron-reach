'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_PREFERENCES, getPreferences, savePreferences, type DevPreferences } from '@/lib/dev/preferences'

type DevPreferencesContextValue = {
  preferences: DevPreferences
  hydrated: boolean
  setPreferences: (patch: Partial<DevPreferences>) => void
  toggleSidebar: () => void
}

const DevPreferencesContext = createContext<DevPreferencesContextValue | null>(null)

export function DevPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<DevPreferences>(DEFAULT_PREFERENCES)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPreferencesState(getPreferences())
    setHydrated(true)
  }, [])

  const setPreferences = (patch: Partial<DevPreferences>) => {
    setPreferencesState(prev => {
      const next = { ...prev, ...patch }
      savePreferences(next)
      return next
    })
  }

  const toggleSidebar = () => setPreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })

  return (
    <DevPreferencesContext.Provider value={{ preferences, hydrated, setPreferences, toggleSidebar }}>
      <div data-theme={hydrated ? preferences.theme : 'dark'} className="dev-root">
        {children}
      </div>
    </DevPreferencesContext.Provider>
  )
}

export function useDevPreferences() {
  const ctx = useContext(DevPreferencesContext)
  if (!ctx) throw new Error('useDevPreferences must be used within DevPreferencesProvider')
  return ctx
}
