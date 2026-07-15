'use client'
import { searchConversionEngine } from '@/lib/searchConversionEngine'

export function SearchConversionEnginePage(){
 const items = searchConversionEngine()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Search Conversion Engine</h1>

   {items.map(item => (
    <div
      key={item}
      className="rounded-2xl bg-[#0b0b1d] p-4 text-white"
    >
      {item}
    </div>
   ))}
  </div>
 )
}