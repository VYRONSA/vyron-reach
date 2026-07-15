export function EnterpriseAudiencePanel() {
  return (
    <section className="rounded-[34px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
        AUDIENCE INTELLIGENCE
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Audience Expansion Matrix
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="text-xs text-slate-500">Top Audience</div>
          <div className="mt-4 text-2xl font-black text-white">
            High Intent Buyers
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="text-xs text-slate-500">Engagement Rate</div>
          <div className="mt-4 text-2xl font-black text-white">
            84.2%
          </div>
        </div>
      </div>
    </section>
  )
}