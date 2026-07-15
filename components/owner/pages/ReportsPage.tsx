'use client'

import { useVyronData } from '@/context/VyronDataContext'
import { OwnerCard, OwnerPageShell } from '@/components/owner/OwnerPageShell'

export function ReportsPage() {
  const { store } = useVyronData()
  const approved = store.uploadedCreatives.filter(c => c.status === 'Approved')
  const pending = store.uploadedCreatives.filter(c => c.status === 'Pending Review')
  const monthSpend = store.campaigns.reduce((s, c) => s + (c.dailyBudget ?? 0) * 30, 0)
  const best = approved.find(c => c.isFinalCampaignCreative) ?? approved[0] ?? null

  return (
    <OwnerPageShell
      eyebrow="Reports"
      title="Reports"
      subtitle="Visual performance cards and clear next steps."
      theme="reports"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <OwnerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">This month</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{monthSpend ? `R${monthSpend.toLocaleString('en-ZA')}` : '—'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Estimated ad spend</p>
        </OwnerCard>
        <OwnerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Creatives</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{approved.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Approved</p>
        </OwnerCard>
        <OwnerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Review</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{pending.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Pending review</p>
        </OwnerCard>
      </div>

      <OwnerCard className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Best performing (placeholder)</h2>
            <p className="mt-1 text-sm text-slate-500">Connect spend/clicks later — for now, show your final creative.</p>
          </div>
          {best ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-800">
              {best.platform}
            </span>
          ) : null}
        </div>

        {best ? (
          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={best.imageUrl} alt={best.variationName} className="aspect-[2/1] w-full object-cover" />
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No approved creatives yet. Create Campaign → upload → approve.
          </p>
        )}
      </OwnerCard>
    </OwnerPageShell>
  )
}
