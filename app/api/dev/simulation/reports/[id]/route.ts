import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getSimulation } from '@/lib/dev/simulation/simulationService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const { id } = await params
  const report = getSimulation(id)
  if (!report) return NextResponse.json({ error: 'Simulation report not found' }, { status: 404 })
  return NextResponse.json({ report })
}
