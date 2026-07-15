'use client'

import type { VyronUploadedCreative } from '@/lib/vyronStore/types'

export function CreativeFullscreenModal({
  creative,
  onClose,
}: {
  creative: VyronUploadedCreative
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 p-4 backdrop-blur-md"
      role="dialog"
      aria-label="Creative fullscreen preview"
    >
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-lg font-black">{creative.variationName}</p>
          <p className="text-sm text-white/70">
            {creative.clientName} · {creative.platform}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black uppercase"
        >
          Close
        </button>
      </div>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl}
          alt={creative.variationName}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />
      </div>
    </div>
  )
}
