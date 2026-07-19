import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { cancelServerDirector } from '@/lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  cancelServerDirector(project)
  return NextResponse.json({ status: getDirectorStatus(project) })
}
