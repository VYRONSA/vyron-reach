'use client';
import React from 'react';
import { Card, DataCard } from '@/components/ui/Cards';

export default function ReportsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-12">
        <div>
          <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Intelligence</p>
          <h2 className="text-5xl font-black tracking-tight text-[#050D1A]">System Reports</h2>
        </div>
        <button className="bg-[#050D1A] text-white px-8 py-4 rounded-[18px] font-black text-xs uppercase tracking-widest">Export Intelligence</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <h4 className="text-lg font-black text-[#0F172A] mb-8 uppercase tracking-widest">Reach Velocity</h4>
          <div className="h-48 flex items-end gap-3">
             {[30, 50, 45, 90, 60, 75, 95].map((h, i) => (
               <div key={i} className="flex-1 bg-[#F6F8FB] rounded-t-lg relative group overflow-hidden">
                 <div className="absolute bottom-0 w-full bg-[#2563EB] transition-all duration-700 group-hover:bg-[#22D3EE]" style={{ height: `${h}%` }}></div>
               </div>
             ))}
          </div>
        </Card>
        <DataCard label="System ROI" value="4.2x" trend="Live" />
      </div>
    </div>
  );
}