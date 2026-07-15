import React from 'react';

// The High-Contrast Hero Panel
export const CommandPanel = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="bg-[#050D1A] rounded-[34px] p-10 text-white mb-10 shadow-2xl relative overflow-hidden border border-white/5">
    <div className="relative z-10">
      <p className="text-[#22D3EE] text-[10px] font-black uppercase tracking-[0.3em] mb-2">{subtitle}</p>
      <h2 className="text-4xl font-black tracking-tighter leading-none">{title}</h2>
      <div className="flex gap-4 mt-8">
        {children}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB] opacity-10 blur-[120px] -mr-48 -mt-48" />
  </div>
);

// The KPI Data Card
export const DataCard = ({ label, value, trend }: { label: string, value: string, trend?: string }) => (
  <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:translate-y-[-2px] transition-all duration-300">
    <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-400 mb-3">{label}</p>
    <div className="flex items-end justify-between">
      <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter">{value}</h3>
      {trend && (
        <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
          {trend}
        </span>
      )}
    </div>
  </div>
);

// The Standard List/Table Card
export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-slate-100 rounded-[34px] p-10 shadow-sm ${className}`}>
    {children}
  </div>
);