/** Pull structured sections from director markdown responses */

export function extractSection(text: string, heading: string): string {
  const re = new RegExp(`##\\s*${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i')
  const m = text.match(re)
  return m?.[1]?.trim() ?? ''
}

export function extractCampaignConcept(text: string): string {
  return (
    extractSection(text, 'Campaign Concept') ||
    extractSection(text, 'Product Explanation') ||
    extractSection(text, 'Solution') ||
    text.slice(0, 1200)
  )
}

export function extractImagePrompt(text: string): string {
  const block =
    extractSection(text, 'Image Prompt') ||
    extractSection(text, 'image prompt') ||
    extractSection(text, 'Poster') ||
    extractSection(text, 'Visual Layout Direction')
  if (block) return block
  const fence = text.match(/```[\s\S]*?```/)
  return fence ? fence[0].replace(/```/g, '').trim() : ''
}

export function extractPlatformCopy(text: string, platform: 'Facebook' | 'Instagram' | 'LinkedIn'): string {
  const map = { Facebook: 'Facebook Copy', Instagram: 'Instagram Copy', LinkedIn: 'LinkedIn Copy' }
  return extractSection(text, map[platform])
}

export function extractGoogleAdsCopy(text: string): string {
  return (
    extractSection(text, 'Headlines & Descriptions \\(Google Ads\\)') ||
    extractSection(text, 'Headlines & Descriptions')
  )
}

export function extractRevisionSuggestions(text: string): string {
  return extractSection(text, 'Revision Suggestions') || extractSection(text, 'Revision Notes')
}

export function extractVisualDirection(text: string): string {
  return extractSection(text, 'Visual Layout Direction')
}

export function extractHeadline(text: string): string {
  const h = extractSection(text, 'Headline')
  if (h) return h.split('\n')[0].replace(/^[-*#\s]+/, '').trim()
  const line = text.match(/^#\s+(.+)/m)
  return line?.[1]?.trim() ?? 'Campaign Headline'
}

export function detectPlatform(message: string): 'Facebook' | 'Instagram' | 'LinkedIn' | 'WhatsApp' | 'Google Display' {
  const m = message.toLowerCase()
  if (m.includes('linkedin')) return 'LinkedIn'
  if (m.includes('instagram')) return 'Instagram'
  if (m.includes('whatsapp')) return 'WhatsApp'
  if (m.includes('google display') || m.includes('display')) return 'Google Display'
  return 'Facebook'
}

export function isRevisionRequest(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('not happy') ||
    m.includes('make it better') ||
    m.includes('more premium') ||
    m.includes('more like') ||
    m.includes('vyron core poster') ||
    m.includes('more corporate') ||
    m.includes('revision') ||
    m.includes('improve') ||
    m.includes('change colour') ||
    m.includes('change color') ||
    m.includes('south african') ||
    m.includes('add clocking') ||
    m.includes('ai hr') ||
    m.includes('regenerate')
  )
}
