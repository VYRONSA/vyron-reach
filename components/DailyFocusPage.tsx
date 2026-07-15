'use client'

export function DailyFocusPage() {
  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-8 text-white">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
        DAILY EXECUTION
      </p>

      <h1 className="mt-3 text-4xl font-black">
        Founder Focus Queue
      </h1>

      <div className="mt-6 space-y-3">
        {[
          'Follow up pending proposals',
          'Schedule onboarding calls',
          'Review demo pipeline',
          'Track campaign ROI',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-cyan-500/15 bg-white/[0.03] p-4 text-sm font-bold text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
