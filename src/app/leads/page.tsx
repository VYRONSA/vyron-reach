'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lead } from '@/types'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const addLead = async () => {
    await supabase.from('leads').insert([{ name, email, company, status: 'new' }])
    setName('')
    setEmail('')
    setCompany('')
    fetchLeads()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>

      <div className="flex gap-2 mb-4">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2"/>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2"/>
        <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} className="border p-2"/>
        <button onClick={addLead} className="bg-blue-600 text-white px-4">Add</button>
      </div>

      <ul>
        {leads.map(l => (
          <li key={l.id} className="border-b py-2">
            {l.name} — {l.company}
          </li>
        ))}
      </ul>
    </div>
  )
}