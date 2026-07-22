import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { dismissInboxItem, markInboxItemRead, resolveInboxItem } from '@/lib/dev/director/engineeringInboxStore'
import { isCurrentInboxBlocker } from '@/lib/dev/director/directorRuntimeStore'
import { resumeServerDirector } from '@/lib/dev/director/serverExecutionLoop'

/**
 * Resolving an item is itself what resumes the paused project — the
 * server does this here, synchronously with the same request, never
 * waiting for or depending on the browser to make a separate "resume"
 * call. This is the concrete fix for "The UI must never own execution":
 * the UI's Resolve button only ever PATCHes this one item.
 *
 * PRA-P1-018 remediation: this used to call resumeServerDirector(project)
 * unconditionally whenever ANY item resolved, regardless of whether it
 * was actually the item the project is currently waiting on
 * (DirectorRuntimeStatus.waitingInboxItemId) — resolving a stale or
 * unrelated Open item for the same project (project-level items like
 * Release/Rollback/Incident are never deduplicated, so more than one can
 * coexist) still triggered a real resume, a false "approval" signal that
 * could cause the loop to retry a batch whose actual blocker was never
 * addressed. Now only the item that is genuinely recorded as the current
 * blocker triggers a resume; resolving/dismissing anything else still
 * updates the item's own status but leaves execution state untouched.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { action?: 'resolve' | 'dismiss' | 'read'; note?: string } | null

  if (body?.action === 'read') {
    const item = markInboxItemRead(id)
    if (!item) return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })
    return NextResponse.json({ item })
  }

  if (body?.action !== 'resolve' && body?.action !== 'dismiss') {
    return NextResponse.json({ error: "action must be 'resolve', 'dismiss', or 'read'" }, { status: 400 })
  }

  const item = body.action === 'resolve' ? resolveInboxItem(id, body.note) : dismissInboxItem(id, body.note)
  if (!item) return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })

  if (body.action === 'resolve' && isCurrentInboxBlocker(item.project, item.id)) {
    resumeServerDirector(item.project)
  }

  return NextResponse.json({ item })
}
