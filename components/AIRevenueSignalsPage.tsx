'use client'

import { aIRevenueSignals } from '@/lib/aIRevenueSignals'

export function AIRevenueSignalsPage(){
 const items = aIRevenueSignals()

 return (
  <div className="space-y-6">
   <div className="rounded-[52px] border border-indigo-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">
      AI Revenue Signals
    </h1>

    <p className="mt-2 text-sm text-zinc-400">
      Enterprise autonomous production intelligence module
    </p>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-indigo-500/20 bg-[#0b0b1d] p-5 text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}