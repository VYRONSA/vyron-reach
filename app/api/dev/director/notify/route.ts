import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { raiseNotification } from '@/lib/dev/notifications/notificationService'
import type { RaiseNotificationInput } from '@/lib/dev/notifications/notificationTypes'

/** The Director's only notification touchpoint: raise an event, never know or care who (if anyone) actually receives it — see notificationService.ts. */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<RaiseNotificationInput> | null
  if (!body?.type || !body.project || !body.title || !body.message || !body.severity) {
    return NextResponse.json({ error: 'type, project, title, message, and severity are required' }, { status: 400 })
  }

  const event = await raiseNotification({
    type: body.type,
    project: body.project,
    title: body.title,
    message: body.message,
    severity: body.severity,
    metadata: body.metadata ?? {},
  })
  return NextResponse.json({ event }, { status: 201 })
}
