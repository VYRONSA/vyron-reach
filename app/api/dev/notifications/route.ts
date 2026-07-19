import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listInAppNotifications, markInAppNotificationRead } from '@/lib/dev/notifications/inAppNotificationStore'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project') ?? undefined
  return NextResponse.json({ notifications: listInAppNotifications(project) })
}

export async function PATCH(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const notification = markInAppNotificationRead(body.id)
  if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  return NextResponse.json({ notification })
}
