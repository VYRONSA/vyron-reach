'use client'
import { adFatigue } from '@/lib/adFatigueEngine'

export function AdFatiguePage(){
 const alerts = adFatigue()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Ad Fatigue Engine</h1>
   {alerts.map(alert => (
    <div key={alert} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-white">{alert}</div>
   ))}
  </div>
 )
}