'use client'

export function ProductionStatusPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 text-white">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          PRODUCTION STATUS
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Deployment Readiness
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Final visibility layer before public demos and real client onboarding.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard title="UI Stability" value="READY" />
        <StatusCard title="Revenue Dashboard" value="READY" />
        <StatusCard title="Demo Environment" value="READY" />
        <StatusCard title="Client Pipeline" value="ACTIVE" />
      </div>
    </div>
  )
}

function StatusCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#111126] p-6">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>

      <div className="mt-4 text-2xl font-black text-emerald-300">
        {value}
      </div>
    </div>
  )
}
