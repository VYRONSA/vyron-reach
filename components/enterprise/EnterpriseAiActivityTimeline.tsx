const events = [
  'AI generated 24 new ad creatives',
  'Revenue optimization loop executed',
  'Audience expansion campaign launched',
  'AI website heatmap updated',
]

export function EnterpriseAiActivityTimeline() {
  return (
    <section className="rounded-[38px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
        AI TIMELINE
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Autonomous Execution Feed
      </h2>

      <div className="mt-8 space-y-5">
        {events.map(event => (
          <div
            key={event}
            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 px-5 py-4"
          >
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />

            <div className="text-sm font-semibold text-slate-200">
              {event}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}