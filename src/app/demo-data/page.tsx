'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type GeneratorStatus = 'idle' | 'running' | 'success' | 'error'

const demoLeads = [
  { name: 'Sarah Jacobs', email: 'sarah@bluepeak.co.za', company: 'BluePeak Logistics', status: 'new' },
  { name: 'Michael Naidoo', email: 'michael@urbanedge.co.za', company: 'Urban Edge Property Group', status: 'contacted' },
  { name: 'Anika Botha', email: 'anika@freshline.co.za', company: 'FreshLine Foods', status: 'qualified' },
  { name: 'Thabo Mokoena', email: 'thabo@northstar.co.za', company: 'Northstar Retail Holdings', status: 'proposal' },
  { name: 'Michelle van Wyk', email: 'michelle@capewide.co.za', company: 'CapeWide Services', status: 'won' },
  { name: 'Jason Pillay', email: 'jason@fleetguard.co.za', company: 'FleetGuard Africa', status: 'new' },
  { name: 'Lerato Dlamini', email: 'lerato@greenfield.co.za', company: 'Greenfield Estates', status: 'contacted' },
  { name: 'Chris Meyer', email: 'chris@matrixhire.co.za', company: 'Matrix Hire Solutions', status: 'qualified' },
]

const demoCampaigns = [
  { name: 'LinkedIn Enterprise Outreach', budget: 18000, status: 'active' },
  { name: 'Property Managers Lead Campaign', budget: 12500, status: 'active' },
  { name: 'Cold Email ROI Offer', budget: 8500, status: 'active' },
  { name: 'Brand Awareness Retargeting', budget: 6000, status: 'paused' },
  { name: 'Case Study Launch', budget: 4500, status: 'planned' },
]

const demoTasks = [
  { title: 'Follow up with BluePeak Logistics', status: 'open', due_date: getFutureDate(1) },
  { title: 'Prepare ROI proposal for Northstar Retail', status: 'open', due_date: getFutureDate(2) },
  { title: 'Write LinkedIn campaign hook variations', status: 'open', due_date: getFutureDate(3) },
  { title: 'Review campaign performance', status: 'completed', due_date: getFutureDate(4) },
  { title: 'Build fresh email list for property managers', status: 'open', due_date: getFutureDate(5) },
]

const demoContent = [
  {
    title: 'How companies lose money through weak follow-up',
    platform: 'LinkedIn',
    status: 'planned',
    publish_date: getFutureDate(1),
    content_type: 'Post',
    notes: 'Strong educational post. End with ROI audit CTA.',
  },
  {
    title: 'VYRON REACH command centre teaser',
    platform: 'Instagram',
    status: 'drafting',
    publish_date: getFutureDate(2),
    content_type: 'Carousel',
    notes: 'Show dashboard, leads, campaigns and reports.',
  },
  {
    title: 'Email: Book your free marketing leakage review',
    platform: 'Email',
    status: 'ready',
    publish_date: getFutureDate(3),
    content_type: 'Email',
    notes: 'Send to warm leads and old enquiries.',
  },
  {
    title: 'Client acquisition mistake checklist',
    platform: 'LinkedIn',
    status: 'planned',
    publish_date: getFutureDate(5),
    content_type: 'Carousel',
    notes: 'Position VYRON REACH as a control system.',
  },
]

function getFutureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default function DemoDataPage() {
  const [status, setStatus] = useState<GeneratorStatus>('idle')
  const [message, setMessage] = useState('Ready to generate premium demo data.')

  async function generateDemoData() {
    setStatus('running')
    setMessage('Generating demo data...')

    try {
      const [leadsRes, campaignsRes, tasksRes, contentRes] = await Promise.all([
        supabase.from('leads').insert(demoLeads),
        supabase.from('campaigns').insert(demoCampaigns),
        supabase.from('tasks').insert(demoTasks),
        supabase.from('content_items').insert(demoContent),
      ])

      const errors = [leadsRes.error, campaignsRes.error, tasksRes.error, contentRes.error].filter(Boolean)

      if (errors.length > 0) {
        setStatus('error')
        setMessage(errors[0]?.message || 'Demo data could not be generated.')
        return
      }

      setStatus('success')
      setMessage('Demo data generated successfully. Your dashboard is now client-demo ready.')
    } catch {
      setStatus('error')
      setMessage('Unexpected error while generating demo data.')
    }
  }

  async function clearDemoData() {
    setStatus('running')
    setMessage('Clearing demo data...')

    try {
      await Promise.all([
        supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('content_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ])

      setStatus('success')
      setMessage('Demo data cleared successfully.')
    } catch {
      setStatus('error')
      setMessage('Could not clear demo data.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
          <p className="text-sm font-semibold tracking-[0.3em] text-purple-300">VYRON REACH</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Demo Data Generator</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Instantly load realistic leads, campaigns, tasks and content so the app looks alive during client demos.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Demo Leads" value={demoLeads.length} />
          <StatCard label="Campaigns" value={demoCampaigns.length} />
          <StatCard label="Tasks" value={demoTasks.length} />
          <StatCard label="Content Items" value={demoContent.length} />
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Generate Client Demo Workspace</h2>
          <p className="mt-2 text-sm text-slate-500">
            This inserts professional sample records into Supabase. Use this before showing the product to potential clients.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-700">Status</p>
            <p className={`mt-2 text-sm font-semibold ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-700' : 'text-slate-600'}`}>
              {message}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={generateDemoData}
              disabled={status === 'running'}
              className="rounded-2xl bg-purple-600 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Generate Demo Data
            </button>

            <button
              onClick={clearDemoData}
              disabled={status === 'running'}
              className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear Demo Data
            </button>

            <Link
              href="/"
              className="rounded-2xl bg-slate-950 px-6 py-3 text-center text-sm font-black text-white"
            >
              View Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
    </div>
  )
}