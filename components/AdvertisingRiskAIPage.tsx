'use client'
import { advertisingRiskAI } from '@/lib/advertisingRiskAI'

export function AdvertisingRiskAIPage(){
 const items = advertisingRiskAI()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Advertising Risk AI</h1>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}