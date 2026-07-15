import {
  buildRoiSummary,
  campaignHealthLabel,
  campaignHealthScore,
  campaignProfit,
  campaignRoi,
  campaignRoiPercent,
  getCampaignRisk,
  getLeadValue,
  hasFollowUpRisk,
  isHighValueLead,
  isLowRoiCampaign,
  safeNumber,
  taskDueBucket,
} from '@/lib/utils'

export type RoiInsight = {
  id: string
  title: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  category: 'Lead' | 'Campaign' | 'Task' | 'Content' | 'Revenue'
  message: string
  value?: number
}

export function buildCampaignRoiRows(campaigns: any[]) {
  return (Array.isArray(campaigns) ? campaigns : []).map(campaign => ({
    ...campaign,
    roi: campaignRoi(campaign),
    roiPercent: campaignRoiPercent(campaign),
    profit: campaignProfit(campaign),
    risk: getCampaignRisk(campaign),
    healthScore: campaignHealthScore(campaign),
    healthLabel: campaignHealthLabel(campaign),
  }))
}

export function buildLeadValueRows(leads: any[]) {
  return (Array.isArray(leads) ? leads : []).map(lead => ({
    ...lead,
    valueScore: getLeadValue(lead),
    isHighValue: isHighValueLead(lead),
    followUpRisk: hasFollowUpRisk(lead),
  }))
}

export function buildTaskRiskRows(tasks: any[]) {
  return (Array.isArray(tasks) ? tasks : []).map(task => ({
    ...task,
    dueBucket: taskDueBucket(task),
    isOverdue: taskDueBucket(task) === 'Overdue',
  }))
}

export function buildRoiInsights(data: any): RoiInsight[] {
  const leads = Array.isArray(data?.leads) ? data.leads : []
  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : []
  const tasks = Array.isArray(data?.tasks) ? data.tasks : []

  const insights: RoiInsight[] = []

  leads.forEach((lead: any) => {
    if (isHighValueLead(lead) && hasFollowUpRisk(lead)) {
      insights.push({
        id: `lead-risk-${lead.id || lead.name}`,
        title: 'High-value lead needs follow-up',
        severity: 'High',
        category: 'Lead',
        message: `${lead.name || 'A lead'} has high value but no follow-up date.`,
        value: getLeadValue(lead),
      })
    }
  })

  campaigns.forEach((campaign: any) => {
    if (isLowRoiCampaign(campaign)) {
      insights.push({
        id: `campaign-risk-${campaign.id || campaign.name}`,
        title: 'Campaign ROI risk',
        severity: getCampaignRisk(campaign) === 'Critical' ? 'Critical' : 'High',
        category: 'Campaign',
        message: `${campaign.name || 'A campaign'} is underperforming against spend.`,
        value: campaignProfit(campaign),
      })
    }
  })

  tasks.forEach((task: any) => {
    if (taskDueBucket(task) === 'Overdue') {
      insights.push({
        id: `task-risk-${task.id || task.title}`,
        title: 'Overdue revenue task',
        severity: 'Medium',
        category: 'Task',
        message: `${task.title || 'A task'} is overdue and may delay follow-up or conversion.`,
      })
    }
  })

  const summary = buildRoiSummary(data)

  if (safeNumber(summary.totalPipeline) > 0 && safeNumber(summary.totalRevenue) <= 0) {
    insights.push({
      id: 'revenue-pipeline-gap',
      title: 'Pipeline not converting yet',
      severity: 'Medium',
      category: 'Revenue',
      message: 'There is pipeline value in the system, but campaign revenue has not caught up yet.',
      value: summary.totalPipeline,
    })
  }

  return insights
}

export function buildExecutiveRoiSnapshot(data: any) {
  const summary = buildRoiSummary(data)
  const campaigns = buildCampaignRoiRows(data?.campaigns || [])
  const insights = buildRoiInsights(data)

  const strongestCampaign = campaigns
    .slice()
    .sort((a, b) => safeNumber(b.profit) - safeNumber(a.profit))[0]

  const weakestCampaign = campaigns
    .slice()
    .sort((a, b) => safeNumber(a.profit) - safeNumber(b.profit))[0]

  return {
    ...summary,
    campaigns,
    insights,
    strongestCampaign: strongestCampaign || null,
    weakestCampaign: weakestCampaign || null,
  }
}