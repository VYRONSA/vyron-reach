'use client'

import { EmployeeDirectory } from '@/components/pay/EmployeeDirectory'
import { PayPageHeader } from '@/components/pay/ui'

export default function PayEmployeesPage() {
  return (
    <div>
      <PayPageHeader
        eyebrow="Workforce"
        title="Employees"
        description="Core employee directory — profile, employment and banking details. Payslips and payroll calculations are handled in a later batch."
      />
      <EmployeeDirectory />
    </div>
  )
}
