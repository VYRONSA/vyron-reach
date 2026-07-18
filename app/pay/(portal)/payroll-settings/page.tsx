'use client'

import { PayrollSettingsForm } from '@/components/pay/PayrollSettingsForm'
import { PayPageHeader } from '@/components/pay/ui'

export default function PayPayrollSettingsPage() {
  return (
    <div>
      <PayPageHeader
        eyebrow="Foundation"
        title="Payroll Settings"
        description="Pay frequency, tax year and statutory reference numbers. No calculations run yet — this is configuration only."
      />
      <PayrollSettingsForm />
    </div>
  )
}
