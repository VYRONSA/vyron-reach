import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { generateEvidencePack } from '@/lib/dev/certification/certificationService'

/**
 * GET generates (or, per generateEvidencePack's own idempotency,
 * returns the already-saved) Evidence Pack for one Certified feature. In
 * practice this is already generated automatically the instant a
 * feature certifies (see certificationService.ts's
 * startCertificationSubscription) — this route mainly serves the
 * dashboard's on-demand view and gives any Open/not-yet-certified
 * feature a clear 404 instead of a partial pack.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ featureId: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { featureId } = await params
  const pack = generateEvidencePack(featureId)
  if (!pack) return NextResponse.json({ error: 'No evidence pack available — the feature does not exist or is not yet Certified' }, { status: 404 })
  return NextResponse.json({ pack })
}
