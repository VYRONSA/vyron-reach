'use client'
import { leadRecovery } from '@/lib/leadRecoveryEngine'

export function LeadRecoveryPage(){
 const items = leadRecovery()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Lead Recovery Engine</h1>
   {items.map(item => (
    <div key={item} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{item}</div>
   ))}
  </div>
 )
}