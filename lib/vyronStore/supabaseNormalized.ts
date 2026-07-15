import { normalizeActionItem } from '@/lib/actionQueue'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { createDefaultStore } from '@/lib/vyronStore/defaults'
import type {
  VyronActionQueueItem,
  VyronCampaign,
  VyronClient,
  VyronCompetitor,
  VyronContentTask,
  VyronKeyword,
  VyronRanking,
  VyronReport,
  VyronSettings,
  VyronStore,
} from '@/lib/vyronStore/types'

const TABLES = {
  settings: 'vyron_reach_owner_settings',
  clients: 'vyron_reach_owner_clients',
  keywords: 'vyron_reach_owner_keywords',
  rankings: 'vyron_reach_owner_rankings',
  competitors: 'vyron_reach_owner_competitors',
  contentTasks: 'vyron_reach_owner_content_tasks',
  campaigns: 'vyron_reach_owner_campaigns',
  actionQueue: 'vyron_reach_owner_action_queue',
  reports: 'vyron_reach_owner_reports',
} as const

export type NormalizedSyncResult = {
  store: VyronStore | null
  updatedAt: string | null
  error: string | null
  hasData: boolean
}

function maxIso(...values: (string | null | undefined)[]): string | null {
  const valid = values.filter(Boolean) as string[]
  if (!valid.length) return null
  return valid.reduce((a, b) => (new Date(a) >= new Date(b) ? a : b))
}

function mergeStore(partial: Partial<VyronStore>): VyronStore {
  const base = createDefaultStore()
  return {
    settings: partial.settings ?? base.settings,
    clients: partial.clients ?? base.clients,
    keywords: partial.keywords ?? base.keywords,
    rankings: partial.rankings ?? base.rankings,
    competitors: partial.competitors ?? base.competitors,
    contentTasks: partial.contentTasks ?? base.contentTasks,
    campaigns: partial.campaigns ?? base.campaigns,
    actionQueue: partial.actionQueue ?? base.actionQueue,
    reports: partial.reports ?? base.reports,
    advertConcepts: partial.advertConcepts ?? base.advertConcepts,
    googleAdsPlans: partial.googleAdsPlans ?? base.googleAdsPlans,
    marketingMaterials: partial.marketingMaterials ?? base.marketingMaterials,
    creatives: partial.creatives ?? base.creatives,
    uploadedCreatives: partial.uploadedCreatives ?? base.uploadedCreatives,
  }
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function settingsFromRow(row: Record<string, unknown>): VyronSettings {
  return {
    businessName: String(row.business_name ?? 'VYRON'),
    defaultProject: String(row.default_project ?? 'VYRON CORE'),
    defaultMarket: String(row.default_market ?? 'South Africa'),
    defaultAdDailyBudget: Number(row.default_ad_daily_budget ?? 50),
    defaultSeoTimelineMonths: Number(row.default_seo_timeline_months ?? 6),
    contactEmail: String(row.contact_email ?? ''),
    businessType: String(row.business_type ?? 'Workforce management / HR software'),
    defaultTargetArea: String(row.default_target_area ?? 'South Africa'),
    aiMarketingRules: String(row.ai_marketing_rules ?? ''),
  }
}

function settingsToRow(userId: string, s: VyronSettings, updatedAt: string) {
  return {
    user_id: userId,
    business_name: s.businessName,
    default_project: s.defaultProject,
    default_market: s.defaultMarket,
    default_ad_daily_budget: s.defaultAdDailyBudget,
    default_seo_timeline_months: s.defaultSeoTimelineMonths,
    contact_email: s.contactEmail,
    business_type: s.businessType,
    default_target_area: s.defaultTargetArea,
    ai_marketing_rules: s.aiMarketingRules,
    updated_at: updatedAt,
  }
}

function clientFromRow(row: Record<string, unknown>): VyronClient {
  return {
    id: String(row.id),
    businessName: String(row.business_name),
    industry: String(row.industry),
    website: String(row.website ?? ''),
    monthlyMarketingBudget: Number(row.monthly_marketing_budget ?? 0),
    targetArea: String(row.target_area),
    targetKeywords: Array.isArray(row.target_keywords) ? (row.target_keywords as string[]) : [],
    notes: String(row.notes ?? ''),
    plan: String(row.plan ?? ''),
    adSpendNote: String(row.ad_spend_note ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function clientToRow(userId: string, c: VyronClient, updatedAt: string) {
  return {
    id: c.id,
    user_id: userId,
    business_name: c.businessName,
    industry: c.industry,
    website: c.website,
    monthly_marketing_budget: c.monthlyMarketingBudget,
    target_area: c.targetArea,
    target_keywords: c.targetKeywords,
    notes: c.notes,
    plan: c.plan,
    ad_spend_note: c.adSpendNote,
    created_at: c.createdAt,
    updated_at: updatedAt,
  }
}

function keywordFromRow(row: Record<string, unknown>): VyronKeyword {
  return {
    id: String(row.id),
    keyword: String(row.keyword),
    volume: Number(row.volume ?? 0),
    difficulty: Number(row.difficulty ?? 0),
    intent: row.intent as VyronKeyword['intent'],
    forecast: String(row.forecast ?? ''),
    gap: row.gap ? String(row.gap) : undefined,
    recommendedPage: row.recommended_page ? String(row.recommended_page) : undefined,
  }
}

function keywordToRow(userId: string, k: VyronKeyword, updatedAt: string) {
  return {
    id: k.id,
    user_id: userId,
    keyword: k.keyword,
    volume: k.volume,
    difficulty: k.difficulty,
    intent: k.intent,
    forecast: k.forecast,
    gap: k.gap ?? null,
    recommended_page: k.recommendedPage ?? null,
    updated_at: updatedAt,
  }
}

function rankingFromRow(row: Record<string, unknown>): VyronRanking {
  return {
    id: String(row.id),
    keyword: String(row.keyword),
    page: String(row.page),
    position: Number(row.position ?? 0),
    change: Number(row.change ?? 0),
    forecast: String(row.forecast ?? ''),
    stuck: Boolean(row.stuck),
    previousPosition: row.previous_position != null ? Number(row.previous_position) : undefined,
  }
}

function rankingToRow(userId: string, r: VyronRanking, updatedAt: string) {
  return {
    id: r.id,
    user_id: userId,
    keyword: r.keyword,
    page: r.page,
    position: r.position,
    change: r.change,
    forecast: r.forecast,
    stuck: r.stuck,
    previous_position: r.previousPosition ?? null,
    updated_at: updatedAt,
  }
}

function competitorFromRow(row: Record<string, unknown>): VyronCompetitor {
  return {
    id: String(row.id),
    name: String(row.name),
    domain: String(row.domain),
    weakPages: Array.isArray(row.weak_pages) ? (row.weak_pages as string[]) : [],
    keywordGaps: Array.isArray(row.keyword_gaps) ? (row.keyword_gaps as string[]) : [],
    threat: row.threat as VyronCompetitor['threat'],
  }
}

function competitorToRow(userId: string, c: VyronCompetitor, updatedAt: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    domain: c.domain,
    weak_pages: c.weakPages,
    keyword_gaps: c.keywordGaps,
    threat: c.threat,
    updated_at: updatedAt,
  }
}

function contentFromRow(row: Record<string, unknown>): VyronContentTask {
  return {
    id: String(row.id),
    title: String(row.title),
    type: row.type as VyronContentTask['type'],
    status: row.status as VyronContentTask['status'],
    targetKeyword: String(row.target_keyword ?? ''),
    dueDate: row.due_date ? String(row.due_date) : undefined,
  }
}

function contentToRow(userId: string, t: VyronContentTask, updatedAt: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    type: t.type,
    status: t.status,
    target_keyword: t.targetKeyword,
    due_date: t.dueDate ?? null,
    updated_at: updatedAt,
  }
}

function campaignFromRow(row: Record<string, unknown>): VyronCampaign {
  return {
    id: String(row.id),
    platform: String(row.platform),
    dailyBudget: Number(row.daily_budget ?? 0),
    monthlyBudget: Number(row.monthly_budget ?? 0),
    status: row.status as VyronCampaign['status'],
    wastedSpend: Number(row.wasted_spend ?? 0),
    intentScore: Number(row.intent_score ?? 0),
    notes: String(row.notes ?? ''),
  }
}

function campaignToRow(userId: string, c: VyronCampaign, updatedAt: string) {
  return {
    id: c.id,
    user_id: userId,
    platform: c.platform,
    daily_budget: c.dailyBudget,
    monthly_budget: c.monthlyBudget,
    status: c.status,
    wasted_spend: c.wastedSpend,
    intent_score: c.intentScore,
    notes: c.notes,
    updated_at: updatedAt,
  }
}

function actionFromRow(row: Record<string, unknown>): VyronActionQueueItem {
  const details = (row.details ?? {}) as Record<string, unknown>
  return normalizeActionItem({
    id: String(row.id),
    title: String(row.title),
    subtitle: String(row.subtitle ?? ''),
    priority: row.priority as VyronActionQueueItem['priority'],
    department: String(row.department ?? ''),
    sourcePage: String(details.sourcePage ?? row.department ?? ''),
    due: String(row.due ?? ''),
    status: row.status as VyronActionQueueItem['status'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    executionBrief: String(details.executionBrief ?? row.subtitle ?? ''),
    nextSteps: Array.isArray(details.nextSteps) ? (details.nextSteps as string[]) : [],
    outputNeeded: String(details.outputNeeded ?? ''),
    generatedOutput: String(details.generatedOutput ?? ''),
    notes: String(details.notes ?? ''),
    completedAt: details.completedAt ? String(details.completedAt) : undefined,
    kind: details.kind as VyronActionQueueItem['kind'],
    contextMeta: details.contextMeta as VyronActionQueueItem['contextMeta'],
    advertMeta: details.advertMeta as VyronActionQueueItem['advertMeta'],
    imageCreated: Boolean(details.imageCreated),
  })
}

function actionToRow(userId: string, a: VyronActionQueueItem, updatedAt: string) {
  return {
    id: a.id,
    user_id: userId,
    title: a.title,
    subtitle: a.subtitle,
    priority: a.priority,
    department: a.department || a.sourcePage,
    due: a.due,
    status: a.status,
    created_at: a.createdAt,
    updated_at: updatedAt,
    details: {
      sourcePage: a.sourcePage,
      executionBrief: a.executionBrief,
      nextSteps: a.nextSteps,
      outputNeeded: a.outputNeeded,
      generatedOutput: a.generatedOutput,
      notes: a.notes,
      completedAt: a.completedAt,
      kind: a.kind,
      contextMeta: a.contextMeta,
      advertMeta: a.advertMeta,
      imageCreated: a.imageCreated,
    },
  }
}

function reportFromRow(row: Record<string, unknown>): VyronReport {
  return {
    id: String(row.id),
    title: String(row.title),
    type: String(row.type ?? ''),
    period: String(row.period ?? ''),
    status: row.status as VyronReport['status'],
    body: String(row.body ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function reportToRow(userId: string, r: VyronReport, updatedAt: string) {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    type: r.type,
    period: r.period,
    status: r.status,
    body: r.body,
    created_at: r.createdAt,
    updated_at: updatedAt,
  }
}

// ─── Prune orphaned rows after upsert ────────────────────────────────────────

async function pruneRows(table: string, userId: string, keepIds: string[]): Promise<string | null> {
  const { data, error } = await supabase.from(table).select('id').eq('user_id', userId)
  if (error) return error.message
  const keep = new Set(keepIds)
  const stale = (data ?? []).map(r => String(r.id)).filter(id => !keep.has(id))
  if (!stale.length) return null
  const { error: delError } = await supabase.from(table).delete().in('id', stale)
  return delError?.message ?? null
}

async function syncTable<T>(
  table: string,
  userId: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>,
  getId: (item: T) => string,
): Promise<string | null> {
  if (items.length === 0) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    return error?.message ?? null
  }
  const rows = items.map(toRow)
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) return error.message
  return pruneRows(table, userId, items.map(getId))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchNormalizedOwnerStore(userId: string): Promise<NormalizedSyncResult> {
  if (!isSupabaseConfigured) {
    return { store: null, updatedAt: null, error: 'Supabase not configured', hasData: false }
  }

  const [
    settingsRes,
    clientsRes,
    keywordsRes,
    rankingsRes,
    competitorsRes,
    contentRes,
    campaignsRes,
    queueRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from(TABLES.settings).select('*').eq('user_id', userId).maybeSingle(),
    supabase.from(TABLES.clients).select('*').eq('user_id', userId),
    supabase.from(TABLES.keywords).select('*').eq('user_id', userId),
    supabase.from(TABLES.rankings).select('*').eq('user_id', userId),
    supabase.from(TABLES.competitors).select('*').eq('user_id', userId),
    supabase.from(TABLES.contentTasks).select('*').eq('user_id', userId),
    supabase.from(TABLES.campaigns).select('*').eq('user_id', userId),
    supabase.from(TABLES.actionQueue).select('*').eq('user_id', userId),
    supabase.from(TABLES.reports).select('*').eq('user_id', userId),
  ])

  const firstError =
    settingsRes.error?.message ??
    clientsRes.error?.message ??
    keywordsRes.error?.message ??
    rankingsRes.error?.message ??
    competitorsRes.error?.message ??
    contentRes.error?.message ??
    campaignsRes.error?.message ??
    queueRes.error?.message ??
    reportsRes.error?.message ??
    null

  if (firstError) {
    return { store: null, updatedAt: null, error: firstError, hasData: false }
  }

  const hasSettings = Boolean(settingsRes.data)
  const hasAnyRows =
    hasSettings ||
    (clientsRes.data?.length ?? 0) > 0 ||
    (keywordsRes.data?.length ?? 0) > 0 ||
    (rankingsRes.data?.length ?? 0) > 0 ||
    (competitorsRes.data?.length ?? 0) > 0 ||
    (contentRes.data?.length ?? 0) > 0 ||
    (campaignsRes.data?.length ?? 0) > 0 ||
    (queueRes.data?.length ?? 0) > 0 ||
    (reportsRes.data?.length ?? 0) > 0

  if (!hasAnyRows) {
    return { store: null, updatedAt: null, error: null, hasData: false }
  }

  const updatedAt = maxIso(
    settingsRes.data?.updated_at as string,
    ...(clientsRes.data ?? []).map(r => r.updated_at as string),
    ...(keywordsRes.data ?? []).map(r => r.updated_at as string),
    ...(rankingsRes.data ?? []).map(r => r.updated_at as string),
    ...(competitorsRes.data ?? []).map(r => r.updated_at as string),
    ...(contentRes.data ?? []).map(r => r.updated_at as string),
    ...(campaignsRes.data ?? []).map(r => r.updated_at as string),
    ...(queueRes.data ?? []).map(r => r.updated_at as string),
    ...(reportsRes.data ?? []).map(r => r.updated_at as string),
  )

  const store = mergeStore({
    settings: settingsRes.data ? settingsFromRow(settingsRes.data) : undefined,
    clients: (clientsRes.data ?? []).map(clientFromRow),
    keywords: (keywordsRes.data ?? []).map(keywordFromRow),
    rankings: (rankingsRes.data ?? []).map(rankingFromRow),
    competitors: (competitorsRes.data ?? []).map(competitorFromRow),
    contentTasks: (contentRes.data ?? []).map(contentFromRow),
    campaigns: (campaignsRes.data ?? []).map(campaignFromRow),
    actionQueue: (queueRes.data ?? []).map(actionFromRow),
    reports: (reportsRes.data ?? []).map(reportFromRow),
  })

  return { store, updatedAt, error: null, hasData: true }
}

export async function pushNormalizedOwnerStore(
  userId: string,
  store: VyronStore,
): Promise<{ error: string | null; updatedAt: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase not configured', updatedAt: null }
  }

  const updatedAt = new Date().toISOString()

  const { error: settingsError } = await supabase
    .from(TABLES.settings)
    .upsert(settingsToRow(userId, store.settings, updatedAt), { onConflict: 'user_id' })

  if (settingsError) return { error: settingsError.message, updatedAt: null }

  const tableSyncs: Array<Promise<string | null>> = [
    syncTable(
      TABLES.clients,
      userId,
      store.clients,
      c => clientToRow(userId, c, updatedAt),
      c => c.id,
    ),
    syncTable(
      TABLES.keywords,
      userId,
      store.keywords,
      k => keywordToRow(userId, k, updatedAt),
      k => k.id,
    ),
    syncTable(
      TABLES.rankings,
      userId,
      store.rankings,
      r => rankingToRow(userId, r, updatedAt),
      r => r.id,
    ),
    syncTable(
      TABLES.competitors,
      userId,
      store.competitors,
      c => competitorToRow(userId, c, updatedAt),
      c => c.id,
    ),
    syncTable(
      TABLES.contentTasks,
      userId,
      store.contentTasks,
      t => contentToRow(userId, t, updatedAt),
      t => t.id,
    ),
    syncTable(
      TABLES.campaigns,
      userId,
      store.campaigns,
      c => campaignToRow(userId, c, updatedAt),
      c => c.id,
    ),
    syncTable(
      TABLES.actionQueue,
      userId,
      store.actionQueue,
      a => actionToRow(userId, a, updatedAt),
      a => a.id,
    ),
    syncTable(
      TABLES.reports,
      userId,
      store.reports,
      r => reportToRow(userId, r, updatedAt),
      r => r.id,
    ),
  ]

  const results = await Promise.all(tableSyncs)
  const err = results.find(Boolean)
  if (err) return { error: err, updatedAt: null }

  return { error: null, updatedAt }
}
