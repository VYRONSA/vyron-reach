'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Lead = {
  id: string
  name: string
  company: string
  status: string
  created_at: string
}

type Campaign = {
  id: string
  name: string
  budget: number
  status: string
  created_at: string
}

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  created_at: string
}

type ContentItem = {
  id: string
  title: string
  platform: string
  status: string
  publish_date: string | null
  created_at: string
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)

    const [leadsRes, campaignsRes, tasksRes, contentRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('content_items').select('*').order('created_at', { ascending: false }),
    ])

    setLeads(leadsRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setTasks(tasksRes.data || [])
    setContentItems(contentRes.data || [])
    setLoading(false)
  }

  const totalBudget = useMemo(() => {
    return campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0)
  }, [campaigns])

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const openTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length
  const plannedContent = contentItems.filter(c => c.status === 'planned').length
  const newLeads = leads.filter(l => l.status === 'new').length

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-cyan-300">
                VYRON REACH
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Marketing Command Centre
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Track leads, campaigns, tasks, content planning and marketing activity from one premium dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/leads" className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950">
                Leads
              </Link>
              <Link href="/content" className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">
                Content Planner
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-sm">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard title="Total Leads" value={leads.length} subtitle={`${newLeads} new leads`} />
              <DashboardCard title="Active Campaigns" value={activeCampaigns} subtitle={`${campaigns.length} total campaigns`} />
              <DashboardCard title="Open Tasks" value={openTasks} subtitle={`${tasks.length} total tasks`} />
              <DashboardCard title="Planned Content" value={plannedContent} subtitle={`${contentItems.length} content items`} />
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Campaign Performance</h2>
                    <p className="text-sm text-slate-500">Live campaign overview from Supabase.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                    Budget: R{totalBudget.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {campaigns.length === 0 ? (
                    <EmptyState text="No campaigns yet. Add campaigns to see them here." />
                  ) : (
                    campaigns.slice(0, 6).map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                        <div>
                          <p className="font-bold text-slate-950">{campaign.name}</p>
                          <p className="text-sm text-slate-500">Status: {campaign.status}</p>
                        </div>
                        <p className="font-black text-slate-950">R{Number(campaign.budget || 0).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Priority Tasks</h2>
                <p className="mb-5 text-sm text-slate-500">Your latest open action items.</p>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <EmptyState text="No tasks yet." />
                  ) : (
                    tasks.slice(0, 6).map(task => (
                      <div key={task.id} className="rounded-2xl border border-slate-100 p-4">
                        <p className="font-bold text-slate-950">{task.title}</p>
                        <p className="text-sm text-slate-500">Status: {task.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Upcoming Content</h2>
                  <p className="text-sm text-slate-500">Latest planned marketing posts.</p>
                </div>
                <Link href="/content" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                  Open Planner
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {contentItems.length === 0 ? (
                  <EmptyState text="No content items planned yet." />
                ) : (
                  contentItems.slice(0, 6).map(item => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                      <p className="font-bold text-slate-950">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.platform} • {item.status}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {item.publish_date ? item.publish_date : 'No date set'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: number
  subtitle: string
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
      {text}
    </div>
  )
}