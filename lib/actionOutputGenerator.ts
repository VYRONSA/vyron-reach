import type { VyronActionQueueItem, VyronSettings } from '@/lib/vyronStore/types'

function inferKind(action: VyronActionQueueItem): VyronActionQueueItem['kind'] {
  if (action.kind && action.kind !== 'general') return action.kind
  if (action.advertMeta) return 'advert_image'
  const src = action.sourcePage.toLowerCase()
  if (src.includes('seo')) return 'seo'
  if (src.includes('google ads') || src.includes('ads')) return 'google_ads'
  if (src.includes('content')) return 'content'
  return 'general'
}

export function buildActionContextFromTitle(
  action: VyronActionQueueItem,
  settings: VyronSettings,
): NonNullable<VyronActionQueueItem['contextMeta']> {
  const existing = action.contextMeta ?? {}
  return {
    keyword: existing.keyword ?? action.title,
    business: existing.business ?? settings.businessName,
    targetArea: existing.targetArea ?? settings.defaultTargetArea,
    searchIntent: existing.searchIntent ?? 'Buyer Intent / Commercial',
    difficulty: existing.difficulty ?? '35',
    volume: existing.volume ?? '400+',
    suggestedDailyBudget: existing.suggestedDailyBudget ?? `R${settings.defaultAdDailyBudget}/day`,
  }
}

export function generateExecutionOutput(action: VyronActionQueueItem, settings: VyronSettings): string {
  const kind = inferKind(action)
  const ctx = buildActionContextFromTitle(action, settings)
  const project = settings.defaultProject
  const market = settings.defaultMarket
  const timeline = settings.defaultSeoTimelineMonths

  if (kind === 'advert_image' && action.advertMeta) {
    const a = action.advertMeta
    return [
      `# Advert Image Execution — ${a.productName}`,
      '',
      '## Image Prompt (copy to your image tool)',
      a.prompt,
      '',
      '## Campaign Context',
      `- Platform: ${a.platform}`,
      `- Audience: ${a.audience}`,
      `- Style: ${a.style}`,
      `- Offer: ${a.offerMessage || action.subtitle}`,
      '',
      '## Next 5 Actions',
      '1. Generate image in Midjourney / DALL·E / Canva',
      '2. Export 1080×1080 and story sizes for platform',
      '3. Add headline overlay matching offer message',
      '4. Run client approval before spend',
      '5. Upload to Ads Manager or schedule organic post',
      '',
      '## Output Needed',
      action.outputNeeded,
    ].join('\n')
  }

  if (kind === 'google_ads') {
    return [
      `# Google Ads Test Plan — ${ctx.keyword}`,
      '',
      '## Target Setup',
      `- Keyword / theme: ${ctx.keyword}`,
      `- Business: ${ctx.business}`,
      `- Market: ${market} · ${ctx.targetArea}`,
      `- Search intent: ${ctx.searchIntent}`,
      `- Starting budget: ${ctx.suggestedDailyBudget} (do not scale until SEO validates intent)`,
      '',
      '## Recommended Keywords (exact match test)',
      `- "${ctx.keyword}"`,
      `- "${ctx.keyword} ${ctx.targetArea}"`,
      `- "buy ${ctx.keyword}"`,
      `- "${settings.businessType.split('/')[0]?.trim() || 'workforce software'} ${ctx.targetArea}"`,
      '',
      '## Negative Keywords to Block Early',
      '- free, jobs, salary, course, template, cracked, login, app download only',
      '- careers, internship, retrenchment, labour law pdf',
      '',
      '## Landing Page Required',
      `- Dedicated page for "${ctx.keyword}" with H1 match, proof, CTA, FAQ schema`,
      '',
      '## R50/Day Test Campaign Plan',
      '- Campaign type: Search only',
      '- Bidding: Maximize clicks with cap, or manual CPC low',
      '- Geo: South Africa (or client target area)',
      '- Review search terms every 48 hours — pause waste',
      '- Pause if no conversion signal after 14 days at test budget',
      '',
      `## ${timeline}-Month SEO Expectation`,
      '- Month 1–2: index landing page, baseline rankings 30–50',
      '- Month 3–4: top 20 for long-tail, internal links from service pages',
      '- Month 5–6: top 10 commercial terms with content depth + links',
      '',
      '## Next 5 Actions',
      '1. Build or fix landing page for this keyword',
      '2. Launch exact-match test campaign at test budget',
      '3. Add negative keyword list above',
      '4. Track weekly rankings in Rankings module',
      '5. Scale budget only after 2+ weeks of clean search terms',
    ].join('\n')
  }

  if (kind === 'seo') {
    return [
      `# SEO Execution Plan — ${ctx.keyword}`,
      '',
      '## Keyword Intelligence',
      `- Primary keyword: ${ctx.keyword}`,
      `- Business: ${ctx.business} (${project})`,
      `- Target area: ${ctx.targetArea}`,
      `- Intent: ${ctx.searchIntent}`,
      `- Difficulty estimate: ${ctx.difficulty}/100`,
      `- Volume estimate: ${ctx.volume}/mo`,
      '',
      '## Recommended Keyword Cluster',
      `- ${ctx.keyword}`,
      `- ${ctx.keyword} ${ctx.targetArea}`,
      `- ${ctx.business} ${ctx.targetArea}`,
      `- staff clocking system ${ctx.targetArea}`,
      `- workforce management software ${ctx.targetArea}`,
      '',
      '## Landing Page Needed',
      `- URL: /solutions/${ctx.keyword?.toLowerCase().replace(/\s+/g, '-') || 'target-keyword'}`,
      '- Sections: hero, features, proof, pricing CTA, FAQ (8+ questions), internal links',
      '',
      `## ${timeline}-Month Ranking Forecast`,
      '- Week 1–4: publish + index, position 40–60',
      '- Month 2–3: top 30 with internal links + schema',
      '- Month 4–6: top 10 if content outdepths competitors',
      '',
      '## Next 5 Actions',
      '1. Audit SERP — note top 3 competitor page lengths',
      '2. Create or expand landing page targeting this keyword',
      '3. Add FAQ schema + internal links from blog/service pages',
      '4. Submit URL in Search Console after publish',
      '5. Add to weekly Rankings tracker',
    ].join('\n')
  }

  if (kind === 'content') {
    return [
      `# Content Brief — ${action.title}`,
      '',
      '## Objective',
      action.executionBrief,
      '',
      '## Target Keyword',
      ctx.keyword ?? action.title,
      '',
      '## Outline',
      '- H1: Primary keyword + benefit for South African business owners',
      '- H2: Problem (payroll leakage, compliance, roster chaos)',
      '- H2: Solution (VYRON CORE features)',
      '- H2: How it works (clocking, roster, HR alerts)',
      '- H2: FAQ (6–10 questions)',
      '- CTA: Book demo / Start trial',
      '',
      '## Schema',
      '- FAQ schema on all FAQ blocks',
      '- Organization + SoftwareApplication where relevant',
      '',
      '## Next 5 Actions',
      ...action.nextSteps.slice(0, 5).map((s, i) => `${i + 1}. ${s}`),
    ].join('\n')
  }

  return [
    `# Marketing Execution — ${action.title}`,
    '',
    '## Brief',
    action.executionBrief,
    '',
    '## Context',
    `- Source: ${action.sourcePage}`,
    `- Priority: ${action.priority}`,
    `- Project: ${project} · ${market}`,
    '',
    '## Output Needed',
    action.outputNeeded,
    '',
    '## Next Steps',
    ...action.nextSteps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '## Recommended Focus This Week',
    '1. Confirm target keyword and landing page exist',
    '2. Execute top 3 steps from brief',
    '3. Log results in Reports or client notes',
    '4. Mark complete when deliverable is shipped',
    '5. Create follow-up task if blocked',
  ].join('\n')
}

export function generateSeoPlanAppend(action: VyronActionQueueItem, settings: VyronSettings): string {
  const ctx = buildActionContextFromTitle(action, settings)
  return [
    '',
    '---',
    '## SEO Plan (generated)',
    `- 6-month target: top 10 for "${ctx.keyword}" in ${ctx.targetArea}`,
    '- Month 1: publish landing + 2 supporting blogs',
    '- Month 2: internal link hub + FAQ schema',
    '- Month 3: comparison page vs top competitor',
    '- Month 4–6: link outreach + refresh content quarterly',
  ].join('\n')
}

export function generateAdsTestPlanAppend(action: VyronActionQueueItem, settings: VyronSettings): string {
  const ctx = buildActionContextFromTitle(action, settings)
  return [
    '',
    '---',
    '## Google Ads Test Plan (generated)',
    `- Budget: ${ctx.suggestedDailyBudget} for 14 days`,
    `- Keywords: exact match on "${ctx.keyword}" only`,
    '- Negatives: free, jobs, salary, course, template',
    '- Landing page must match keyword in H1',
    '- Scale rule: +20% budget only after 3+ qualified leads at test spend',
  ].join('\n')
}

export function generateContentBriefAppend(action: VyronActionQueueItem, settings: VyronSettings): string {
  const ctx = buildActionContextFromTitle(action, settings)
  return [
    '',
    '---',
    '## Content Brief (generated)',
    `- Title: ${ctx.keyword} — guide for ${ctx.targetArea} businesses`,
    `- Angle: ${settings.businessType} for ${ctx.business}`,
    '- Length: 1,200–1,800 words',
    '- Include: 3 screenshots, 8 FAQs, CTA every 400 words',
    '- Publish then link from homepage + solutions hub',
  ].join('\n')
}
