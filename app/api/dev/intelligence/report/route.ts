import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { computeServerEngineeringFindings } from '@/lib/dev/intelligence/serverIntelligenceAggregator'

/**
 * Gated identically to the runtime job routes — this reads source file
 * contents (including a literal secret-pattern scan) and shells out to
 * `git diff`, so it gets the same three-check access control, not a
 * looser one just because it's "only reading."
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const hasSqlDocumentation = request.nextUrl.searchParams.get('hasSqlDocumentation') === 'true'
  const findings = await computeServerEngineeringFindings(hasSqlDocumentation)
  return NextResponse.json({ findings })
}
