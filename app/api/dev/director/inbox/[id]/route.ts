import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { dismissInboxItem, markInboxItemRead, resolveInboxItem } from '@/lib/dev/director/engineeringInboxStore'
import { resumeServerDirector } from '@/lib/dev/director/serverExecutionLoop'

/**
 * Resolving an item is itself what resumes the paused project — the
 * server does this here, synchronously with the same request, never
 * waiting for or depending on the browser to make a separate "resume"
 * call. This is the concrete fix for "The UI must never own execution":
 * the UI's Resolve button only ever PATCHes this one item.
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

  if (body.action === 'resolve') resumeServerDirector(item.project)

  return NextResponse.json({ item })
}
