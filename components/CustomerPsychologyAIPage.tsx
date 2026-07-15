'use client'
import { customerPsychologyAI } from '@/lib/customerPsychologyAI'

export function CustomerPsychologyAIPage(){
 const items = customerPsychologyAI()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Customer Psychology AI</h1>

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