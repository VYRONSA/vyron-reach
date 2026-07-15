import { contextSummary } from '@/lib/marketingDirector/context'
import { QUALITY_BENCHMARK } from '@/lib/marketingDirector/prompts'
import type { MarketingDirectorContext } from '@/lib/marketingDirector/types'
import type { PlatformId } from '@/lib/platforms'
import { getPlatform } from '@/lib/platforms'

export type HandoffBrief = {
  clientId: string | null
  platform: PlatformId
  campaignGoal: string
  offerAngle?: string
  extraNotes?: string
}

const PLATFORM_DELIVERABLES: Record<PlatformId, string[]> = {
  Facebook: [
    'Primary ad copy (feed) — hook, story, proof, CTA',
    'Headline + link description',
    'Detailed image/poster prompt (1080×1080 + safe zones)',
    '3 revision directions if asked to improve',
  ],
  Instagram: [
    'Feed caption + story variant',
    'Visual direction (portrait 4:5 + story 9:16)',
    'Image prompt with brand lighting and composition',
    'Hashtag strategy (relevant, not spammy)',
  ],
  LinkedIn: [
    'Sponsored post — professional hook + body + CTA',
    'Thought-leadership angle for B2B decision-makers',
    '1200×627 visual direction + image prompt',
    'Comment starter for engagement',
  ],
  WhatsApp: [
    'Status/promo poster copy — short, bold, urgent',
    'Square visual prompt (1080×1080)',
    'CTA for reply / link / demo booking',
  ],
  'Google Ads': [
    'RSA headlines (15) and descriptions (4) — character counts',
    'Keyword themes + negative keyword suggestions',
    'Landing page message match notes',
    'Display ad concept + 1200×628 prompt if relevant',
  ],
  SEO: [
    'Primary keyword + search intent',
    'Landing page H1/H2 outline',
    'Meta title + description',
    'Blog topic cluster (3 articles)',
    'FAQ block for rich results',
  ],
  'Landing Pages': [
    'Hero headline + subheadline',
    'Section flow (problem → solution → proof → CTA)',
    'Above-the-fold visual direction',
    'Trust elements + conversion microcopy',
  ],
}

export function buildWorldClassChatGptPrompt(
  ctx: MarketingDirectorContext,
  brief: HandoffBrief,
): string {
  const client = ctx.client
  const clientName = client?.businessName ?? ctx.settings.defaultProject
  const platform = getPlatform(brief.platform)
  const deliverables = PLATFORM_DELIVERABLES[brief.platform]
  const website = client?.website?.replace(/^https?:\/\//, '') ?? 'vyron.co.za'
  const contact = ctx.settings.contactEmail || 'hello@vyron.co.za'

  return [
    '# VYRON REACH — Premium Campaign Brief for ChatGPT',
    '',
    'You are acting as a **senior enterprise marketing strategist**, **branding agency creative director**, **conversion copywriter**, and **SaaS launch consultant** — combined.',
    '',
    'Your job: produce **agency-grade, launch-ready** marketing creative for the client below. This is NOT a generic social post or gradient card.',
    '',
    '---',
    '',
    '## Quality benchmark (non-negotiable)',
    '',
    QUALITY_BENCHMARK,
    '',
    'Reference standard: **VYRON CORE launch poster** — cinematic layout, layered dashboard + phone mockups, feature blocks (Smart Clocking, AI HR, Real-Time Insights, Secure Cloud, Automated Workflows), strong headline hierarchy, business outcome, website/contact footer, navy + cyan/purple premium SaaS aesthetic.',
    '',
    '---',
    '',
    '## Campaign assignment',
    '',
    `**Client:** ${clientName}`,
    `**Platform:** ${platform.label} — ${platform.tagline}`,
    `**Campaign goal:** ${brief.campaignGoal}`,
    brief.offerAngle ? `**Offer / angle:** ${brief.offerAngle}` : '',
    `**Website:** ${website}`,
    `**Contact:** ${contact}`,
    brief.extraNotes ? `**Additional direction:** ${brief.extraNotes}` : '',
    '',
    '---',
    '',
    '## Client intelligence dossier',
    '',
    contextSummary(ctx),
    '',
    '**Services to emphasise:**',
    ...ctx.services.map(s => `- ${s}`),
    '',
    '**Brand positioning:**',
    ctx.brandStyle,
    '',
    '---',
    '',
    '## Visual & CTA direction',
    '',
    '- **Visual:** Premium enterprise layout — explain the product visually (dashboard UI, mobile app, feature grid). Cinematic lighting, depth, glass/neon accents where appropriate for SaaS.',
    '- **Typography:** Bold headline hierarchy, readable subheads, no cluttered walls of text.',
    '- **CTA:** Clear primary action (e.g. Book Demo, Visit Website, Get Started) aligned with campaign goal.',
    '- **Negative prompt (for images):** No watermark, no blurry text, no stock handshake clichés, no empty placeholder UI, no basic gradient-only cards.',
    '',
    '---',
    '',
    `## Required deliverables for ${platform.label}`,
    '',
    ...deliverables.map((d, i) => `${i + 1}. ${d}`),
    '',
    '---',
    '',
    '## Output format',
    '',
    'Respond with clear markdown sections:',
    '',
    '```',
    '## Campaign Concept',
    '## Headline',
    '## Subheadline',
    '## Problem',
    '## Solution',
    '## Feature Highlights',
    '## Visual Layout Direction',
    '## Image Prompt',
    '## Platform Copy',
    '## CTA',
    '## Google Ads (if applicable)',
    '## Revision Suggestions',
    '```',
    '',
    '**Image Prompt** must be copy-paste ready for DALL·E, Midjourney, or ChatGPT image — include dimensions, composition layers, lighting, style, and negative prompt.',
    '',
    '---',
    '',
    '## Revision protocol',
    '',
    'After your first output, I may ask for revisions such as:',
    '- "Make it more premium / more like the VYRON CORE poster"',
    '- "More corporate / more South African"',
    '- "Add clocking and AI HR features"',
    '- "Stronger headline and CTA"',
    '',
    'When revising, **update the full concept** — do not give shallow tweaks.',
    '',
    '---',
    '',
    '## Start',
    '',
    `Create the complete ${platform.label} campaign creative for **${clientName}** now. Be specific, conversion-focused, and visually ambitious.`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildRevisionHandoffSnippet(instruction: string): string {
  return `\n\n---\n\n**Revision request (paste below your previous output in ChatGPT):**\n\n${instruction.trim()}`
}
