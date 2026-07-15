'use client'
import { autonomousBrandVoice } from '@/lib/autonomousBrandVoice'

export function AutonomousBrandVoicePage(){
 const items = autonomousBrandVoice()

 return (
  <div className="space-y-6">
   <div className="rounded-[36px] border border-orange-500/20 bg-[#0b0b1d] p-8 shadow-2xl">
    <h1 className="text-5xl font-black tracking-tight text-white">
      Autonomous Brand Voice
    </h1>

    <div className="mt-2 text-sm text-zinc-400">
      Enterprise AI marketing automation and conversion intelligence
    </div>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-orange-500/20 bg-[#0b0b1d] p-5 text-sm font-medium text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}