import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { updateDecision, deleteDecision } from '@/lib/dev/planningState/planningStateService'
import type { Decision } from '@/lib/dev/planningState/planningStateTypes'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  const patch = (await request.json().catch(() => null)) as Partial<Omit<Decision, 'id' | 'relatedProject' | 'createdAt'>> | null
  if (!patch) return NextResponse.json({ error: 'Patch body missing or malformed' }, { status: 400 })

  const decision = updateDecision(project, id, patch)
  if (!decision) return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
  return NextResponse.json({ decision })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ project: string; id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { project, id } = await params
  deleteDecision(project, id)
  return NextResponse.json({ deleted: true })
}
