'use client'

import { PayDashboardOverview } from '@/components/pay/PayDashboardOverview'
import { PayPageHeader } from '@/components/pay/ui'

export default function PayDashboardPage() {
  return (
    <div>
      <PayPageHeader eyebrow="Overview" title="Dashboard" description="Your VYRON PAY workspace at a glance." />
      <PayDashboardOverview />
    </div>
  )
}
