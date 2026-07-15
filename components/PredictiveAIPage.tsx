'use client'
import { predictiveAI } from '@/lib/predictiveAI'

export function PredictiveAIPage(){
 const result = predictiveAI()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Predictive AI</h1>
   <div className="mt-6 text-2xl font-black">{result.nextBestAction}</div>
   <div className="mt-4">Confidence: {result.confidence}</div>
  </div>
 )
}