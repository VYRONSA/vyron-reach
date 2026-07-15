'use client'

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { CreativeFullscreenModal } from '@/components/owner/CreativeFullscreenModal'
import { CreativeRevisionModal } from '@/components/owner/CreativeRevisionModal'
import { getPlatformLaunchUrl } from '@/lib/creativeUpload/platformLinks'
import { OwnerEmptyState, OwnerPageShell } from '@/components/owner/OwnerPageShell'
import type { VyronUploadedCreative } from '@/lib/vyronStore/types'

export function AICreativeStudioPage() {
  const { navigate } = useAppNavigation()
  const {
    store,
    approveUploadedCreative,
    rejectUploadedCreative,
    requestUploadedCreativeRevision,
    setFinalUploadedCreative,
  } = useVyronData()

  const [clientFilter, setClientFilter] = useState<string>('All')
  const [platformFilter, setPlatformFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<VyronUploadedCreative['status'] | 'All'>('All')
  const [revisionTarget, setRevisionTarget] = useState<VyronUploadedCreative | null>(null)
  const [fullscreen, setFullscreen] = useState<VyronUploadedCreative | null>(null)

  const creatives = useMemo(() => {
    return store.uploadedCreatives
      .filter(c => (clientFilter === 'All' ? true : c.clientName === clientFilter))
      .filter(c => (platformFilter === 'All' ? true : c.platform === platformFilter))
      .filter(c => (statusFilter === 'All' ? true : c.status === statusFilter))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [store.uploadedCreatives, clientFilter, platformFilter, statusFilter])

  const clients = useMemo(() => ['All', ...store.clients.map(c => c.businessName)], [store.clients])
  const platforms = useMemo(
    () => ['All', ...Array.from(new Set(store.uploadedCreatives.map(c => c.platform)))],
    [store.uploadedCreatives],
  )

  return (
    <OwnerPageShell
      eyebrow="Creative Studio"
      title="Creative Studio"
      subtitle="Big visuals. Quick decisions. Approve → launch."
      theme="creative"
    >
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your gallery</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Uploaded creatives</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">Image-first review wall. Approve the winners.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('ai-marketing-director')}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg"
          >
            Create Campaign →
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-black text-slate-700">
            Client
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
            >
              {clients.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            Platform
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
            >
              {platforms.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-black text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              {['All', 'Pending Review', 'Approved', 'Needs Revision', 'Rejected'].map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="mt-6">
          <OwnerEmptyState
            title="No creatives yet"
            description="Create Campaign → Open in ChatGPT → Upload images → Approve."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creatives.map(c => (
            <article
              key={c.id}
              className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-lg ring-1 ring-slate-100/80 backdrop-blur-md"
            >
              <button type="button" onClick={() => setFullscreen(c)} className="relative block w-full">
                <img src={c.imageUrl} alt={c.variationName} className="aspect-[4/5] w-full object-cover" />
                {c.isFinalCampaignCreative ? (
                  <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-black uppercase text-white">
                    Final
                  </span>
                ) : null}
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-900">{c.clientName}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {c.platform} · {c.variationName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      c.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'Pending Review'
                          ? 'bg-amber-100 text-amber-900'
                          : c.status === 'Needs Revision'
                            ? 'bg-violet-100 text-violet-900'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => approveUploadedCreative(c.id)}
                    className="rounded-xl bg-emerald-600 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectUploadedCreative(c.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisionTarget(c)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                  >
                    Revise
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(getPlatformLaunchUrl(c.platform), '_blank')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                  >
                    Launch
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalUploadedCreative(c.id)}
                    className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                  >
                    Set as final campaign creative
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {revisionTarget ? (
        <CreativeRevisionModal
          creative={revisionTarget}
          onClose={() => setRevisionTarget(null)}
          onSave={(notes, prompt) => {
            requestUploadedCreativeRevision(revisionTarget.id, notes, prompt)
            setRevisionTarget(null)
          }}
          onCopyPrompt={prompt => void navigator.clipboard.writeText(prompt)}
        />
      ) : null}

      {fullscreen ? <CreativeFullscreenModal creative={fullscreen} onClose={() => setFullscreen(null)} /> : null}
    </OwnerPageShell>
  )
}
