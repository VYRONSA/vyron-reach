import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { getSchedulerState } from '@/lib/dev/scheduler/schedulerStore'

/**
 * Read-only — returns the persisted SchedulerState as-is, never
 * triggers a scheduling cycle itself (a GET request must never have a
 * write side effect). "Current execution order" and the per-project
 * eligibility buckets (running/paused/blocked/waiting) are both already
 * present on state.lastCycleResult.order from the most recent real
 * cycle (at most TICK_INTERVAL_MS old — see schedulerBootstrap.ts).
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ state: getSchedulerState() })
}
