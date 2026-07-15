import type { CreativeRevisionNotes } from '@/lib/vyronStore/types'
import { buildRevisionHandoffSnippet } from '@/lib/marketingDirector/handoffPrompt'

export function buildCreativeRevisionPrompt(input: {
  clientName: string
  platform: string
  variationName: string
  notes: CreativeRevisionNotes
}): string {
  const lines = [
    `Revise the ${input.platform} advert creative "${input.variationName}" for ${input.clientName}.`,
    '',
    input.notes.whatMustChange ? `**What must change:** ${input.notes.whatMustChange}` : '',
    input.notes.toneChanges ? `**Tone:** ${input.notes.toneChanges}` : '',
    input.notes.colourChanges ? `**Colours:** ${input.notes.colourChanges}` : '',
    input.notes.ctaChanges ? `**CTA:** ${input.notes.ctaChanges}` : '',
    input.notes.platformNotes ? `**Platform notes:** ${input.notes.platformNotes}` : '',
    '',
    'Regenerate the full visual at premium enterprise SaaS quality (VYRON CORE poster standard).',
  ].filter(Boolean)

  return buildRevisionHandoffSnippet(lines.join('\n'))
}
