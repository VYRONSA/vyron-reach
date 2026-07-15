import type { AdvertPlatform, AdvertStyle } from '@/lib/vyronStore/types'

export type AdvertPromptInput = {
  productName: string
  targetAudience: string
  platform: AdvertPlatform
  offerMessage: string
  style: AdvertStyle
}

const STYLE_NOTES: Record<AdvertStyle, string> = {
  'Premium SaaS': 'clean SaaS aesthetic, soft gradients, white space, professional UI mockups',
  'Bold Social': 'high contrast, bold typography, energetic social feed composition',
  Corporate: 'trustworthy corporate layout, subtle blues, professional photography',
  Futuristic: 'futuristic command centre, cyan glow, AI dashboards, dark mode accents',
  Minimal: 'minimal layout, single focal product shot, restrained palette',
}

const PLATFORM_SIZE: Record<AdvertPlatform, string> = {
  Facebook: '1080×1080 feed, 1080×1920 story',
  Instagram: '1080×1080 feed, 1080×1350 portrait',
  WhatsApp: '1080×1080 status image',
  LinkedIn: '1200×627 sponsored, 1080×1080 organic',
  'Google Display': '1200×628 landscape, 300×250 medium rectangle',
}

export function generateAdvertImagePrompt(input: AdvertPromptInput): string {
  const styleNote = STYLE_NOTES[input.style]
  const headline = input.offerMessage.trim() || 'Transform how you manage your team'
  const size = PLATFORM_SIZE[input.platform]

  return [
    '# AI Advert Image Prompt',
    '',
    `**Platform:** ${input.platform}`,
    `**Recommended size:** ${size}`,
    '',
    '## Image Description',
    `Create a premium ${input.platform} advert for ${input.productName}, targeting ${input.targetAudience}.`,
    `Show a modern workforce command centre: staff clocking, live roster, AI HR alert panel, clean SaaS UI.`,
    `Visual style: ${styleNote}. Blue/cyan glow, white cards, South African business context.`,
    '',
    '## Headline Text (on creative)',
    `"${headline}"`,
    '',
    '## Call-to-Action',
    'Book a Demo · Start Free Trial',
    '',
    '## Negative Prompt / Instructions',
    'No watermark. No blurry text. No generic stock handshakes. No cluttered layout.',
    'No misspelled brand. High resolution, paid-social ready.',
    '',
    '## One-line prompt (for image tools)',
    `Premium ${input.platform} ad for ${input.productName}: workforce dashboard, ${styleNote}, headline "${headline}", cyan glow, no watermark.`,
  ].join('\n')
}
