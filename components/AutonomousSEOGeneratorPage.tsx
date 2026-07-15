'use client'
import { autonomousSEOGenerator } from '@/lib/autonomousSEOGenerator'

export function AutonomousSEOGeneratorPage(){
 const items = autonomousSEOGenerator()

 return (
  <div className="space-y-4">
   <div className="rounded-[32px] border border-violet-500/20 bg-[#0b0b1d] p-8 shadow-2xl">
    <h1 className="text-5xl font-black tracking-tight text-white">
      Autonomous SEO Generator
    </h1>

    <p className="mt-3 text-sm text-zinc-400">
      Enterprise AI marketing intelligence module
    </p>
   </div>

   <div className="grid gap-4 md:grid-cols-2">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-violet-500/20 bg-[#0b0b1d] p-5 text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}