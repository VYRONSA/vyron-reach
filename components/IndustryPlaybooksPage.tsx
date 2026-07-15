'use client'
import { industryPlaybook } from '@/lib/industryPlaybooks'

export function IndustryPlaybooksPage(){
 const playbook = industryPlaybook('Towing Services')

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Industry Playbooks</h1>
   <div className="mt-6">Industry: {playbook.industry}</div>
   <div>Best Platform: {playbook.bestPlatform}</div>
   <div>Strategy: {playbook.bestStrategy}</div>
  </div>
 )
}