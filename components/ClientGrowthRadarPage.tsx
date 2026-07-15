'use client'
import { growthRadar } from '@/lib/clientGrowthRadar'

export function ClientGrowthRadarPage(){
 const items = growthRadar()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Client Growth Radar</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{item}</div>
   ))}
  </div>
 )
}