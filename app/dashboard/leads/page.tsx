'use client';
import { CommandPanel, DataCard, Card } from '@/components/ui/Cards';

export default function ReachDashboard() {
  return (
    <section className="animate-in fade-in duration-700">
      {/* VYRON CORE ALIGNED HERO PANEL */}
      <div className="bg-[#050D1A] rounded-[34px] p-10 text-white mb-10 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.3em] mb-2">VYRON REACH</p>
              <h1 className="text-4xl font-black tracking-tighter leading-none">Command Centre</h1>
              <p className="text-slate-400 text-sm font-bold mt-4 max-w-md">
                Marketing reach, lead outreach, and campaign execution visibility in one controlled system.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Supabase connection active</p>
              </div>
            </div>
            <button className="bg-white text-[#050D1A] px-8 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              Launch AI Campaign
            </button>
          </div>
        </div>
        {/* Brand decorative element matching CORE suite */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB] opacity-10 blur-[120px] -mr-48 -mt-48" />
      </div>

      {/* KPI GRID - MATCHING CORE KPI PLACEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <DataCard label="Active Campaigns" value="12" trend="+2" />
        <DataCard label="New Leads" value="48" trend="+12%" />
        <DataCard label="Pipeline Value" value="R 1.2M" />
        <DataCard label="Goal Reach" value="84%" trend="Live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT ACTIVITY QUEUE */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xl font-black text-[#0F172A] tracking-tight">Recent Pipeline Movement</h4>
            <button className="text-vyron-blue text-xs font-black uppercase tracking-widest hover:underline">View All Leads</button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'AuraVida Properties', sub: 'Lead assigned to Erkie', val: 'R 85,000', status: 'High Value' },
              { name: 'Bridgewater Botanicals', sub: 'Campaign: Summer Launch', val: 'R 12,500', status: 'Discovery' },
              { name: 'Cutting Edge Cuisine', sub: 'Inbound WhatsApp Lead', val: 'R 4,200', status: 'New' }
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-[24px] border border-slate-50 hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 shadow-sm">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-[#0F172A] text-sm">{lead.name}</p>
                    <p className="text-[11px] text-slate-400 font-bold">{lead.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-black text-sm text-[#2563EB]">{lead.val}</p>
                  <span className="px-4 py-2 bg-cyan-50 text-[#22D3EE] rounded-full text-[9px] font-black uppercase tracking-widest">{lead.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* OUTREACH ACTION PANEL */}
        <div className="flex h-full flex-col rounded-[34px] border border-white/10 bg-[#050D1A] p-10 text-white shadow-2xl">
          <h4 className="text-xl font-black tracking-tight">Outreach Actions</h4>
          <p className="mt-2 text-sm font-bold text-slate-400">Priority follow-ups for today.</p>
          <ul className="mt-8 space-y-4 text-sm font-bold text-slate-300">
            <li>Send proposal — AuraVida Properties</li>
            <li>Schedule discovery call — Bridgewater Botanicals</li>
            <li>Reply to WhatsApp — Cutting Edge Cuisine</li>
          </ul>
          <button className="mt-auto rounded-[18px] bg-[#2563EB] px-6 py-4 text-xs font-black uppercase tracking-widest text-white">
            Open Outreach Queue
          </button>
        </div>
      </div>
    </section>
  );
}