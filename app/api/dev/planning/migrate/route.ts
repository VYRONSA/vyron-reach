import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getMigrationStatus } from '@/lib/dev/planningState/planningStateStore'
import { importFromLocalStorage } from '@/lib/dev/planningState/planningStateMigration'
import type { PlanningMigrationPayload } from '@/lib/dev/planningState/planningStateTypes'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ status: getMigrationStatus() })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as PlanningMigrationPayload | null
  if (!body || !Array.isArray(body.projects)) {
    return NextResponse.json({ error: 'Migration payload missing or malformed' }, { status: 400 })
  }

  const result = importFromLocalStorage(body)
  return NextResponse.json({ result, status: getMigrationStatus() })
}
