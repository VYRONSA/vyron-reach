import {
  extractHeadline,
  extractImagePrompt,
  extractSection,
} from '@/lib/marketingDirector/extract'
import type { CreativePlatform, VyronCreative } from '@/lib/vyronStore/types'

export type SaveDirectorCreativeInput = {
  clientId?: string
  clientName: string
  platform: CreativePlatform
  campaignGoal: string
  aiContent: string
}

export function buildCreativeFromDirectorAI(
  input: SaveDirectorCreativeInput,
  newId: (prefix: string) => string,
): VyronCreative {
  const now = new Date().toISOString()
  const headline = extractHeadline(input.aiContent)
  const imagePrompt = extractImagePrompt(input.aiContent) || input.aiContent.slice(0, 3000)
  const ctaBlock = extractSection(input.aiContent, 'CTA')
  const cta = ctaBlock.split('\n')[0]?.replace(/\*\*/g, '').trim() || 'BOOK DEMO'

  return {
    id: newId('creative'),
    clientId: input.clientId,
    clientName: input.clientName,
    productName: input.clientName.includes('VYRON') ? 'VYRON CORE' : input.clientName,
    campaignGoal: input.campaignGoal,
    platform: input.platform,
    audience: 'From AI Marketing Director',
    offer: extractSection(input.aiContent, 'Subheadline') || headline,
    headline,
    cta,
    visualStyle: 'Premium SaaS',
    colourDirection: 'From AI direction',
    notes: input.aiContent,
    version: 1,
    status: 'Awaiting Approval',
    imagePrompt,
    visualDirection: extractSection(input.aiContent, 'Visual Layout Direction') || 'AI-generated',
    feedbackNotes: '',
    approvalHistory: [
      {
        id: newId('hist'),
        status: 'Awaiting Approval',
        note: 'Saved from AI Marketing Director',
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}
