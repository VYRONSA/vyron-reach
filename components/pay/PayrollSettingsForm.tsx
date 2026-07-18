'use client'

import { useState } from 'react'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { updatePayrollSettings } from '@/lib/pay/companySettings'
import type { PayFrequency } from '@/lib/pay/types'
import { PayButton, PayCard, PayField, PayInput, PaySelect } from './ui'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function PayrollSettingsForm() {
  const { company, payrollSettings, can, refresh } = usePayCompany()
  const editable = can('managePayrollSettings')

  const [form, setForm] = useState({
    payFrequency: payrollSettings?.payFrequency ?? 'Monthly',
    payDay: payrollSettings?.payDay ?? 25,
    taxYearStartMonth: payrollSettings?.taxYearStartMonth ?? 3,
    payeReference: payrollSettings?.payeReference ?? '',
    uifReference: payrollSettings?.uifReference ?? '',
    sdlReference: payrollSettings?.sdlReference ?? '',
    uifExempt: payrollSettings?.uifExempt ?? false,
    sdlExempt: payrollSettings?.sdlExempt ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!company || !payrollSettings) return null

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updatePayrollSettings(company.id, form)
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payroll settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PayCard eyebrow="Payroll Foundation" title="Payroll Settings">
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PayField label="Pay Frequency">
            <PaySelect
              value={form.payFrequency}
              onChange={e => update('payFrequency', e.target.value as PayFrequency)}
              disabled={!editable}
            >
              <option value="Monthly">Monthly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Weekly">Weekly</option>
            </PaySelect>
          </PayField>
          <PayField label="Pay Day (day of month)">
            <PayInput
              type="number"
              min={1}
              max={31}
              value={form.payDay}
              onChange={e => update('payDay', Number(e.target.value))}
              disabled={!editable}
            />
          </PayField>
          <PayField label="Tax Year Start Month">
            <PaySelect
              value={form.taxYearStartMonth}
              onChange={e => update('taxYearStartMonth', Number(e.target.value))}
              disabled={!editable}
            >
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx + 1}>
                  {month}
                </option>
              ))}
            </PaySelect>
          </PayField>
          <PayField label="PAYE Reference Number">
            <PayInput value={form.payeReference} onChange={e => update('payeReference', e.target.value)} disabled={!editable} />
          </PayField>
          <PayField label="UIF Reference Number">
            <PayInput value={form.uifReference} onChange={e => update('uifReference', e.target.value)} disabled={!editable} />
          </PayField>
          <PayField label="SDL Reference Number">
            <PayInput value={form.sdlReference} onChange={e => update('sdlReference', e.target.value)} disabled={!editable} />
          </PayField>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-8">
          <label className="flex items-center gap-2 text-sm text-[var(--pay-text-muted)]">
            <input
              type="checkbox"
              checked={form.uifExempt}
              onChange={e => update('uifExempt', e.target.checked)}
              disabled={!editable}
            />
            UIF exempt
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--pay-text-muted)]">
            <input
              type="checkbox"
              checked={form.sdlExempt}
              onChange={e => update('sdlExempt', e.target.checked)}
              disabled={!editable}
            />
            SDL exempt
          </label>
        </div>

        {error ? <p className="mt-4 text-xs font-medium text-rose-600">{error}</p> : null}

        {editable ? (
          <div className="mt-6 flex items-center gap-3">
            <PayButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Payroll Settings'}
            </PayButton>
            {saved ? <span className="text-xs font-medium text-emerald-600">Saved</span> : null}
          </div>
        ) : (
          <p className="mt-6 text-xs text-[var(--pay-text-faint)]">
            You have read-only access to payroll settings.
          </p>
        )}
      </PayCard>
    </form>
  )
}
