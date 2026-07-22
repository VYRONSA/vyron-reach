import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { removeDependency } from '@/lib/dev/planningState/planningStateService'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  removeDependency(project, id)
  return NextResponse.json({ deleted: true })
}
