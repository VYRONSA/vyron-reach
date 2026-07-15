'use client'
import { predictiveLeadScoring } from '@/lib/predictiveLeadScoring'

export function PredictiveLeadScoringPage(){
 const items = predictiveLeadScoring()

 return (
  <div className="space-y-4">
   <div className="rounded-3xl bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">Predictive Lead Scoring</h1>
   </div>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl border border-purple-500/20 bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}