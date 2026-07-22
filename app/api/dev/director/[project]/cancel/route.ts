import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { cancelServerDirector, describeDirectorError } from '@/lib/dev/director/serverExecutionLoop'
import { getDirectorStatus } from '@/lib/dev/director/directorRuntimeStore'

export async function POST(request: NextRequest, { params }: { params: Promise<{ project: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project } = await params
  try {
    cancelServerDirector(project)
  } catch (err) {
    const described = describeDirectorError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
  return NextResponse.json({ status: getDirectorStatus(project) })
}
