import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { VyronStore } from '@/lib/vyronStore/types'
import { createDefaultStore } from '@/lib/vyronStore/defaults'
import {
  fetchNormalizedOwnerStore,
  pushNormalizedOwnerStore,
} from '@/lib/vyronStore/supabaseNormalized'

const BLOB_TABLE = 'vyron_reach_owner_store'

export type OwnerStoreSyncResult = {
  store: VyronStore | null
  updatedAt: string | null
  error: string | null
  source: 'normalized' | 'blob' | null
}

function mergeWithDefaults(raw: unknown): VyronStore {
  const base = createDefaultStore()
  if (!raw || typeof raw !== 'object') return base
  return { ...base, ...(raw as VyronStore) }
}

async function fetchBlobStore(userId: string): Promise<OwnerStoreSyncResult> {
  const { data, error } = await supabase
    .from(BLOB_TABLE)
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return { store: null, updatedAt: null, error: error.message, source: null }
  }

  if (!data?.payload) {
    return { store: null, updatedAt: null, error: null, source: null }
  }

  return {
    store: mergeWithDefaults(data.payload),
    updatedAt: data.updated_at as string,
    error: null,
    source: 'blob',
  }
}

/** Load owner marketing store — normalized tables first, blob fallback for migration. */
export async function fetchOwnerStoreFromSupabase(userId: string): Promise<OwnerStoreSyncResult> {
  if (!isSupabaseConfigured) {
    return { store: null, updatedAt: null, error: 'Supabase not configured', source: null }
  }

  const normalized = await fetchNormalizedOwnerStore(userId)

  if (normalized.error && !normalized.error.includes('does not exist')) {
    return { store: null, updatedAt: null, error: normalized.error, source: null }
  }

  if (normalized.hasData && normalized.store) {
    return {
      store: normalized.store,
      updatedAt: normalized.updatedAt,
      error: null,
      source: 'normalized',
    }
  }

  return fetchBlobStore(userId)
}

/** Push to normalized tables; also update blob as backup during migration period. */
export async function pushOwnerStoreToSupabase(
  userId: string,
  store: VyronStore,
): Promise<{ error: string | null; updatedAt: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase not configured', updatedAt: null }
  }

  const normalized = await pushNormalizedOwnerStore(userId, store)

  if (normalized.error && !normalized.error.includes('does not exist')) {
    return normalized
  }

  if (!normalized.error) {
    return normalized
  }

  // Fallback: blob table only (tables not migrated yet)
  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from(BLOB_TABLE).upsert(
    { user_id: userId, payload: store, updated_at: updatedAt },
    { onConflict: 'user_id' },
  )

  if (error) return { error: error.message, updatedAt: null }
  return { error: null, updatedAt }
}

/** Migrate blob → normalized (called after first load from blob). */
export async function migrateBlobToNormalized(userId: string, store: VyronStore): Promise<void> {
  await pushNormalizedOwnerStore(userId, store)
}

/** Re-exported from lib/supabase for existing call sites — the canonical definition now lives there since it's product-agnostic. */
export { getSupabaseUserId } from '@/lib/supabase'
