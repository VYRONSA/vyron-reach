export type MarketingBusinessProfile = {
  businessName?: string
  productName?: string
  industry?: string
  location?: string
  serviceRadiusKm?: number
  targetCustomer?: string
  monthlyBudget?: number
  websiteAgeMonths?: number
  mainGoal?: string
}

export type MarketingChannelRecommendation = {
  channel: string
  allocation: number
  reason: string
  warning?: string
}

export type MarketingStrategyRecommendation = {
  title: string
  summary: string
  budgetMode: 'Lean Build' | 'Balanced Growth' | 'Aggressive Scale'
  targetArea: string
  channels: MarketingChannelRecommendation[]
  rules: string[]
  nextActions: string[]
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalise(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isLocalEmergencyService(profile: MarketingBusinessProfile) {
  const text = `${profile.industry || ''} ${profile.productName || ''} ${profile.mainGoal || ''}`.toLowerCase()

  return (
    text.includes('towing') ||
    text.includes('plumber') ||
    text.includes('electrician') ||
    text.includes('locksmith') ||
    text.includes('breakdown') ||
    text.includes('emergency')
  )
}

function isB2BSaas(profile: MarketingBusinessProfile) {
  const text = `${profile.industry || ''} ${profile.productName || ''} ${profile.targetCustomer || ''}`.toLowerCase()

  return (
    text.includes('saas') ||
    text.includes('software') ||
    text.includes('hr') ||
    text.includes('clocking') ||
    text.includes('payroll') ||
    text.includes('workforce') ||
    text.includes('vyron core')
  )
}

function getBudgetMode(monthlyBudget: number, websiteAgeMonths: number): MarketingStrategyRecommendation['budgetMode'] {
  if (monthlyBudget <= 1500 || websiteAgeMonths < 6) return 'Lean Build'
  if (monthlyBudget <= 12000) return 'Balanced Growth'
  return 'Aggressive Scale'
}

function getTargetArea(profile: MarketingBusinessProfile) {
  const location = profile.location || 'the selected service area'
  const radius = safeNumber(profile.serviceRadiusKm, isLocalEmergencyService(profile) ? 20 : 60)

  if (isLocalEmergencyService(profile)) {
    return `${location} plus a tight ${radius}km emergency-response radius. Avoid broad areas that create wasted clicks outside service reach.`
  }

  if (isB2BSaas(profile)) {
    return `${location || 'South Africa'} with decision-maker targeting. Prioritise businesses with multi-location teams, payroll pressure and operational complexity.`
  }

  return `${location} plus a controlled ${radius}km commercial radius. Expand only after lead quality is proven.`
}

function buildLocalEmergencyChannels(profile: MarketingBusinessProfile): MarketingChannelRecommendation[] {
  const websiteAgeMonths = safeNumber(profile.websiteAgeMonths)
  const monthlyBudget = safeNumber(profile.monthlyBudget)

  if (websiteAgeMonths < 6 || monthlyBudget <= 1500) {
    return [
      {
        channel: 'Google Search + Maps',
        allocation: 55,
        reason: 'Urgent local services are searched when the customer has immediate intent. Keep spend tight while Google learns the business and service area.',
      },
      {
        channel: 'Local SEO + Reviews',
        allocation: 30,
        reason: 'Rankings and trust build slowly. Reviews, service pages and local relevance reduce long-term dependency on paid clicks.',
      },
      {
        channel: 'Facebook Retargeting',
        allocation: 10,
        reason: 'Facebook is not the main emergency-intent channel, but it can keep the brand visible to local users who visited the site.',
      },
      {
        channel: 'Tracking + Landing Page Testing',
        allocation: 5,
        reason: 'Before scaling spend, the system must prove which keywords, locations and pages convert.',
      },
    ]
  }

  return [
    {
      channel: 'Google Search + Maps',
      allocation: 65,
      reason: 'After initial trust and indexing improve, scale search traffic in proven local zones only.',
    },
    {
      channel: 'Local SEO + Reviews',
      allocation: 20,
      reason: 'Organic local authority protects margins and reduces cost per lead over time.',
    },
    {
      channel: 'Facebook Retargeting',
      allocation: 10,
      reason: 'Retargeting supports recall but should not drain budget from urgent search intent.',
    },
    {
      channel: 'Conversion Testing',
      allocation: 5,
      reason: 'Every increase in spend must be linked to better calls, forms or WhatsApp enquiries.',
    },
  ]
}

function buildB2BSaasChannels(profile: MarketingBusinessProfile): MarketingChannelRecommendation[] {
  const websiteAgeMonths = safeNumber(profile.websiteAgeMonths)

  if (websiteAgeMonths < 6) {
    return [
      {
        channel: 'Founder-Led Outreach',
        allocation: 35,
        reason: 'Early B2B SaaS growth needs direct conversations, not blind ad spend. Demos and feedback create faster trust.',
      },
      {
        channel: 'LinkedIn Decision-Maker Campaigns',
        allocation: 25,
        reason: 'VYRON CORE buyers are likely owners, HR managers, payroll operators and operations managers. LinkedIn gives better role targeting.',
      },
      {
        channel: 'Case Study Content',
        allocation: 20,
        reason: 'Operational software sells better when the buyer can see before-and-after pain relief.',
      },
      {
        channel: 'Google Brand + Problem Search',
        allocation: 15,
        reason: 'Keep Google spend lean early. Focus on high-intent problem searches like clocking software, HR compliance and payroll readiness.',
      },
      {
        channel: 'Retargeting',
        allocation: 5,
        reason: 'Retarget only warm visitors and demo viewers. Avoid broad awareness waste.',
      },
    ]
  }

  return [
    {
      channel: 'LinkedIn Decision-Maker Campaigns',
      allocation: 30,
      reason: 'Scale the proven audience of HR, payroll and operations decision-makers.',
    },
    {
      channel: 'Founder-Led Outreach',
      allocation: 25,
      reason: 'Direct outreach should remain active because enterprise-style sales need trust and follow-up.',
    },
    {
      channel: 'Google Search',
      allocation: 25,
      reason: 'Increase spend only on keywords proven to create demos and qualified conversations.',
    },
    {
      channel: 'Case Studies + SEO',
      allocation: 15,
      reason: 'Long-term ranking and credibility reduce dependence on paid acquisition.',
    },
    {
      channel: 'Retargeting',
      allocation: 5,
      reason: 'Keep VYRON visible after website visits, demo page views and proposal reviews.',
    },
  ]
}

function buildGeneralChannels(profile: MarketingBusinessProfile): MarketingChannelRecommendation[] {
  return [
    {
      channel: 'Google Search',
      allocation: 40,
      reason: 'Capture active buyers searching for the problem or service.',
    },
    {
      channel: 'Facebook / Instagram',
      allocation: 25,
      reason: 'Build local awareness and retarget people who already interacted with the business.',
    },
    {
      channel: 'SEO + Content',
      allocation: 25,
      reason: 'Build long-term organic visibility and reduce paid dependency over time.',
    },
    {
      channel: 'Testing + Tracking',
      allocation: 10,
      reason: 'Hold budget back for testing landing pages, conversion tracking and message angles.',
    },
  ]
}

export function buildMarketingStrategy(profile: MarketingBusinessProfile): MarketingStrategyRecommendation {
  const industry = profile.industry || 'Growth'
  const productName = profile.productName || 'VYRON CORE'
  const monthlyBudget = safeNumber(profile.monthlyBudget, 5000)
  const websiteAgeMonths = safeNumber(profile.websiteAgeMonths, 0)
  const budgetMode = getBudgetMode(monthlyBudget, websiteAgeMonths)

  const channels = isLocalEmergencyService(profile)
    ? buildLocalEmergencyChannels(profile)
    : isB2BSaas(profile)
      ? buildB2BSaasChannels(profile)
      : buildGeneralChannels(profile)

  const targetArea = getTargetArea(profile)

  const rules = [
    'Do not scale spend until tracking proves where qualified leads come from.',
    'Exclude locations outside the profitable service area.',
    'Prioritise high-intent searches before broad awareness campaigns.',
    'Use retargeting only for warm audiences, not cold wasted reach.',
    'Review conversion quality weekly, not only clicks and impressions.',
  ]

  if (budgetMode === 'Lean Build') {
    rules.unshift('Keep Google spend lean while the site gains trust, indexing, conversion data and proof.')
  }

  const nextActions = [
    'Confirm target customer and profitable service radius.',
    'Create one clear landing page for the main offer.',
    'Set up conversion tracking for calls, forms, WhatsApp and demo bookings.',
    'Launch only the highest-intent channels first.',
    'Review lead quality before increasing spend.',
  ]

  return {
    title: `${productName} ${industry} Growth Strategy`,
    summary: `Recommended ${budgetMode.toLowerCase()} strategy built around service-area control, lead quality, conversion visibility and protection against wasted spend.`,
    budgetMode,
    targetArea,
    channels,
    rules,
    nextActions,
  }
}

export function buildVyronCoreInternalStrategy() {
  return buildMarketingStrategy({
    businessName: 'VYRON',
    productName: 'VYRON CORE',
    industry: 'B2B SaaS workforce, HR, clocking and payroll-readiness software',
    location: 'South Africa',
    serviceRadiusKm: 999,
    targetCustomer: 'Owners, HR managers, payroll teams and operations managers in multi-location businesses',
    monthlyBudget: 5000,
    websiteAgeMonths: 0,
    mainGoal: 'Book demos, close recurring SaaS clients and grow MRR',
  })
}

export function buildChannelAllocationTotal(channels: MarketingChannelRecommendation[]) {
  return channels.reduce((sum, channel) => sum + safeNumber(channel.allocation), 0)
}
