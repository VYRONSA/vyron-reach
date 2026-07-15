import React from 'react';

export const StatusPill = ({ label }: { label: string }) => {
  const getColors = (l: string) => {
    const low = l.toLowerCase();
    if (low.includes('new')) return 'bg-blue-50 text-[#2563EB]';
    if (low.includes('high') || low.includes('proposal')) return 'bg-cyan-50 text-[#22D3EE]';
    if (low.includes('discovery')) return 'bg-slate-100 text-slate-500';
    return 'bg-emerald-50 text-emerald-600';
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${getColors(label)}`}>
      {label}
    </span>
  );
};