
'use client'

import { ReachPageShell, Card, LineChart, Donut } from '@/components/reach/shared/ReachDesignSystem'

const kpis = [
  { label:'Enterprise Score', value:'96.4%', delta:'+18.4%', color:'#9333ea', icon:'⚡' },
  { label:'AI Operations', value:'87.1%', delta:'+12.8%', color:'#1688ff', icon:'🤖' },
  { label:'Global Reach', value:'14.2M', delta:'+28.3%', color:'#10b981', icon:'🌍' },
  { label:'Automation Rate', value:'92.8%', delta:'+16.2%', color:'#f97316', icon:'⚙️' },
  { label:'AI Accuracy', value:'97.2%', delta:'+8.2%', color:'#22d3ee', icon:'🧠' },
  { label:'Revenue Impact', value:'8.4x', delta:'+22.7%', color:'#ec4899', icon:'💎' },
]

export default function Batch25_TeamOperationsPage() {
  return (
    <ReachPageShell
      active="Team Operations"
      eyebrow="TEAM OPERATIONS CENTRE"
      title="Team Operations Centre"
      subtitle="Manage marketing teams, AI assistants, productivity, tasks, approvals, and operational execution."
      liveLabel="LIVE ENTERPRISE SYSTEM ACTIVE"
      theme="automation"
      kpis={kpis}
    >
      <div className="grid gap-4 xl:grid-cols-12">
        <Card title="Team Operations Centre Analytics" action="Last 30 Days" className="xl:col-span-5">
          <LineChart />
        </Card>

        <Card title="VYRON Ecosystem Intelligence" action="Live" className="xl:col-span-4">
          <div className="space-y-4">
            {['VYRON CORE','VYRON COST','VYRON FARM','VYRON MAINT'].map((x, i) => (
              <div key={x} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 text-sm font-black text-white">
                  {x[7]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black">{x}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-violet-600" style={{ width: `${85 - i * 11}%` }} />
                  </div>
                </div>
                <div className="text-right text-xs font-black text-emerald-600">
                  +{31 - i * 3}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Enterprise Feed" action="View All" className="xl:col-span-3">
          <div className="space-y-4">
            {['Google rankings improved','Instagram engagement spike','AI content approved','Enterprise workflow deployed'].map((x, i) => (
              <div key={x} className="flex gap-3">
                <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-violet-100" />
                <div>
                  <div className="text-sm font-black">{x}</div>
                  <div className="text-xs font-semibold text-slate-500">{4 + i * 3}m ago</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card title="Performance Breakdown" className="xl:col-span-3">
          <Donut label="R 128M" sub="Enterprise Value" />
        </Card>

        <Card title="Enterprise Systems" action="Optimal" className="xl:col-span-3">
          <div className="space-y-4">
            {['Google Engine','Facebook Ads','Instagram AI','VYRON Cloud'].map(x => (
              <div key={x} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{x}</span>
                <span className="text-xs font-black text-emerald-600">Online</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions" className="xl:col-span-3">
          <div className="space-y-3">
            {['Deploy AI','Generate Insights','Launch Workflow','Open Analytics'].map((x, i) => (
              <button key={x} className="{`h-12 w-full rounded-2xl text-sm font-black text-white ${['bg-gradient-to-r from-violet-600 to-pink-500','bg-gradient-to-r from-blue-500 to-cyan-400','bg-gradient-to-r from-emerald-500 to-teal-400','bg-gradient-to-r from-orange-500 to-amber-400'][i]}`}">
                {x}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Marketing Intelligence" className="xl:col-span-3">
          <div className="space-y-4">
            {['Google Ads +22%','Instagram Reach +41%','SEO Ranking #3','Facebook CTR +18%'].map((x, i) => (
              <div key={x} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-sm font-black">{x}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {14 + i} minutes ago
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ReachPageShell>
  )
}
