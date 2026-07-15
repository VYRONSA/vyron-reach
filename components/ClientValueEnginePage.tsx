'use client'
import { clientValue } from '@/lib/clientValueEngine'

export function ClientValueEnginePage(){
 const result = clientValue()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Client Value Engine</h1>

   <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div>Monthly Value: {result.monthlyValue}</div>
    <div>Growth Potential: {result.growthPotential}</div>
    <div>Risk: {result.risk}</div>
   </div>
  </div>
 )
}