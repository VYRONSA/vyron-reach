'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  const fetchCampaigns = async () => {
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(data || [])
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const addCampaign = async () => {
    await supabase.from('campaigns').insert([{ name, budget: Number(budget), status: 'active' }])
    setName('')
    setBudget('')
    fetchCampaigns()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Campaigns</h1>

      <div className="flex gap-2 mb-4">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2"/>
        <input placeholder="Budget" value={budget} onChange={e => setBudget(e.target.value)} className="border p-2"/>
        <button onClick={addCampaign} className="bg-green-600 text-white px-4">Add</button>
      </div>

      <ul>
        {campaigns.map(c => (
          <li key={c.id} className="border-b py-2">
            {c.name} — R{c.budget}
          </li>
        ))}
      </ul>
    </div>
  )
}