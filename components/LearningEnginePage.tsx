'use client'
import { learningInsight } from '@/lib/learningEngine'

export function LearningEnginePage(){
 const insights = learningInsight()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Learning Engine</h1>
   {insights.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{item}</div>
   ))}
  </div>
 )
}