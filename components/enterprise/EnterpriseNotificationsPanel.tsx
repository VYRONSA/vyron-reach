const notices = [
  'AI campaign optimization completed',
  'Revenue increase detected in Meta ads',
  'New landing page conversion spike',
  'Audience segment exceeded ROAS target',
]

export function EnterpriseNotificationsPanel() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
        LIVE NOTIFICATIONS
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Revenue Intelligence Alerts
      </h2>

      <div className="mt-8 space-y-4">
        {notices.map(notice => (
          <div
            key={notice}
            className="rounded-2xl border border-white/5 bg-black/20 px-5 py-4 text-sm font-semibold text-slate-200"
          >
            {notice}
          </div>
        ))}
      </div>
    </section>
  )
}