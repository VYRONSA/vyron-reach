'use client'
import { analyzeCompetitor } from '@/lib/competitorIntelligence'

export function CompetitorIntelligencePage(){
 const result = analyzeCompetitor('Market Leader')

 return (
  <div className="space-y-6">
   <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">Competitor Intelligence</h1>
   </div>

   <div className="grid gap-4 md:grid-cols-3">
    <div className="rounded-2xl bg-[#0b0b1d] p-5 text-white">
      <h2 className="font-black">Strengths</h2>
      {result.strengths.map(x => <div key={x}>{x}</div>)}
    </div>

    <div className="rounded-2xl bg-[#0b0b1d] p-5 text-white">
      <h2 className="font-black">Weaknesses</h2>
      {result.weaknesses.map(x => <div key={x}>{x}</div>)}
    </div>

    <div className="rounded-2xl bg-[#0b0b1d] p-5 text-white">
      <h2 className="font-black">Opportunities</h2>
      {result.opportunities.map(x => <div key={x}>{x}</div>)}
    </div>
   </div>
  </div>
 )
}