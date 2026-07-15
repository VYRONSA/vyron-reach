'use client'

import { enterpriseExecutionInfrastructure } from '@/lib/enterpriseExecutionInfrastructure'

export function EnterpriseExecutionInfrastructurePage(){
 const items = enterpriseExecutionInfrastructure()

 return (
  <div className="space-y-6">
   <div className="rounded-[62px] border border-violet-500/20 bg-[#0b0b1d] p-8">
    <h1 className="text-5xl font-black text-white">
      Enterprise Execution Infrastructure
    </h1>

    <p className="mt-2 text-sm text-zinc-400">
      Enterprise autonomous execution infrastructure module
    </p>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-violet-500/20 bg-[#0b0b1d] p-5 text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}