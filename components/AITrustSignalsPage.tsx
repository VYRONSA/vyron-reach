'use client'
import { aITrustSignals } from '@/lib/aITrustSignals'

export function AITrustSignalsPage(){
 const items = aITrustSignals()

 return (
  <div className="space-y-4">
   <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">AI Trust Signals</h1>
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