'use client'
import { predictiveScaling } from '@/lib/predictiveScaling'

export function PredictiveScalingPage(){
 const result = predictiveScaling()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Predictive Scaling</h1>
   <div className="mt-6 text-2xl font-black">
    Forecast Growth: {result.nextMonthGrowth}
   </div>
   <div className="mt-4">{result.recommendation}</div>
  </div>
 )
}