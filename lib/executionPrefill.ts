import type { CreativeBuilderInput } from '@/lib/vyronStore/types'
import type { VyronActionQueueItem, VyronSettings } from '@/lib/vyronStore/types'

export type GoogleAdsBuilderPrefill = {
  campaignName: string
  dailyBudget: number
  targetArea: string
  productService: string
  keywordTheme: string
  audience: string
  offer: string
  landingPageUrl: string
  searchIntent?: string
  business?: string
}

export type MarketingStudioPrefill = {
  productName: string
  targetAudience: string
  platform: string
  offerMessage: string
  tone: string
  campaignGoal: string
  targetArea: string
}

export type SeoWarRoomPrefill = {
  keyword: string
  business: string
  industry: string
  targetArea: string
  intent: string
}

export type CreativeStudioPrefill = CreativeBuilderInput

export type AttachedCreativePrefill = {
  creativeId: string
  headline: string
  cta: string
  offer: string
  audience: string
  platform: string
  productName: string
  clientName: string
}

export type ExecutionPrefill = {
  source: 'ai-action-queue' | 'creative-studio' | 'dashboard-platform'
  actionId?: string
  message: string
  googleAds?: GoogleAdsBuilderPrefill
  marketingStudio?: MarketingStudioPrefill
  seo?: SeoWarRoomPrefill
  creativeStudio?: CreativeStudioPrefill
  attachedCreative?: AttachedCreativePrefill
  showGoogleAdsLaunch?: boolean
  directorPlatform?: string
  directorPrompt?: string
}

export const EXECUTION_PREFILL_KEY = 'vyron-reach-execution-prefill'

export function saveExecutionPrefill(prefill: ExecutionPrefill) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(EXECUTION_PREFILL_KEY, JSON.stringify(prefill))
}

export function loadExecutionPrefill(): ExecutionPrefill | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(EXECUTION_PREFILL_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ExecutionPrefill
  } catch {
    return null
  }
}

export function clearExecutionPrefill() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(EXECUTION_PREFILL_KEY)
}

export function prefillFromAction(
  action: VyronActionQueueItem,
  settings: VyronSettings,
): ExecutionPrefill {
  const ctx = action.contextMeta
  const keyword = ctx?.keyword ?? action.title
  const area = ctx?.targetArea ?? settings.defaultTargetArea
  const business = ctx?.business ?? settings.businessName
  const daily = settings.defaultAdDailyBudget
  const slug = keyword.toLowerCase().replace(/\s+/g, '-').slice(0, 40)

  const base: ExecutionPrefill = {
    source: 'ai-action-queue',
    actionId: action.id,
    message: `Loaded from AI Action Queue: ${action.title}`,
  }

  if (action.kind === 'google_ads' || action.sourcePage.toLowerCase().includes('google ads')) {
    return {
      ...base,
      googleAds: {
        campaignName: `${settings.defaultProject} — ${keyword}`,
        dailyBudget: daily,
        targetArea: area,
        productService: settings.businessType,
        keywordTheme: keyword,
        audience: 'South African business owners and HR managers',
        offer: action.subtitle || 'Stop losing payroll hours — book a demo',
        landingPageUrl: `https://vyron.co.za/${slug}`,
        searchIntent: ctx?.searchIntent ?? 'Buyer Intent',
        business,
      },
    }
  }

  if (action.kind === 'advert_image' && action.advertMeta) {
    const studio: CreativeStudioPrefill = {
      clientName: settings.businessName,
      productName: action.advertMeta.productName,
      campaignGoal: 'Lead generation',
      platform: (action.advertMeta.platform as CreativeStudioPrefill['platform']) || 'Facebook',
      audience: action.advertMeta.audience,
      offer: action.advertMeta.offerMessage ?? action.subtitle,
      headline: action.advertMeta.offerMessage?.slice(0, 60) ?? action.title,
      cta: 'Book a Demo',
      visualStyle: (action.advertMeta.style as CreativeStudioPrefill['visualStyle']) || 'Premium SaaS',
      colourDirection: 'blue cyan purple',
      notes: action.advertMeta.prompt,
      actionId: action.id,
    }
    return {
      ...base,
      creativeStudio: studio,
      marketingStudio: {
        productName: action.advertMeta.productName,
        targetAudience: action.advertMeta.audience,
        platform: action.advertMeta.platform,
        offerMessage: action.advertMeta.offerMessage ?? action.subtitle,
        tone: action.advertMeta.style,
        campaignGoal: 'Lead generation',
        targetArea: area,
      },
    }
  }

  if (action.kind === 'seo' || action.sourcePage.toLowerCase().includes('seo') || action.sourcePage.toLowerCase().includes('ranking')) {
    return {
      ...base,
      seo: {
        keyword,
        business,
        industry: settings.businessType,
        targetArea: area,
        intent: ctx?.searchIntent ?? 'Buyer Intent',
      },
    }
  }

  if (action.kind === 'content' || action.sourcePage.toLowerCase().includes('content')) {
    return {
      ...base,
      creativeStudio: {
        clientName: settings.businessName,
        productName: settings.defaultProject,
        campaignGoal: 'Content + conversions',
        platform: 'Facebook',
        audience: 'South African business owners',
        offer: action.subtitle || settings.defaultProject,
        headline: action.title.slice(0, 80),
        cta: 'Learn More',
        visualStyle: 'Premium SaaS',
        colourDirection: 'violet cyan',
        notes: action.executionBrief,
        actionId: action.id,
      },
      marketingStudio: {
        productName: settings.defaultProject,
        targetAudience: 'South African business owners',
        platform: 'Facebook',
        offerMessage: action.subtitle || settings.defaultProject,
        tone: 'Premium SaaS',
        campaignGoal: 'SEO content + conversions',
        targetArea: area,
      },
    }
  }

  if (action.sourcePage.toLowerCase().includes('client')) {
    return base
  }

  return {
    ...base,
    creativeStudio: {
      clientName: settings.businessName,
      productName: settings.defaultProject,
      campaignGoal: 'Growth',
      platform: 'Facebook',
      audience: 'South African business owners',
      offer: action.executionBrief.slice(0, 120),
      headline: action.title.slice(0, 80),
      cta: 'Book a Demo',
      visualStyle: 'Premium SaaS',
      colourDirection: 'violet cyan',
      notes: '',
      actionId: action.id,
    },
    marketingStudio: {
      productName: settings.defaultProject,
      targetAudience: 'South African business owners',
      platform: 'Facebook',
      offerMessage: action.executionBrief.slice(0, 120),
      tone: 'Premium SaaS',
      campaignGoal: 'Growth',
      targetArea: area,
    },
  }
}

export function prefillFromCreative(
  creative: import('@/lib/vyronStore/types').VyronCreative,
  settings: VyronSettings,
): ExecutionPrefill {
  const keyword = creative.headline
  return {
    source: 'creative-studio',
    message: `Loaded approved creative: ${creative.headline}`,
    showGoogleAdsLaunch: true,
    attachedCreative: {
      creativeId: creative.id,
      headline: creative.headline,
      cta: creative.cta,
      offer: creative.offer,
      audience: creative.audience,
      platform: creative.platform,
      productName: creative.productName,
      clientName: creative.clientName,
    },
    googleAds: {
      campaignName: `${creative.productName} — ${creative.platform}`,
      dailyBudget: settings.defaultAdDailyBudget,
      targetArea: settings.defaultTargetArea,
      productService: settings.businessType,
      keywordTheme: keyword,
      audience: creative.audience,
      offer: creative.offer,
      landingPageUrl: `https://vyron.co.za/campaign`,
      business: creative.clientName,
    },
    creativeStudio: {
      clientName: creative.clientName,
      productName: creative.productName,
      campaignGoal: creative.campaignGoal,
      platform: creative.platform,
      audience: creative.audience,
      offer: creative.offer,
      headline: creative.headline,
      cta: creative.cta,
      visualStyle: creative.visualStyle,
      colourDirection: creative.colourDirection,
      notes: creative.notes,
    },
  }
}
