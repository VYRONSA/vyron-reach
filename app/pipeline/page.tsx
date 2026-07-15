'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const stages = ['New', 'Discovery', 'Proposal', 'Closing'];

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('marketing_leads').select('*');
      if (data) setLeads(data);
    }
    fetchLeads();
  }, []);

  async function moveLead(leadId: string, nextStage: string) {
    const previousLeads = leads;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || (lead.status ?? 'New') === nextStage) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: nextStage } : l)));

    const { data, error } = await supabase
      .from('marketing_leads')
      .update({ status: nextStage })
      .eq('id', leadId)
      .select('id');

    // RLS silently matches zero rows instead of erroring, so an empty
    // result is also a failure case that needs the optimistic update rolled back.
    if (error || !data || data.length === 0) {
      setLeads(previousLeads);
      alert(`Could not move lead: ${error?.message ?? 'The change was not saved.'}`);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Revenue Oversight</p>
        <h2 className="text-5xl font-black tracking-tight text-[#050D1A]">Deal Pipeline</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stages.map((stage) => (
          <div key={stage} className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stage}</p>
              <span className="text-[10px] font-black text-slate-300">{leads.filter(l => (l.status ?? 'New') === stage).length}</span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
              onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const leadId = e.dataTransfer.getData('text/plain') || draggingId;
                if (leadId) moveLead(leadId, stage);
                setDraggingId(null);
              }}
              className={`bg-slate-50/50 border border-dashed rounded-[34px] p-3 min-h-[600px] space-y-4 transition-colors ${
                dragOverStage === stage ? 'border-[#2563EB] bg-blue-50/50' : 'border-slate-200'
              }`}
            >
              {leads.filter(l => (l.status ?? 'New') === stage).map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id);
                    setDraggingId(lead.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:border-[#2563EB] cursor-grab active:cursor-grabbing transition-all ${
                    draggingId === lead.id ? 'opacity-40' : ''
                  }`}
                >
                  <p className="font-black text-[#0F172A] text-sm mb-1">{lead.contact_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lead.company_name}</p>
                  <p className="mt-4 font-black text-[#2563EB] text-xs">R {lead.estimated_value?.toLocaleString()}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stages.filter((s) => s !== stage).map((target) => (
                      <button
                        key={target}
                        onClick={() => moveLead(lead.id, target)}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#2563EB] bg-slate-50 hover:bg-blue-50 rounded-lg px-2 py-1 transition"
                      >
                        → {target}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
