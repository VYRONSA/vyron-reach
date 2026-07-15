'use client'

type SystemHealthChecklistProps = {
  appData?: any
  data?: any
  connectionStatus?: string
  dataError?: string
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : []
}

export function SystemHealthChecklist({
  appData,
  data,
  connectionStatus = 'Live Connected',
  dataError = '',
}: SystemHealthChecklistProps) {
  const source = data || appData || {}

  const leads = safeArray(source.leads)
  const campaigns = safeArray(source.campaigns)
  const tasks = safeArray(source.tasks)
  const content = safeArray(source.content)

  const checks = [
    {
      label: 'Supabase connection',
      value: connectionStatus,
      ok: !dataError,
    },
    {
      label: 'Leads loaded',
      value: String(leads.length),
      ok: true,
    },
    {
      label: 'Campaigns loaded',
      value: String(campaigns.length),
      ok: true,
    },
    {
      label: 'Tasks loaded',
      value: String(tasks.length),
      ok: true,
    },
    {
      label: 'Content loaded',
      value: String(content.length),
      ok: true,
    },
  ]

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
        SYSTEM HEALTH
      </p>

      <h2 className="mt-3 text-2xl font-black text-white">
        Stabilisation Checklist
      </h2>

      <div className="mt-5 space-y-3">
        {checks.map(check => (
          <div
            key={check.label}
            className="flex items-center justify-between rounded-2xl border border-purple-500/15 bg-white/[0.03] px-4 py-3"
          >
            <div className="text-sm font-bold text-slate-300">
              {check.label}
            </div>

            <div
              className={`text-sm font-black ${
                check.ok ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {check.value}
            </div>
          </div>
        ))}

        {dataError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {dataError}
          </div>
        ) : null}
      </div>
    </div>
  )
}
