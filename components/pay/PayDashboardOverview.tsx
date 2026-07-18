'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { listEmployees } from '@/lib/pay/employees'
import { PayBadge, PayCard, PayGrid, PayStat } from './ui'

type ChecklistItem = {
  label: string
  done: boolean
  href: string
}

export function PayDashboardOverview() {
  const { company, payrollSettings } = usePayCompany()
  const [employeeCount, setEmployeeCount] = useState<number | null>(null)

  useEffect(() => {
    if (!company) return
    let mounted = true
    listEmployees(company.id).then(employees => {
      if (mounted) setEmployeeCount(employees.length)
    })
    return () => {
      mounted = false
    }
  }, [company])

  if (!company || !payrollSettings) return null

  const checklist: ChecklistItem[] = [
    {
      label: 'Company registration details captured',
      done: Boolean(company.registrationNumber && company.industryClassification),
      href: '/pay/company',
    },
    {
      label: 'Statutory reference numbers captured (PAYE / UIF / SDL)',
      done: Boolean(payrollSettings.payeReference || payrollSettings.uifReference || payrollSettings.sdlReference),
      href: '/pay/payroll-settings',
    },
    {
      label: 'At least one employee added',
      done: (employeeCount ?? 0) > 0,
      href: '/pay/employees',
    },
  ]

  const completed = checklist.filter(item => item.done).length

  return (
    <div className="space-y-8">
      <PayCard eyebrow="Welcome" title={`${company.companyName} — VYRON PAY`}>
        <p className="mt-2 text-sm text-[var(--pay-text-muted)]">
          This is the foundation workspace for your South African payroll operations. Complete the setup
          checklist below to get ready for payroll processing.
        </p>
      </PayCard>

      <PayGrid>
        <PayStat label="Employees" value={employeeCount === null ? '—' : String(employeeCount)} />
        <PayStat label="Pay Frequency" value={payrollSettings.payFrequency} />
        <PayStat label="Currency" value={company.currency} />
      </PayGrid>

      <PayCard eyebrow="Setup Progress" title={`${completed} of ${checklist.length} steps complete`}>
        <div className="mt-4 divide-y divide-[var(--pay-border)]">
          {checklist.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between gap-4 py-3 text-sm text-[var(--pay-text)] hover:text-[var(--pay-accent)]"
            >
              <span>{item.label}</span>
              <PayBadge tone={item.done ? 'success' : 'neutral'}>{item.done ? 'Done' : 'To do'}</PayBadge>
            </Link>
          ))}
        </div>
      </PayCard>
    </div>
  )
}
