'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePayCompany } from '@/context/pay/PayCompanyContext'
import { listCompanyUsers, removeCompanyUser, updateCompanyUserRole } from '@/lib/pay/companyUsers'
import type { PayCompanyUser, PayUserRole } from '@/lib/pay/types'
import { PayBadge, PayCard, PayEmptyState, PaySelect } from './ui'

const ROLES: PayUserRole[] = ['Owner', 'Administrator', 'Viewer']

export function TeamMembersPanel() {
  const { company, can } = usePayCompany()
  const editable = can('manageUsers')

  const [members, setMembers] = useState<PayCompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!company) return
    setLoading(true)
    try {
      setMembers(await listCompanyUsers(company.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load workspace members.')
    } finally {
      setLoading(false)
    }
  }, [company])

  useEffect(() => {
    void load()
  }, [load])

  if (!company) return null

  const handleRoleChange = async (member: PayCompanyUser, role: PayUserRole) => {
    await updateCompanyUserRole(member.id, role)
    await load()
  }

  const handleRemove = async (member: PayCompanyUser) => {
    if (!window.confirm(`Remove ${member.email} from this workspace?`)) return
    await removeCompanyUser(member.id)
    await load()
  }

  const handleCopyInvite = async () => {
    if (!company.inviteCode) return
    await navigator.clipboard.writeText(company.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <PayCard eyebrow="Workspace" title="Invite Team Members">
        <p className="mt-2 text-sm text-[var(--pay-text-muted)]">
          Share this invite code with colleagues so they can join {company.companyName} on VYRON PAY.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <code className="rounded-lg border border-[var(--pay-border-strong)] bg-[var(--pay-input-bg)] px-4 py-2 text-sm font-semibold tracking-widest text-[var(--pay-text)]">
            {company.inviteCode ?? '—'}
          </code>
          <button
            type="button"
            onClick={handleCopyInvite}
            className="text-xs font-medium text-[var(--pay-accent)] hover:underline"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      </PayCard>

      <PayCard eyebrow="Authorization" title="Workspace Members">
        {error ? <p className="mt-4 text-xs font-medium text-rose-600">{error}</p> : null}

        <div className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--pay-text-faint)]">Loading members…</p>
          ) : members.length === 0 ? (
            <PayEmptyState>No members yet.</PayEmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--pay-border)] text-[10px] uppercase tracking-[0.14em] text-[var(--pay-text-faint)]">
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Role</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  {editable ? <th className="pb-2 font-semibold">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-[var(--pay-border)] last:border-0">
                    <td className="py-3 pr-4 font-medium text-[var(--pay-text)]">{member.email}</td>
                    <td className="py-3 pr-4">
                      {editable ? (
                        <PaySelect
                          value={member.role}
                          onChange={e => handleRoleChange(member, e.target.value as PayUserRole)}
                          className="max-w-[160px]"
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </PaySelect>
                      ) : (
                        <PayBadge tone="info">{member.role}</PayBadge>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <PayBadge tone={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</PayBadge>
                    </td>
                    {editable ? (
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PayCard>
    </div>
  )
}
