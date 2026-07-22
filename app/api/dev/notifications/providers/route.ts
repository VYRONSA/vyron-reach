import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listNotificationProviders } from '@/lib/dev/notifications/notificationService'
import { getProviderHealth } from '@/lib/dev/notifications/providerHealth'

/** "Provider health reporting" — read-only, derived from delivery history; never triggers a send. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const providers = listNotificationProviders().map(p => getProviderHealth(p.name, p.enabled))
  return NextResponse.json({ providers })
}
