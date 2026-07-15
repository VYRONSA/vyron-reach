'use client'
import { industryStyleEngine } from '@/lib/industryStyleEngine'

export function IndustryStyleEnginePage(){
 const items = industryStyleEngine()

 return (
  <div className="space-y-5">
   <div className="rounded-[34px] border border-cyan-500/20 bg-[#0b0b1d] p-8 shadow-2xl">
    <h1 className="text-5xl font-black tracking-tight text-white">
      Industry Style Engine
    </h1>

    <div className="mt-2 text-sm text-zinc-400">
      Autonomous enterprise marketing intelligence system
    </div>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-cyan-500/20 bg-[#0b0b1d] p-5 text-sm font-medium text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}