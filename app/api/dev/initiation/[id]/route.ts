import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import {
  cancelInitiation,
  describeInitiationError,
  getInitiation,
  updateDirective,
  updateReview,
} from '@/lib/dev/initiation/initiationService'
import type { GeneratedPlanCandidate } from '@/lib/dev/initiation/initiationTypes'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  const initiation = getInitiation(id)
  if (!initiation) return NextResponse.json({ error: `InitiationRequest '${id}' not found.` }, { status: 404 })
  return NextResponse.json({ initiation })
}

type PatchBody = {
  directiveTitle?: string
  directiveText?: string
  reviewedProgramme?: GeneratedPlanCandidate
  reviewNotes?: string
}

/** Dispatches to updateDirective (Draft/GenerationFailed) or updateReview (Review) based on which fields are present — both are CAS-gated by initiationService, so sending the wrong field for the current status is simply rejected as a 409. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 })

  try {
    if (body.reviewedProgramme !== undefined || body.reviewNotes !== undefined) {
      const initiation = updateReview(id, { reviewedProgramme: body.reviewedProgramme, reviewNotes: body.reviewNotes })
      return NextResponse.json({ initiation })
    }
    const initiation = updateDirective(id, { directiveTitle: body.directiveTitle, directiveText: body.directiveText })
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}

/** Only meaningful while still Draft (nothing generated/committed yet) — archives the reserved project shell via cancelInitiation, same non-destructive path every other cancellation uses. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params
  const initiation = getInitiation(id)
  if (!initiation) return NextResponse.json({ error: `InitiationRequest '${id}' not found.` }, { status: 404 })
  if (initiation.status !== 'Draft') {
    return NextResponse.json({ error: `InitiationRequest '${id}' is '${initiation.status}'; only a Draft can be deleted. Use /cancel instead.` }, { status: 409 })
  }

  try {
    const cancelled = cancelInitiation(id, currentDevActor())
    return NextResponse.json({ initiation: cancelled })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
