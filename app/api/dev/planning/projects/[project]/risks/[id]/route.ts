import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { updateRisk, deleteRisk } from '@/lib/dev/planningState/planningStateService'
import type { Risk } from '@/lib/dev/planningState/planningStateTypes'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  const patch = (await request.json().catch(() => null)) as Partial<Omit<Risk, 'id' | 'project' | 'createdAt'>> | null
  if (!patch) return NextResponse.json({ error: 'Patch body missing or malformed' }, { status: 400 })

  const risk = updateRisk(project, id, patch)
  if (!risk) return NextResponse.json({ error: 'Risk not found' }, { status: 404 })
  return NextResponse.json({ risk })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  deleteRisk(project, id)
  return NextResponse.json({ deleted: true })
}
