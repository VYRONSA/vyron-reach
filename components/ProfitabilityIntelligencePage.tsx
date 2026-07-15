'use client'
import { profitability } from '@/lib/profitabilityEngine'

export function ProfitabilityIntelligencePage(){
 const result = profitability(12000, 28000)

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Profitability Intelligence</h1>

   <div className="mt-6 grid gap-4 md:grid-cols-4">
    <div>Spend: R{result.spend}</div>
    <div>Revenue: R{result.revenue}</div>
    <div>Profit: R{result.profit}</div>
    <div>ROI: {result.roi.toFixed(1)}%</div>
   </div>
  </div>
 )
}