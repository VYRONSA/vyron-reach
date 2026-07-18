import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { runContinuousValidation, captureRecentCommits } from '@/lib/dev/operations/continuousValidationEngine'

/**
 * Runs the real `npm run build` + `npx tsc --noEmit` pair this project's
 * own batch workflow has always run manually, and writes the result to
 * lib/dev/lastValidation.json. Gated identically to the runtime job
 * routes — this executes real subprocesses, same risk category as
 * spawning Claude Code.
 */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const cwd = process.cwd()
  const [validation, rollbackPoints] = await Promise.all([runContinuousValidation(cwd), captureRecentCommits(cwd)])
  return NextResponse.json({ validation, rollbackPoints })
}
