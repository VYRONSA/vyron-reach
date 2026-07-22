import { listDeliveriesForProvider } from './deliveryStore'

export type ProviderHealth = {
  provider: string
  enabled: boolean
  totalDeliveries: number
  delivered: number
  failed: number
  cancelled: number
  pending: number
  lastDeliveredAt: string | null
  lastFailedAt: string | null
}

/** Derived entirely from delivery history — no separate health store, per "reuse the existing persistence architecture, do not introduce another mechanism." Delivery records are already newest-first (see deliveryStore.ts's createDelivery), so the first match for each status is the most recent one. */
export function getProviderHealth(provider: string, enabled: boolean): ProviderHealth {
  const deliveries = listDeliveriesForProvider(provider)

  const delivered = deliveries.filter(d => d.status === 'Delivered')
  const failed = deliveries.filter(d => d.status === 'Failed')
  const cancelled = deliveries.filter(d => d.status === 'Cancelled')
  const pending = deliveries.filter(d => d.status === 'Queued' || d.status === 'Sending' || d.status === 'Retrying')

  return {
    provider,
    enabled,
    totalDeliveries: deliveries.length,
    delivered: delivered.length,
    failed: failed.length,
    cancelled: cancelled.length,
    pending: pending.length,
    lastDeliveredAt: delivered[0]?.deliveredAt ?? null,
    lastFailedAt: failed[0]?.updatedAt ?? null,
  }
}
