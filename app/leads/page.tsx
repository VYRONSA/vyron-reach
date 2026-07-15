'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DataCard, Card } from '@/components/ui/Cards';
import { StatusPill } from '@/components/ui/StatusPill';
import { AddLeadPanel, type EditableLead } from '@/components/ui/AddLeadPanel';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<EditableLead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchLeads(); }, []);

  function openCreatePanel() {
    setEditingLead(null);
    setIsPanelOpen(true);
  }

  function openEditPanel(lead: any) {
    setEditingLead({
      id: lead.id,
      contact_name: lead.contact_name,
      company_name: lead.company_name,
      email: lead.email,
      estimated_value: lead.estimated_value,
    });
    setIsPanelOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('marketing_leads').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      alert(`Engine Error: ${error.message}`);
      return;
    }
    fetchLeads();
  }

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('marketing_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Sync Error:", error);
    if (data) setLeads(data);
    setLoading(false);
  }

  const totalValue = leads.reduce((acc, lead) => acc + (Number(lead.estimated_value) || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-12">
        <div>
          <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Reach Management</p>
          <h2 className="text-5xl font-black tracking-tight text-[#050D1A]">Leads & Contacts</h2>
        </div>
        <button
          onClick={openCreatePanel}
          className="bg-[#2563EB] text-white px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all"
        >
          + Add New Lead
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <DataCard label="Total Contacts" value={leads.length.toString()} />
        <DataCard label="Pipeline Value" value={`R ${totalValue.toLocaleString()}`} trend="Live" />
        <DataCard label="Avg. Deal Size" value={`R ${(totalValue / (leads.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Value</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-300">Syncing Engine...</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                  <td className="p-8 font-black text-[#0F172A]">{lead.contact_name}</td>
                  <td className="p-8 text-slate-500 font-bold text-sm">{lead.company_name || '—'}</td>
                  <td className="p-8"><StatusPill label={lead.status} /></td>
                  <td className="p-8 text-right font-black text-[#2563EB]">R {lead.estimated_value?.toLocaleString()}</td>
                  <td className="p-8 text-right">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => openEditPanel(lead)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#2563EB] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition disabled:opacity-40"
                      >
                        {deletingId === lead.id ? 'Removing...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddLeadPanel
        isOpen={isPanelOpen}
        onClose={() => { setIsPanelOpen(false); setEditingLead(null); }}
        onRefresh={fetchLeads}
        lead={editingLead}
      />
    </div>
  );
}