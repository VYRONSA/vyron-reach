import type { GoogleAdsBuilderPrefill } from '@/lib/executionPrefill'
import type { VyronSettings } from '@/lib/vyronStore/types'

export type GoogleAdsPlanSections = {
  fullPlan: string
  structure: string
  adGroups: string
  exactKeywords: string
  phraseKeywords: string
  negativeKeywords: string
  headlines: string
  descriptions: string
  landingPage: string
  budgetRule: string
  nextSteps: string
}

export function generateGoogleAdsCampaignPlan(
  input: GoogleAdsBuilderPrefill,
  settings: VyronSettings,
): GoogleAdsPlanSections {
  const kw = input.keywordTheme.trim()
  const area = input.targetArea.trim()
  const daily = input.dailyBudget

  const exact = [
    `[${kw}]`,
    `[${kw} ${area}]`,
    `[buy ${kw}]`,
    `[${input.productService.split('/')[0]?.trim()} ${area}]`,
  ].join('\n')

  const phrase = [
    `"${kw}"`,
    `"${kw} ${area}"`,
    `"workforce management ${area}"`,
    `"staff clocking system"`,
  ].join('\n')

  const negatives = [
    'free',
    'jobs',
    'salary',
    'careers',
    'course',
    'template',
    'cracked',
    'login only',
    'internship',
    'retrenchment',
    'labour law pdf',
    'whatsapp group',
  ].join('\n')

  const headlines = [
    `1. ${settings.defaultProject} — ${kw}`,
    `2. Stop Payroll Leakage | ${area}`,
    `3. Workforce Command Centre`,
  ].join('\n')

  const descriptions = [
    `1. ${input.offer} AI clocking, rostering & HR alerts. Book a demo.`,
    `2. Built for ${area} businesses. Start at R${daily}/day test budget.`,
    `3. Replace spreadsheets with one dashboard. Scale after SEO wins.`,
  ].join('\n')

  const structure = [
    `Campaign: ${input.campaignName}`,
    'Type: Search only',
    `Geo: ${area}`,
    `Budget: R${daily}/day (test — do not scale for 14 days minimum)`,
    'Bidding: Maximize clicks with cap OR manual CPC low',
    '',
    'Ad Group 1: Exact Match — Buyer Intent',
    'Ad Group 2: Phrase Match — Commercial Research',
  ].join('\n')

  const adGroups = [
    '**Ad Group 1 — Exact Buyer Intent**',
    `- Keywords: exact match on "${kw}"`,
    '- Ads: 3 RSA variants, sitelinks to demo + pricing',
    '',
    '**Ad Group 2 — Phrase Commercial**',
    `- Keywords: phrase match workforce / HR software ${area}`,
    '- Ads: problem-agitation + proof points',
  ].join('\n')

  const landingPage = [
    `URL: ${input.landingPageUrl}`,
    `H1 must include: "${kw}"`,
    'Sections: hero, 3 benefits, proof, FAQ, demo CTA',
    'Match ad headline promise — no message mismatch',
  ].join('\n')

  const budgetRule = [
    `Daily test budget: R${daily}/day`,
    `Monthly cap at test: R${daily * 30}`,
    'Scale rule: +20% only after 3+ qualified leads AND clean search terms 2 weeks',
    'Pause keywords with >R80 spend and zero conversions',
  ].join('\n')

  const nextSteps = [
    '1. Publish landing page before enabling ads',
    '2. Upload exact + phrase keywords per ad group',
    '3. Paste negative keyword list at campaign level',
    '4. Review search terms every 48 hours',
    '5. Mark plan launched in VYRON when live in Google Ads',
  ].join('\n')

  const fullPlan = [
    `# Google Ads Campaign Plan — ${input.campaignName}`,
    '',
    '## Campaign Structure',
    structure,
    '',
    '## Ad Groups',
    adGroups,
    '',
    '## Exact Match Keywords',
    exact,
    '',
    '## Phrase Match Keywords',
    phrase,
    '',
    '## Negative Keywords',
    negatives,
    '',
    '## Headlines (RSA)',
    headlines,
    '',
    '## Descriptions (RSA)',
    descriptions,
    '',
    '## Landing Page',
    landingPage,
    '',
    '## Budget & Scaling',
    budgetRule,
    '',
    '## Targeting',
    `- Audience: ${input.audience}`,
    `- Intent: ${input.searchIntent ?? 'Buyer Intent'}`,
    `- Product: ${input.productService}`,
    '',
    '## Next Steps',
    nextSteps,
  ].join('\n')

  return {
    fullPlan,
    structure,
    adGroups,
    exactKeywords: exact,
    phraseKeywords: phrase,
    negativeKeywords: negatives,
    headlines,
    descriptions,
    landingPage,
    budgetRule,
    nextSteps,
  }
}
