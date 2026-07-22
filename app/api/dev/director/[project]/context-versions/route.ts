import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { computeEngineeringContextVersions } from '@/lib/dev/director/engineeringContextVersion'

/** The browser-attended path's entry point into the same Version 2.0 Milestone 2.2 version calculation the headless Director loop uses directly in-process — see lib/dev/runtime/executionService.ts. Keeps "every component consumes the same version calculation" true across both execution paths. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json(computeEngineeringContextVersions(project))
}
