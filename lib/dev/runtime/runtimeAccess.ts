import type { NextRequest } from 'next/server'
import { DEV_SESSION_COOKIE, isOwner, isValidDevToken } from '../auth'

function isAuthenticatedOwner(request: NextRequest): boolean {
  if (!isOwner()) return false
  const token = request.cookies.get(DEV_SESSION_COOKIE)?.value
  return isValidDevToken(token)
}

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
  return isAuthenticatedOwner(request) && process.env.DEV_RUNTIME_ENABLED === 'true'
}

/**
 * Only ever called after isRuntimeAccessible() has already failed, to
 * decide what to tell the caller. Unauthenticated/non-owner requests still
 * get an opaque 404 — same as every other owner-only surface in this app,
 * never revealing the route exists. An already-authenticated owner hitting
 * a disabled flag gets a real diagnosis instead: this is exactly the
 * "DEV_RUNTIME_ENABLED wasn't loaded by the running server process" case
 * that silently degrades Mission Control to "Not found" with no way to
 * tell that from an actual missing route.
 */
export function runtimeUnavailableResponse(request: NextRequest): { status: number; error: string } {
  if (!isAuthenticatedOwner(request)) return { status: 404, error: 'Not found' }
  return {
    status: 503,
    error: 'The execution runtime is disabled. Set DEV_RUNTIME_ENABLED=true in .env.local and restart the dev server.',
  }
}
