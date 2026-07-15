import type { MarketingStudioPrefill } from '@/lib/executionPrefill'

export type MarketingStudioInput = MarketingStudioPrefill

export type MarketingMaterialPack = {
  fullDocument: string
  facebookAd: string
  instagramPost: string
  whatsappStatus: string
  linkedinPost: string
  googleHeadlines: string
  googleDescriptions: string
  advertImagePrompt: string
  landingSection: string
  blogOutline: string
  faqBlock: string
}

export function generateMarketingMaterialPack(input: MarketingStudioInput): MarketingMaterialPack {
  const p = input.productName.trim()
  const aud = input.targetAudience.trim()
  const offer = input.offerMessage.trim()
  const area = input.targetArea.trim()
  const goal = input.campaignGoal.trim()

  const facebookAd = [
    `🔥 ${p} for ${area} businesses`,
    '',
    offer,
    '',
    '✅ Staff clocking & attendance',
    '✅ Rostering & shift control',
    '✅ AI HR compliance alerts',
    '',
    '👉 Book a free demo — link in comments',
    `#WorkforceManagement #${area.replace(/\s/g, '')} #HRtech`,
  ].join('\n')

  const instagramPost = [
    `Stop losing payroll hours.`,
    '',
    `${p} gives you one command centre for clocking, rostering and HR alerts — built for ${aud}.`,
    '',
    `📍 ${area}`,
    `🎯 Goal: ${goal}`,
    '',
    'DM "DEMO" or tap link in bio.',
  ].join('\n')

  const whatsappStatus = [
    `${p} — ${offer}`,
    '',
    `Perfect for teams in ${area}.`,
    'Reply DEMO for a quick walkthrough.',
  ].join('\n')

  const linkedinPost = [
    `Why ${aud} are switching to ${p}`,
    '',
    `The problem: payroll leakage, manual rosters, and compliance blind spots.`,
    '',
    `The fix: one workforce command centre — clocking, AI alerts, and reporting.`,
    '',
    `${offer}`,
    '',
    `Targeting ${area}. ${goal}.`,
    '',
    'Comment "INFO" for the playbook.',
  ].join('\n')

  const googleHeadlines = [
    `${p} | ${area}`,
    'Stop Payroll Leakage Today',
    'Workforce Command Centre',
    'Staff Clocking + HR Alerts',
    'Book Demo — VYRON CORE',
  ].join('\n')

  const googleDescriptions = [
    `${offer} Built for ${area}. AI clocking, rostering & compliance.`,
    'Replace spreadsheets. See who is on site. Fix HR risks early. Start low test budget.',
    'Demo available this week. Scale ads only after SEO validates intent.',
  ].join('\n')

  const advertImagePrompt = [
    `Create a premium ${input.platform} advert for ${p}, targeting ${aud} in ${area}.`,
    `Visual: modern workforce dashboard, staff clocking UI, cyan/violet SaaS glow, ${input.tone} style.`,
    `Headline on creative: "${offer}".`,
    'Size: 1080×1080 feed + 1080×1920 story safe zone.',
    'CTA: Book Demo.',
    'Negative: no watermark, no blurry text, no stock photo clichés.',
  ].join(' ')

  const landingSection = [
    `## Hero — ${p}`,
    `H1: ${offer}`,
    `Sub: Workforce management for ${aud} in ${area}`,
    '',
    '## 3 Benefits',
    '1. Accurate clocking → payroll ready',
    '2. Smart rostering → labour cost control',
    '3. AI HR alerts → compliance before fines',
    '',
    '## CTA',
    'Book demo | Start trial',
  ].join('\n')

  const blogOutline = [
    `# Blog: ${p} — complete guide for ${area}`,
    '',
    '1. Introduction — payroll leakage problem',
    '2. What workforce software must do in 2026',
    '3. Clocking + rostering + HR in one stack',
    '4. South African compliance considerations',
    '5. ROI calculator framework',
    '6. FAQ (8 questions)',
    '7. CTA — demo',
  ].join('\n')

  const faqBlock = [
    '**What is workforce management software?**',
    `Software that combines time tracking, rostering and HR compliance — like ${p}.`,
    '',
    '**How fast can we go live?**',
    'Most teams onboard in 1–2 weeks with clocking first.',
    '',
    '**Does it work for multi-site teams?**',
    `Yes — built for ${area} operations with multiple branches.`,
    '',
    '**What does it cost?**',
    'Pricing scales by active staff — book a demo for a quote.',
  ].join('\n')

  const fullDocument = [
    `# Marketing Material Pack — ${p}`,
    `Platform focus: ${input.platform} · Tone: ${input.tone} · Goal: ${goal}`,
    '',
    '## Facebook Ad Copy',
    facebookAd,
    '',
    '## Instagram Post',
    instagramPost,
    '',
    '## WhatsApp Status',
    whatsappStatus,
    '',
    '## LinkedIn Post',
    linkedinPost,
    '',
    '## Google Headlines',
    googleHeadlines,
    '',
    '## Google Descriptions',
    googleDescriptions,
    '',
    '## AI Advert Image Prompt',
    advertImagePrompt,
    '',
    '## Landing Page Section',
    landingSection,
    '',
    '## Blog Outline',
    blogOutline,
    '',
    '## FAQ Block',
    faqBlock,
  ].join('\n')

  return {
    fullDocument,
    facebookAd,
    instagramPost,
    whatsappStatus,
    linkedinPost,
    googleHeadlines,
    googleDescriptions,
    advertImagePrompt,
    landingSection,
    blogOutline,
    faqBlock,
  }
}
