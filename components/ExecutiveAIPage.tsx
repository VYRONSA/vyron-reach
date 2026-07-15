'use client'
import { executiveAIReport } from '@/lib/executiveAI'

export function ExecutiveAIPage(){
 const report = executiveAIReport()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Executive AI</h1>
   <div className="mt-6">{report.summary}</div>
   <div className="mt-4">{report.recommendation}</div>
  </div>
 )
}