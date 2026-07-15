'use client'

export function LaunchReadinessPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 text-white">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          LAUNCH READINESS
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Client Acquisition Readiness
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Final operational layer before aggressive VYRON CORE market expansion.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          'Demo Environment Ready',
          'Proposal Templates Ready',
          'Onboarding Workflow Ready',
          'Sales Scripts Ready',
        ].map((item) => (
          <div
            key={item}
            className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6 text-sm font-bold text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
