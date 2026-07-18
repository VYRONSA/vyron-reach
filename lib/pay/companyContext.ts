import { getSupabaseUserId, supabase } from '@/lib/supabase'
import type { PayUserRole } from './types'

export class PayCompanyResolutionError extends Error {}

/** Thrown when the signed-in user has no vyron_pay_company_users row yet. */
export class NoPayCompanyMembershipError extends PayCompanyResolutionError {}

export type PayCompanyMembership = {
  companyId: string
  role: PayUserRole
}

/**
 * Resolves the current signed-in user's PAY company membership via
 * vyron_pay_company_users. Returns null if there is none (no throw), so
 * callers that just want to check membership state don't need to catch
 * an exception for the expected "not onboarded yet" case.
 *
 * A user can end up with more than one vyron_pay_company_users row (e.g.
 * they create a workspace, then later join another via invite code), so
 * this reads the full set rather than `.maybeSingle()` (which errors on
 * >1 rows) and resolves to the earliest membership.
 */
export async function resolvePayCompanyMembership(): Promise<PayCompanyMembership | null> {
  const userId = await getSupabaseUserId()
  if (!userId) {
    throw new PayCompanyResolutionError('You must be signed in to do this.')
  }

  const { data, error } = await supabase
    .from('vyron_pay_company_users')
    .select('company_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    throw new PayCompanyResolutionError(`Could not resolve your PAY workspace: ${error.message}`)
  }

  const row = data?.[0]
  if (!row?.company_id) return null
  return { companyId: row.company_id, role: (row.role as PayUserRole) ?? 'Viewer' }
}

/**
 * Resolves just the company id. Throws instead of falling back to a
 * placeholder so callers surface a real, actionable error.
 *
 * Callers should route NoPayCompanyMembershipError to /pay/onboarding
 * rather than showing it as a generic error.
 */
export async function resolvePayCompanyId(): Promise<string> {
  const membership = await resolvePayCompanyMembership()
  if (!membership) {
    throw new NoPayCompanyMembershipError('Your account is not linked to a PAY workspace yet.')
  }
  return membership.companyId
}
