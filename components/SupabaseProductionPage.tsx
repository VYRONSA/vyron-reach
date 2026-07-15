'use client'
import { tables } from '@/lib/supabaseStructure'

export function SupabaseProductionPage(){
 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Supabase Production Storage</h1>
   {tables.map(table => (
    <div key={table} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{table}</div>
   ))}
  </div>
 )
}