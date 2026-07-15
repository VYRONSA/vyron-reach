'use client'

export function ExecutiveMomentumPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">MRR Growth</div>
        <div className="mt-4 text-4xl font-black text-emerald-300">+18%</div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo Growth</div>
        <div className="mt-4 text-4xl font-black text-cyan-300">42</div>
      </div>

      <div className="rounded-3xl border border-pink-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Pipeline</div>
        <div className="mt-4 text-4xl font-black text-pink-300">R1.8M</div>
      </div>
    </div>
  )
}
