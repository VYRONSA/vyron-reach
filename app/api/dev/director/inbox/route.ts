import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { createInboxItem, listInboxItems, type CreateInboxItemInput } from '@/lib/dev/director/engineeringInboxStore'
import type { EngineeringInboxStatus } from '@/lib/dev/director/directorRuntimeTypes'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project') ?? undefined
  const status = (request.nextUrl.searchParams.get('status') as EngineeringInboxStatus | null) ?? undefined
  return NextResponse.json({ items: listInboxItems({ project, status }) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateInboxItemInput> | null
  if (!body?.project || !body.reasonType || !body.reason || !body.severity || !body.recommendedAction) {
    return NextResponse.json({ error: 'project, reasonType, reason, severity, and recommendedAction are required' }, { status: 400 })
  }

  const item = createInboxItem({
    project: body.project,
    batchId: body.batchId ?? null,
    batchNumber: body.batchNumber ?? null,
    reasonType: body.reasonType,
    reason: body.reason,
    severity: body.severity,
    recommendedAction: body.recommendedAction,
  })
  return NextResponse.json({ item }, { status: 201 })
}
