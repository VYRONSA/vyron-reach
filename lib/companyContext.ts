import { supabase } from '@/lib/supabase';
import { getSupabaseUserId } from '@/lib/vyronStore/supabaseSync';

export class CompanyResolutionError extends Error {}

/** Thrown when the signed-in user has no vyron_reach_company_users row yet. */
export class NoCompanyMembershipError extends CompanyResolutionError {}

export type CompanyMembership = {
  companyId: string;
  role: string | null;
};

/**
 * Resolves the current signed-in user's company membership via
 * vyron_reach_company_users. Returns null if there is none (no throw),
 * so callers that just want to check membership state don't need to
 * catch an exception for the expected "not onboarded yet" case.
 *
 * A user can end up with more than one vyron_reach_company_users row
 * (e.g. they create a workspace, then later join another via invite
 * code), so this reads the full set rather than `.maybeSingle()`
 * (which errors on >1 rows) and resolves to the earliest membership.
 */
export async function resolveCompanyMembership(): Promise<CompanyMembership | null> {
  const userId = await getSupabaseUserId();
  if (!userId) {
    throw new CompanyResolutionError('You must be signed in to do this.');
  }

  const { data, error } = await supabase
    .from('vyron_reach_company_users')
    .select('company_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw new CompanyResolutionError(`Could not resolve your company workspace: ${error.message}`);
  }

  const row = data?.[0];
  if (!row?.company_id) return null;
  return { companyId: row.company_id, role: row.role ?? null };
}

/**
 * Resolves just the company id. Throws instead of falling back to a
 * placeholder so callers surface a real, actionable error.
 *
 * Callers should route NoCompanyMembershipError to /onboarding rather
 * than showing it as a generic error.
 */
export async function resolveCompanyId(): Promise<string> {
  const membership = await resolveCompanyMembership();
  if (!membership) {
    throw new NoCompanyMembershipError('Your account is not linked to a company workspace yet.');
  }
  return membership.companyId;
}
