import type { ActionQueueStatus, ActionTaskKind, VyronActionQueueItem, VyronSettings } from '@/lib/vyronStore/types'

export type AddActionQueueInput = Omit<
  VyronActionQueueItem,
  'id' | 'createdAt' | 'status' | 'imageCreated' | 'completedAt'
>

export function inferTaskKind(sourcePage: string, kind?: ActionTaskKind, hasAdvert?: boolean): ActionTaskKind {
  if (hasAdvert || kind === 'advert_image') return 'advert_image'
  if (kind && kind !== 'general') return kind
  const src = sourcePage.toLowerCase()
  if (src.includes('seo war') || src.includes('seo')) return 'seo'
  if (src.includes('google ads') || src === 'google ads ai') return 'google_ads'
  if (src.includes('content engine') || src.includes('content')) return 'content'
  if (src.includes('rankings')) return 'seo'
  if (src.includes('competitors')) return 'seo'
  return 'general'
}

export function normalizeActionItem(
  raw: Partial<VyronActionQueueItem> & Pick<VyronActionQueueItem, 'id' | 'title'>,
  settings?: VyronSettings,
): VyronActionQueueItem {
  const sourcePage = raw.sourcePage ?? raw.department ?? 'VYRON REACH'
  const legacyStatus = raw.status as string
  let status: ActionQueueStatus = 'pending'
  if (legacyStatus === 'completed') status = 'completed'
  else if (legacyStatus === 'ready_to_execute') status = 'ready_to_execute'
  else if (legacyStatus === 'in_progress') status = 'in_progress'
  else if (legacyStatus === 'pending') status = 'pending'

  const kind = inferTaskKind(sourcePage, raw.kind, Boolean(raw.advertMeta))

  const defaultCtx =
    settings && kind !== 'advert_image'
      ? {
          keyword: raw.title,
          business: settings.businessName,
          targetArea: settings.defaultTargetArea,
          searchIntent: 'Buyer Intent',
          difficulty: '35',
          volume: '400+',
          suggestedDailyBudget: `R${settings.defaultAdDailyBudget}/day`,
        }
      : undefined

  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle ?? '',
    priority: raw.priority ?? 'High',
    department: raw.department ?? sourcePage,
    sourcePage,
    due: raw.due ?? 'This week',
    status,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    completedAt: raw.completedAt,
    executionBrief: raw.executionBrief ?? raw.subtitle ?? raw.title,
    nextSteps: raw.nextSteps?.length ? raw.nextSteps : [raw.subtitle ?? 'Execute this marketing action'],
    outputNeeded: raw.outputNeeded ?? `Deliverable for: ${raw.title}`,
    generatedOutput: raw.generatedOutput ?? '',
    notes: raw.notes ?? '',
    kind,
    contextMeta: raw.contextMeta ?? defaultCtx,
    advertMeta: raw.advertMeta,
    imageCreated: raw.imageCreated ?? false,
  }
}

export function statusLabel(status: ActionQueueStatus): string {
  if (status === 'pending') return 'Pending'
  if (status === 'in_progress') return 'In Progress'
  if (status === 'ready_to_execute') return 'Ready to Execute'
  return 'Completed'
}

export function isActiveStatus(status: ActionQueueStatus): boolean {
  return status === 'pending' || status === 'in_progress' || status === 'ready_to_execute'
}

export function formatActionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
