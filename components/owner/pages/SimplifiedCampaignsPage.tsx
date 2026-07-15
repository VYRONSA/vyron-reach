'use client'

import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { getPlatformLaunchUrl } from '@/lib/creativeUpload/platformLinks'
import { OwnerCard, OwnerEmptyState, OwnerPageShell } from '@/components/owner/OwnerPageShell'

export function SimplifiedCampaignsPage() {
  const { store } = useVyronData()
  const { campaigns, uploadedCreatives } = store
  const approvedUploads = uploadedCreatives.filter(c => c.status === 'Approved')

  return (
    <OwnerPageShell
      eyebrow="Your campaigns"
      title="Campaigns"
      subtitle="Simple campaign gallery — preview, status, and launch links."
      theme="ads"
    >
      <OwnerCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Campaign gallery</h2>
            <p className="mt-1 text-sm text-slate-500">Approved creatives imported from ChatGPT</p>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400">
            {approvedUploads.length} approved
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {approvedUploads.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <OwnerEmptyState
                title="No approved creatives yet"
                description="Create Campaign → Upload images → Approve."
              />
            </div>
          ) : (
            approvedUploads.map(c => (
              <article
                key={c.id}
                className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-lg ring-1 ring-slate-100/80 backdrop-blur-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl} alt={c.variationName} className="aspect-[4/5] w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-900">{c.clientName}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {c.platform} · {c.variationName}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                      Approved
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{c.campaignGoal}</p>
                  {c.isFinalCampaignCreative ? (
                    <p className="mt-2 text-[10px] font-black uppercase text-violet-600">Final campaign creative</p>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ActionBtn onClick={() => void navigator.clipboard.writeText(c.caption)}>Copy caption</ActionBtn>
                    <ActionBtn onClick={() => void navigator.clipboard.writeText(c.cta)}>Copy CTA</ActionBtn>
                    <ActionBtn
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = c.imageUrl
                        a.download = `${c.variationName}.png`
                        a.click()
                      }}
                    >
                      Download
                    </ActionBtn>
                    <ActionBtn onClick={() => window.open(getPlatformLaunchUrl(c.platform), '_blank')}>
                      Open ads
                    </ActionBtn>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </OwnerCard>

      {campaigns.length > 0 ? (
        <OwnerCard className="mt-5">
          <h2 className="text-lg font-black text-slate-950">Active spend (light)</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {campaigns.map(c => (
              <div key={c.id} className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-800">{c.platform}</div>
                <div className="mt-1 text-xs text-slate-500">
                  R{c.dailyBudget}/day · {c.status}
                </div>
              </div>
            ))}
          </div>
        </OwnerCard>
      ) : null}
    </OwnerPageShell>
  )
}

function ActionBtn({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-700 hover:bg-violet-50 ${className}`}
    >
      {children}
    </button>
  )
}
