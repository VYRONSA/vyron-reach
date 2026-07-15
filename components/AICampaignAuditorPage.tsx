'use client'
import { campaignAudit } from '@/lib/aiCampaignAuditor'

export function AICampaignAuditorPage(){
 const items = campaignAudit()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">AI Campaign Auditor</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-white">{item}</div>
   ))}
  </div>
 )
}