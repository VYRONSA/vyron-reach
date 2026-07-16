'use client'

import type { ReactNode } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { DevSidebar } from './DevSidebar'
import { DevTopbar } from './DevTopbar'
import { QuickNotesPanel } from './QuickNotesPanel'
import { FocusModeView } from './FocusModeView'

export function DevPortalShell({ children, owner }: { children: ReactNode; owner: boolean }) {
  const { preferences, hydrated } = useDevPreferences()
  const focusMode = hydrated && preferences.focusMode

  return (
    <>
      {focusMode ? (
        <FocusModeView />
      ) : (
        <div className="flex min-h-screen">
          <DevSidebar owner={owner} />
          <div className="flex min-w-0 flex-1 flex-col">
            <DevTopbar />
            <main className="min-w-0 flex-1">
              <div className="mx-auto max-w-[1240px] px-8 py-10">{children}</div>
            </main>
          </div>
        </div>
      )}
      <QuickNotesPanel />
    </>
  )
}
