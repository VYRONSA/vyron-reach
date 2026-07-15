'use client'
import { salesIntelligence } from '@/lib/salesIntelligence'

export function SalesIntelligencePage(){
 const result = salesIntelligence()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Sales Intelligence</h1>
   <div className="mt-6">Best Channel: {result.bestClosingChannel}</div>
   <div>Weak Channel: {result.weakChannel}</div>
   <div>{result.recommendation}</div>
  </div>
 )
}