'use client'

import { useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import type { VyronClient } from '@/lib/vyronStore/types'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

const EMPTY_FORM = {
  businessName: '',
  industry: '',
  website: '',
  monthlyMarketingBudget: 5000,
  targetArea: 'South Africa',
  targetKeywords: '',
  notes: '',
}

export function ClientsPage() {
  const { openDrill } = useAppNavigation()
  const { store, addClient, updateClient, deleteClient } = useVyronData()
  const { clients } = store
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (c: VyronClient) => {
    setEditingId(c.id)
    setForm({
      businessName: c.businessName,
      industry: c.industry,
      website: c.website,
      monthlyMarketingBudget: c.monthlyMarketingBudget,
      targetArea: c.targetArea,
      targetKeywords: c.targetKeywords.join(', '),
      notes: c.notes,
    })
    setShowForm(true)
  }

  const saveClient = () => {
    if (!form.businessName.trim()) return
    const keywords = form.targetKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
    const payload = {
      businessName: form.businessName,
      industry: form.industry,
      website: form.website,
      monthlyMarketingBudget: form.monthlyMarketingBudget,
      targetArea: form.targetArea,
      targetKeywords: keywords,
      notes: form.notes,
      plan: 'Custom',
      adSpendNote: '',
    }
    if (editingId) {
      updateClient(editingId, payload)
    } else {
      addClient(payload)
    }
    resetForm()
  }

  const totalBudget = clients.reduce((s, c) => s + c.monthlyMarketingBudget, 0)

  return (
    <OwnerPageShell
      eyebrow="Client Growth · Plans & Tasks"
      title="Client Growth Plans"
      subtitle="Add and manage client accounts — SEO plans, budgets, target keywords and marketing notes."
      theme="clients"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Clients', value: String(clients.length), color: '#7c3aed' },
          { label: 'Total Budget', value: clients.length ? `R${totalBudget.toLocaleString('en-ZA')}` : '—', color: '#10b981' },
          { label: 'Avg Budget', value: clients.length ? `R${Math.round(totalBudget / clients.length).toLocaleString('en-ZA')}` : '—', color: '#22d3ee' },
          { label: 'With Keywords', value: String(clients.filter(c => c.targetKeywords.length > 0).length), color: '#ec4899' },
        ]}
      />

      <OwnerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Client Portfolio</h2>
          <button
            type="button"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="rounded-2xl bg-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Add Client
          </button>
        </div>

        {showForm ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['businessName', 'Business Name', 'text'],
                ['industry', 'Industry', 'text'],
                ['website', 'Website', 'text'],
                ['monthlyMarketingBudget', 'Monthly Budget (R)', 'number'],
                ['targetArea', 'Target Area', 'text'],
                ['targetKeywords', 'Target Keywords (comma-separated)', 'text'],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="block text-sm font-semibold text-slate-700">
                {label}
                <input
                  type={type}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={String(form[key])}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              </label>
            ))}
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Notes
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="button" onClick={saveClient} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">
                {editingId ? 'Update Client' : 'Save Client'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {clients.length === 0 ? (
            <OwnerEmptyState
              title="No clients added yet"
              description="Add your first client to start building SEO plans, budgets and target keyword lists."
              action={
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-violet-600 px-5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                >
                  Add First Client
                </button>
              }
            />
          ) : (
            clients.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-2">
                <ClickableRow
                  title={c.businessName}
                  subtitle={`${c.industry}${c.website ? ` · ${c.website}` : ''} · R${c.monthlyMarketingBudget.toLocaleString('en-ZA')}/mo · ${c.targetArea}`}
                  badge="Active"
                  accent="#7c3aed"
                  onClick={() =>
                    openDrill(
                      buildOwnerDrill(
                        c.businessName,
                        c.notes || 'Client marketing plan',
                        'Clients',
                        [
                          { label: 'Industry', value: c.industry || '—' },
                          { label: 'Website', value: c.website || '—' },
                          { label: 'Monthly Budget', value: `R${c.monthlyMarketingBudget.toLocaleString('en-ZA')}` },
                          { label: 'Target Area', value: c.targetArea },
                          { label: 'Keywords', value: c.targetKeywords.join(', ') || '—' },
                          { label: 'Notes', value: c.notes || '—' },
                        ],
                        [
                          'Define buyer-intent target keywords',
                          'Set 6-month SEO content plan',
                          `Start Google Ads at R50/day only after SEO assets exist`,
                          'Generate monthly client report',
                        ],
                        undefined,
                        { department: 'Clients', priority: 'High' },
                      ),
                    )
                  }
                />
                <div className="flex gap-2 px-3 pb-2">
                  <button type="button" onClick={() => startEdit(c)} className="text-[10px] font-black uppercase text-violet-600">
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteClient(c.id)} className="text-[10px] font-black uppercase text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </OwnerCard>
    </OwnerPageShell>
  )
}
