'use client'
import { metaAdsData } from '@/lib/metaAdsApi'

export function MetaAdsIntegrationPage(){
 const data = metaAdsData()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Meta Ads API</h1>
   <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div>Reach: {data.reach}</div>
    <div>Engagement: {data.engagement}</div>
    <div>Audience: {data.bestAudience}</div>
   </div>
  </div>
 )
}