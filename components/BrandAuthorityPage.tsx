'use client'
import { brandAuthority } from '@/lib/brandAuthorityAI'

export function BrandAuthorityPage(){
 const result = brandAuthority()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">Brand Authority AI</h1>
   <div className="mt-6">Authority: {result.authority}</div>
   <div>Trust Score: {result.trustScore}</div>
   <div>{result.recommendation}</div>
  </div>
 )
}