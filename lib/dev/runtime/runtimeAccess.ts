import type { NextRequest } from 'next/server'
import { DEV_SESSION_COOKIE, isOwner, isValidDevToken } from '../auth'

/**
 * The runtime spawns Claude Code with shell/filesystem access to this
 * repository — a meaningfully different risk than every read-only
 * intelligence engine in this app. Gated behind three independent checks:
 * a valid Developer session, the owner capability flag, and an explicit
 * DEV_RUNTIME_ENABLED opt-in that is not meant to ever be set on a
 * deployed instance. All three must hold, every request — there is no
 * "remember this" bypass.
 */
export function isRuntimeAccessible(request: NextRequest): boolean {
  if (process.env.DEV_RUNTIME_ENABLED !== 'true') return false
  if (!isOwner()) return false
  const token = request.cookies.get(DEV_SESSION_COOKIE)?.value
  return isValidDevToken(token)
}
