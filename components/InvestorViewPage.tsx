'use client'

export function InvestorViewPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-emerald-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Revenue Potential
        </div>

        <div className="mt-4 text-4xl font-black text-emerald-300">
          HIGH
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Market Expansion
        </div>

        <div className="mt-4 text-4xl font-black text-cyan-300">
          ACTIVE
        </div>
      </div>

      <div className="rounded-3xl border border-pink-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          SaaS Momentum
        </div>

        <div className="mt-4 text-4xl font-black text-pink-300">
          SCALING
        </div>
      </div>
    </div>
  )
}
