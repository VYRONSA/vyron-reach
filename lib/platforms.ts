export type PlatformId =
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'WhatsApp'
  | 'Google Ads'
  | 'SEO'
  | 'Landing Pages'

export type PlatformConfig = {
  id: PlatformId
  label: string
  tagline: string
  gradient: string
  glow: string
  icon: string
  directorRoute: 'ai-marketing-director' | 'creatives' | 'campaigns'
  starterPrompt: (clientName: string) => string
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'Facebook',
    label: 'Facebook',
    tagline: 'Feed & story ads',
    gradient: 'from-[#1877F2] to-[#0d5bbd]',
    glow: 'rgba(24,119,242,0.35)',
    icon: 'f',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Create a premium Facebook advert for ${c}. Full enterprise creative with headline, features, dashboard mockup, image prompt and CTA.`,
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    tagline: 'Portrait & story',
    gradient: 'from-[#f77737] via-[#e1306c] to-[#833ab4]',
    glow: 'rgba(225,48,108,0.35)',
    icon: '◎',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Create a premium Instagram campaign for ${c}. Visual storytelling, portrait layout, image prompt and 3 variations.`,
  },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    tagline: 'Corporate B2B',
    gradient: 'from-[#0a66c2] to-[#004182]',
    glow: 'rgba(10,102,194,0.35)',
    icon: 'in',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Create a LinkedIn corporate campaign for ${c}. Professional sponsored post, headline, CTA and image direction.`,
  },
  {
    id: 'WhatsApp',
    label: 'WhatsApp',
    tagline: 'Status & promos',
    gradient: 'from-[#25D366] to-[#128C7E]',
    glow: 'rgba(37,211,102,0.35)',
    icon: '✆',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Create a WhatsApp marketing poster for ${c}. Bold offer, CTA, visual layout and image prompt.`,
  },
  {
    id: 'Google Ads',
    label: 'Google Ads',
    tagline: 'Search & display',
    gradient: 'from-[#4285F4] via-[#EA4335] to-[#FBBC05]',
    glow: 'rgba(66,133,244,0.3)',
    icon: 'G',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Generate a complete Google Ads campaign for ${c}. Headlines, descriptions, keywords, negatives, budget and landing page.`,
  },
  {
    id: 'SEO',
    label: 'SEO',
    tagline: 'Rank & grow',
    gradient: 'from-emerald-500 to-cyan-500',
    glow: 'rgba(16,185,129,0.35)',
    icon: '↗',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Build an SEO content plan for ${c}. Keywords, landing page outline, blog ideas and ranking strategy.`,
  },
  {
    id: 'Landing Pages',
    label: 'Landing Pages',
    tagline: 'Convert visitors',
    gradient: 'from-violet-600 to-fuchsia-500',
    glow: 'rgba(124,58,237,0.35)',
    icon: '⌂',
    directorRoute: 'ai-marketing-director',
    starterPrompt: c => `Create a high-converting landing page hero for ${c}. Headline, sections, CTA and visual direction.`,
  },
]

export function getPlatform(id: PlatformId): PlatformConfig {
  return PLATFORMS.find(p => p.id === id) ?? PLATFORMS[0]
}
