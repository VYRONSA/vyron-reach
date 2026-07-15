'use client'
import { aISalesForecast } from '@/lib/aISalesForecast'

export function AISalesForecastPage(){
 const items = aISalesForecast()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">AI Sales Forecast</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">
      {item}
    </div>
   ))}
  </div>
 )
}