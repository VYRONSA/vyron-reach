'use client'
import { generateExecutiveSummary } from '@/lib/executiveReporting'

export function ExecutiveReportingPage(){
 const summary = generateExecutiveSummary('RapidTow')

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Executive Reporting</h1>
   <p className="mt-6">{summary}</p>
  </div>
 )
}