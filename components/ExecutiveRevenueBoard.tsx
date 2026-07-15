'use client'

export function ExecutiveRevenueBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
          Active MRR
        </div>

        <div className="mt-4 text-4xl font-black text-emerald-300">
          R124,000
        </div>
      </div>
    </div>
  )
}
