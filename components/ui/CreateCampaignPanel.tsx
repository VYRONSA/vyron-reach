'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCompanyId, CompanyResolutionError, NoCompanyMembershipError } from '@/lib/companyContext';

export const CreateCampaignPanel = ({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: () => void, onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
    budget: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyId = await resolveCompanyId();

      const { error } = await supabase
        .from('marketing_campaigns')
        .insert([
          {
            name: formData.name,
            status: formData.status,
            budget: parseFloat(formData.budget) || 0,
            company_id: companyId,
          },
        ]);

      if (error) {
        alert(`Engine Error: ${error.message}`);
      } else {
        onRefresh();
        onClose();
        setFormData({ name: '', status: 'Active', budget: '' });
      }
    } catch (err) {
      if (err instanceof NoCompanyMembershipError) {
        window.location.href = '/onboarding';
        return;
      }
      const message = err instanceof CompanyResolutionError ? err.message : 'Unexpected error creating campaign.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-[#050D1A]/40 backdrop-blur-sm">
      <div className="w-[500px] bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 p-12 flex flex-col">
        <header className="mb-10">
          <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-widest mb-2">Campaign Intake</p>
          <h2 className="text-2xl font-black tracking-tight text-[#050D1A]">Launch New Campaign</h2>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Campaign Name</label>
            <input
              required
              value={formData.name}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Status</label>
            <select
              value={formData.status}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Daily Budget (ZAR)</label>
            <input
              type="number"
              value={formData.budget}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-[#2563EB] outline-none transition"
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
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
              {loading ? 'Processing...' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
