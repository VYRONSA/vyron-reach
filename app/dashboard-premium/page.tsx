export default function DashboardPremium() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(147,51,234,.18),transparent_30%),linear-gradient(135deg,#eef2ff,#fff,#effcff)] p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[40px] bg-white shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-12">
              <div className="text-xs font-black tracking-[0.4em] text-violet-600">
                VYRON REACH • COMMAND CENTRE
              </div>

              <h1 className="mt-6 text-7xl font-black tracking-[-0.08em] text-slate-950">
                Marketing that looks expensive.
              </h1>

              <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-600">
                Create campaigns, generate premium ChatGPT prompts,
                upload final creatives and launch campaigns from one
                AI-powered command centre.
              </p>

              <div className="mt-10 flex gap-4">
                <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-black text-white">
                  CREATE CAMPAIGN
                </button>

                <button className="rounded-2xl border border-slate-300 bg-white px-8 py-4 font-black text-slate-900">
                  OPEN CREATIVE STUDIO
                </button>
              </div>
            </div>

            <div className="bg-[radial-gradient(circle_at_top,rgba(34,211,238,.35),transparent_30%),linear-gradient(145deg,#020617,#0f172a)] p-10 text-white">
              <div className="grid grid-cols-2 gap-5">
                {[
                  ['Revenue', '+24%'],
                  ['Leads', '148'],
                  ['ROI', '3.2x'],
                  ['Spend', 'R12K'],
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl"
                  >
                    <div className="text-sm font-bold text-white/60">
                      {title}
                    </div>

                    <div className="mt-3 text-5xl font-black">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[32px] bg-gradient-to-r from-violet-600 to-cyan-500 p-8">
                <div className="text-4xl font-black">
                  AI Campaign Studio
                </div>

                <p className="mt-3 text-lg font-semibold text-white/80">
                  Facebook, Google and LinkedIn campaign generation with premium AI workflows.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
