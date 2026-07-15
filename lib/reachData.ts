import { supabase } from '@/lib/supabase'

export type ReachLead = {
  id?: string
  user_id?: string
  name: string
  company: string
  email: string
  phone: string
  source: string
  status: string
  value: number
  owner: string
  nextFollowUp?: string
  notes: string
  created_at?: string
}

export type ReachCampaign = {
  id?: string
  user_id?: string
  name: string
  channel: string
  status: string
  budget: number
  spend: number
  revenue: number
  leads: number
  startDate?: string
  endDate?: string
  notes: string
  created_at?: string
}

export type ReachTask = {
  id?: string
  user_id?: string
  title: string
  type: string
  status: string
  owner: string
  dueDate?: string
  priority: string
  leadId?: string
  leadName: string
  campaignId?: string
  channel: string
  notes: string
  created_at?: string
}

export type ReachContent = {
  id?: string
  user_id?: string
  title: string
  type: string
  channel: string
  status: string
  owner: string
  publishDate?: string
  campaignId?: string
  campaign: string
  notes: string
  created_at?: string
}

export type ReachLiveData = {
  leads: ReachLead[]
  campaigns: ReachCampaign[]
  tasks: ReachTask[]
  content: ReachContent[]
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/* ======================
   RELATION ENGINE
====================== */

function applyRelationships(
  leads: ReachLead[],
  campaigns: ReachCampaign[],
  tasks: ReachTask[],
  content: ReachContent[]
) {
  const campaignMap = new Map(campaigns.map(c => [c.id, c]))
  const leadMap = new Map(leads.map(l => [l.id, l]))

  const tasksLinked = tasks.map(task => {
    const lead = task.leadId ? leadMap.get(task.leadId) : null
    const campaign = task.campaignId ? campaignMap.get(task.campaignId) : null

    return {
      ...task,
      leadName: task.leadName || lead?.name || '',
      channel: task.channel || campaign?.channel || 'General',
    }
  })

  const contentLinked = content.map(item => {
    const campaign = item.campaignId
      ? campaignMap.get(item.campaignId)
      : null

    return {
      ...item,
      campaign: item.campaign || campaign?.name || '',
      channel: item.channel || campaign?.channel || 'Social',
    }
  })

  const campaignsLinked = campaigns.map(campaign => {
    const relatedLeads = leads.filter(
      l => l.source === campaign.channel
    )

    const revenue = relatedLeads.reduce(
      (sum, l) => sum + toNumber(l.value),
      0
    )

    return {
      ...campaign,
      leads: relatedLeads.length,
      revenue: revenue || campaign.revenue,
    }
  })

  return {
    leads,
    campaigns: campaignsLinked,
    tasks: tasksLinked,
    content: contentLinked,
  }
}

/* ======================
   DB → APP
====================== */

function leadFromDb(row: any): ReachLead {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || '',
    company: row.company || '',
    email: row.email || '',
    phone: row.phone || '',
    source: row.source || 'Manual',
    status: row.status || 'New',
    value: toNumber(row.value),
    owner: row.owner || '',
    nextFollowUp: row.next_follow_up || '',
    notes: row.notes || '',
    created_at: row.created_at,
  }
}

function campaignFromDb(row: any): ReachCampaign {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || '',
    channel: row.channel || 'General',
    status: row.status || 'Active',
    budget: toNumber(row.budget),
    spend: toNumber(row.spend),
    revenue: toNumber(row.revenue),
    leads: toNumber(row.leads),
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    notes: row.notes || '',
    created_at: row.created_at,
  }
}

function taskFromDb(row: any): ReachTask {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || '',
    type: row.type || 'Follow-up',
    status: row.status || 'Pending',
    owner: row.owner || '',
    dueDate: row.due_date || '',
    priority: row.priority || 'Normal',
    leadId: row.lead_id,
    leadName: row.lead_name || '',
    campaignId: row.campaign_id,
    channel: row.channel || 'General',
    notes: row.notes || '',
    created_at: row.created_at,
  }
}

function contentFromDb(row: any): ReachContent {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || '',
    type: row.type || 'Post',
    channel: row.channel || 'Social',
    status: row.status || 'Draft',
    owner: row.owner || '',
    publishDate: row.publish_date || '',
    campaignId: row.campaign_id,
    campaign: row.campaign || '',
    notes: row.notes || '',
    created_at: row.created_at,
  }
}

/* ======================
   LOAD
====================== */

export async function loadReachLiveData(userId: string): Promise<ReachLiveData> {
  const [leadsRes, campaignsRes, tasksRes, contentRes] =
    await Promise.all([
      supabase.from('vyron_reach_leads').select('*').eq('user_id', userId),
      supabase.from('vyron_reach_campaigns').select('*').eq('user_id', userId),
      supabase.from('vyron_reach_tasks').select('*').eq('user_id', userId),
      supabase.from('vyron_reach_content').select('*').eq('user_id', userId),
    ])

  if (leadsRes.error) throw leadsRes.error
  if (campaignsRes.error) throw campaignsRes.error
  if (tasksRes.error) throw tasksRes.error
  if (contentRes.error) throw contentRes.error

  const leads = (leadsRes.data || []).map(leadFromDb)
  const campaigns = (campaignsRes.data || []).map(campaignFromDb)
  const tasks = (tasksRes.data || []).map(taskFromDb)
  const content = (contentRes.data || []).map(contentFromDb)

  return applyRelationships(leads, campaigns, tasks, content)
}

/* ======================
   SAVE / DELETE (UNCHANGED)
====================== */

export async function saveReachLead(userId: string, lead: ReachLead) {
  const payload = {
    user_id: userId,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    value: toNumber(lead.value),
    owner: lead.owner,
    next_follow_up: lead.nextFollowUp || null,
    notes: lead.notes,
  }

  const query = lead.id
    ? supabase.from('vyron_reach_leads').update(payload).eq('id', lead.id)
    : supabase.from('vyron_reach_leads').insert(payload)

  const { error } = await query
  if (error) throw error
}

export async function deleteReachLead(userId: string, id: string) {
  const { error } = await supabase
    .from('vyron_reach_leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function saveReachCampaign(userId: string, campaign: ReachCampaign) {
  const payload = {
    user_id: userId,
    name: campaign.name,
    channel: campaign.channel,
    status: campaign.status,
    budget: campaign.budget,
    spend: campaign.spend,
    revenue: campaign.revenue,
    leads: campaign.leads,
    start_date: campaign.startDate || null,
    end_date: campaign.endDate || null,
    notes: campaign.notes,
  }

  const query = campaign.id
    ? supabase.from('vyron_reach_campaigns').update(payload).eq('id', campaign.id)
    : supabase.from('vyron_reach_campaigns').insert(payload)

  const { error } = await query
  if (error) throw error
}

export async function deleteReachCampaign(userId: string, id: string) {
  const { error } = await supabase
    .from('vyron_reach_campaigns')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function saveReachTask(userId: string, task: ReachTask) {
  const payload = {
    user_id: userId,
    title: task.title,
    type: task.type,
    status: task.status,
    owner: task.owner,
    due_date: task.dueDate || null,
    priority: task.priority,
    lead_id: task.leadId || null,
    lead_name: task.leadName,
    campaign_id: task.campaignId || null,
    channel: task.channel,
    notes: task.notes,
  }

  const query = task.id
    ? supabase.from('vyron_reach_tasks').update(payload).eq('id', task.id)
    : supabase.from('vyron_reach_tasks').insert(payload)

  const { error } = await query
  if (error) throw error
}

export async function deleteReachTask(userId: string, id: string) {
  const { error } = await supabase
    .from('vyron_reach_tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function saveReachContent(userId: string, content: ReachContent) {
  const payload = {
    user_id: userId,
    title: content.title,
    type: content.type,
    channel: content.channel,
    status: content.status,
    owner: content.owner,
    publish_date: content.publishDate || null,
    campaign_id: content.campaignId || null,
    campaign: content.campaign,
    notes: content.notes,
  }

  const query = content.id
    ? supabase.from('vyron_reach_content').update(payload).eq('id', content.id)
    : supabase.from('vyron_reach_content').insert(payload)

  const { error } = await query
  if (error) throw error
}

export async function deleteReachContent(userId: string, id: string) {
  const { error } = await supabase
    .from('vyron_reach_content')
    .delete()
    .eq('id', id)

  if (error) throw error
}