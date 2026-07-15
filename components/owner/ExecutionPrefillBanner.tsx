'use client'

import { useAppNavigation } from '@/context/AppNavigationContext'

export function ExecutionPrefillBanner() {
  const { executionPrefill, clearExecutionPrefill } = useAppNavigation()
  if (!executionPrefill) return null

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">AI Action Queue</p>
        <p className="mt-1 text-sm font-bold text-violet-900">{executionPrefill.message}</p>
      </div>
      <button
        type="button"
        onClick={clearExecutionPrefill}
        className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-violet-700"
      >
        Dismiss
      </button>
    </div>
  )
}
