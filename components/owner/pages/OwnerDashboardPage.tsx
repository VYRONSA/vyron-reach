'use client'

import { SimplifiedDashboardHome } from '@/components/owner/SimplifiedDashboardHome'
import { OwnerPageShell } from '@/components/owner/OwnerPageShell'

export function OwnerDashboardPage() {
  return (
    <OwnerPageShell
      eyebrow="VYRON REACH · AI Marketing"
      title="Dashboard"
      subtitle="Simple, visual, fast — create, approve, launch."
      theme="dashboard"
      hideBack
    >
      <SimplifiedDashboardHome />
    </OwnerPageShell>
  )
}
