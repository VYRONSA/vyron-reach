import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  createInboxItem,
  listInboxItems,
  queryInboxItems,
  queryArchivedInboxItems,
  type CreateInboxItemInput,
} from '@/lib/dev/director/engineeringInboxStore'
import type { EngineeringInboxStatus, InterventionSeverity, InterventionReasonType } from '@/lib/dev/director/directorRuntimeTypes'

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2): the
 * original `{ items: [...] }` contract (every open/matching item, no
 * pagination) is preserved byte-for-byte by default — existing callers
 * (LiveEngineeringCommandCentre.tsx, GlobalEngineeringInboxView.tsx via
 * directorClient.ts) are untouched. Passing `page`/`pageSize` (or
 * `archived=true`) opts into the new paginated/filtered/searchable
 * response shape instead — additive, not a breaking redesign.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const params = request.nextUrl.searchParams
  const project = params.get('project') ?? undefined
  const status = (params.get('status') as EngineeringInboxStatus | null) ?? undefined

  const page = params.get('page')
  const pageSize = params.get('pageSize')
  const archived = params.get('archived') === 'true'

  if (archived) {
    const result = queryArchivedInboxItems(project, { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined })
    return NextResponse.json(result)
  }

  if (page || pageSize || params.get('severity') || params.get('reasonType') || params.get('search') || params.get('dateFrom') || params.get('dateTo')) {
    const result = queryInboxItems(
      {
        project,
        status,
        severity: (params.get('severity') as InterventionSeverity | null) ?? undefined,
        reasonType: (params.get('reasonType') as InterventionReasonType | null) ?? undefined,
        dateRange: params.get('dateFrom') || params.get('dateTo') ? { from: params.get('dateFrom') ?? undefined, to: params.get('dateTo') ?? undefined } : undefined,
        search: params.get('search') ?? undefined,
      },
      { page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
    )
    return NextResponse.json(result)
  }

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
