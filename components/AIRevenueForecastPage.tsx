'use client'
import { revenueForecast } from '@/lib/aiRevenueForecast'

export function AIRevenueForecastPage(){
 const result = revenueForecast()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">AI Revenue Forecast</h1>
   <div className="mt-6">Forecast Revenue: {result.nextQuarterRevenue}</div>
   <div>Growth: {result.predictedGrowth}</div>
   <div>{result.recommendation}</div>
  </div>
 )
}