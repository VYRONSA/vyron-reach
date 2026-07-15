'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CommandPanel, Card } from '@/components/ui/Cards';
import { generateOutreachDraft } from '@/lib/ai_engine';

export default function OutreachPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [activeDraft, setActiveDraft] = useState<{name: string, text: string} | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('marketing_leads').select('*').limit(10);
      if (data) setLeads(data);
    }
    fetchLeads();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <header className="mb-12">
        <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Operational Velocity</p>
        <h2 className="text-5xl font-black tracking-tight text-[#050D1A]">Outreach Queue</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="max-h-[70vh] overflow-y-auto">
          <h4 className="text-xl font-black text-[#0F172A] mb-8">Daily Actions</h4>
          <div className="space-y-4">
            {leads.map((l) => (
              <div key={l.id} className="p-8 border border-slate-50 rounded-[30px] hover:border-[#2563EB] transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                     {l.status || 'New'} Lead
                   </span>
                </div>
                <p className="font-black text-[#0F172A] text-lg">{l.contact_name}</p>
                <p className="text-sm text-slate-500 font-bold mb-6">{l.company_name}</p>
                <button 
                  onClick={() => setActiveDraft({
                    name: l.contact_name,
                    text: generateOutreachDraft(l.contact_name, l.company_name, l.status || 'New')
                  })}
                  className="w-full py-4 bg-slate-50 text-[#050D1A] group-hover:bg-[#2563EB] group-hover:text-white rounded-[18px] font-black text-xs uppercase tracking-widest transition-all"
                >
                  Generate AI Draft
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* AI DRAFT PREVIEW PANEL */}
        <div className="sticky top-0 h-fit space-y-6">
          {activeDraft ? (
            <div className="bg-[#050D1A] rounded-[34px] p-12 text-white shadow-2xl animate-in fade-in zoom-in duration-300">
              <h4 className="text-xl font-black mb-2 text-[#22D3EE]">Sentry Draft</h4>
              <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">To: {activeDraft.name}</p>
              
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 text-slate-300 font-medium leading-relaxed italic mb-8">
                "{activeDraft.text}"
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(activeDraft.text);
                    alert("Draft copied to clipboard!");
                  }}
                  className="flex-1 py-4 bg-[#2563EB] text-white rounded-[18px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Copy to Clipboard
                </button>
                <button 
                  onClick={() => setActiveDraft(null)}
                  className="px-8 py-4 border border-white/10 rounded-[18px] font-black text-xs uppercase text-slate-500 hover:text-white transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[34px] p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 font-black text-slate-400">AI</div>
              <p className="text-slate-400 font-bold max-w-[200px]">Select a lead from the queue to generate an AI outreach draft.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}