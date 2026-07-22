import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listDeliveries } from '@/lib/dev/notifications/deliveryStore'

/** Read-only delivery history — never triggers a send or a retry. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { searchParams } = new URL(request.url)
  const project = searchParams.get('project') ?? undefined
  return NextResponse.json({ deliveries: listDeliveries(project) })
}
