'use client'

import { CompanySetupForm } from '@/components/pay/CompanySetupForm'
import { PayPageHeader } from '@/components/pay/ui'

export default function PayCompanyPage() {
  return (
    <div>
      <PayPageHeader
        eyebrow="Foundation"
        title="Company Setup"
        description="Statutory registration details used across VYRON PAY."
      />
      <CompanySetupForm />
    </div>
  )
}
