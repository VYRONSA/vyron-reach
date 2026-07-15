'use client'

import { useState } from 'react'
import type { CreativeRevisionNotes, VyronUploadedCreative } from '@/lib/vyronStore/types'
import { buildCreativeRevisionPrompt } from '@/lib/creativeUpload/revisionPrompt'

export function CreativeRevisionModal({
  creative,
  onClose,
  onSave,
  onCopyPrompt,
}: {
  creative: VyronUploadedCreative
  onClose: () => void
  onSave: (notes: CreativeRevisionNotes, prompt: string) => void
  onCopyPrompt: (prompt: string) => void
}) {
  const [notes, setNotes] = useState<CreativeRevisionNotes>(creative.revisionNotes ?? {})

  const prompt = buildCreativeRevisionPrompt({
    clientName: creative.clientName,
    platform: creative.platform,
    variationName: creative.variationName,
    notes,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="text-lg font-black text-slate-950">Revision notes — {creative.variationName}</h3>
        <p className="mt-1 text-sm text-slate-500">Capture feedback, then copy the revision prompt into ChatGPT.</p>
        <div className="mt-5 space-y-4">
          <RevField
            label="What must change?"
            value={notes.whatMustChange ?? ''}
            onChange={v => setNotes(n => ({ ...n, whatMustChange: v }))}
          />
          <RevField
            label="Tone changes"
            value={notes.toneChanges ?? ''}
            onChange={v => setNotes(n => ({ ...n, toneChanges: v }))}
          />
          <RevField
            label="Colour changes"
            value={notes.colourChanges ?? ''}
            onChange={v => setNotes(n => ({ ...n, colourChanges: v }))}
          />
          <RevField
            label="CTA changes"
            value={notes.ctaChanges ?? ''}
            onChange={v => setNotes(n => ({ ...n, ctaChanges: v }))}
          />
          <RevField
            label="Platform notes"
            value={notes.platformNotes ?? ''}
            onChange={v => setNotes(n => ({ ...n, platformNotes: v }))}
          />
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSave(notes, prompt)}
            className="rounded-xl bg-violet-600 px-4 py-3 text-xs font-black uppercase text-white"
          >
            Save & mark needs revision
          </button>
          <button
            type="button"
            onClick={() => onCopyPrompt(prompt)}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-black uppercase text-emerald-800"
          >
            Copy revision prompt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase text-slate-600 sm:col-span-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function RevField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}
