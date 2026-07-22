import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  listInAppNotifications,
  markInAppNotificationRead,
  queryInAppNotifications,
  queryArchivedInAppNotifications,
} from '@/lib/dev/notifications/inAppNotificationStore'
import type { NotificationEventType, NotificationSeverity } from '@/lib/dev/notifications/notificationTypes'

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2): the
 * original `{ notifications: [...] }` contract (every notification, no
 * pagination) is preserved byte-for-byte by default. Passing
 * `page`/`pageSize` (or `archived=true`) opts into the new paginated/
 * filtered/searchable shape — additive, not a breaking redesign.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const project = params.get('project') ?? undefined
  const page = params.get('page')
  const pageSize = params.get('pageSize')
  const archived = params.get('archived') === 'true'

  if (archived) {
    return NextResponse.json(queryArchivedInAppNotifications(project, { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }))
  }

  if (page || pageSize || params.get('severity') || params.get('type') || params.get('search') || params.get('read') || params.get('dateFrom') || params.get('dateTo')) {
    const result = queryInAppNotifications(
      {
        project,
        severity: (params.get('severity') as NotificationSeverity | null) ?? undefined,
        type: (params.get('type') as NotificationEventType | null) ?? undefined,
        read: params.get('read') !== null ? params.get('read') === 'true' : undefined,
        dateRange: params.get('dateFrom') || params.get('dateTo') ? { from: params.get('dateFrom') ?? undefined, to: params.get('dateTo') ?? undefined } : undefined,
        search: params.get('search') ?? undefined,
      },
      { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
    )
    return NextResponse.json(result)
  }

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
