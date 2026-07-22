import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listCertificationCriteria, createCertificationCriteria } from '@/lib/dev/certification/certificationCriteriaStore'
import type { CreateCertificationCriteriaInput } from '@/lib/dev/certification/certificationCriteriaStore'

/** "Certification criteria must be configuration-driven" — this is the configuration surface. Changes here take effect on the very next batch-completed event processed (certificationClassifier.ts reads criteria fresh from disk every time), never requiring a restart. */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ criteria: listCertificationCriteria() })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateCertificationCriteriaInput> | null
  if (
    !body ||
    typeof body.name !== 'string' ||
    typeof body.maxInterventionsForAutonomous !== 'number' ||
    typeof body.maxInterventionsForAssisted !== 'number'
  ) {
    return NextResponse.json({ error: 'name, maxInterventionsForAutonomous, and maxInterventionsForAssisted are required' }, { status: 400 })
  }

  const criteria = createCertificationCriteria({
    name: body.name,
    enabled: body.enabled ?? true,
    project: body.project ?? null,
    maxInterventionsForAutonomous: body.maxInterventionsForAutonomous,
    maxInterventionsForAssisted: body.maxInterventionsForAssisted,
    requireAtLeastOneCompletedTask: body.requireAtLeastOneCompletedTask ?? true,
    recoveryDisqualifiesAutonomous: body.recoveryDisqualifiesAutonomous ?? false,
  })
  return NextResponse.json({ criteria }, { status: 201 })
}
