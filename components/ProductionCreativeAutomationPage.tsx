'use client'

import { productionCreativeAutomation } from '@/lib/productionCreativeAutomation'

export function ProductionCreativeAutomationPage(){
 const items = productionCreativeAutomation()

 return (
  <div className="space-y-6">
   <div className="rounded-[50px] border border-cyan-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">
      Production Creative Automation
    </h1>

    <p className="mt-2 text-sm text-zinc-400">
      Enterprise autonomous AI execution module
    </p>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-cyan-500/20 bg-[#0b0b1d] p-5 text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}