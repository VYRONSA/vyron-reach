import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listReleases } from '@/lib/dev/director/releaseManagement/releaseManagementService'

/**
 * PRA-P1-032 remediation — read-only, added so the Executive Build/Release
 * UI can find which ReleaseRequest a "Release Go/Hold Required" Engineering
 * Inbox item is actually about (the inbox item itself carries no
 * releaseId — see directorRuntimeTypes.ts's EngineeringInboxItem). Never
 * mutates anything; the only route that can ever record a decision
 * remains [releaseId]/decision/route.ts.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ releases: listReleases(project) })
}
