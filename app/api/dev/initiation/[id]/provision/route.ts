import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { describeInitiationError } from '@/lib/dev/initiation/initiationService'
import { startProvisioning } from '@/lib/dev/initiation/initiationProvisioningService'

/**
 * Approved -> Provisioning -> Provisioned | ProvisioningFailed.
 *
 * PRA-P1-016 remediation: this used to await the entire provisioning
 * sequence before responding. It now returns as soon as the synchronous
 * 'Provisioning' transition is recorded; the actual work continues via
 * startProvisioning's fire-and-forget worker. The client already renders
 * a distinct "Provisioning…" state for this response and already
 * subscribes to the 'Project Initiation' SSE event the eventual
 * completion/failure publishes (InitiationDetailView.tsx) — no client
 * change was required.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params

  try {
    const initiation = startProvisioning(id)
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
