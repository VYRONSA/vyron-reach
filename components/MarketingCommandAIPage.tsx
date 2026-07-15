'use client'
import { commandAI } from '@/lib/marketingCommandAI'

export function MarketingCommandAIPage(){
 const items = commandAI()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Marketing Command AI</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{item}</div>
   ))}
  </div>
 )
}