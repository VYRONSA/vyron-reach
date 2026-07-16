import type { ReactNode } from 'react'
import '../portal-theme.css'
import { DevPreferencesProvider } from '@/context/dev/DevPreferencesContext'
import { DevExperienceProvider } from '@/components/dev/DevExperience'
import { DevPortalShell } from '@/components/dev/DevPortalShell'

export const metadata = {
  title: 'VYRON DEV — Developer Portal',
}

export default function DevPortalLayout({ children }: { children: ReactNode }) {
  return (
    <DevPreferencesProvider>
      <DevExperienceProvider>
        <DevPortalShell>{children}</DevPortalShell>
      </DevExperienceProvider>
    </DevPreferencesProvider>
  )
}
