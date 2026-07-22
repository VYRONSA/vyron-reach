import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { SCENARIO_IDS } from '@/lib/dev/simulation/simulationScenarios'
import { getScenarioDefinition } from '@/lib/dev/simulation/simulationScenarios'

/** "Available scenarios" — read-only, describes every scenario's default behavior without running anything. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const scenarios = SCENARIO_IDS.map(id => ({ id, ...getScenarioDefinition(id) }))
  return NextResponse.json({ scenarios, loadProfiles: ['Small', 'Medium', 'Large', 'Enterprise', 'Custom'] })
}
