import { generateGoogleAdsCampaignPlan } from '@/lib/googleAdsPlanGenerator'
import {
  buildEnterpriseCampaignSpec,
  buildEnterpriseImagePrompt,
  detectBrand,
} from '@/lib/enterpriseCreativeEngine'
import type { CreativeBuilderInput, CreativePlatform } from '@/lib/vyronStore/types'
import type { MarketingDirectorContext } from '@/lib/marketingDirector/types'
import type { DirectorMessage } from '@/lib/marketingDirector/types'
import { detectPlatform, isRevisionRequest } from '@/lib/marketingDirector/extract'

function builderFromContext(ctx: MarketingDirectorContext, platform: CreativePlatform, version: number): CreativeBuilderInput {
  const c = ctx.client
  const brand = detectBrand(c?.businessName ?? '', c?.businessName ?? ctx.settings.defaultProject)
  return {
    clientId: c?.id,
    clientName: c?.businessName ?? ctx.settings.defaultProject,
    productName: c?.businessName.includes('VYRON') ? 'VYRON CORE' : (c?.businessName ?? ctx.settings.defaultProject),
    campaignGoal: ctx.campaignGoal,
    platform,
    audience: c?.targetArea
      ? `${c.targetArea} — business owners and decision-makers`
      : 'South African business owners and operations managers',
    offer: c?.notes?.slice(0, 120) ?? ctx.settings.defaultProject,
    headline: brand === 'vyron' ? 'VYRON CORE IS LIVE' : c?.businessName ?? 'Your Business. Powered.',
    cta: brand === 'vyron' ? 'BOOK DEMO' : 'GET STARTED',
    visualStyle: 'Premium SaaS',
    colourDirection: 'navy neon cyan purple',
    layout: platform === 'LinkedIn' ? 'LinkedIn Corporate' : platform === 'Instagram' ? 'Poster' : 'SaaS Launch Campaign',
    variationTheme: version === 1 ? 'Futuristic AI' : version === 2 ? 'Executive Enterprise' : 'South African Market Focus',
    website: c?.website?.replace(/^https?:\/\//, '') ?? 'vyron.co.za',
    contact: ctx.settings.contactEmail || 'hello@vyron.co.za',
    notes: ctx.services.join(', '),
  }
}

function formatEnterpriseCampaign(
  spec: ReturnType<typeof buildEnterpriseCampaignSpec>,
  imagePrompt: string,
  input: CreativeBuilderInput,
  version: number,
  revisionNote?: string,
): string {
  return [
    `# Enterprise Campaign — ${input.clientName}${revisionNote ? ' (revised)' : ''}`,
    revisionNote ? `\n> **Revision applied:** ${revisionNote}\n` : '',
    '',
    '## Campaign Concept',
    `${spec.productExplanation} ${spec.businessOutcome}`,
    '',
    '## Headline',
    spec.headline,
    '',
    '## Subheadline',
    spec.subheadline,
    '',
    '## Problem',
    spec.problem,
    '',
    '## Solution',
    spec.solution,
    '',
    '## Product Explanation',
    spec.productExplanation,
    '',
    '## Who It Helps',
    spec.whoItHelps,
    '',
    '## Why Better',
    spec.whyBetter,
    '',
    '## Feature Highlights',
    ...spec.features.map(f => `- **${f.icon} ${f.title}** — ${f.description}`),
    '',
    '## Business Outcome',
    spec.businessOutcome,
    '',
    '## Visual Layout Direction',
    `${spec.layout} · ${spec.theme} · Layered dashboard UI + mobile mockup + feature grid + CTA footer · ${input.platform} format`,
    '',
    '## Image Prompt',
    imagePrompt,
    '',
    '## Facebook Copy',
    `**Primary text:** ${spec.productExplanation}\n\n**Headline:** ${spec.headline}\n\n**CTA:** ${spec.cta}`,
    '',
    '## Instagram Copy',
    `**Caption:** ${spec.headline} — ${spec.subheadline}\n\n${spec.features.slice(0, 3).map(f => `${f.icon} ${f.title}`).join(' · ')}\n\n**CTA:** ${spec.cta} → ${spec.website}`,
    '',
    '## LinkedIn Copy',
    `**Hook:** ${spec.headline}\n\n**Body:** ${spec.productExplanation}\n\n**CTA:** ${spec.cta} → ${spec.website}`,
    '',
    '## Headlines & Descriptions (Google Ads)',
    `Headlines: ${spec.headline} | ${spec.subheadline.slice(0, 30)} | ${input.clientName}\nDescriptions: ${spec.solution.slice(0, 90)} | ${spec.businessOutcome.slice(0, 90)}`,
    '',
    '## Platform Size',
    input.platform === 'Instagram'
      ? '1080×1080 feed · 1080×1920 story safe zone'
      : input.platform === 'LinkedIn'
        ? '1200×627 sponsored'
        : input.platform === 'WhatsApp'
          ? '1080×1080 status'
          : input.platform === 'Google Display'
            ? '1200×628 landscape'
            : '1080×1080 + 1200×628',
    '',
    '## Negative Prompt',
    'No watermark. No blurry text. No generic stock handshakes. No simple gradient card. No empty placeholder UI.',
    '',
    '## Style Direction',
    spec.theme + ' · ' + input.colourDirection,
    '',
    '## CTA',
    `Primary: **${spec.cta}** · Secondary: ${spec.ctaSecondary ?? 'VISIT NOW'}`,
    '',
    '## Revision Suggestions',
    'Try: "make it more premium", "more like the VYRON CORE poster", "add clocking and AI HR", "make it more corporate", "change colours to blue/cyan".',
    '',
    '## Contact / Website',
    `${spec.website} · ${spec.contact}`,
    '',
    '---',
    '*This is AI-generated campaign copy — use Open in ChatGPT for image generation, or save to Creatives.*',
  ].join('\n')
}

function applyRevisionHints(message: string, input: CreativeBuilderInput): { input: CreativeBuilderInput; note: string } {
  const m = message.toLowerCase()
  const note: string[] = []
  const next = { ...input }
  if (m.includes('poster') || m.includes('vyron core')) {
    next.variationTheme = 'Futuristic AI'
    next.colourDirection = 'navy neon cyan purple cinematic'
    next.layout = 'SaaS Launch Campaign'
    note.push('VYRON CORE poster style')
  }
  if (m.includes('premium') || m.includes('better')) {
    next.variationTheme = 'Futuristic AI'
    next.colourDirection = 'navy neon cyan purple cinematic'
    note.push('more premium finish')
  }
  if (m.includes('corporate')) {
    next.variationTheme = 'Executive Enterprise'
    next.visualStyle = 'Corporate'
    note.push('more corporate')
  }
  if (m.includes('south africa')) {
    next.variationTheme = 'South African Market Focus'
    next.audience = 'South African business owners, ops managers and HR leaders'
    note.push('South African market focus')
  }
  if (m.includes('clocking') || m.includes('ai hr')) {
    next.notes = 'Emphasize Smart Clocking, AI HR, Real-Time Insights, Secure Cloud, Automated Workflows'
    note.push('added clocking + AI HR features')
  }
  if (m.includes('colour') || m.includes('color')) {
    next.colourDirection = m.includes('blue') ? 'blue cyan' : 'violet cyan purple'
    note.push('colour direction updated')
  }
  if (m.includes('headline')) {
    next.headline = 'STOP LOSING PAYROLL HOURS'
    note.push('stronger headline')
  }
  if (m.includes('cta') || m.includes('demo')) {
    next.cta = 'BOOK DEMO'
    note.push('CTA strengthened')
  }
  if (m.includes('service') || m.includes('detail')) {
    note.push('expanded service detail in feature blocks')
  }
  if (m.includes('version 2')) return { input: next, note: note.join(', ') || 'version 2 focus' }
  if (m.includes('version 3')) return { input: { ...next, variationTheme: 'High Energy Growth' }, note: 'version 3 high energy' }
  return { input: next, note: note.join(', ') || message.slice(0, 80) }
}

export function generateFallbackDirectorReply(
  userMessage: string,
  ctx: MarketingDirectorContext,
  history: DirectorMessage[],
): string {
  const msg = userMessage.toLowerCase()
  const platform = detectPlatform(userMessage)
  const lastAssistant = [...history].reverse().find(m => m.role === 'assistant')

  if (msg.includes('google ads') || msg.includes('search campaign') || msg.includes('rsa')) {
    const c = ctx.client
    const form = {
      campaignName: `${c?.businessName ?? 'Campaign'} — Search`,
      dailyBudget: Math.round((c?.monthlyMarketingBudget ?? 15000) / 30),
      targetArea: c?.targetArea ?? ctx.settings.defaultTargetArea,
      productService: c?.industry ?? ctx.settings.businessType,
      keywordTheme: c?.targetKeywords[0] ?? ctx.keywords[0]?.keyword ?? 'buyer intent',
      audience: ctx.campaignGoal,
      offer: ctx.services[0] ?? 'Book a demo',
      landingPageUrl: c?.website ?? 'https://vyron.co.za',
    }
    const plan = generateGoogleAdsCampaignPlan(form, ctx.settings)
    return [
      `# Google Ads Plan — ${c?.businessName ?? 'Client'}`,
      '',
      plan.fullPlan,
      '',
      '## Next Step',
      'Click **Create Google Ads Plan** to save in VYRON REACH, or **Launch Google Ads Setup** from Google Ads AI.',
    ].join('\n')
  }

  if (msg.includes('linkedin') && (msg.includes('campaign') || msg.includes('post') || msg.includes('copy'))) {
    const input = builderFromContext(ctx, 'LinkedIn', 2)
    const spec = buildEnterpriseCampaignSpec(input, 2)
    const prompt = buildEnterpriseImagePrompt(spec, input, 2)
    return formatEnterpriseCampaign(spec, prompt, input, 2) + '\n\n## LinkedIn Copy\n\n' + [
      `**Post hook:** ${spec.headline}`,
      `**Body:** ${spec.productExplanation}`,
      `**CTA:** ${spec.cta} → ${spec.website}`,
    ].join('\n')
  }

  if (msg.includes('report') || msg.includes('monthly')) {
    return [
      '# Marketing Director — Report Brief',
      '',
      `Prepared for **${ctx.client?.businessName ?? 'Agency'}** · ${new Date().toLocaleDateString('en-ZA')}`,
      '',
      '## Summary',
      ctx.campaignGoal,
      '',
      '## Keywords in focus',
      ...(ctx.client?.targetKeywords ?? ctx.keywords.map(k => k.keyword)).map(k => `- ${k}`),
      '',
      '## Recommended actions',
      '1. Approve enterprise creative in AI Creative Studio',
      '2. Launch Google Ads test budget',
      '3. Publish SEO landing page for primary keyword',
      '',
      'Use **Create Report** to save in Reports module.',
    ].join('\n')
  }

  if (
    msg.includes('advert') ||
    msg.includes('ad ') ||
    msg.includes('creative') ||
    msg.includes('poster') ||
    msg.includes('facebook') ||
    msg.includes('instagram') ||
    msg.includes('image prompt') ||
    msg.includes('vyron core') ||
    isRevisionRequest(userMessage)
  ) {
    let version = 1
    if (msg.includes('version 2') || msg.includes('variation 2')) version = 2
    if (msg.includes('version 3') || msg.includes('variation 3')) version = 3
    if (isRevisionRequest(userMessage) && !msg.includes('version')) version = 2

    let input = builderFromContext(ctx, platform, version)
    let revisionNote: string | undefined
    if (isRevisionRequest(userMessage)) {
      const rev = applyRevisionHints(userMessage, input)
      input = rev.input
      revisionNote = rev.note
    }
    if (lastAssistant && isRevisionRequest(userMessage)) {
      revisionNote = revisionNote ?? userMessage
    }

    const spec = buildEnterpriseCampaignSpec(input, version)
    const prompt = buildEnterpriseImagePrompt(spec, input, version)
    return formatEnterpriseCampaign(spec, prompt, input, version, revisionNote)
  }

  if (msg.includes('content') || msg.includes('blog') || msg.includes('landing')) {
    return [
      '# Content Plan',
      '',
      `**Client:** ${ctx.client?.businessName ?? '—'}`,
      '',
      '## Recommended assets',
      '1. **Landing page** — buyer-intent keyword H1 match',
      '2. **Blog** — problem/solution guide for primary keyword',
      '3. **FAQ block** — payroll-ready clocking / services',
      '4. **LinkedIn carousel** — feature highlights from enterprise creative',
      '',
      '## Primary keyword',
      ctx.client?.targetKeywords[0] ?? ctx.keywords[0]?.keyword ?? '—',
      '',
      'Save via **Content Engine** or **Add to Action Queue**.',
    ].join('\n')
  }

  return [
    `# VYRON REACH AI Marketing Director`,
    '',
    `I'm ready to build **premium enterprise campaigns** for **${ctx.client?.businessName ?? 'your selected client'}** — not template cards.`,
    '',
    '**Try:**',
    '- Create a Facebook advert for VYRON CORE',
    '- Make it more premium',
    '- Add clocking and AI HR features',
    '- Generate image prompt',
    '- Generate Google Ads copy',
    '- Create 3 variations',
    '- Improve version 2',
    '',
    '**Client context loaded:**',
    ctx.client
      ? `${ctx.client.businessName} · R${ctx.client.monthlyMarketingBudget}/mo · ${ctx.client.targetArea}`
      : 'Select a client above for full context.',
    '',
    ctx.brandStyle,
  ].join('\n')
}
