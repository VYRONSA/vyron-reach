'use client'
import { smartBudget } from '@/lib/smartBudgetAllocator'

export function SmartBudgetAllocatorPage(){
 const result = smartBudget()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Smart Budget Allocator</h1>

   <div className="mt-6 grid gap-4 md:grid-cols-4">
    <div>Google: {result.google}</div>
    <div>Facebook: {result.facebook}</div>
    <div>Instagram: {result.instagram}</div>
    <div>SEO: {result.seo}</div>
   </div>
  </div>
 )
}