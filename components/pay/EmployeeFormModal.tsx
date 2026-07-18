'use client'

import { useState } from 'react'
import type { EmploymentStatus, EmploymentType, PayEmployee } from '@/lib/pay/types'
import type { EmployeeInput } from '@/lib/pay/employees'
import { PayButton, PayField, PayInput, PaySelect } from './ui'

type Props = {
  initial?: PayEmployee | null
  onCancel: () => void
  onSubmit: (input: EmployeeInput) => Promise<void>
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['Permanent', 'Fixed-Term', 'Temporary', 'Contractor']
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['Active', 'Inactive', 'Terminated']

export function EmployeeFormModal({ initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<EmployeeInput>({
    employeeNumber: initial?.employeeNumber ?? '',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    idNumber: initial?.idNumber ?? '',
    passportNumber: initial?.passportNumber ?? '',
    dateOfBirth: initial?.dateOfBirth ?? null,
    gender: initial?.gender ?? '',
    employmentType: initial?.employmentType ?? 'Permanent',
    jobTitle: initial?.jobTitle ?? '',
    department: initial?.department ?? '',
    startDate: initial?.startDate ?? null,
    terminationDate: initial?.terminationDate ?? null,
    employmentStatus: initial?.employmentStatus ?? 'Active',
    taxNumber: initial?.taxNumber ?? '',
    bankName: initial?.bankName ?? '',
    bankAccountNumber: initial?.bankAccountNumber ?? '',
    bankAccountType: initial?.bankAccountType ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save employee.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="pay-fade-in w-full max-w-2xl rounded-2xl border border-[var(--pay-border)] bg-[var(--pay-surface)] p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-[var(--pay-text)]">
          {initial ? 'Edit Employee' : 'Add Employee'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-6 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PayField label="First Name">
              <PayInput value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
            </PayField>
            <PayField label="Last Name">
              <PayInput value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
            </PayField>
            <PayField label="Employee Number">
              <PayInput value={form.employeeNumber} onChange={e => update('employeeNumber', e.target.value)} />
            </PayField>
            <PayField label="ID Number">
              <PayInput value={form.idNumber} onChange={e => update('idNumber', e.target.value)} />
            </PayField>
            <PayField label="Passport Number">
              <PayInput value={form.passportNumber} onChange={e => update('passportNumber', e.target.value)} />
            </PayField>
            <PayField label="Date of Birth">
              <PayInput
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={e => update('dateOfBirth', e.target.value || null)}
              />
            </PayField>
            <PayField label="Gender">
              <PayInput value={form.gender} onChange={e => update('gender', e.target.value)} />
            </PayField>
            <PayField label="Job Title">
              <PayInput value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} />
            </PayField>
            <PayField label="Department">
              <PayInput value={form.department} onChange={e => update('department', e.target.value)} />
            </PayField>
            <PayField label="Employment Type">
              <PaySelect value={form.employmentType} onChange={e => update('employmentType', e.target.value as EmploymentType)}>
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </PaySelect>
            </PayField>
            <PayField label="Employment Status">
              <PaySelect value={form.employmentStatus} onChange={e => update('employmentStatus', e.target.value as EmploymentStatus)}>
                {EMPLOYMENT_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </PaySelect>
            </PayField>
            <PayField label="Start Date">
              <PayInput
                type="date"
                value={form.startDate ?? ''}
                onChange={e => update('startDate', e.target.value || null)}
              />
            </PayField>
            <PayField label="Termination Date">
              <PayInput
                type="date"
                value={form.terminationDate ?? ''}
                onChange={e => update('terminationDate', e.target.value || null)}
              />
            </PayField>
            <PayField label="Tax Number">
              <PayInput value={form.taxNumber} onChange={e => update('taxNumber', e.target.value)} />
            </PayField>
            <PayField label="Bank Name">
              <PayInput value={form.bankName} onChange={e => update('bankName', e.target.value)} />
            </PayField>
            <PayField label="Bank Account Number">
              <PayInput value={form.bankAccountNumber} onChange={e => update('bankAccountNumber', e.target.value)} />
            </PayField>
            <PayField label="Bank Account Type">
              <PayInput value={form.bankAccountType} onChange={e => update('bankAccountType', e.target.value)} />
            </PayField>
          </div>

          {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--pay-border)] pt-5">
            <PayButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </PayButton>
            <PayButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Employee'}
            </PayButton>
          </div>
        </form>
      </div>
    </div>
  )
}
