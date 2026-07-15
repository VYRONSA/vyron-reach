const systems = [
  ['OpenAI Systems', 'Operational'],
  ['Meta Integrations', 'Operational'],
  ['Campaign Pipelines', 'Operational'],
  ['AI Render Engine', 'Operational'],
]

export function EnterpriseSystemHealth() {
  return (
    <section className="rounded-[34px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
        SYSTEM HEALTH
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Infrastructure Monitoring
      </h2>

      <div className="mt-8 space-y-4">
        {systems.map(system => (
          <div
            key={system[0]}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-5 py-4"
          >
            <div className="text-sm font-bold text-white">
              {system[0]}
            </div>

            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-400">
              {system[1]}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}