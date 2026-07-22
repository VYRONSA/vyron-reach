import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getPlatformCertification } from '@/lib/dev/certification/certificationService'
import type { PlatformCertificationWindow } from '@/lib/dev/certification/certificationTypes'

const WINDOWS: PlatformCertificationWindow[] = ['30d', '90d', '12m']

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const window = request.nextUrl.searchParams.get('window') as PlatformCertificationWindow | null
  if (window && !WINDOWS.includes(window)) {
    return NextResponse.json({ error: `window must be one of: ${WINDOWS.join(', ')}` }, { status: 400 })
  }

  if (window) return NextResponse.json({ summary: getPlatformCertification(window) })
  return NextResponse.json({ summaries: WINDOWS.map(w => getPlatformCertification(w)) })
}
