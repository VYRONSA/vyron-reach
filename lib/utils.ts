export function money(value: number | string | null | undefined) {
  const safeValue = Number(value || 0)

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safeValue) ? safeValue : 0)
}

export function formatCurrency(value: number | string | null | undefined) {
  return money(value)
}

export function formatNumber(value: number | string | null | undefined) {
  const safeValue = Number(value || 0)

  return new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safeValue) ? safeValue : 0)
}

export function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function campaignRoi(campaign: any) {
  const spend = safeNumber(campaign?.spend || campaign?.budget)
  const revenue = safeNumber(campaign?.revenue)

  if (spend <= 0) return 0

  return Number(((revenue - spend) / spend).toFixed(2))
}

export function campaignRoiPercent(campaign: any) {
  return Number((campaignRoi(campaign) * 100).toFixed(0))
}

export function calculateRoi(
  revenue: number | string | null | undefined,
  spend: number | string | null | undefined
) {
  const safeRevenue = safeNumber(revenue)
  const safeSpend = safeNumber(spend)

  if (safeSpend <= 0) return 0

  return Number(((safeRevenue - safeSpend) / safeSpend).toFixed(2))
}

export function campaignProfit(campaign: any) {
  return safeNumber(campaign?.revenue) - safeNumber(campaign?.spend || campaign?.budget)
}

export function isLowRoiCampaign(campaign: any) {
  const spend = safeNumber(campaign?.spend || campaign?.budget)
  const roi = campaignRoi(campaign)

  return spend > 0 && roi < 1
}

export function isHighValueLead(lead: any) {
  return safeNumber(lead?.value || lead?.estimated_value || lead?.deal_value) >= 50000
}

export function hasFollowUpRisk(lead: any) {
  const status = String(lead?.status || '')
  const followUp = String(
    lead?.followUp ||
      lead?.nextFollowUp ||
      lead?.next_follow_up ||
      lead?.next_followup ||
      ''
  )

  return status !== 'Lost' && status !== 'Won' && followUp.trim().length === 0
}

export function getCampaignRisk(campaign: any) {
  const spend = safeNumber(campaign?.spend || campaign?.budget)
  const revenue = safeNumber(campaign?.revenue)
  const leads = safeNumber(campaign?.leads)
  const roi = campaignRoi(campaign)

  if (spend > 0 && revenue <= 0) return 'Critical'
  if (spend >= 10000 && leads <= 2) return 'High'
  if (roi < 0) return 'High'
  if (roi < 1 && spend > 0) return 'Medium'

  return 'Low'
}

export function campaignHealthScore(campaign: any) {
  const roi = campaignRoi(campaign)
  const leads = safeNumber(campaign?.leads)
  const spend = safeNumber(campaign?.spend || campaign?.budget)

  let score = 50

  if (roi >= 3) score += 30
  else if (roi >= 2) score += 20
  else if (roi >= 1) score += 10
  else if (roi < 0) score -= 25

  if (leads >= 10) score += 15
  else if (leads >= 5) score += 8
  else if (spend > 5000 && leads <= 2) score -= 15

  return Math.max(0, Math.min(100, score))
}

export function campaignHealthLabel(campaign: any) {
  const score = campaignHealthScore(campaign)

  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Healthy'
  if (score >= 40) return 'Watch'
  return 'At Risk'
}

export function taskDueBucket(task: any) {
  const dueValue = task?.dueDate || task?.due_date

  if (!dueValue) return 'No date'

  const today = new Date()
  const dueDate = new Date(dueValue)

  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return 'This week'

  return 'Later'
}

export function getLeadValue(lead: any) {
  return safeNumber(lead?.value || lead?.estimated_value || lead?.deal_value)
}

export function getLeadName(lead: any) {
  return String(lead?.name || lead?.contact_name || 'Unnamed Lead')
}

export function getLeadCompany(lead: any) {
  return String(lead?.company || lead?.company_name || 'No company')
}

export function getStatusLabel(value: string | null | undefined) {
  return String(value || 'Unknown')
}

export function safeText(value: string | number | null | undefined, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

export function buildRoiSummary(data: any) {
  const leads = Array.isArray(data?.leads) ? data.leads : []
  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : []
  const tasks = Array.isArray(data?.tasks) ? data.tasks : []
  const content = Array.isArray(data?.content) ? data.content : []

  const totalPipeline = leads.reduce((sum: number, lead: any) => {
    return sum + getLeadValue(lead)
  }, 0)

  const totalSpend = campaigns.reduce((sum: number, campaign: any) => {
    return sum + safeNumber(campaign?.spend || campaign?.budget)
  }, 0)

  const totalRevenue = campaigns.reduce((sum: number, campaign: any) => {
    return sum + safeNumber(campaign?.revenue)
  }, 0)

  const highValueLeads = leads.filter(isHighValueLead).length
  const followUpRisks = leads.filter(hasFollowUpRisk).length
  const lowRoiCampaigns = campaigns.filter(isLowRoiCampaign).length
  const overdueTasks = tasks.filter((task: any) => taskDueBucket(task) === 'Overdue').length
  const plannedContent = content.filter((item: any) => String(item?.status || '').toLowerCase() !== 'published').length

  return {
    totalPipeline,
    totalSpend,
    totalRevenue,
    totalProfit: totalRevenue - totalSpend,
    totalRoi: totalSpend > 0 ? Number(((totalRevenue - totalSpend) / totalSpend).toFixed(2)) : 0,
    highValueLeads,
    followUpRisks,
    lowRoiCampaigns,
    overdueTasks,
    plannedContent,
  }
}