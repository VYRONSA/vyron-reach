'use client'

export function ExpansionTrackerPage() {
  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-8 text-white">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
        CLIENT EXPANSION
      </p>

      <h1 className="mt-3 text-4xl font-black">
        Growth Opportunities
      </h1>

      <div className="mt-6 space-y-3">
        {[
          'Add additional branches',
          'Upsell advanced workforce tools',
          'Convert trials into recurring clients',
          'Expand onboarding packages',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-cyan-500/15 bg-white/[0.03] p-4 text-sm font-bold text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
