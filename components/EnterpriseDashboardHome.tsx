'use client'

import { useMemo } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import type { DrillRecord } from '@/components/DrillDownPanel'

const tabs = [
  ['Overview', 'violet'],
  ['SEO', 'emerald'],
  ['Ads', 'orange'],
  ['Content', 'violet'],
  ['Clients', 'blue'],
  ['Rankings', 'cyan'],
  ['Queue', 'orange'],
]

export function EnterpriseDashboardHome() {
  const { openDrill, navigate } = useAppNavigation()
  const { store } = useVyronData()

  const { keywords, rankings, campaigns, contentTasks, clients, actionQueue, settings } = store
  const pending = actionQueue.filter(a => a.status === 'pending')
  const improved = rankings.filter(r => r.change > 0).length
  const stuck = rankings.filter(r => r.stuck).length
  const totalWaste = campaigns.reduce((s, c) => s + c.wastedSpend, 0)
  const dailyBudget = settings.defaultAdDailyBudget

  const kpis = useMemo(
    () => [
      ['SEO Keywords', String(keywords.length), keywords.length ? `${settings.defaultSeoTimelineMonths}mo plan` : 'None added', '🔍', '#22d3ee'],
      ['Rankings Up', String(improved), rankings.length ? `${stuck} stuck` : 'None tracked', '📈', '#10b981'],
      ['Ad Test Budget', `R${dailyBudget}/day`, campaigns.length ? `R${totalWaste} waste` : 'Default rule', '📣', '#ec4899'],
      ['Content Tasks', String(contentTasks.length), contentTasks.length ? 'In queue' : 'None yet', '✍️', '#d946ef'],
      ['Clients', String(clients.length), clients.length ? 'Active accounts' : 'Add your first', '👥', '#7c3aed'],
      ['Action Queue', String(pending.length), pending.length ? 'Pending tasks' : 'Empty', '⚡', '#f97316'],
    ],
    [keywords.length, improved, stuck, dailyBudget, totalWaste, contentTasks.length, clients.length, pending.length, settings.defaultSeoTimelineMonths, rankings.length, campaigns.length],
  )

  const alerts = useMemo(() => {
    const items: Array<[string, string, string, string]> = []
    if (stuck > 0) items.push([`${stuck} stuck keywords`, 'Run content + internal linking intervention', 'Now', '#f97316'])
    if (totalWaste > 500) items.push([`R${totalWaste} ad waste detected`, 'Pause broad match and review search terms', '48h', '#ef4444'])
    if (pending.length > 0) items.push([`${pending.length} actions in queue`, pending[0]?.title ?? 'Execute top priority', 'Today', '#7c3aed'])
    if (items.length === 0) {
      items.push(['No alerts yet', 'Add clients and keywords to start tracking', '—', '#64748b'])
    }
    return items.slice(0, 4)
  }, [stuck, totalWaste, pending])

  const openKpiDrill = (title: string, subtitle: string, page: string) => {
    openDrill(
      buildOwnerDrill(
        title,
        subtitle,
        'Dashboard',
        [
          { label: 'Project', value: settings.defaultProject },
          { label: 'Market', value: settings.defaultMarket },
          { label: 'Detail', value: subtitle },
        ],
        [
          'Open the relevant module for full detail',
          'Add highest-impact item to AI Action Queue',
          'Review weekly with ranking tracker',
          'Include in next monthly client report',
        ],
        undefined,
        { department: page },
      ),
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-7 gap-3">
        {tabs.map((tab, index) => (
          <button
            key={tab[0]}
            type="button"
            onClick={() => {
              const map: Record<string, string> = {
                Overview: 'dashboard',
                SEO: 'seo-war-room',
                Ads: 'google-ads-ai',
                Content: 'content-engine',
                Clients: 'clients',
                Rankings: 'rankings',
                Queue: 'ai-action-queue',
              }
              navigate(map[tab[0]] ?? 'dashboard')
            }}
            className={`h-12 rounded-2xl border border-slate-200 bg-white/85 text-[11px] font-black uppercase tracking-[0.24em] shadow-sm transition hover:-translate-y-0.5 ${
              index === 0 ? 'vyron-tab-active border-0' : ''
            } ${
              tab[1] === 'emerald' ? 'text-emerald-600' :
              tab[1] === 'orange' ? 'text-orange-500' :
              tab[1] === 'cyan' ? 'text-cyan-500' :
              tab[1] === 'blue' ? 'text-blue-600' :
              'text-violet-700'
            }`}
          >
            {tab[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        {kpis.map(kpi => (
          <button
            key={kpi[0]}
            type="button"
            onClick={() => openKpiDrill(kpi[0] as string, `${kpi[1]} · ${kpi[2]}`, 'Dashboard')}
            className="vyron-card vyron-kpi-exact p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(59,130,246,0.14)]"
          >
            <div className="vyron-mini-icon" style={{ background: `linear-gradient(135deg, ${kpi[4]}, #fff)` }}>
              {kpi[3]}
            </div>
            <div className="mt-4 text-xs font-black text-slate-600">{kpi[0]}</div>
            <div className="mt-3 text-[28px] font-black tracking-[-0.04em] text-slate-950">{kpi[1]}</div>
            <div className="mt-2 text-xs font-black text-emerald-600">
              {kpi[2]}
            </div>
            <Spark color={kpi[4] as string} />
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="vyron-card xl:col-span-5 p-5">
          <PanelHead title="Ranking Progress" action="Open Rankings →" onAction={() => navigate('rankings')} />
          <div className="mt-5 space-y-3">
            {rankings.length === 0 ? (
              <DashboardEmpty message="No rankings tracked yet" />
            ) : (
              rankings.slice(0, 4).map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    openDrill(
                      buildOwnerDrill(
                        r.keyword,
                        r.forecast,
                        'Dashboard',
                        [
                          { label: 'Position', value: `#${r.position}` },
                          { label: 'Change', value: `${r.change >= 0 ? '+' : ''}${r.change}` },
                        ],
                        ['Track weekly', 'Fix if stuck 8+ weeks'],
                        undefined,
                        { department: 'Rankings', priority: r.stuck ? 'Critical' : 'Medium' },
                      ),
                    )
                  }
                  className="flex w-full items-center justify-between rounded-2xl p-2 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-black text-slate-900">{r.keyword}</span>
                  <span className={`text-xs font-black ${r.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    #{r.position} ({r.change >= 0 ? '+' : ''}{r.change})
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="vyron-card xl:col-span-4 p-5">
          <PanelHead title="Google Ads Status" action="Open Ads →" onAction={() => navigate('google-ads-ai')} />
          <div className="mt-5 space-y-4">
            {campaigns.length === 0 ? (
              <DashboardEmpty message="No campaigns created yet" />
            ) : (
              campaigns.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  openDrill(
                    buildOwnerDrill(
                      c.platform,
                      c.notes,
                      'Dashboard',
                      [
                        { label: 'Daily', value: `R${c.dailyBudget}` },
                        { label: 'Waste', value: `R${c.wastedSpend}` },
                        { label: 'Intent', value: `${c.intentScore}%` },
                      ],
                      ['Start R50/day test', 'Scale only after SEO validates'],
                      undefined,
                      { department: 'Google Ads AI' },
                    ),
                  )
                }
                className="flex w-full items-center gap-4 rounded-2xl p-2 text-left hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 text-sm font-black text-white">
                  G
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900">{c.platform}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    R{c.dailyBudget}/day · {c.status} · waste R{c.wastedSpend}
                  </div>
                </div>
                <div className="text-xs font-black text-emerald-600">{c.intentScore}%</div>
              </button>
              ))
            )}
          </div>
        </section>

        <section className="vyron-card xl:col-span-3 p-5">
          <PanelHead title="Marketing Alerts" action="View Queue →" onAction={() => navigate('ai-action-queue')} />
          <div className="mt-5 space-y-4">
            {alerts.map(feed => (
              <button
                key={feed[0]}
                type="button"
                onClick={() => openKpiDrill(feed[0], feed[1], 'Dashboard')}
                className="flex w-full gap-3 rounded-2xl p-2 text-left hover:bg-slate-50"
              >
                <div className="mt-1 h-9 w-9 shrink-0 rounded-full" style={{ background: `${feed[3]}22` }} />
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-900">{feed[0]}</div>
                  <div className="text-xs font-semibold text-slate-500">{feed[1]}</div>
                </div>
                <div className="text-xs font-semibold text-slate-400">{feed[2]}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="vyron-card xl:col-span-3 p-5">
          <PanelHead title="Next Best Actions" />
          <div className="mt-5 space-y-3">
            {pending.length === 0 ? (
              <DashboardEmpty message="No actions queued — add from any drilldown" />
            ) : (
              pending.slice(0, 4).map(a => (
                <div key={a.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                  [{a.priority}] {a.title}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="vyron-card xl:col-span-3 p-5">
          <PanelHead title="Budget Status" />
          <div className="mt-6 space-y-4 text-sm font-bold text-slate-700">
            <div className="flex justify-between">
              <span>Ad test budget</span>
              <span className="text-pink-600">R{dailyBudget}/day</span>
            </div>
            <div className="flex justify-between">
              <span>Client budgets/mo</span>
              <span>{clients.length ? `R${clients.reduce((s, c) => s + c.monthlyMarketingBudget, 0).toLocaleString('en-ZA')}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Wasted spend</span>
              <span className="text-red-500">{campaigns.length ? `R${totalWaste}` : '—'}</span>
            </div>
          </div>
        </section>

        <section className="vyron-card xl:col-span-3 p-5">
          <PanelHead title="SEO Snapshot" />
          <Health items={[
            ['Keywords tracked', String(keywords.length)],
            ['Rankings improved', String(improved)],
            ['Stuck alerts', String(stuck)],
            ['Competitors', String(store.competitors.length)],
          ]} />
        </section>

        <section className="vyron-card xl:col-span-3 p-5">
          <PanelHead title="Quick Actions" />
          <div className="mt-5 space-y-3">
            {[
              ['SEO War Room', 'from-violet-600 to-purple-600', 'seo-war-room'],
              ['Google Ads AI', 'from-pink-500 to-rose-500', 'google-ads-ai'],
              ['Generate Report', 'from-emerald-500 to-teal-400', 'reports'],
              ['Action Queue', 'from-orange-500 to-amber-400', 'ai-action-queue'],
            ].map(btn => (
              <button
                key={btn[0]}
                type="button"
                onClick={() => navigate(btn[2])}
                className={`h-12 w-full rounded-2xl bg-gradient-to-r ${btn[1]} text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5`}
              >
                {btn[0]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function DashboardEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-500">
      {message}
    </p>
  )
}

function PanelHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      {action ? (
        <button type="button" onClick={onAction} className="text-xs font-black text-blue-600">
          {action}
        </button>
      ) : null}
    </div>
  )
}

function Spark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 140 42" className="mt-4 h-10 w-full">
      <path d="M4 32 L24 20 L44 28 L64 18 L84 26 L104 16 L130 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M4 32 L24 20 L44 28 L64 18 L84 26 L104 16 L130 24 L130 42 L4 42 Z" fill={color} opacity="0.12" />
    </svg>
  )
}

function Health({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="mt-6 space-y-4">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-700">{label}</div>
          <div className="text-xs font-black text-emerald-600">{value}</div>
        </div>
      ))}
    </div>
  )
}
