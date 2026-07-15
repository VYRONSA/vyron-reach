'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCompanyId, CompanyResolutionError, NoCompanyMembershipError } from '@/lib/companyContext';

export type EditableLead = {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  estimated_value: number | null;
};

const emptyForm = { contact_name: '', company_name: '', email: '', estimated_value: '' };

export const AddLeadPanel = ({ isOpen, onClose, onRefresh, lead }: { isOpen: boolean, onClose: () => void, onRefresh: () => void, lead?: EditableLead | null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const isEditing = Boolean(lead);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(
      lead
        ? {
            contact_name: lead.contact_name ?? '',
            company_name: lead.company_name ?? '',
            email: lead.email ?? '',
            estimated_value: lead.estimated_value != null ? String(lead.estimated_value) : '',
          }
        : emptyForm
    );
  }, [isOpen, lead]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && lead) {
        const { data, error } = await supabase
          .from('marketing_leads')
          .update({
            contact_name: formData.contact_name,
            company_name: formData.company_name,
            email: formData.email,
            estimated_value: parseFloat(formData.estimated_value) || 0,
          })
          .eq('id', lead.id)
          .select('id');

        if (error || !data || data.length === 0) {
          alert(`Engine Error: ${error?.message ?? 'The lead could not be updated.'}`);
        } else {
          onRefresh();
          onClose();
        }
        return;
      }

      const companyId = await resolveCompanyId();

      const { error } = await supabase
        .from('marketing_leads')
        .insert([
          {
            contact_name: formData.contact_name,
            company_name: formData.company_name,
            email: formData.email,
            // Convert string to number for the database
            estimated_value: parseFloat(formData.estimated_value) || 0,
            status: 'New',
            company_id: companyId,
          },
        ]);

      if (error) {
        console.error("Supabase Error:", error.message);
        // This will alert you in the browser if the DB rejects it
        alert(`Engine Error: ${error.message}`);
      } else {
        onRefresh(); // Re-fetches the list on the main page
        onClose();   // Closes the panel
        setFormData(emptyForm);
      }
    } catch (err) {
      if (err instanceof NoCompanyMembershipError) {
        window.location.href = '/onboarding';
        return;
      }
      const message = err instanceof CompanyResolutionError ? err.message : 'Unexpected error saving lead.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-[#050D1A]/40 backdrop-blur-sm">
      <div className="w-[500px] bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 p-12 flex flex-col">
        <header className="mb-10">
          <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-widest mb-2">Lead Intake</p>
          <h2 className="text-2xl font-black tracking-tight text-[#050D1A]">{isEditing ? 'Edit Opportunity' : 'Add New Opportunity'}</h2>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Contact Name</label>
            <input 
              required
              value={formData.contact_name}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Company Name</label>
            <input 
              value={formData.company_name}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Email Address</label>
            <input 
              type="email"
              value={formData.email}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Estimated Value (ZAR)</label>
            <input 
              type="number"
              value={formData.estimated_value}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
            />
          </div>

          <div className="pt-10 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              disabled={loading}
              className="flex-[2] py-4 bg-[#2563EB] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition"
            >
              {loading ? 'Processing...' : isEditing ? 'Save Changes' : 'Save Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};