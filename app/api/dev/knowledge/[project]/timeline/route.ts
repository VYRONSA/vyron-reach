import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listTimeline } from '@/lib/dev/knowledge/knowledgeService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { project } = await params
  return NextResponse.json({ timeline: listTimeline(project) })
}
