'use client'
import { googleAdsData } from '@/lib/googleAdsApi'

export function GoogleAdsIntegrationPage(){
 const data = googleAdsData()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Google Ads API</h1>
   <div className="mt-6 grid gap-4 md:grid-cols-4">
    <div>Spend: R{data.spend}</div>
    <div>Conversions: {data.conversions}</div>
    <div>CTR: {data.ctr}%</div>
    <div>Best Keyword: {data.bestKeyword}</div>
   </div>
  </div>
 )
}