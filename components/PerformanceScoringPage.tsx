'use client'
import { generatePerformanceScore } from '@/lib/performanceScoring'

export function PerformanceScoringPage(){
 const score = generatePerformanceScore(82)

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Performance Scoring</h1>
   <div className="mt-6 text-3xl font-black">{score}</div>
  </div>
 )
}