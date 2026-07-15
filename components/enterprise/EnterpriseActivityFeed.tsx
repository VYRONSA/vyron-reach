const items = [
  'AI optimized Meta campaign budget allocation',
  'New landing page deployed successfully',
  'Revenue anomaly detected and corrected',
  'Audience expansion sequence activated',
]

export function EnterpriseActivityFeed() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[#08111d]/90 p-7">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
        LIVE ACTIVITY
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Operational Feed
      </h2>

      <div className="mt-8 space-y-4">
        {items.map(item => (
          <div
            key={item}
            className="rounded-2xl border border-white/5 bg-black/20 px-5 py-4 text-sm font-semibold text-slate-200"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}