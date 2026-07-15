'use client'

import { EnterpriseCampaignCreative } from '@/components/owner/EnterpriseCampaignCreative'
import type { VyronCreative } from '@/lib/vyronStore/types'

export function CreativePreviewCard({
  creative,
  selected,
  onSelect,
}: {
  creative: VyronCreative
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full overflow-hidden rounded-[24px] border text-left transition ${
        selected ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200'
      }`}
    >
      <EnterpriseCampaignCreative creative={creative} mode="thumbnail" showMeta={false} />
      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-800">{creative.platform}</span>
          <StatusPill status={creative.status} />
        </div>
        <p className="mt-1 text-sm font-black text-slate-900">{creative.headline}</p>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
          {creative.campaignSpec?.layout ?? 'Enterprise Campaign'} · {creative.campaignSpec?.theme ?? creative.visualStyle}
        </p>
      </div>
    </button>
  )
}

function StatusPill({ status }: { status: VyronCreative['status'] }) {
  const colors: Record<string, string> = {
    Draft: 'bg-slate-100 text-slate-600',
    'Awaiting Approval': 'bg-amber-50 text-amber-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Declined: 'bg-red-50 text-red-600',
    'Revision Requested': 'bg-orange-50 text-orange-700',
    Scheduled: 'bg-blue-50 text-blue-700',
    Launched: 'bg-violet-50 text-violet-700',
  }
  const label = status === 'Approved' ? 'Campaign Ready' : status
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${colors[status] ?? ''}`}>
      {label}
    </span>
  )
}
