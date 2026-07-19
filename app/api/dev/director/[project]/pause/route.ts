import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { pauseServerDirector } from '@/lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'

/** Pauses at the next boundary between batches — never interrupts an in-flight Claude run. See serverExecutionLoop.ts's per-iteration guard. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  pauseServerDirector(project)
  return NextResponse.json({ status: getDirectorStatus(project) })
}
