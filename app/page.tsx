'use client'

import { AppNavigationProvider, useAppNavigation } from '@/context/AppNavigationContext'
import { VyronDataProvider } from '@/context/VyronDataContext'
import { EnterpriseShell } from '@/components/EnterpriseShell'
import { PageChrome } from '@/components/PageChrome'
import { DASHBOARD_KEY } from '@/lib/enterpriseNav'
import { getOwnerPage } from '@/lib/pageRegistry'
import { OwnerDashboardPage } from '@/components/owner/pages/OwnerDashboardPage'

function AppContent() {
  const { active } = useAppNavigation()
  const Page = getOwnerPage(active) ?? (active === DASHBOARD_KEY ? OwnerDashboardPage : null)

  return (
    <EnterpriseShell>
      <PageChrome>{Page ? <Page /> : <OwnerDashboardPage />}</PageChrome>
    </EnterpriseShell>
  )
}

export default function Page() {
  return (
    <AppNavigationProvider>
      <VyronDataProvider>
        <AppContent />
      </VyronDataProvider>
    </AppNavigationProvider>
  )
}
