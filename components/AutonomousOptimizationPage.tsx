'use client'
import { autonomousOptimization } from '@/lib/autonomousOptimization'

export function AutonomousOptimizationPage(){
 const items = autonomousOptimization()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Autonomous Optimization</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{item}</div>
   ))}
  </div>
 )
}