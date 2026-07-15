'use client'

export function RevenueForecastPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-emerald-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Forecasted MRR
        </div>

        <div className="mt-4 text-4xl font-black text-emerald-300">
          R186,000
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Pipeline Close Rate
        </div>

        <div className="mt-4 text-4xl font-black text-cyan-300">
          38%
        </div>
      </div>
    </div>
  )
}
