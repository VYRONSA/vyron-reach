'use client'
import { enterpriseMonitoring } from '@/lib/enterpriseMonitoring'

export function EnterpriseMonitoringPage(){
 const result = enterpriseMonitoring()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Enterprise Monitoring</h1>

   <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div>Active: {result.activeCampaigns}</div>
    <div>High Risk: {result.highRiskCampaigns}</div>
    <div>Stable: {result.stableCampaigns}</div>
   </div>
  </div>
 )
}