export type LeadSource =
  | 'Google Search'
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'SEO'

export type LeadQuality =
  | 'Poor'
  | 'Average'
  | 'Good'
  | 'Excellent'

export type LeadEntry = {
  source: LeadSource
  cost: number
  revenue: number
  converted: boolean
  quality: LeadQuality
  location: string
}

export type ROIAnalysis = {
  totalSpend: number
  totalRevenue: number
  roi: number
  bestPlatform: string
  worstPlatform: string
  highestROIPlatform: string
  wastedSpend: number
  warnings: string[]
}

function scoreQuality(quality: LeadQuality) {
  if (quality === 'Excellent') return 4
  if (quality === 'Good') return 3
  if (quality === 'Average') return 2
  return 1
}

export function analyzeROI(leads: LeadEntry[]): ROIAnalysis {
  const totalSpend = leads.reduce((sum, lead) => sum + lead.cost, 0)

  const totalRevenue = leads.reduce(
    (sum, lead) => sum + lead.revenue,
    0
  )

  const roi =
    totalSpend === 0
      ? 0
      : ((totalRevenue - totalSpend) / totalSpend) * 100

  const grouped: Record<
    string,
    {
      spend: number
      revenue: number
      quality: number
    }
  > = {}

  for (const lead of leads) {
    if (!grouped[lead.source]) {
      grouped[lead.source] = {
        spend: 0,
        revenue: 0,
        quality: 0,
      }
    }

    grouped[lead.source].spend += lead.cost
    grouped[lead.source].revenue += lead.revenue
    grouped[lead.source].quality += scoreQuality(
      lead.quality
    )
  }

  let bestPlatform = ''
  let worstPlatform = ''
  let highestROIPlatform = ''

  let bestQuality = -999
  let worstQuality = 999
  let bestROI = -999

  for (const key of Object.keys(grouped)) {
    const item = grouped[key]

    const currentROI =
      item.spend === 0
        ? 0
        : ((item.revenue - item.spend) / item.spend) *
          100

    if (item.quality > bestQuality) {
      bestQuality = item.quality
      bestPlatform = key
    }

    if (item.quality < worstQuality) {
      worstQuality = item.quality
      worstPlatform = key
    }

    if (currentROI > bestROI) {
      bestROI = currentROI
      highestROIPlatform = key
    }
  }

  const warnings: string[] = []

  if (roi < 0) {
    warnings.push(
      'Campaigns currently running at negative ROI.'
    )
  }

  if (totalSpend > totalRevenue) {
    warnings.push(
      'Marketing spend currently exceeds generated revenue.'
    )
  }

  const wastedSpend = Math.max(
    totalSpend - totalRevenue,
    0
  )

  return {
    totalSpend,
    totalRevenue,
    roi,
    bestPlatform,
    worstPlatform,
    highestROIPlatform,
    wastedSpend,
    warnings,
  }
}