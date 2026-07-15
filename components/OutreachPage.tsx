'use client'

type OutreachPageProps = {
  data?: any
  appData?: any
  leads?: any[]
  tasks?: any[]
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : []
}

function safeNumber(value: any) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: any) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(safeNumber(value))
}

function needsFollowUp(lead: any) {
  const status = String(lead.status || '').toLowerCase()
  const followUp = String(lead.nextFollowUp || lead.next_follow_up || '').trim()

  return !['won', 'lost', 'cancelled', 'active'].includes(status) && followUp.length === 0
}

function outreachPriority(lead: any) {
  const value = safeNumber(lead.value)
  const status = String(lead.status || '').toLowerCase()

  if (value >= 100000) return 'Critical'
  if (status.includes('proposal') || status.includes('demo')) return 'High'
  if (value >= 50000) return 'High'
  return 'Normal'
}

export function OutreachPage({ data, appData, leads, tasks }: OutreachPageProps) {
  const source = data || appData || {}
  const safeLeads = safeArray(leads || source.leads)
  const safeTasks = safeArray(tasks || source.tasks)

  const followUpLeads = safeLeads.filter(needsFollowUp)
  const proposalLeads = safeLeads.filter(lead => String(lead.status || '').toLowerCase().includes('proposal'))
  const demoLeads = safeLeads.filter(lead => String(lead.status || '').toLowerCase().includes('demo'))

  const outreachTasks = safeTasks.filter(task => {
    const text = `${task.title || ''} ${task.type || ''}`.toLowerCase()
    return text.includes('follow') || text.includes('call') || text.includes('proposal') || text.includes('demo')
  })

  const highValueQueue = safeLeads
    .filter(lead => safeNumber(lead.value) >= 50000)
    .sort((a, b) => safeNumber(b.value) - safeNumber(a.value))

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          OUTREACH COMMAND
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          Follow-Up & Demo Conversion Queue
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          Keep VYRON CORE sales moving by making high-value leads, proposals, demo follow-ups and next actions impossible to miss.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Needs Follow-Up" value={String(followUpLeads.length)} />
        <Metric title="Demo Leads" value={String(demoLeads.length)} />
        <Metric title="Proposal Leads" value={String(proposalLeads.length)} />
        <Metric title="Outreach Tasks" value={String(outreachTasks.length)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
          <h2 className="text-2xl font-black text-white">
            Priority Outreach Queue
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Highest-value prospects and missing follow-ups first.
          </p>

          <div className="mt-5 space-y-4">
            {highValueQueue.length === 0 && <EmptyState text="No high-value outreach records yet." />}

            {highValueQueue.map((lead, index) => (
              <div key={lead.id || `${lead.name}-${index}`} className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-black text-white">{lead.name || 'Unnamed lead'}</div>
                    <div className="mt-1 text-sm text-slate-400">{lead.company || 'No company'} • {lead.source || 'Manual'}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill label={outreachPriority(lead)} />
                      <Pill label={lead.status || 'Lead'} secondary />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-300">{money(lead.value)}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Potential Value</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
                  Recommended next action: book a short operational pain discovery call and position VYRON CORE around payroll readiness, clocking control and HR visibility.
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
            <h2 className="text-2xl font-black text-white">Follow-Up Risks</h2>
            <div className="mt-5 space-y-3">
              {followUpLeads.length === 0 && <EmptyState text="No missing follow-ups detected." />}
              {followUpLeads.slice(0, 8).map((lead, index) => (
                <div key={lead.id || `${lead.name}-${index}`} className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
                  <div className="font-black text-white">{lead.name || 'Unnamed lead'}</div>
                  <div className="mt-1 text-sm text-orange-100">No follow-up date set • {lead.company || 'No company'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
            <h2 className="text-2xl font-black text-white">Sales Task Queue</h2>
            <div className="mt-5 space-y-3">
              {outreachTasks.length === 0 && <EmptyState text="No outreach tasks loaded." />}
              {outreachTasks.slice(0, 8).map((task, index) => (
                <div key={task.id || `${task.title}-${index}`} className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-4">
                  <div className="font-black text-white">{task.title || 'Sales task'}</div>
                  <div className="mt-1 text-sm text-slate-400">{task.status || 'Pending'} • {task.priority || 'Normal'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{title}</div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
    </div>
  )
}

function Pill({ label, secondary }: { label: string; secondary?: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${secondary ? 'border border-cyan-400/20 bg-cyan-500/10 text-cyan-200' : 'border border-purple-400/20 bg-purple-500/10 text-purple-200'}`}>
      {label}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-purple-500/20 bg-white/[0.02] p-6 text-sm font-bold text-slate-500">{text}</div>
}
