'use client'
import { generateRecommendations } from '@/lib/aiRecommendations'

export function AIRecommendationsPage(){
 const recommendations = generateRecommendations()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">AI Recommendations</h1>
   {recommendations.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">
      {item}
    </div>
   ))}
  </div>
 )
}