'use client'

import { EnterpriseCampaignCreative } from '@/components/owner/EnterpriseCampaignCreative'
import type { VyronCreative } from '@/lib/vyronStore/types'

export function FacebookAdPreviewCard({
  creative,
  variationLabel,
  pageName,
  adCopy,
}: {
  creative: VyronCreative
  variationLabel: string
  pageName: string
  adCopy?: string
}) {
  const spec = creative.campaignSpec
  const copy =
    adCopy ??
    spec?.productExplanation ??
    creative.offer ??
    'Stop losing payroll hours — workforce command centre for South African teams.'

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 bg-[#f0f2f5] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d5bbd] text-sm font-black text-white">
            {pageName.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{pageName}</p>
            <p className="text-[10px] font-bold text-slate-500">Sponsored · Facebook</p>
          </div>
        </div>
        <span className="rounded-full bg-[#1877F2] px-2.5 py-1 text-[9px] font-black uppercase text-white">
          Facebook Ad
        </span>
      </div>

      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold leading-relaxed text-slate-800">{copy}</p>
      </div>

      <div className="relative bg-slate-950">
        <EnterpriseCampaignCreative creative={creative} mode="preview" showMeta={false} />
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{variationLabel}</p>
        <p className="mt-1 text-lg font-black text-slate-900">{creative.headline}</p>
        <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-600">{spec?.subheadline ?? creative.offer}</p>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-[#1877F2] py-3 text-sm font-black uppercase tracking-wide text-white shadow-md"
        >
          {creative.cta}
        </button>
      </div>

      <div className="flex items-center justify-around border-t border-slate-100 bg-[#f0f2f5] px-4 py-2.5 text-xs font-bold text-slate-500">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  )
}
