import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { computeKnowledgeVersion } from '@/lib/dev/knowledge/knowledgeVersion'

/** The single HTTP-accessible entry point for the unified knowledge-version algorithm — browser-side callers (lib/dev/runtime/executionService.ts) fetch it here instead of computing anything locally, so every component (browser-attended and headless) consumes the exact same server-side calculation. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ version: computeKnowledgeVersion(project) })
}
