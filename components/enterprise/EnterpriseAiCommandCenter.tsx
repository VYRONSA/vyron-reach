export function EnterpriseAiCommandCenter() {
  return (
    <section className="rounded-[32px] border border-violet-500/20 bg-[#08111d]/90 p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            AI COMMAND CENTRE
          </div>
          <h2 className="mt-3 text-3xl font-black text-white">
            Autonomous Revenue Intelligence
          </h2>
        </div>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400">
          LIVE
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-xs text-slate-500">AI Tasks</div>
          <div className="mt-3 text-4xl font-black text-white">24,531</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-xs text-slate-500">Optimizations</div>
          <div className="mt-3 text-4xl font-black text-white">1,247</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-xs text-slate-500">Campaign Wins</div>
          <div className="mt-3 text-4xl font-black text-white">87%</div>
        </div>
      </div>
    </section>
  )
}