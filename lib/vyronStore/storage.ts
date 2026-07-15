import { normalizeActionItem } from '@/lib/actionQueue'
import { createDefaultStore } from '@/lib/vyronStore/defaults'
import {
  createDemoEnvironment,
  DEMO_ENVIRONMENT_VERSION,
  shouldSeedDemoEnvironment,
} from '@/lib/vyronStore/demoEnvironment'
import type { VyronStore } from '@/lib/vyronStore/types'

/** Current localStorage key for owner marketing data (all modules in one JSON blob). */
export const VYRON_STORAGE_KEY = 'vyron-reach-owner-data-v2'

/** Logical store names — all persist inside VYRON_STORAGE_KEY */
export const VYRON_STORE_KEYS = {
  actionQueue: 'vyronReachActionQueue',
  clients: 'vyronReachClients',
  keywords: 'vyronReachKeywords',
  campaigns: 'vyronReachCampaigns',
  marketingMaterials: 'vyronReachMarketingMaterials',
  reports: 'vyronReachReports',
  settings: 'vyronReachSettings',
  googleAdsPlans: 'vyronReachGoogleAdsPlans',
  creatives: 'vyronReachCreatives',
} as const

const VYRON_META_KEY = 'vyron-reach-owner-meta-v2'

/** Legacy keys from demo builds — cleared on reset. */
const LEGACY_KEYS = [
  'vyron-reach-owner-data',
  'vyron-reach-owner-meta',
  'vyron-reach-app-data-v1',
]

export function getLocalStoreUpdatedAt(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(VYRON_META_KEY)
    if (!raw) return 0
    const meta = JSON.parse(raw) as { updatedAt?: string }
    return meta.updatedAt ? new Date(meta.updatedAt).getTime() : 0
  } catch {
    return 0
  }
}

export function setLocalStoreUpdatedAt(iso: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(VYRON_META_KEY, JSON.stringify({ updatedAt: iso }))
}

function mergeStore(parsed: Partial<VyronStore>): VyronStore {
  const defaults = createDefaultStore()
  return {
    ...defaults,
    ...parsed,
    settings: {
      ...defaults.settings,
      ...parsed.settings,
      businessType: parsed.settings?.businessType ?? defaults.settings.businessType,
      defaultTargetArea: parsed.settings?.defaultTargetArea ?? defaults.settings.defaultTargetArea,
      aiMarketingRules: parsed.settings?.aiMarketingRules ?? defaults.settings.aiMarketingRules,
    },
    clients: (parsed.clients ?? []).map(c => ({
      ...c,
      website: c.website ?? '',
      plan: c.plan ?? '',
      adSpendNote: c.adSpendNote ?? '',
    })),
    keywords: (parsed.keywords ?? []).map(k => ({
      ...k,
      intent: k.intent === 'Transactional' ? 'Commercial' : k.intent,
      business: k.business ?? '',
      industry: k.industry ?? '',
      targetArea: k.targetArea ?? '',
    })),
    advertConcepts: parsed.advertConcepts ?? [],
    rankings: parsed.rankings ?? [],
    competitors: parsed.competitors ?? [],
    contentTasks: parsed.contentTasks ?? [],
    campaigns: parsed.campaigns ?? [],
    actionQueue: (parsed.actionQueue ?? []).map(a =>
      normalizeActionItem(a, {
        ...defaults.settings,
        ...parsed.settings,
        businessType: parsed.settings?.businessType ?? defaults.settings.businessType,
        defaultTargetArea: parsed.settings?.defaultTargetArea ?? defaults.settings.defaultTargetArea,
        aiMarketingRules: parsed.settings?.aiMarketingRules ?? defaults.settings.aiMarketingRules,
      }),
    ),
    reports: parsed.reports ?? [],
    googleAdsPlans: parsed.googleAdsPlans ?? [],
    marketingMaterials: parsed.marketingMaterials ?? [],
    creatives: (parsed.creatives ?? []).map(c => ({
      ...c,
      approvalHistory: c.approvalHistory ?? [],
      feedbackNotes: c.feedbackNotes ?? '',
      version: c.version ?? 1,
      campaignSpec: c.campaignSpec,
    })),
    uploadedCreatives: (parsed.uploadedCreatives ?? []).map(u => ({
      ...u,
      revisionNotes: u.revisionNotes ?? {},
      revisionPrompt: u.revisionPrompt ?? '',
      caption: u.caption ?? '',
      cta: u.cta ?? '',
      chatgptNotes: u.chatgptNotes ?? '',
      isFinalCampaignCreative: Boolean(u.isFinalCampaignCreative),
    })),
  }
}

export function loadStore(): VyronStore {
  if (typeof window === 'undefined') return createDefaultStore()
  try {
    const raw = localStorage.getItem(VYRON_STORAGE_KEY)
    if (!raw) {
      const demo = createDemoEnvironment()
      saveStore(demo)
      setDemoEnvironmentMeta()
      return demo
    }
    const merged = mergeStore(JSON.parse(raw) as Partial<VyronStore>)
    if (shouldSeedDemoEnvironment(merged)) {
      const demo = createDemoEnvironment()
      saveStore(demo)
      setDemoEnvironmentMeta()
      return demo
    }
    return merged
  } catch {
    return createDefaultStore()
  }
}

function setDemoEnvironmentMeta() {
  if (typeof window === 'undefined') return
  const existing = localStorage.getItem(VYRON_META_KEY)
  let meta: Record<string, unknown> = {}
  try {
    if (existing) meta = JSON.parse(existing) as Record<string, unknown>
  } catch {
    meta = {}
  }
  localStorage.setItem(
    VYRON_META_KEY,
    JSON.stringify({
      ...meta,
      updatedAt: new Date().toISOString(),
      demoEnvironmentVersion: DEMO_ENVIRONMENT_VERSION,
    }),
  )
}

/** Load or replace store with the full 3-company demo environment. */
export function applyDemoEnvironment(): VyronStore {
  const demo = createDemoEnvironment()
  saveStore(demo)
  setDemoEnvironmentMeta()
  return demo
}

export function saveStore(store: VyronStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(VYRON_STORAGE_KEY, JSON.stringify(store))
  setLocalStoreUpdatedAt(new Date().toISOString())
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Wipe all local demo/cache state and persist a clean empty store. */
export function clearVyronReachData(): VyronStore {
  if (typeof window === 'undefined') return createDefaultStore()

  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key)
  }
  localStorage.removeItem(VYRON_STORAGE_KEY)
  localStorage.removeItem(VYRON_META_KEY)
  sessionStorage.clear()

  const fresh = createDefaultStore()
  saveStore(fresh)
  return fresh
}
