'use client'

export function MarketingBudgetEngine() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Google Search
        </div>

        <div className="mt-4 text-4xl font-black text-cyan-300">
          70%
        </div>
      </div>

      <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          LinkedIn
        </div>

        <div className="mt-4 text-4xl font-black text-purple-300">
          20%
        </div>
      </div>

      <div className="rounded-3xl border border-pink-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Retargeting
        </div>

        <div className="mt-4 text-4xl font-black text-pink-300">
          10%
        </div>
      </div>
    </div>
  )
}
