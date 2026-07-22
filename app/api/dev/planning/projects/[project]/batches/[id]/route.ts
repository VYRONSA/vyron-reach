import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { updateBatch, deleteBatch } from '@/lib/dev/planningState/planningStateService'
import type { Batch } from '@/lib/dev/planningState/planningStateTypes'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  const patch = (await request.json().catch(() => null)) as Partial<Omit<Batch, 'id' | 'createdAt'>> | null
  if (!patch) return NextResponse.json({ error: 'Patch body missing or malformed' }, { status: 400 })

  const batch = updateBatch(project, id, patch)
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  return NextResponse.json({ batch })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  deleteBatch(project, id)
  return NextResponse.json({ deleted: true })
}
