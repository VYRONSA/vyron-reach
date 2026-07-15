'use client'

import { ReachPageShell, Card, LineChart, Donut } from '@/components/reach/shared/ReachDesignSystem'

const kpis = [
  {
    "label": "Total Revenue",
    "value": "R 24.8M",
    "delta": "+32.4%",
    "color": "#9333ea",
    "icon": "\ud83d\udcb0"
  },
  {
    "label": "Active Campaigns",
    "value": "128",
    "delta": "+18.7%",
    "color": "#1688ff",
    "icon": "\ud83d\udce3"
  },
  {
    "label": "Pipeline Value",
    "value": "R 67.3M",
    "delta": "+27.1%",
    "color": "#10b981",
    "icon": "\ud83d\udcc8"
  },
  {
    "label": "Conversion Rate",
    "value": "14.6%",
    "delta": "+8.3%",
    "color": "#f97316",
    "icon": "\ud83c\udfaf"
  },
  {
    "label": "ROI",
    "value": "4.73x",
    "delta": "+21.9%",
    "color": "#22d3ee",
    "icon": "\u2699\ufe0f"
  },
  {
    "label": "AI Score",
    "value": "87.4",
    "delta": "-12.8%",
    "color": "#ec4899",
    "icon": "\ud83d\udc8e"
  }
]

export default function Batch03_RevenuePage() {
  return (
    <ReachPageShell active="Revenue" eyebrow="FINANCIAL INTELLIGENCE CENTRE" title="Revenue Intelligence Centre" subtitle="Real-time financial performance, pipeline intelligence, forecasting, and profitability analytics across all operations." liveLabel="LIVE FINANCIAL DATA ACTIVE" theme="revenue" kpis={kpis}>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card title="Revenue Performance Overview" action="Last 30 Days" className="xl:col-span-5"><LineChart /></Card>
        <Card title="Top Performing Signals" action="View All" className="xl:col-span-4">
          <div className="space-y-4">{['AI Creative Launch','Enterprise Outreach Q2','Market Expansion US','Product Showcase'].map((x, i) => <div key={x} className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 text-sm font-black text-white">{x[0]}</div><div className="min-w-0 flex-1"><div className="text-sm font-black">{x}</div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-violet-600" style={{ width: `${80 - i * 12}%` }} /></div></div><div className="text-right text-xs font-black text-emerald-600">+{34 - i * 5}%</div></div>)}</div>
        </Card>
        <Card title="AI Intelligence Feed" action="View All" className="xl:col-span-3">
          <div className="space-y-4">{['High intent signal detected','Optimization complete','New opportunity created','Performance spike'].map((x, i) => <div key={x} className="flex gap-3"><div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-violet-100" /><div><div className="text-sm font-black">{x}</div><div className="text-xs font-semibold text-slate-500">{2 + i * 7}m ago</div></div></div>)}</div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card title="Channel Performance" action="Live" className="xl:col-span-3"><div className="space-y-5">{['Google Ads','Facebook Ads','Instagram Ads','VYRON Ecosystem'].map((x, i) => <div key={x} className="grid grid-cols-[1fr_120px_auto] items-center gap-3"><div className="text-sm font-bold text-slate-700">{x}</div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${80 - i * 12}%` }} /></div><div className="text-xs font-black text-emerald-600">+{32 - i * 4}%</div></div>)}</div></Card>
        <Card title="Pipeline Breakdown" className="xl:col-span-3"><Donut /></Card>
        <Card title="System Health" action="All Systems Operational" className="xl:col-span-3"><div className="space-y-4">{['AI Engine','Data Infrastructure','Analytics Engine','Automation Systems'].map(x => <div key={x} className="flex items-center justify-between"><span className="text-sm font-bold text-slate-700">{x}</span><span className="text-xs font-black text-emerald-600">Operational</span></div>)}</div></Card>
        <Card title="Quick Actions" className="xl:col-span-3"><div className="space-y-3">{['Launch Campaign','AI Generate Content','View Reports','Revenue Insights'].map((x, i) => <button key={x} className="{`h-12 w-full rounded-2xl text-sm font-black text-white ${['bg-gradient-to-r from-violet-600 to-pink-500','bg-gradient-to-r from-blue-500 to-cyan-400','bg-gradient-to-r from-emerald-500 to-teal-400','bg-gradient-to-r from-orange-500 to-amber-400'][i]}`}">{x}</button>)}</div></Card>
      </div>
    </ReachPageShell>
  )
}
