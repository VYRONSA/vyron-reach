'use client'
import { campaignForecast } from '@/lib/campaignForecasting'

export function CampaignForecastingPage(){
 const result = campaignForecast()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Campaign Forecasting</h1>
   <div className="mt-6">Projected Leads: {result.projectedLeads}</div>
   <div>Projected ROI: {result.projectedROI}</div>
   <div>{result.recommendation}</div>
  </div>
 )
}