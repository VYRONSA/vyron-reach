'use client'

export function FounderSalesOSPanel() {
  return (
    <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 shadow-[0_0_40px_rgba(168,85,247,0.18)]">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">
        Founder Sales OS
      </div>

      <h2 className="mt-4 text-4xl font-black text-white">
        Conversion Engine
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Centralized founder-focused sales operating system for tracking
        demos, proposals, onboarding, conversion flow and recurring revenue growth.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric title="Demos" value="18" />
        <Metric title="Proposals" value="11" />
        <Metric title="Trials" value="7" />
        <Metric title="MRR" value="R84,500" />
      </div>
    </section>
  )
}

function Metric({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-5">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>

      <div className="mt-4 text-3xl font-black text-white">
        {value}
      </div>
    </div>
  )
}
