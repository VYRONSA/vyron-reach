import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import {
  updateCertificationCriteria,
  deleteCertificationCriteria,
  getCertificationCriteria,
  listCertificationCriteriaHistory,
} from '@/lib/dev/certification/certificationCriteriaStore'
import type { CertificationCriteria } from '@/lib/dev/certification/certificationTypes'

/** Read-side companion to PATCH/DELETE below — surfaces the same attributed, append-only history those now write, reusing this resource's existing route rather than introducing a new one. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const criteria = getCertificationCriteria(id)
  if (!criteria) return NextResponse.json({ error: 'Criteria not found' }, { status: 404 })
  return NextResponse.json({ criteria, history: listCertificationCriteriaHistory(id) })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const patch = (await request.json().catch(() => null)) as Partial<Omit<CertificationCriteria, 'id' | 'createdAt'>> | null
  if (!patch) return NextResponse.json({ error: 'A JSON body is required' }, { status: 400 })

  const criteria = updateCertificationCriteria(id, patch, currentDevActor())
  if (!criteria) return NextResponse.json({ error: 'Criteria not found' }, { status: 404 })
  return NextResponse.json({ criteria })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const removed = deleteCertificationCriteria(id, currentDevActor())
  if (!removed) return NextResponse.json({ error: 'Criteria not found' }, { status: 404 })
  return NextResponse.json({ removed: true })
}
