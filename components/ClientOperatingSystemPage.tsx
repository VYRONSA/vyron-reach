'use client'
import { clients } from '@/lib/clientOperatingSystem'

export function ClientOperatingSystemPage(){
 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Client Operating System</h1>
   {clients.map(client => (
    <div key={client.name} className="rounded-2xl bg-[#0b0b1d] p-5 text-white">
      <div className="text-2xl font-black">{client.name}</div>
      <div>Status: {client.status}</div>
      <div>Reports: {client.reports}</div>
    </div>
   ))}
  </div>
 )
}