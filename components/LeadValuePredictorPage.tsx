'use client'
import { leadValuePredictor } from '@/lib/leadValuePredictor'

export function LeadValuePredictorPage(){
 const items = leadValuePredictor()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Lead Value Predictor</h1>

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