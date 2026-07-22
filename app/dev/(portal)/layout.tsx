import type { ReactNode } from 'react'
import '../portal-theme.css'
import { isOwner } from '@/lib/dev/auth'
import { DevPreferencesProvider } from '@/context/dev/DevPreferencesContext'
import { DevExperienceProvider } from '@/components/dev/DevExperience'
import { DevPortalShell } from '@/components/dev/DevPortalShell'
import { PlanningHydrationGate } from '@/components/dev/PlanningHydrationGate'

export const metadata = {
  title: 'VYRON DEV — Developer Portal',
}

export default function DevPortalLayout({ children }: { children: ReactNode }) {
  const owner = isOwner()

  return (
    <DevPreferencesProvider>
      <DevExperienceProvider>
        <DevPortalShell owner={owner}>
          <PlanningHydrationGate>{children}</PlanningHydrationGate>
        </DevPortalShell>
      </DevExperienceProvider>
    </DevPreferencesProvider>
  )
}
