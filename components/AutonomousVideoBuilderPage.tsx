'use client'
import { autonomousVideoBuilder } from '@/lib/autonomousVideoBuilder'

export function AutonomousVideoBuilderPage(){
 const items = autonomousVideoBuilder()

 return (
  <div className="space-y-4">
   <div className="rounded-3xl border border-fuchsia-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">Autonomous Video Builder</h1>
   </div>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl border border-fuchsia-500/20 bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}