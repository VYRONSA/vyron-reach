import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { initializeDNA } from '@/lib/dev/initializer/dnaInitializer'
import { initializeLearning } from '@/lib/dev/initializer/learningInitializer'

/**
 * The Engineering Organization Initializer's only server-side step —
 * DNA and Learning are file-backed (see dnaInitializer.ts,
 * learningInitializer.ts) and can only be written from the server.
 * Everything else the Initializer creates (roadmap phases, milestones,
 * batches, queue) is localStorage-backed and stays entirely client-side
 * in lib/dev/initializer/organizationInitializer.ts, the same split
 * Mission Control already uses for its own local-vs-server pieces.
 * Gated identically to every other owner-only write route in VYRON DEV.
 */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as { projectSlug?: string; productName?: string; category?: string } | null
  if (!body || !body.projectSlug) {
    return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
  }

  const dnaResult = initializeDNA(body.projectSlug, body.productName ?? body.projectSlug, body.category ?? '')
  const learningResult = initializeLearning(body.projectSlug)

  return NextResponse.json({ dnaResult, learningResult })
}
