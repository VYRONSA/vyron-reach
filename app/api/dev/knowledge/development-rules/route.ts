import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getDevelopmentRules, setDevelopmentRules } from '@/lib/dev/knowledge/developmentRulesStore'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ rules: getDevelopmentRules() })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const body = (await request.json().catch(() => null)) as { content?: string } | null
  if (typeof body?.content !== 'string') return NextResponse.json({ error: 'content is required' }, { status: 400 })
  return NextResponse.json({ rules: setDevelopmentRules(body.content) }, { status: 201 })
}
