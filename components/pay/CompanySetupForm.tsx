'use client'

import { useState } from 'react'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { updateCompany } from '@/lib/pay/companySettings'
import { PayButton, PayCard, PayField, PayInput } from './ui'

export function CompanySetupForm() {
  const { company, can, refresh } = usePayCompany()
  const editable = can('manageCompanySettings')

  const [form, setForm] = useState({
    companyName: company?.companyName ?? '',
    registrationNumber: company?.registrationNumber ?? '',
    industryClassification: company?.industryClassification ?? '',
    contactEmail: company?.contactEmail ?? '',
    physicalAddress: company?.physicalAddress ?? '',
    postalAddress: company?.postalAddress ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!company) return null

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateCompany(company.id, form)
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save company details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PayCard eyebrow="Registered Entity" title="Company Details">
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PayField label="Company Name">
            <PayInput value={form.companyName} onChange={handleChange('companyName')} disabled={!editable} required />
          </PayField>
          <PayField label="Registration Number (CIPC)">
            <PayInput
              value={form.registrationNumber}
              onChange={handleChange('registrationNumber')}
              disabled={!editable}
              placeholder="e.g. 2024/123456/07"
            />
          </PayField>
          <PayField label="Industry Classification (SIC Code)">
            <PayInput
              value={form.industryClassification}
              onChange={handleChange('industryClassification')}
              disabled={!editable}
              placeholder="e.g. 62020 — IT consultancy"
            />
          </PayField>
          <PayField label="Contact Email">
            <PayInput
              type="email"
              value={form.contactEmail}
              onChange={handleChange('contactEmail')}
              disabled={!editable}
            />
          </PayField>
          <PayField label="Physical Address">
            <PayInput value={form.physicalAddress} onChange={handleChange('physicalAddress')} disabled={!editable} />
          </PayField>
          <PayField label="Postal Address">
            <PayInput value={form.postalAddress} onChange={handleChange('postalAddress')} disabled={!editable} />
          </PayField>
        </div>

        {error ? <p className="mt-4 text-xs font-medium text-rose-600">{error}</p> : null}

        {editable ? (
          <div className="mt-6 flex items-center gap-3">
            <PayButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Company Details'}
            </PayButton>
            {saved ? <span className="text-xs font-medium text-emerald-600">Saved</span> : null}
          </div>
        ) : (
          <p className="mt-6 text-xs text-[var(--pay-text-faint)]">
            You have read-only access to company details.
          </p>
        )}
      </PayCard>
    </form>
  )
}
