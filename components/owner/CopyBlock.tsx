'use client'

import { useState } from 'react'

export function CopyBlock({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false)

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text)
            setDone(true)
            setTimeout(() => setDone(false), 2000)
          }}
          className="rounded-lg bg-violet-600 px-3 py-1 text-[9px] font-black uppercase text-white"
        >
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs font-medium text-slate-700">{text}</pre>
    </div>
  )
}
