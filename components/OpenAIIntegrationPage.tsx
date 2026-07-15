'use client'
import { aiPrompt } from '@/lib/openaiIntegration'

export function OpenAIIntegrationPage(){
 const output = aiPrompt('Towing company growth strategy')

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">OpenAI Integration</h1>
   <div className="mt-6">{output}</div>
  </div>
 )
}