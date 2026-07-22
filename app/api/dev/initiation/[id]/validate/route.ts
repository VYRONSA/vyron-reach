import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { describeInitiationError, validateReview } from '@/lib/dev/initiation/initiationService'

/**
 * Review-only: re-runs the validator against the current reviewedProgramme
 * without attempting to approve. A convenience checkpoint for the
 * reviewer — Approve and Provision each enforce this exact same check
 * again themselves regardless of what this call last reported.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params

  try {
    const initiation = validateReview(id)
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
