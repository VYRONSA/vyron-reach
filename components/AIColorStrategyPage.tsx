'use client'
import { aIColorStrategy } from '@/lib/aIColorStrategy'

export function AIColorStrategyPage(){
 const items = aIColorStrategy()

 return (
  <div className="space-y-4">
   <div className="rounded-3xl border border-cyan-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">AI Color Strategy</h1>
   </div>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl border border-cyan-500/20 bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}