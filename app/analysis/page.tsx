'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, DataCard } from '@/components/ui/Cards';
import { calculatePropertyMetrics } from '@/lib/roi_engine';

export default function AnalysisPage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('marketing_leads').select('*').not('purchase_price', 'eq', 0);
      if (data) setLeads(data);
    }
    fetchLeads();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Portfolio Intelligence</p>
        <h2 className="text-5xl font-black tracking-tight text-[#050D1A]">ROI Analysis</h2>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {leads.map((property) => {
          const metrics = calculatePropertyMetrics(property.purchase_price, property.monthly_rental, property.is_section_13sex);
          
          return (
            <Card key={property.id} className="p-10 border-l-8 border-l-[#2563EB]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-[#050D1A] mb-2">{property.company_name || property.contact_name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Property Investment Lead</p>
                </div>
                {property.is_section_13sex && (
                  <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Section 13sex Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Gross Yield</p>
                  <p className="text-3xl font-black text-[#050D1A]">{metrics.grossYield}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Est. Annual Income</p>
                  <p className="text-3xl font-black text-[#2563EB]">R {metrics.annualIncome}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Annual Tax Benefit</p>
                  <p className="text-3xl font-black text-[#22D3EE]">R {metrics.taxBenefit}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Net Cashflow (Est)</p>
                  <p className="text-3xl font-black text-emerald-500">R {metrics.monthlyCashflow}/mo</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}