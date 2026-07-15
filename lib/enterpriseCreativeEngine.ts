import type {
  CreativeBuilderInput,
  CreativeLayoutType,
  CreativePlatform,
  CreativeVariationTheme,
  EnterpriseCampaignSpec,
  EnterpriseFeatureHighlight,
  VyronCreative,
} from '@/lib/vyronStore/types'

export type BrandProfile = 'vyron' | 'bridgewater' | 'cuisine' | 'generic'

export function detectBrand(clientName: string, productName: string): BrandProfile {
  const s = `${clientName} ${productName}`.toLowerCase()
  if (s.includes('vyron')) return 'vyron'
  if (s.includes('bridgewater') || s.includes('botanical')) return 'bridgewater'
  if (s.includes('cutting edge') || s.includes('catering') || s.includes('cuisine')) return 'cuisine'
  return 'generic'
}

const THEMES_BY_VERSION: CreativeVariationTheme[] = [
  'Futuristic AI',
  'Executive Enterprise',
  'South African Market Focus',
]

export function layoutForPlatform(platform: CreativePlatform, override?: CreativeLayoutType): CreativeLayoutType {
  if (override) return override
  if (platform === 'LinkedIn') return 'LinkedIn Corporate'
  if (platform === 'WhatsApp') return 'WhatsApp Promo'
  if (platform === 'Instagram') return 'Poster'
  if (platform === 'Google Display') return 'Billboard'
  if (platform === 'Facebook') return 'Social Ad'
  return 'SaaS Launch Campaign'
}

const HEADLINE_POOL: Record<BrandProfile, string[]> = {
  vyron: [
    'VYRON CORE IS LIVE',
    'STOP LOSING PAYROLL HOURS',
    'YOUR BUSINESS. POWERED BY AI.',
    'THE FUTURE OF WORKFORCE MANAGEMENT',
  ],
  bridgewater: [
    'WIND DOWN WITHOUT ALCOHOL',
    'BOTANICAL LUXURY. ZERO COMPROMISE.',
    'THE SOBER SIP THAT FEELS SPECIAL',
    'EVENINGS, ELEVATED.',
  ],
  cuisine: [
    'IMPRESS THE BOARDROOM AT LUNCH',
    'CAPE TOWN CORPORATE CATERING',
    'SUSHI. PRECISION. DELIVERED.',
    'OFFICE LUNCH, ELEVATED.',
  ],
  generic: ['TRANSFORM YOUR BUSINESS', 'BUILT FOR GROWTH', 'YOUR OPERATIONS. UPGRADED.'],
}

const VYRON_FEATURES: EnterpriseFeatureHighlight[] = [
  { title: 'Smart Clocking', description: 'GPS + biometric clocking synced to payroll', icon: '◷' },
  { title: 'AI HR', description: 'Leave, compliance & alert automation', icon: '◈' },
  { title: 'Real-Time Insights', description: 'Live KPI dashboards for every site', icon: '◉' },
  { title: 'Secure Cloud', description: 'POPIA-ready workforce data vault', icon: '◆' },
  { title: 'Automated Workflows', description: 'Rosters, approvals & shift swaps', icon: '◇' },
]

const BRIDGE_FEATURES: EnterpriseFeatureHighlight[] = [
  { title: 'Botanical Blend', description: 'Adaptogens + premium botanicals', icon: '✦' },
  { title: 'Zero Alcohol', description: 'Full flavour, zero compromise', icon: '○' },
  { title: 'Evening Ritual', description: 'Designed for social wind-down', icon: '◐' },
  { title: 'Premium Craft', description: 'Small-batch Cape Town production', icon: '◆' },
  { title: 'Shop & Subscribe', description: 'DTC delivery CPT & JHB', icon: '◇' },
]

const CUISINE_FEATURES: EnterpriseFeatureHighlight[] = [
  { title: 'Sushi Platters', description: 'Chef-crafted for corporate events', icon: '◎' },
  { title: 'Same-Week Booking', description: '10–200 pax office & events', icon: '◷' },
  { title: 'Premium Presentation', description: 'Boardroom-ready plating', icon: '◈' },
  { title: 'Dietary Flex', description: 'Halal, vegan & custom menus', icon: '◉' },
  { title: 'Account Service', description: 'Dedicated corporate coordinator', icon: '◆' },
]

function pickHeadline(brand: BrandProfile, input: CreativeBuilderInput, version: number): string {
  if (input.headline.trim()) {
    if (version === 2) return input.headline.toUpperCase()
    if (version === 3) return `${input.headline} — BUILT FOR SA TEAMS`
    return input.headline.toUpperCase()
  }
  const pool = HEADLINE_POOL[brand]
  return pool[(version - 1) % pool.length]
}

function brandFeatures(brand: BrandProfile): EnterpriseFeatureHighlight[] {
  if (brand === 'bridgewater') return BRIDGE_FEATURES
  if (brand === 'cuisine') return CUISINE_FEATURES
  return VYRON_FEATURES
}

function storytelling(
  brand: BrandProfile,
  input: CreativeBuilderInput,
): Pick<
  EnterpriseCampaignSpec,
  'problem' | 'solution' | 'productExplanation' | 'whoItHelps' | 'whyBetter' | 'benefits' | 'businessOutcome' | 'kpis'
> {
  if (brand === 'bridgewater') {
    return {
      problem: 'Social nights without a premium sober option that feels special.',
      solution: 'Bridgewater Botanicals — crafted non-alcoholic tonics for modern evenings.',
      productExplanation:
        'Premium botanical beverages combining adaptogens and luxury flavour — alcohol-free, lifestyle-forward.',
      whoItHelps: 'Urban professionals 25–45 in Cape Town & Johannesburg who want ritual without alcohol.',
      whyBetter: 'Moody luxury branding, DTC convenience, and botanical credibility vs sugary mocktails.',
      benefits: ['Premium positioning', 'Evening ritual habit', 'Giftable DTC packs', 'Strong margin DTC'],
      businessOutcome: 'Increase online basket size +25% and repeat purchase rate in 90 days.',
      kpis: [
        { label: 'Brand recall', value: '+18%' },
        { label: 'ROAS target', value: '3.2x' },
        { label: 'CPT delivery', value: '48hr' },
      ],
    }
  }
  if (brand === 'cuisine') {
    return {
      problem: 'Corporate teams settle for generic catering that fails to impress clients and staff.',
      solution: 'Cutting Edge Cuisine — premium sushi and lunch programs for Cape Town offices.',
      productExplanation:
        'Chef-designed corporate catering: sushi towers, office lunch subscriptions, and event spreads.',
      whoItHelps: 'Office managers, EA’s and event planners — CBD & Atlantic Seaboard corporates.',
      whyBetter: 'Same-week booking, premium presentation, and dedicated account service.',
      benefits: ['Boardroom-ready sushi', 'Flexible headcount', 'Dietary customization', 'Recurring office programs'],
      businessOutcome: '8+ qualified corporate quotes per month from Google + LinkedIn funnel.',
      kpis: [
        { label: 'Avg. order', value: 'R4.2k' },
        { label: 'Repeat clients', value: '67%' },
        { label: 'Lead SLA', value: '<24hr' },
      ],
    }
  }
  return {
    problem: 'South African businesses lose payroll hours to manual clocking, spreadsheets and HR firefighting.',
    solution: `${input.productName} — one AI-powered workforce command centre for clocking, rostering and HR.`,
    productExplanation:
      'Cloud workforce platform: smart clocking, AI HR automation, real-time operational dashboards and secure workflows.',
    whoItHelps: 'Business owners and operations managers with 20–500 staff across multiple sites.',
    whyBetter: 'Payroll-ready clocking, POPIA-grade security, and SA-built support — not generic US tools.',
    benefits: [
      'Cut payroll leakage',
      'Live visibility every site',
      'Automate HR compliance',
      'Scale without spreadsheets',
    ],
    businessOutcome: 'Reduce payroll leakage up to 23% and book 12+ qualified demos per month.',
    kpis: [
      { label: 'Payroll accuracy', value: '99.2%' },
      { label: 'Sites live', value: '48+' },
      { label: 'Demo CPA', value: 'R186' },
    ],
  }
}

export function buildEnterpriseCampaignSpec(
  input: CreativeBuilderInput,
  version: number,
): EnterpriseCampaignSpec {
  const brand = detectBrand(input.clientName, input.productName)
  const theme = input.variationTheme ?? THEMES_BY_VERSION[(version - 1) % THEMES_BY_VERSION.length]
  const layout = layoutForPlatform(input.platform, input.layout)
  const story = storytelling(brand, input)
  const headline = pickHeadline(brand, input, version)

  const subheadlines: Record<BrandProfile, string> = {
    vyron: 'Workforce intelligence for South African operations — clocking, HR and insights in one command centre.',
    bridgewater: 'Premium botanical tonics — alcohol-free evenings with cinematic luxury.',
    cuisine: 'Premium corporate catering — sushi, events and office lunch programs.',
    generic: input.offer || 'Operational excellence, delivered.',
  }

  const website =
    input.website ??
    (brand === 'vyron'
      ? 'vyron.co.za'
      : brand === 'bridgewater'
        ? 'bridgewaterbotanicals.co.za'
        : brand === 'cuisine'
          ? 'cuttingedgecuisine.co.za'
          : 'yourbusiness.co.za')

  const contact = input.contact ?? 'sales@agency.local · +27 21 000 0000'

  const cta =
    version === 3 && brand === 'vyron'
      ? 'TRANSFORM YOUR BUSINESS'
      : (input.cta || 'BOOK DEMO').toUpperCase()

  return {
    layout,
    theme,
    headline,
    subheadline: subheadlines[brand],
    ...story,
    features: brandFeatures(brand),
    website,
    contact,
    cta,
    ctaSecondary: brand === 'vyron' ? 'VISIT NOW' : 'LEARN MORE',
    brandLabel: input.productName.toUpperCase(),
  }
}

export function buildEnterpriseImagePrompt(
  spec: EnterpriseCampaignSpec,
  input: CreativeBuilderInput,
  version: number,
): string {
  return [
    `# Enterprise Campaign Creative — ${input.productName} (V${version})`,
    '',
    `**Layout:** ${spec.layout}`,
    `**Theme:** ${spec.theme}`,
    `**Platform:** ${input.platform}`,
    '',
    '## Hero',
    `Headline: ${spec.headline}`,
    `Subheadline: ${spec.subheadline}`,
    '',
    '## Storytelling',
    `Problem: ${spec.problem}`,
    `Solution: ${spec.solution}`,
    `Product: ${spec.productExplanation}`,
    `Who it helps: ${spec.whoItHelps}`,
    `Why better: ${spec.whyBetter}`,
    `Outcome: ${spec.businessOutcome}`,
    '',
    '## Feature Highlights',
    ...spec.features.map(f => `- ${f.title}: ${f.description}`),
    '',
    '## Visual Composition (MANDATORY)',
    '- Layered dashboard UI mockup with KPI cards and analytics panels',
    '- Mobile app screen mockup with operational workflow',
    '- Cinematic navy + neon cyan/purple lighting, premium typography',
    '- Glowing AI overlay accents, device frames, operational graphics',
    '- Hero + feature grid + CTA bar + website/contact footer',
    '- NO generic gradients, empty cards, or placeholder shapes',
    '',
    '## CTA',
    `${spec.cta} · ${spec.ctaSecondary ?? ''}`,
    '',
    '## Contact',
    `${spec.website} · ${spec.contact}`,
    '',
    '## Negative',
    'No stock handshakes. No blurry text. No simple social post layout.',
  ].join('\n')
}

/** Resolve spec for legacy creatives missing campaignSpec */
export function resolveCampaignSpec(creative: VyronCreative): EnterpriseCampaignSpec {
  if (creative.campaignSpec) return creative.campaignSpec
  const input: CreativeBuilderInput = {
    clientName: creative.clientName,
    productName: creative.productName,
    campaignGoal: creative.campaignGoal,
    platform: creative.platform,
    audience: creative.audience,
    offer: creative.offer,
    headline: creative.headline,
    cta: creative.cta,
    visualStyle: creative.visualStyle,
    colourDirection: creative.colourDirection,
    notes: creative.notes,
  }
  return buildEnterpriseCampaignSpec(input, creative.version)
}

export function applyRevisionToSpec(
  spec: EnterpriseCampaignSpec,
  feedback: string,
): EnterpriseCampaignSpec {
  const f = feedback.toLowerCase()
  const next = { ...spec, features: [...spec.features] }
  if (f.includes('headline') || f.includes('better headline')) {
    next.headline = spec.headline.includes('—') ? spec.headline.split('—')[0].trim() : `${spec.headline} — UPGRADED`
    if (detectBrand('', spec.brandLabel) === 'vyron') next.headline = 'YOUR BUSINESS. POWERED BY AI.'
  }
  if (f.includes('cta') || f.includes('stronger')) {
    next.cta = 'BOOK DEMO'
    next.ctaSecondary = 'START TODAY'
  }
  if (f.includes('layout') || f.includes('clean')) {
    next.theme = 'Corporate Clean'
  }
  if (f.includes('corporate')) next.theme = 'Executive Enterprise'
  if (f.includes('premium') || f.includes('futuristic')) next.theme = 'Futuristic AI'
  if (f.includes('south africa')) next.theme = 'South African Market Focus'
  if (f.includes('energy') || f.includes('bold')) next.theme = 'High Energy Growth'
  if (f.includes('colour') || f.includes('color')) {
    next.subheadline = `${spec.subheadline} — refreshed palette`
  }
  if (f.includes('less text')) {
    next.productExplanation = spec.productExplanation.slice(0, 100)
  }
  return next
}
