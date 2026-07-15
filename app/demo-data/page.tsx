'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DemoDataPage() {
  const [message, setMessage] = useState('Ready to generate VYRON REACH demo data.')

  async function generateDemoData() {
    setMessage('Checking logged-in user...')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      setMessage('Error: You must be logged in before generating demo data.')
      return
    }

    const userId = user.id

    setMessage('Clearing old demo data...')

    await Promise.all([
      supabase.from('vyron_reach_leads').delete().eq('user_id', userId),
      supabase.from('vyron_reach_campaigns').delete().eq('user_id', userId),
      supabase.from('vyron_reach_tasks').delete().eq('user_id', userId),
      supabase.from('vyron_reach_content').delete().eq('user_id', userId),
    ])

    setMessage('Generating fresh demo data...')

    const leadsRes = await supabase.from('vyron_reach_leads').insert([
      {
        user_id: userId,
        name: 'Sarah Jacobs',
        company: 'BluePeak Logistics',
        email: 'sarah@bluepeak.co.za',
        phone: '082 555 1122',
        source: 'LinkedIn',
        status: 'New',
        value: 45000,
        owner: 'VYRON Admin',
        next_follow_up: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        notes: 'Interested in lead follow-up automation and campaign tracking.',
      },
      {
        user_id: userId,
        name: 'Michael Naidoo',
        company: 'Urban Edge Property Group',
        email: 'michael@urbanedge.co.za',
        phone: '083 555 2244',
        source: 'Cold Email',
        status: 'Qualified',
        value: 85000,
        owner: 'VYRON Admin',
        next_follow_up: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        notes: 'Needs better marketing visibility across multiple property branches.',
      },
      {
        user_id: userId,
        name: 'Anika Botha',
        company: 'FreshLine Foods',
        email: 'anika@freshline.co.za',
        phone: '084 555 3366',
        source: 'Referral',
        status: 'Proposal',
        value: 120000,
        owner: 'VYRON Admin',
        next_follow_up: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        notes: 'Proposal requested for monthly marketing command centre setup.',
      },
      {
        user_id: userId,
        name: 'Thabo Mokoena',
        company: 'Northstar Retail Holdings',
        email: 'thabo@northstar.co.za',
        phone: '081 555 7788',
        source: 'Website',
        status: 'Won',
        value: 150000,
        owner: 'VYRON Admin',
        next_follow_up: new Date(Date.now() + 432000000).toISOString().split('T')[0],
        notes: 'Strong opportunity for multi-branch marketing reporting.',
      },
    ])

    if (leadsRes.error) {
      setMessage(`Leads error: ${leadsRes.error.message}`)
      return
    }

    const campaignsRes = await supabase.from('vyron_reach_campaigns').insert([
      {
        user_id: userId,
        name: 'LinkedIn Enterprise Outreach',
        channel: 'LinkedIn',
        status: 'Active',
        budget: 18000,
        spend: 6200,
        revenue: 95000,
        leads: 18,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
        notes: 'High-value B2B outreach campaign targeting decision makers.',
      },
      {
        user_id: userId,
        name: 'Cold Email ROI Offer',
        channel: 'Email',
        status: 'Active',
        budget: 8500,
        spend: 2600,
        revenue: 60000,
        leads: 12,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 1814400000).toISOString().split('T')[0],
        notes: 'Campaign focused on free marketing leakage audit.',
      },
      {
        user_id: userId,
        name: 'Property Managers Demo Push',
        channel: 'Direct Outreach',
        status: 'Planning',
        budget: 12000,
        spend: 0,
        revenue: 0,
        leads: 0,
        start_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 2419200000).toISOString().split('T')[0],
        notes: 'Upcoming campaign for property management companies.',
      },
    ])

    if (campaignsRes.error) {
      setMessage(`Campaigns error: ${campaignsRes.error.message}`)
      return
    }

    const tasksRes = await supabase.from('vyron_reach_tasks').insert([
      {
        user_id: userId,
        title: 'Follow up with BluePeak Logistics',
        type: 'Follow-up',
        status: 'Pending',
        owner: 'VYRON Admin',
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: 'High',
        lead_name: 'Sarah Jacobs',
        channel: 'LinkedIn',
        notes: 'Send personalised message with ROI dashboard angle.',
      },
      {
        user_id: userId,
        title: 'Prepare ROI proposal for Northstar Retail',
        type: 'Proposal',
        status: 'In Progress',
        owner: 'VYRON Admin',
        due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        priority: 'High',
        lead_name: 'Thabo Mokoena',
        channel: 'Website',
        notes: 'Focus on branch visibility, campaign waste, and pipeline reporting.',
      },
      {
        user_id: userId,
        title: 'Write LinkedIn campaign hooks',
        type: 'Content',
        status: 'Pending',
        owner: 'VYRON Admin',
        due_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        priority: 'Normal',
        lead_name: '',
        channel: 'LinkedIn',
        notes: 'Create 5 hooks for marketing leakage and missed lead follow-up.',
      },
    ])

    if (tasksRes.error) {
      setMessage(`Tasks error: ${tasksRes.error.message}`)
      return
    }

    const contentRes = await supabase.from('vyron_reach_content').insert([
      {
        user_id: userId,
        title: 'How companies lose money through weak follow-up',
        type: 'Post',
        channel: 'LinkedIn',
        status: 'Planned',
        owner: 'VYRON Admin',
        publish_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        campaign: 'LinkedIn Enterprise Outreach',
        notes: 'Educational post with ROI audit CTA.',
      },
      {
        user_id: userId,
        title: 'Marketing command centre demo carousel',
        type: 'Carousel',
        channel: 'Instagram',
        status: 'Draft',
        owner: 'VYRON Admin',
        publish_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        campaign: 'Property Managers Demo Push',
        notes: 'Show dashboard, leads, campaigns, tasks and reports.',
      },
      {
        user_id: userId,
        title: 'Book your free marketing leakage review',
        type: 'Email',
        channel: 'Email',
        status: 'Ready',
        owner: 'VYRON Admin',
        publish_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        campaign: 'Cold Email ROI Offer',
        notes: 'Send to warm leads and previous enquiries.',
      },
    ])

    if (contentRes.error) {
      setMessage(`Content error: ${contentRes.error.message}`)
      return
    }

    setMessage('Demo data generated successfully. Go back to VYRON REACH and refresh.')
  }

  return (
    <main className="min-h-screen bg-[#05050f] p-8 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8 shadow-[0_0_40px_rgba(168,85,247,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-purple-300">
          VYRON REACH
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Demo Data Generator
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          This creates a complete premium demo workspace linked to your logged-in user.
        </p>

        <button
          onClick={generateDemoData}
          className="mt-8 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-black text-white hover:bg-purple-500"
        >
          Generate Fresh Demo Data
        </button>

        <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm font-bold text-purple-100">
          {message}
        </div>
      </div>
    </main>
  )
}