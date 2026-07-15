'use client'

export function FounderCommandPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 text-white">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          FOUNDER COMMAND
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Daily Revenue Operations
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          High-level operational visibility for pipeline growth, demos, onboarding and MRR execution.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-emerald-500/20 bg-[#0b0b1d] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Revenue Target
          </div>

          <div className="mt-4 text-4xl font-black text-emerald-300">
            R100K
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Current MRR
          </div>

          <div className="mt-4 text-4xl font-black text-cyan-300">
            R42K
          </div>
        </div>

        <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Active Deals
          </div>

          <div className="mt-4 text-4xl font-black text-purple-300">
            23
          </div>
        </div>

        <div className="rounded-3xl border border-pink-500/20 bg-[#0b0b1d] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Demos This Week
          </div>

          <div className="mt-4 text-4xl font-black text-pink-300">
            11
          </div>
        </div>
      </div>
    </div>
  )
}
