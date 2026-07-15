'use client'

export function ScalingRoadmapPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 text-white">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          SCALING ROADMAP
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Revenue Growth Expansion
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Strategic execution roadmap for scaling VYRON CORE and VYRON REACH recurring revenue.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          'Acquire First 10 Clients',
          'Refine Onboarding',
          'Increase Demo Conversion',
          'Scale Marketing Budget',
        ].map((step) => (
          <div
            key={step}
            className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6 text-sm font-bold text-slate-300"
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
