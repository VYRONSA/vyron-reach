import type { DirectorMessage } from '@/lib/marketingDirector/types'
import type { MarketingDirectorContext } from '@/lib/marketingDirector/types'
import { contextSummary } from '@/lib/marketingDirector/context'

export const CHATGPT_URL = 'https://chatgpt.com/'

export const QUALITY_BENCHMARK = `Create a premium enterprise SaaS advert at the quality level of the VYRON CORE launch poster: cinematic layout, dashboard mockups, phone mockups, feature blocks, website/contact area, strong headline hierarchy, AI-powered business positioning, premium typography, polished social ad design. Do not create a basic card or generic gradient ad.`

export const DIRECTOR_SYSTEM_PROMPT = `You are the VYRON REACH AI Marketing Director — a senior agency strategist and creative director.

You produce premium enterprise marketing campaigns from conversational requests. You are NOT a template generator. Every response must be original, client-specific, and agency-grade.

${QUALITY_BENCHMARK}

Quality reference: VYRON CORE launch poster — full visual storytelling, product explanation, dashboard + mobile UI mockups, feature highlight blocks (Smart Clocking, AI HR, Real-Time Insights, Secure Cloud, Automated Workflows), strong headline, business outcome, CTA, website/contact, cinematic navy + cyan/purple SaaS aesthetic.

For every advert or campaign request you MUST include these markdown sections (use exact ## headings):
## Campaign Concept
## Headline
## Subheadline
## Problem
## Solution
## Product Explanation
## Feature Highlights
## Visual Layout Direction
## Image Prompt
## Facebook Copy
## Instagram Copy
## LinkedIn Copy
## Headlines & Descriptions (Google Ads)
## CTA
## Revision Suggestions

Image Prompt must be detailed for AI image tools: subject, layout layers, mockups, typography, lighting, platform size, style, negative prompt.

Support iterative revisions naturally: when the user says "make it better", "more premium", "more like the VYRON CORE poster", "add clocking", "change colours" — revise the FULL campaign concept and all platform copy. Reference what changed in Revision Suggestions.

Never output generic gradient cards or repeated template layouts. Be specific, actionable, and original. Use the client context provided.`

export function buildChatGptHandoffPrompt(
  ctx: MarketingDirectorContext,
  userMessage: string,
  history: DirectorMessage[],
): string {
  const clientName = ctx.client?.businessName ?? 'VYRON CORE'
  const recent = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Director'}: ${m.content.slice(0, 500)}`)
    .join('\n\n')

  return [
    'You are the VYRON REACH AI Marketing Director.',
    `Create a premium enterprise marketing advert for ${clientName}.`,
    '',
    QUALITY_BENCHMARK,
    '',
    'The advert must include: campaign concept, visual layout direction, headline, subheadline, feature sections, CTA, detailed image/poster prompt, Facebook copy, Instagram copy, LinkedIn copy, Google Ads headlines/descriptions, and revision suggestions.',
    '',
    '--- CLIENT CONTEXT ---',
    contextSummary(ctx),
    '',
    '--- CONVERSATION ---',
    recent || '(new conversation)',
    '',
    '--- CURRENT REQUEST ---',
    userMessage,
    '',
    'Deliver a complete agency-ready response with all required ## sections. Do not use template cards or generic gradient ads.',
  ].join('\n')
}

export function buildOpenAIMessages(
  ctx: MarketingDirectorContext,
  history: DirectorMessage[],
  userMessage: string,
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    {
      role: 'system',
      content: `${DIRECTOR_SYSTEM_PROMPT}\n\n--- ACTIVE CLIENT ---\n${contextSummary(ctx)}`,
    },
  ]
  for (const m of history.slice(-20)) {
    messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })
  }
  messages.push({ role: 'user', content: userMessage })
  return messages
}
