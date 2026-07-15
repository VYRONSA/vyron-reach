import type { VyronStore } from '@/lib/vyronStore/types'

/** Fresh empty store — settings only, no demo records. */
export function createDefaultStore(): VyronStore {
  return {
    settings: {
      businessName: 'VYRON',
      defaultProject: 'VYRON CORE',
      defaultMarket: 'South Africa',
      defaultAdDailyBudget: 50,
      defaultSeoTimelineMonths: 6,
      contactEmail: '',
      businessType: 'Workforce management / HR software',
      defaultTargetArea: 'South Africa',
      aiMarketingRules:
        'SEO 6-month horizon. Google Ads start R50/day buyer-intent only. Scale ads after rankings validate. No vanity metrics — leads and revenue only.',
    },
    clients: [],
    keywords: [],
    rankings: [],
    competitors: [],
    contentTasks: [],
    campaigns: [],
    actionQueue: [],
    reports: [],
    advertConcepts: [],
    googleAdsPlans: [],
    marketingMaterials: [],
    creatives: [],
    uploadedCreatives: [],
  }
}
