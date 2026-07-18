import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

/**
 * Current Supabase session user id, if any. Product-agnostic — shared
 * across every VYRON product that authenticates via this Supabase
 * project (Reach, PAY), not owned by any one product's data layer.
 */
export async function getSupabaseUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}