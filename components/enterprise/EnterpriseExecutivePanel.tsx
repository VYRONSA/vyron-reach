export function EnterpriseExecutivePanel() {
  return (
    <section className="rounded-[34px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
            EXECUTIVE COMMAND
          </div>

          <h2 className="mt-3 text-4xl font-black text-white">
            Revenue Operations Overview
          </h2>
        </div>

        <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white">
          Export Report
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs text-slate-500">Revenue Protected</div>
          <div className="mt-4 text-4xl font-black text-white">$1.2M</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs text-slate-500">AI Optimizations</div>
          <div className="mt-4 text-4xl font-black text-white">4,521</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs text-slate-500">Active Clients</div>
          <div className="mt-4 text-4xl font-black text-white">214</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs text-slate-500">Growth Velocity</div>
          <div className="mt-4 text-4xl font-black text-white">+42%</div>
        </div>
      </div>
    </section>
  )
}