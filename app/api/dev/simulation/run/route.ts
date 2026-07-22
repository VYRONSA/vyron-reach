import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { runSimulation } from '@/lib/dev/simulation/simulationService'
import { SCENARIO_IDS } from '@/lib/dev/simulation/simulationScenarios'
import type { RunSimulationInput } from '@/lib/dev/simulation/simulationService'
import type { LoadProfileLabel } from '@/lib/dev/simulation/simulationTypes'

const LOAD_PROFILES: LoadProfileLabel[] = ['Small', 'Medium', 'Large', 'Enterprise', 'Custom']

/**
 * Triggers a real simulation run and waits for it to finish — every
 * scenario at every load profile up through Enterprise completes in low
 * single-digit seconds (see simulationRunner.smoke.test.ts), since
 * nothing here spawns a real subprocess (see simulationRunner.ts's
 * header doc for the two deliberate execution boundaries). The report is
 * already durably saved (simulationService.ts) by the time this
 * responds, so a client that times out waiting can still fetch the
 * result afterward from GET /api/dev/simulation/reports/:id.
 */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<RunSimulationInput> | null
  if (!body?.scenario || !SCENARIO_IDS.includes(body.scenario)) {
    return NextResponse.json({ error: `scenario is required and must be one of: ${SCENARIO_IDS.join(', ')}` }, { status: 400 })
  }
  if (!body.loadProfile || !LOAD_PROFILES.includes(body.loadProfile)) {
    return NextResponse.json({ error: `loadProfile is required and must be one of: ${LOAD_PROFILES.join(', ')}` }, { status: 400 })
  }

  const report = await runSimulation({
    scenario: body.scenario,
    loadProfile: body.loadProfile,
    customLoad: body.customLoad,
    seed: body.seed,
    faults: body.faults,
  })
  return NextResponse.json({ report }, { status: 201 })
}
