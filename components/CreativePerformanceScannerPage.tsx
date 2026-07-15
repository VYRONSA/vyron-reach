'use client'
import { creativePerformanceScanner } from '@/lib/creativePerformanceScanner'

export function CreativePerformanceScannerPage(){
 const items = creativePerformanceScanner()

 return (
  <div className="space-y-6">
   <div className="rounded-[38px] border border-pink-500/20 bg-[#0b0b1d] p-8 shadow-2xl">
    <h1 className="text-5xl font-black tracking-tight text-white">
      Creative Performance Scanner
    </h1>

    <div className="mt-2 text-sm text-zinc-400">
      Enterprise autonomous marketing intelligence platform
    </div>
   </div>

   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item => (
      <div
        key={item}
        className="rounded-2xl border border-pink-500/20 bg-[#0b0b1d] p-5 text-sm font-medium text-white"
      >
        {item}
      </div>
    ))}
   </div>
  </div>
 )
}