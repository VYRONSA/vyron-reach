import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { appendOperationsSnapshot, readOperationsHistory } from '@/lib/dev/operations/operationsHistoryStorage'
import type { OperationsSnapshot } from '@/lib/dev/operations/operationsTypes'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const projectSlug = request.nextUrl.searchParams.get('project') ?? undefined
  return NextResponse.json({ history: readOperationsHistory(projectSlug) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<OperationsSnapshot> | null
  if (!body || !body.projectSlug || !body.timestamp) {
    return NextResponse.json({ error: 'projectSlug and timestamp are required' }, { status: 400 })
  }

  const snapshot: OperationsSnapshot = {
    timestamp: body.timestamp,
    projectSlug: body.projectSlug,
    jobId: body.jobId ?? null,
    engineeringScore: body.engineeringScore ?? 0,
    overallHealth: body.overallHealth ?? 'Unknown',
    deliveryRisk: body.deliveryRisk ?? 'Unknown',
    technicalDebtScore: body.technicalDebtScore ?? 0,
    productCompletion: body.productCompletion ?? 0,
    buildStatus: body.buildStatus ?? 'Unknown',
    typescriptStatus: body.typescriptStatus ?? 'Unknown',
    cost: body.cost ?? null,
    duration: body.duration ?? null,
    applied: body.applied ?? false,
  }
  appendOperationsSnapshot(snapshot)
  return NextResponse.json({ snapshot }, { status: 201 })
}
