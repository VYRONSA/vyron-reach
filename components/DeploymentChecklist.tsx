'use client'

export function DeploymentChecklist() {
  const items = [
    'Supabase connected',
    'Sidebar navigation tested',
    'Reports export working',
    'Demo data visible',
    'No runtime errors',
    'Revenue dashboard stable',
    'Founder workflow usable',
  ]

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
      <h2 className="text-2xl font-black text-white">
        Deployment Checklist
      </h2>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-purple-500/15 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
