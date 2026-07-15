'use client'
import { seoAuthority } from '@/lib/seoAuthorityEngine'

export function SEOAuthorityPage(){
 const result = seoAuthority()

 return (
  <div className="rounded-3xl bg-[#0b0b1d] p-8 text-white">
   <h1 className="text-5xl font-black">SEO Authority Engine</h1>
   <div className="mt-6">Authority Score: {result.authorityScore}</div>
   <div>Backlinks: {result.backlinks}</div>
   <div>{result.recommendation}</div>
  </div>
 )
}