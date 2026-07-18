'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { createEmployee, deleteEmployee, listEmployees, updateEmployee, type EmployeeInput } from '@/lib/pay/employees'
import type { PayEmployee } from '@/lib/pay/types'
import { PayBadge, PayButton, PayCard, PayEmptyState } from './ui'
import { EmployeeFormModal } from './EmployeeFormModal'

function statusTone(status: PayEmployee['employmentStatus']) {
  if (status === 'Active') return 'success' as const
  if (status === 'Inactive') return 'warning' as const
  return 'danger' as const
}

export function EmployeeDirectory() {
  const { company, can } = usePayCompany()
  const editable = can('manageEmployees')

  const [employees, setEmployees] = useState<PayEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PayEmployee | null>(null)

  const load = useCallback(async () => {
    if (!company) return
    setLoading(true)
    try {
      setEmployees(await listEmployees(company.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load employees.')
    } finally {
      setLoading(false)
    }
  }, [company])

  useEffect(() => {
    void load()
  }, [load])

  if (!company) return null

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (employee: PayEmployee) => {
    setEditing(employee)
    setModalOpen(true)
  }

  const handleSubmit = async (input: EmployeeInput) => {
    if (editing) {
      await updateEmployee(editing.id, input)
    } else {
      await createEmployee(company.id, input)
    }
    setModalOpen(false)
    await load()
  }

  const handleDelete = async (employee: PayEmployee) => {
    if (!window.confirm(`Remove ${employee.firstName} ${employee.lastName} from the employee directory?`)) return
    await deleteEmployee(employee.id)
    await load()
  }

  return (
    <PayCard eyebrow="Core Domain Model" title="Employee Directory">
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[var(--pay-text-faint)]">
          {employees.length} employee{employees.length === 1 ? '' : 's'}
        </p>
        {editable ? <PayButton onClick={openAdd}>Add Employee</PayButton> : null}
      </div>

      {error ? <p className="mt-4 text-xs font-medium text-rose-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--pay-text-faint)]">Loading employees…</p>
        ) : employees.length === 0 ? (
          <PayEmptyState>No employees yet. {editable ? 'Add your first employee to get started.' : ''}</PayEmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pay-border)] text-[10px] uppercase tracking-[0.14em] text-[var(--pay-text-faint)]">
                <th className="pb-2 pr-4 font-semibold">Name</th>
                <th className="pb-2 pr-4 font-semibold">Employee #</th>
                <th className="pb-2 pr-4 font-semibold">Job Title</th>
                <th className="pb-2 pr-4 font-semibold">Department</th>
                <th className="pb-2 pr-4 font-semibold">Type</th>
                <th className="pb-2 pr-4 font-semibold">Status</th>
                {editable ? <th className="pb-2 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id} className="border-b border-[var(--pay-border)] last:border-0">
                  <td className="py-3 pr-4 font-medium text-[var(--pay-text)]">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="py-3 pr-4 text-[var(--pay-text-muted)]">{employee.employeeNumber || '—'}</td>
                  <td className="py-3 pr-4 text-[var(--pay-text-muted)]">{employee.jobTitle || '—'}</td>
                  <td className="py-3 pr-4 text-[var(--pay-text-muted)]">{employee.department || '—'}</td>
                  <td className="py-3 pr-4 text-[var(--pay-text-muted)]">{employee.employmentType}</td>
                  <td className="py-3 pr-4">
                    <PayBadge tone={statusTone(employee.employmentStatus)}>{employee.employmentStatus}</PayBadge>
                  </td>
                  {editable ? (
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(employee)}
                          className="text-xs font-medium text-[var(--pay-accent)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(employee)}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen ? (
        <EmployeeFormModal initial={editing} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit} />
      ) : null}
    </PayCard>
  )
}
