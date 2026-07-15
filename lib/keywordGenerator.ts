import type { KeywordIntent, VyronKeyword, VyronSettings } from '@/lib/vyronStore/types'

export type KeywordGenInput = {
  business?: string
  industry?: string
  targetArea?: string
  services?: string
  settings: VyronSettings
}

const VYRON_CORE_KEYWORDS = [
  'staff clocking system South Africa',
  'workforce management software South Africa',
  'employee attendance tracking software',
  'rostering software for restaurants',
  'payroll ready clocking system',
  'HR compliance software South Africa',
  'staff scheduling software for retail',
  'biometric clocking alternative',
  'AI workforce management software',
  'employee time tracking system',
]

function areaSuffix(area: string) {
  const a = area.trim()
  if (!a) return 'South Africa'
  if (a.toLowerCase().includes('south africa')) return a
  return `${a}`
}

function buildKeyword(
  phrase: string,
  intent: KeywordIntent,
  input: KeywordGenInput,
  index: number,
): Omit<VyronKeyword, 'id'> {
  const area = areaSuffix(input.targetArea || input.settings.defaultTargetArea || input.settings.defaultMarket)
  const kw = phrase.includes(area) ? phrase : `${phrase} ${area}`.replace(/\s+/g, ' ').trim()
  const difficulty = 28 + (index % 5) * 7
  const volume = 320 + (index % 8) * 110

  return {
    keyword: kw,
    volume,
    difficulty,
    intent,
    forecast: `Target top 20 in ~${input.settings.defaultSeoTimelineMonths} months with dedicated landing page`,
    gap: 'Build buyer-intent content and internal links',
    recommendedPage: 'New landing page or service hub',
    business: input.business || input.settings.businessName,
    industry: input.industry || input.settings.businessType,
    targetArea: area,
  }
}

export function generateAIKeywords(input: KeywordGenInput): Omit<VyronKeyword, 'id'>[] {
  const industry = (input.industry || input.settings.businessType || 'workforce management software').toLowerCase()
  const business = input.business || input.settings.businessName || 'VYRON CORE'
  const area = areaSuffix(input.targetArea || input.settings.defaultTargetArea)
  const services = input.services?.trim()

  const isVyron =
    business.toLowerCase().includes('vyron') ||
    industry.includes('workforce') ||
    industry.includes('hr') ||
    industry.includes('clocking') ||
    industry.includes('attendance')

  if (isVyron) {
    return VYRON_CORE_KEYWORDS.map((phrase, i) =>
      buildKeyword(phrase, i % 3 === 0 ? 'Buyer Intent' : i % 2 === 0 ? 'Commercial' : 'Local', input, i),
    )
  }

  const templates: Array<{ phrase: string; intent: KeywordIntent }> = [
    { phrase: `${industry} ${area}`, intent: 'Commercial' },
    { phrase: `best ${industry} for small business`, intent: 'Buyer Intent' },
    { phrase: `${industry} pricing ${area}`, intent: 'Commercial' },
    { phrase: `how to choose ${industry}`, intent: 'Informational' },
    { phrase: `${industry} near me`, intent: 'Local' },
    { phrase: `${business} ${industry}`, intent: 'Buyer Intent' },
    { phrase: `${industry} software comparison`, intent: 'Commercial' },
    { phrase: `affordable ${industry} ${area}`, intent: 'Local' },
    { phrase: `${industry} implementation guide`, intent: 'Informational' },
    { phrase: `${industry} ROI calculator`, intent: 'Buyer Intent' },
  ]

  if (services) {
    templates.push(
      { phrase: `${services} ${area}`, intent: 'Commercial' },
      { phrase: `${services} for businesses`, intent: 'Buyer Intent' },
    )
  }

  return templates.map((t, i) => buildKeyword(t.phrase, t.intent, input, i))
}
