'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CommandPanel, DataCard, Card } from '@/components/ui/Cards';
import { StatusPill } from '@/components/ui/StatusPill';
import { CreateCampaignPanel } from '@/components/ui/CreateCampaignPanel';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  async function fetchCampaigns() {
    const { data } = await supabase.from('marketing_campaigns').select('*');
    if (data) setCampaigns(data);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  const totalBudget = campaigns.reduce((acc, curr) => acc + (curr.budget || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CommandPanel title="Campaign Control" subtitle="VYRON REACH • Ad Engine">
        <button
          onClick={() => setIsPanelOpen(true)}
          className="bg-white text-[#050D1A] px-8 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
        >
          New AI Campaign
        </button>
      </CommandPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <DataCard label="Active Budget" value={`R ${totalBudget.toLocaleString()}`} trend="Live" />
        <DataCard label="Avg. CPC" value="R 4.12" trend="-8.2%" />
        <DataCard label="Sentry Optimization" value="98%" />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Daily Budget</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={3} className="p-20 text-center font-bold text-slate-300">No campaigns yet.</td></tr>
            ) : campaigns.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                <td className="p-8 font-black text-[#0F172A]">{c.name}</td>
                <td className="p-8"><StatusPill label={c.status} /></td>
                <td className="p-8 text-right font-black text-[#2563EB]">R {(c.budget || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateCampaignPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onRefresh={fetchCampaigns} />
    </div>
  );
}
