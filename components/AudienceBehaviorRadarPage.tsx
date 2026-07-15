'use client'
import { audienceBehaviorRadar } from '@/lib/audienceBehaviorRadar'

export function AudienceBehaviorRadarPage(){
 const items = audienceBehaviorRadar()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Audience Behavior Radar</h1>

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