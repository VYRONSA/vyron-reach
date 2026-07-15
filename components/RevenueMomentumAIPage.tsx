'use client'
import { revenueMomentumAI } from '@/lib/revenueMomentumAI'

export function RevenueMomentumAIPage(){
 const items = revenueMomentumAI()

 return (
  <div className="space-y-4">
   <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">Revenue Momentum AI</h1>
   </div>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl border border-purple-500/20 bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}