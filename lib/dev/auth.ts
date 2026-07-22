import { createHmac, timingSafeEqual } from 'crypto'

export const DEV_SESSION_COOKIE = 'vyron_dev_session'
export const DEV_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function expectedToken(username: string, password: string) {
  return createHmac('sha256', password).update(username).digest('hex')
}

export function verifyDevCredentials(username: string, password: string): boolean {
  const validUser = process.env.DEV_USERNAME ?? ''
  const validPass = process.env.DEV_PASSWORD ?? ''
  if (!validUser || !validPass) return false
  return username === validUser && password === validPass
}

export function issueDevToken(): string {
  const username = process.env.DEV_USERNAME ?? ''
  const password = process.env.DEV_PASSWORD ?? ''
  return expectedToken(username, password)
}

export function isValidDevToken(token: string | undefined | null): boolean {
  const username = process.env.DEV_USERNAME ?? ''
  const password = process.env.DEV_PASSWORD ?? ''
  if (!token || !username || !password) return false

  const expected = expectedToken(username, password)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Owner-only capability gate for /dev/admin. Deliberately a single env
 * flag, not a real role system — VYRON DEV has exactly one Developer
 * login today, so this just decides whether that one user may also
 * administer the platform. Designed to be swapped for a real per-user
 * role lookup later without touching any call site: every caller asks
 * "is the current session an owner?", never "is DEV_OWNER set?".
 */
export function isOwner(): boolean {
  return process.env.DEV_OWNER === 'true'
}

/**
 * Best-available "who is this" identity for attribution fields
 * (InitiationRequest.submittedBy/approvedBy/cancelledBy, InitiationEvent.actor,
 * RiskGateDecision.executive, ExecutiveControlDecision.executive,
 * ReleaseControlDecision.executive, PlanningHistoryRecord.decidedBy, and
 * every other governance-decision record system-wide) — VYRON DEV has
 * exactly one Developer login, not a per-user account system, so
 * DEV_USERNAME is the only real identity signal available server-side.
 *
 * PRA-P1-002 (Production Readiness Hardening Audit, Phase 1) — accepted
 * limitation, not an oversight: this label is process-wide, not derived
 * from the session cookie/token, so if credentials are ever shared by
 * more than one person, the audit trail cannot distinguish who actually
 * made a given decision. Reviewed and deliberately kept this way because
 * VYRON DEV is a single-operator product today; the audit's own
 * recommended fix (thread a distinct identity claim from the session
 * token through this function) remains the correct path if/when a second
 * genuine operator is ever introduced, but is not worth building ahead of
 * that need. If this assumption ever changes, every call site already
 * asks "who is the current actor" through this one function, not
 * `process.env.DEV_USERNAME` directly — so only this function needs to
 * change, not its callers.
 */
export function currentDevActor(): string {
  return process.env.DEV_USERNAME?.trim() || 'owner'
}
