export type CampaignObjective =
  | 'Lead Generation'
  | 'Brand Awareness'
  | 'Website Traffic'
  | 'Bookings'
  | 'Calls'
  | 'Retargeting'

export type CampaignPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'

export type RecommendedCampaign = {
  platform: string
  objective: CampaignObjective
  priority: CampaignPriority
  monthlyBudget: number
  recommendedDurationMonths: number
  reason: string
  expectedOutcome: string
}

export type WeeklyAction = {
  week: string
  title: string
  description: string
  overdueRisk: boolean
}

export type ScalingAdvice = {
  recommendation: string
  reason: string
  percentage?: number
}

export type CampaignIntelligenceResult = {
  campaigns: RecommendedCampaign[]
  weeklyActions: WeeklyAction[]
  scalingAdvice: ScalingAdvice[]
  warnings: string[]
}

export type BusinessCampaignInput = {
  industry: string
  monthlyBudget: number
  businessAgeMonths: number
  websiteStrength:
    | 'No Website'
    | 'New Website'
    | 'Existing Website'
    | 'Strong Website'
}

function lower(value: string) {
  return value.toLowerCase().trim()
}

function isEmergency(industry: string) {
  const v = lower(industry)

  return (
    v.includes('tow') ||
    v.includes('plumb') ||
    v.includes('electric') ||
    v.includes('locksmith')
  )
}

function isRestaurant(industry: string) {
  const v = lower(industry)

  return (
    v.includes('restaurant') ||
    v.includes('coffee') ||
    v.includes('cafe') ||
    v.includes('food')
  )
}

function isProfessional(industry: string) {
  const v = lower(industry)

  return (
    v.includes('law') ||
    v.includes('attorney') ||
    v.includes('account') ||
    v.includes('finance')
  )
}

function isB2B(industry: string) {
  const v = lower(industry)

  return (
    v.includes('software') ||
    v.includes('saas') ||
    v.includes('marketing') ||
    v.includes('hr')
  )
}

export function generateCampaignIntelligence(
  input: BusinessCampaignInput
): CampaignIntelligenceResult {
  const campaigns: RecommendedCampaign[] = []
  const weeklyActions: WeeklyAction[] = []
  const scalingAdvice: ScalingAdvice[] = []
  const warnings: string[] = []

  if (isEmergency(input.industry)) {
    campaigns.push({
      platform: 'Google Search',
      objective: 'Calls',
      priority: 'Critical',
      monthlyBudget: input.monthlyBudget * 0.65,
      recommendedDurationMonths: 6,
      reason:
        'Emergency services depend heavily on immediate search intent.',
      expectedOutcome:
        'Higher inbound emergency calls from local search.',
    })

    campaigns.push({
      platform: 'Facebook',
      objective: 'Retargeting',
      priority: 'Medium',
      monthlyBudget: input.monthlyBudget * 0.2,
      recommendedDurationMonths: 3,
      reason:
        'Facebook works best as trust reinforcement and retargeting.',
      expectedOutcome:
        'Improved trust and return visitors.',
    })
  }

  if (isRestaurant(input.industry)) {
    campaigns.push({
      platform: 'Instagram',
      objective: 'Brand Awareness',
      priority: 'High',
      monthlyBudget: input.monthlyBudget * 0.4,
      recommendedDurationMonths: 6,
      reason:
        'Restaurants require visual engagement and local visibility.',
      expectedOutcome:
        'Increased local brand awareness and foot traffic.',
    })

    campaigns.push({
      platform: 'Facebook',
      objective: 'Bookings',
      priority: 'High',
      monthlyBudget: input.monthlyBudget * 0.3,
      recommendedDurationMonths: 6,
      reason:
        'Facebook remains strong for local offers and promotions.',
      expectedOutcome:
        'Higher bookings and offer engagement.',
    })
  }

  if (isProfessional(input.industry)) {
    campaigns.push({
      platform: 'Google Search',
      objective: 'Lead Generation',
      priority: 'High',
      monthlyBudget: input.monthlyBudget * 0.5,
      recommendedDurationMonths: 6,
      reason:
        'Professional services rely on trust and search intent.',
      expectedOutcome:
        'Higher consultation enquiries.',
    })
  }

  if (isB2B(input.industry)) {
    campaigns.push({
      platform: 'LinkedIn',
      objective: 'Lead Generation',
      priority: 'Critical',
      monthlyBudget: input.monthlyBudget * 0.45,
      recommendedDurationMonths: 8,
      reason:
        'B2B buyers need authority and professional targeting.',
      expectedOutcome:
        'Higher quality decision-maker leads.',
    })

    campaigns.push({
      platform: 'SEO',
      objective: 'Website Traffic',
      priority: 'High',
      monthlyBudget: input.monthlyBudget * 0.25,
      recommendedDurationMonths: 12,
      reason:
        'SEO compounds authority over time for B2B.',
      expectedOutcome:
        'Long-term inbound lead growth.',
    })
  }

  weeklyActions.push(
    {
      week: 'Week 1',
      title: 'Campaign Setup',
      description:
        'Build campaigns, setup audiences, keywords and tracking.',
      overdueRisk: true,
    },
    {
      week: 'Week 2',
      title: 'Performance Review',
      description:
        'Pause weak ads and improve targeting.',
      overdueRisk: false,
    },
    {
      week: 'Week 3',
      title: 'Creative Optimization',
      description:
        'Replace weak creatives and test new messaging.',
      overdueRisk: false,
    },
    {
      week: 'Week 4',
      title: 'Monthly Reporting',
      description:
        'Prepare ROI and performance reports.',
      overdueRisk: true,
    }
  )

  if (
    input.businessAgeMonths < 3 ||
    input.websiteStrength === 'No Website'
  ) {
    scalingAdvice.push({
      recommendation: 'Do NOT scale aggressively yet.',
      reason:
        'SEO and conversion trust are not mature enough.',
    })

    warnings.push(
      'Business foundation still weak. Avoid aggressive ad scaling.'
    )
  } else {
    scalingAdvice.push({
      recommendation: 'Increase spend gradually.',
      reason:
        'Business foundation is improving.',
      percentage: 15,
    })
  }

  if (input.monthlyBudget < 3000) {
    warnings.push(
      'Budget may be too low for multiple simultaneous campaigns.'
    )
  }

  return {
    campaigns,
    weeklyActions,
    scalingAdvice,
    warnings,
  }
}